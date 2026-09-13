import { useEffect, useMemo, useRef, useState } from 'react';
import type { Station } from '../types';
import { STATIONS } from '../data/stations';
import type { VisitMap } from '../lib/visits';

// ── 좌표계 ────────────────────────────────────────────────
// 위경도 → [0,1] 정규화 월드 좌표 (위도 35.8° 기준 가로 축척 보정)
const LON0 = 124.6;
const LAT1 = 38.65;
const KX = Math.cos((35.8 * Math.PI) / 180); // ≈0.81
const DEN = 5.7; // 세로(위도) 범위 기준 정규화
const OFFX = 0.03;

function project(lon: number, lat: number): { x: number; y: number } {
  return { x: ((lon - LON0) * KX) / DEN + OFFX, y: (LAT1 - lat) / DEN };
}

// 대한민국 본토 외곽선 (단순화, 해안선 시계방향)
const MAINLAND: [number, number][] = [
  [126.68, 37.78], [126.55, 37.6], [126.6, 37.4], [126.68, 37.2], [126.75, 37.05],
  [126.85, 36.98], [126.6, 36.92], [126.3, 36.9], [126.13, 36.72], [126.2, 36.45],
  [126.4, 36.25], [126.52, 36.05], [126.55, 35.95], [126.42, 35.78], [126.4, 35.55],
  [126.28, 35.3], [126.32, 35.05], [126.3, 34.78], [126.15, 34.55], [126.3, 34.35],
  [126.52, 34.3], [126.75, 34.35], [126.95, 34.45], [127.1, 34.38], [127.3, 34.32],
  [127.52, 34.5], [127.68, 34.6], [127.85, 34.75], [128.05, 34.8], [128.35, 34.8],
  [128.6, 34.88], [128.85, 35.0], [129.05, 35.08], [129.25, 35.32], [129.38, 35.5],
  [129.48, 35.75], [129.58, 36.02], [129.42, 36.15], [129.42, 36.45], [129.45, 36.8],
  [129.42, 37.1], [129.25, 37.35], [129.12, 37.52], [128.95, 37.78], [128.75, 38.05],
  [128.6, 38.2], [128.42, 38.38], [128.1, 38.32], [127.6, 38.32], [127.1, 38.3],
  [126.85, 38.1], [126.7, 37.95],
];

// 제주도 (타원 근사)
const JEJU: [number, number][] = Array.from({ length: 22 }, (_, i) => {
  const a = (i / 22) * Math.PI * 2;
  return [126.53 + Math.cos(a) * 0.37, 33.38 + Math.sin(a) * 0.185] as [number, number];
});

// 울릉도 (작은 원)
const ULLEUNG: [number, number][] = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2;
  return [130.88 + Math.cos(a) * 0.06, 37.5 + Math.sin(a) * 0.05] as [number, number];
});

// 자치도(권역)별 색 구역 — 본토 외곽선으로 클리핑해서 칠한다
// box = [lon0, lat0(남), lon1, lat1(북)], label = 이름 표시 위치
interface Zone {
  name: string;
  box: [number, number, number, number];
  color: string;
  label: [number, number];
}
const ZONES: Zone[] = [
  { name: '경기·인천', box: [124.6, 36.9, 127.3, 38.7], color: '#e2edfb', label: [126.95, 37.5] },
  { name: '강원', box: [127.3, 37.0, 129.7, 38.7], color: '#ddf2e6', label: [128.35, 37.75] },
  { name: '충청', box: [124.6, 36.0, 128.1, 36.9], color: '#fdf3d8', label: [126.95, 36.48] },
  { name: '전북', box: [124.6, 35.45, 127.9, 36.0], color: '#eef6d9', label: [127.05, 35.72] },
  { name: '전남·광주', box: [124.6, 33.8, 127.78, 35.45], color: '#fde8e0', label: [126.9, 34.98] },
  { name: '경북', box: [128.1, 35.75, 129.7, 37.0], color: '#ede8f9', label: [128.8, 36.4] },
  { name: '경남·부산', box: [127.78, 33.8, 129.7, 35.75], color: '#fceaf1', label: [128.35, 35.32] },
  { name: '제주', box: [125.8, 32.95, 127.3, 33.75], color: '#ffefd8', label: [126.53, 33.68] },
];
const JEJU_COLOR = '#ffefd8';

function unproject(wx: number, wy: number): { lon: number; lat: number } {
  return { lon: ((wx - OFFX) * DEN) / KX + LON0, lat: LAT1 - wy * DEN };
}

/** 구역 박스를 화면에 딱 맞게 보여주는 배율 */
function zoneFitScale(z: Zone): number {
  const zw = ((z.box[2] - z.box[0]) * KX) / DEN;
  const zh = (z.box[3] - z.box[1]) / DEN;
  return Math.max(2.7, Math.min(4.4, 0.85 / Math.max(zw, zh)));
}

interface View {
  x: number;
  y: number;
  s: number;
}

export interface KoreaMapProps {
  visits: VisitMap;
  favs: string[];
  selected: Station | null;
  onSelect: (s: Station | null) => void;
  /** 외부(칩 클릭 등)에서 특정 지점으로 줌 요청. n 증가로 재트리거 */
  focus?: { st: Station; n: number } | null;
}

// 3단계 줌: 전국(1) → 자치도(~3.x) → 시·군(~7) → 지점 카드(9)
const ZONE_LEVEL = 2.1;   // 이 미만이면 전국 화면으로 취급
const GROUP_LEVEL = 5.6;  // 이 미만이면 자치도 화면으로 취급
const SPOT_SCALE = 9;

interface GroupInfo {
  name: string;
  x: number;
  y: number;
  n: number;
  ext: number; // 반경(월드 좌표)
  stations: Station[];
}

export default function KoreaMap({ visits, favs, selected, onSelect, focus }: KoreaMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cur = useRef<View>({ x: 0.5, y: 0.5, s: 1 });
  const queue = useRef<View[]>([]);
  const holdUntil = useRef(0);
  const [zoomed, setZoomed] = useState(false);

  // draw 루프가 항상 최신 props를 읽도록 ref 경유
  const propsRef = useRef({ visits, favs, selected });
  propsRef.current = { visits, favs, selected };
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  const pos = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    for (const st of STATIONS) m.set(st.id, project(st.lon, st.lat));
    return m;
  }, []);

  // 시·군 단위 묶음 (중심점·반경) — 2단계 줌과 라벨에 사용
  const groups = useMemo(() => {
    const m = new Map<string, GroupInfo>();
    for (const st of STATIONS) {
      const key = `${st.province}|${st.group}`;
      const p = pos.get(st.id)!;
      let g = m.get(key);
      if (!g) {
        g = { name: st.group, x: 0, y: 0, n: 0, ext: 0, stations: [] };
        m.set(key, g);
      }
      g.x += p.x;
      g.y += p.y;
      g.n++;
      g.stations.push(st);
    }
    for (const g of m.values()) {
      g.x /= g.n;
      g.y /= g.n;
      for (const st of g.stations) {
        const p = pos.get(st.id)!;
        g.ext = Math.max(g.ext, Math.hypot(p.x - g.x, p.y - g.y));
      }
    }
    return m;
  }, [pos]);

  const groupOf = (st: Station) => groups.get(`${st.province}|${st.group}`)!;

  const groupView = (g: GroupInfo): View => ({
    x: g.x,
    y: g.y,
    s: Math.max(6.2, Math.min(9.5, 0.4 / Math.max(g.ext, 0.035))),
  });

  const spotView = (st: Station): View => {
    const p = pos.get(st.id)!;
    // 하단 카드에 가리지 않도록 지점을 화면 위쪽에 두는 오프셋
    return { x: p.x, y: p.y + 0.22 / SPOT_SCALE, s: SPOT_SCALE };
  };

  /** 지점으로 향하는 토스식 다단계 줌 체인 (자치도 → 시·군 → 지점) */
  const zoomToStation = (st: Station) => {
    const steps: View[] = [];
    if (cur.current.s < ZONE_LEVEL) {
      const z = ZONES.find(
        (z) => st.lon >= z.box[0] && st.lon <= z.box[2] && st.lat >= z.box[1] && st.lat <= z.box[3],
      );
      if (z) {
        const c = project((z.box[0] + z.box[2]) / 2, (z.box[1] + z.box[3]) / 2);
        steps.push({ x: c.x, y: c.y, s: zoneFitScale(z) });
      }
    }
    if (cur.current.s < GROUP_LEVEL) steps.push(groupView(groupOf(st)));
    steps.push(spotView(st));
    queue.current = steps;
    selectRef.current(st);
  };

  useEffect(() => {
    if (focus) zoomToStation(focus.st);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.n]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = canvas.parentElement!;
    const ctx = canvas.getContext('2d')!;
    let W = 0;
    let H = 0;
    let raf = 0;
    let last = performance.now();
    let alive = true;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = wrap.clientWidth;
      H = Math.round(W * 1.06);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const base = () => Math.min(W, H) * 0.96;
    const toScreen = (wx: number, wy: number, v: View) => ({
      x: W / 2 + (wx - v.x) * v.s * base(),
      y: H / 2 + (wy - v.y) * v.s * base(),
    });

    const tracePoly = (poly: [number, number][], v: View) => {
      ctx.beginPath();
      poly.forEach(([lon, lat], i) => {
        const w = project(lon, lat);
        const p = toScreen(w.x, w.y, v);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
    };

    const draw = (t: number) => {
      const v = cur.current;
      const { visits: vm, favs: fv, selected: sel } = propsRef.current;

      // 바다 배경
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#e3f0fd');
      g.addColorStop(1, '#d3e7fb');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // 육지 기본색
      ctx.fillStyle = '#f7f2e8';
      for (const poly of [MAINLAND, JEJU, ULLEUNG]) {
        tracePoly(poly, v);
        ctx.fill();
      }

      // 자치도별 색 구역 — 본토 모양으로 클리핑해서 파스텔로 칠한다
      ctx.save();
      tracePoly(MAINLAND, v);
      ctx.clip();
      for (const z of ZONES) {
        const a = project(z.box[0], z.box[3]);
        const b = project(z.box[2], z.box[1]);
        const pa = toScreen(a.x, a.y, v);
        const pb = toScreen(b.x, b.y, v);
        ctx.fillStyle = z.color;
        ctx.fillRect(pa.x, pa.y, pb.x - pa.x, pb.y - pa.y);
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(pa.x, pa.y, pb.x - pa.x, pb.y - pa.y);
      }
      ctx.restore();

      // 제주는 별도 폴리곤 채색
      ctx.fillStyle = JEJU_COLOR;
      tracePoly(JEJU, v);
      ctx.fill();

      // 외곽선
      ctx.strokeStyle = '#d9cfbc';
      ctx.lineWidth = 1.2;
      for (const poly of [MAINLAND, JEJU, ULLEUNG]) {
        tracePoly(poly, v);
        ctx.stroke();
      }

      // 지점 점 찍기 (전국 화면에선 옅고 작게 → 확대하면 또렷하게)
      const f = Math.min(2.2, Math.sqrt(v.s));
      const dotAlpha = v.s < ZONE_LEVEL ? 0.28 : 0.55;
      const dotR = v.s < ZONE_LEVEL ? 1.1 : 1.6 * f;
      const favSet = new Set(fv);
      for (const st of STATIONS) {
        const w = pos.get(st.id)!;
        const p = toScreen(w.x, w.y, v);
        if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) continue;
        const state = vm[st.id];
        const isFavd = favSet.has(st.id);
        const marked = state || isFavd;

        if (!marked) {
          ctx.fillStyle = `rgba(150,162,178,${dotAlpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, dotR, 0, Math.PI * 2);
          ctx.fill();
          // 시·군 화면 이상으로 확대하면 모든 지점 이름 표시
          if (v.s > 5.8) {
            ctx.font = '500 10px Pretendard, sans-serif';
            ctx.fillStyle = 'rgba(78,89,104,0.75)';
            ctx.textAlign = 'left';
            ctx.fillText(st.name, p.x + 6, p.y + 3.5);
          }
          continue;
        }

        const color = state === 'visited' ? '#3182F6' : state === 'wish' ? '#F5A623' : '#2AC77F';
        // 은은한 빛 번짐 — "색이 차오르는" 느낌
        ctx.shadowColor = color;
        ctx.shadowBlur = 7 * f;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.1 * f, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        if (isFavd && state) {
          ctx.strokeStyle = '#FFD54A';
          ctx.lineWidth = 1.6 * f;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4.6 * f, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (v.s > 4.6) {
          ctx.font = '600 11px Pretendard, sans-serif';
          ctx.fillStyle = '#4a5568';
          ctx.textAlign = 'left';
          ctx.fillText(st.name, p.x + 7 * f, p.y + 4);
        }
      }

      // 자치도 이름 라벨 (전국 화면에서 또렷, 확대하면 서서히 사라짐)
      const zoneAlpha = Math.max(0, Math.min(1, (2.9 - v.s) / 1.1));
      if (zoneAlpha > 0.02) {
        ctx.font = '800 13px Pretendard, sans-serif';
        ctx.textAlign = 'center';
        for (const z of ZONES) {
          const c = project(z.label[0], z.label[1]);
          const p = toScreen(c.x, c.y, v);
          ctx.lineWidth = 4;
          ctx.strokeStyle = `rgba(255,255,255,${0.9 * zoneAlpha})`;
          ctx.strokeText(z.name, p.x, p.y);
          ctx.fillStyle = `rgba(90,100,115,${zoneAlpha})`;
          ctx.fillText(z.name, p.x, p.y);
        }
      }

      // 시·군 이름 라벨 (자치도 화면에서 보임 — "군산"을 눌러 들어가는 안내)
      const grpIn = Math.max(0, Math.min(1, (v.s - ZONE_LEVEL) / 0.35));
      const grpOut = Math.max(0, Math.min(1, (6.6 - v.s) / 0.9));
      const grpAlpha = Math.min(grpIn, grpOut);
      if (grpAlpha > 0.02) {
        ctx.font = '700 12px Pretendard, sans-serif';
        ctx.textAlign = 'center';
        for (const g of groups.values()) {
          const p = toScreen(g.x, g.y, v);
          if (p.x < -30 || p.x > W + 30 || p.y < -30 || p.y > H + 30) continue;
          ctx.lineWidth = 4;
          ctx.strokeStyle = `rgba(255,255,255,${0.9 * grpAlpha})`;
          ctx.strokeText(g.name, p.x, p.y - 8);
          ctx.fillStyle = `rgba(70,80,95,${grpAlpha})`;
          ctx.fillText(g.name, p.x, p.y - 8);
        }
      }

      // 선택 지점 펄스 링
      if (sel) {
        const w = pos.get(sel.id)!;
        const p = toScreen(w.x, w.y, v);
        const pulse = 1 + Math.sin(t / 280) * 0.18;
        ctx.strokeStyle = 'rgba(49,130,246,0.85)';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 11 * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(49,130,246,0.3)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 18 * pulse, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const loop = (now: number) => {
      if (!alive) return;
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;

      const target = queue.current[0];
      if (target && now >= holdUntil.current) {
        const v = cur.current;
        const k = 1 - Math.exp(-dt * 5.5);
        v.x += (target.x - v.x) * k;
        v.y += (target.y - v.y) * k;
        v.s += (target.s - v.s) * k;
        const close =
          Math.abs(target.s - v.s) < 0.03 * target.s &&
          Math.hypot(target.x - v.x, target.y - v.y) < 0.004 / Math.sqrt(target.s);
        if (close && queue.current.length > 1) {
          queue.current.shift();
          holdUntil.current = now + 200; // 토스식 단계 사이 잠깐 멈춤
        }
      }
      setZoomed((z) => (cur.current.s > 1.35) !== z ? cur.current.s > 1.35 : z);

      draw(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // ── 포인터: 탭 = 줌/선택, 드래그 = 이동 ──
    let downX = 0;
    let downY = 0;
    let startV: View | null = null;
    let dragging = false;

    const worldOf = (px: number, py: number) => {
      const v = cur.current;
      return {
        x: v.x + (px - W / 2) / (v.s * base()),
        y: v.y + (py - H / 2) / (v.s * base()),
      };
    };

    const nearestStation = (px: number, py: number) => {
      const v = cur.current;
      let best: Station | null = null;
      let bestD = Infinity;
      for (const st of STATIONS) {
        const w = pos.get(st.id)!;
        const p = toScreen(w.x, w.y, v);
        const d = Math.hypot(p.x - px, p.y - py);
        if (d < bestD) {
          bestD = d;
          best = st;
        }
      }
      return { st: best, d: bestD };
    };

    const onDown = (e: PointerEvent) => {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // 일부 환경에서 실패해도 탭 동작에는 지장 없음
      }
      const r = canvas.getBoundingClientRect();
      downX = e.clientX - r.left;
      downY = e.clientY - r.top;
      startV = { ...cur.current };
      dragging = false;
    };
    const onMove = (e: PointerEvent) => {
      if (!startV) return;
      const r = canvas.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      if (!dragging && Math.hypot(px - downX, py - downY) > 7) dragging = true;
      if (dragging && cur.current.s > 1.2) {
        const v = cur.current;
        v.x = startV.x - (px - downX) / (v.s * base());
        v.y = startV.y - (py - downY) / (v.s * base());
        v.x = Math.max(0.05, Math.min(0.95, v.x));
        v.y = Math.max(0.05, Math.min(0.95, v.y));
        queue.current = []; // 드래그 중엔 자동 이동 중지
      }
    };
    const onUp = (e: PointerEvent) => {
      if (!startV) return;
      startV = null;
      if (dragging) return;
      const r = canvas.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      const v = cur.current;
      const near = nearestStation(px, py);
      const w = worldOf(px, py);

      if (v.s < ZONE_LEVEL) {
        // 1단계: 전국 → 탭한 자치도로 확대
        const { lon, lat } = unproject(w.x, w.y);
        const z = ZONES.find(
          (z) => lon >= z.box[0] && lon <= z.box[2] && lat >= z.box[1] && lat <= z.box[3],
        );
        if (z) {
          const c = project((z.box[0] + z.box[2]) / 2, (z.box[1] + z.box[3]) / 2);
          queue.current = [{ x: c.x, y: c.y, s: zoneFitScale(z) }];
        } else if (near.st && near.d < 18) {
          // 구역 밖(울릉도 등) 지점은 바로 시·군으로
          queue.current = [groupView(groupOf(near.st))];
        }
        selectRef.current(null);
      } else if (v.s < GROUP_LEVEL) {
        // 2단계: 자치도 → 탭한 시·군으로 확대 (예: 전북에서 군산)
        // 시·군 이름(중심)을 기준으로 판정해야 라벨을 눌렀을 때 확실히 들어간다
        let bestG: GroupInfo | null = null;
        let bestGD = 52;
        for (const g of groups.values()) {
          const p = toScreen(g.x, g.y, v);
          const d = Math.hypot(p.x - px, p.y - py);
          if (d < bestGD) {
            bestGD = d;
            bestG = g;
          }
        }
        const g = bestG ?? (near.st && near.d < 34 ? groupOf(near.st) : null);
        if (g) {
          if (g.n === 1) {
            // 지점이 하나뿐인 시·군은 바로 카드까지
            queue.current = [spotView(g.stations[0])];
            selectRef.current(g.stations[0]);
          } else {
            queue.current = [groupView(g)];
            selectRef.current(null);
          }
        } else {
          queue.current = [{ x: w.x, y: w.y, s: v.s }];
          selectRef.current(null);
        }
      } else {
        // 3단계: 시·군 → 지점 선택 + 카드
        if (near.st && near.d < 34) {
          queue.current = [spotView(near.st)];
          selectRef.current(near.st);
        } else {
          queue.current = [{ x: w.x, y: w.y, s: v.s }];
          selectRef.current(null);
        }
      }
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetView = () => {
    queue.current = [{ x: 0.5, y: 0.5, s: 1 }];
    onSelect(null);
  };

  return (
    <>
      <canvas ref={canvasRef} className="map-canvas" />
      <div className="map-legend">
        <span><i style={{ background: '#3182F6' }} /> 가본 바다</span>
        <span><i style={{ background: '#F5A623' }} /> 가고싶은</span>
        <span><i style={{ background: '#2AC77F' }} /> 즐겨찾기</span>
      </div>
      {zoomed && (
        <button className="map-reset" onClick={resetView}>
          🗺️ 전체 지도
        </button>
      )}
    </>
  );
}
