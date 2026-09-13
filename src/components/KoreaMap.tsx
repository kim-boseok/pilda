import { useEffect, useMemo, useRef, useState } from 'react';
import type { Station } from '../types';
import { STATIONS, getTown } from '../data/stations';
import type { VisitMap } from '../lib/visits';
import { PROVINCES } from '../data/koreaGeo';

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

// 실제 시·도 경계(경량화)를 월드 좌표로 미리 투영해 둔다
const PROV_RINGS: { zone: string; rings: [number, number][][] }[] = PROVINCES.map((p) => ({
  zone: p.zone,
  rings: p.rings.map((ring) =>
    ring.map(([lon, lat]) => {
      const w = project(lon, lat);
      return [w.x, w.y] as [number, number];
    }),
  ),
}));

// 자치도(권역)별 색 구역 — 본토 외곽선으로 클리핑해서 칠한다
// box = [lon0, lat0(남), lon1, lat1(북)], label = 이름 표시 위치
interface Zone {
  name: string;
  box: [number, number, number, number];
  color: string;
  label: [number, number];
}
const ZONES: Zone[] = [
  { name: '경기·인천', box: [124.6, 36.9, 127.3, 38.7], color: '#eaf2fc', label: [126.95, 37.5] },
  { name: '강원', box: [127.3, 37.0, 129.7, 38.7], color: '#e9f6ef', label: [128.35, 37.75] },
  { name: '충청', box: [124.6, 36.0, 128.1, 36.9], color: '#fbf4e0', label: [126.95, 36.48] },
  { name: '전북', box: [124.6, 35.45, 127.9, 36.0], color: '#f1f7e3', label: [127.05, 35.72] },
  { name: '전남·광주', box: [124.6, 33.8, 127.78, 35.45], color: '#fceee7', label: [126.9, 34.98] },
  { name: '경북', box: [128.1, 35.75, 129.7, 37.0], color: '#efecfa', label: [128.8, 36.4] },
  { name: '경남·부산', box: [127.78, 33.8, 129.7, 35.75], color: '#faecf2', label: [128.35, 35.32] },
  { name: '제주', box: [125.8, 32.95, 127.3, 33.75], color: '#fdf2e1', label: [126.53, 33.68] },
];
const ZONE_COLOR: Record<string, string> = Object.fromEntries(ZONES.map((z) => [z.name, z.color]));

function unproject(wx: number, wy: number): { lon: number; lat: number } {
  return { lon: ((wx - OFFX) * DEN) / KX + LON0, lat: LAT1 - wy * DEN };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** 구역 박스를 화면에 딱 맞게 보여주는 배율 */
function zoneFitScale(z: Zone): number {
  const zw = ((z.box[2] - z.box[0]) * KX) / DEN;
  const zh = (z.box[3] - z.box[1]) / DEN;
  return clamp(0.85 / Math.max(zw, zh), 2.7, 4.4);
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

// 4단계 탐색: 전국 → 자치도 → 시·군 → 읍·면 → 지점
// 한 화면에 이름이 몰려 못 읽는 걸 막으려고 단계마다 '그 단계의 이름'만 보여준다
type Level = 'nation' | 'zone' | 'group' | 'town' | 'spot';

const SPOT_SCALE = 14;

interface Cluster {
  key: string;
  name: string;
  x: number;
  y: number;
  ext: number; // 반경(월드 좌표)
  stations: Station[];
}
interface GroupInfo extends Cluster {
  towns: Cluster[];
}

/** 지점 묶음의 중심·반경 계산 */
function centroid(c: Cluster, pos: Map<string, { x: number; y: number }>) {
  let x = 0;
  let y = 0;
  for (const st of c.stations) {
    const p = pos.get(st.id)!;
    x += p.x;
    y += p.y;
  }
  c.x = x / c.stations.length;
  c.y = y / c.stations.length;
  for (const st of c.stations) {
    const p = pos.get(st.id)!;
    c.ext = Math.max(c.ext, Math.hypot(p.x - c.x, p.y - c.y));
  }
}

export default function KoreaMap({ visits, favs, selected, onSelect, focus }: KoreaMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cur = useRef<View>({ x: 0.5, y: 0.5, s: 1 });
  const queue = useRef<View[]>([]);
  const holdUntil = useRef(0);
  const level = useRef<Level>('nation');
  const path = useRef<{ zone?: Zone; group?: GroupInfo; town?: Cluster }>({});
  // 라벨 페이드 (단계가 바뀔 때 이름이 부드럽게 교체되도록)
  const fade = useRef({ zone: 1, group: 0, town: 0, spot: 0 });
  const [nav, setNav] = useState<{ zone?: string; group?: string; town?: string; spot?: string }>(
    {},
  );

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

  // 시·군 묶음과 그 안의 읍·면 묶음
  const { groups, towns, groupOfStation, townOfStation } = useMemo(() => {
    const gm = new Map<string, GroupInfo>();
    const tm = new Map<string, Cluster>();
    const gOf = new Map<string, GroupInfo>();
    const tOf = new Map<string, Cluster>();

    for (const st of STATIONS) {
      const gKey = `${st.province}|${st.group}`;
      let g = gm.get(gKey);
      if (!g) {
        g = { key: gKey, name: st.group, x: 0, y: 0, ext: 0, stations: [], towns: [] };
        gm.set(gKey, g);
      }
      g.stations.push(st);
      gOf.set(st.id, g);

      // 읍·면·동을 모르는 지점은 시·군 이름으로 묶는다 (섬·항만 등 소수)
      const townName = getTown(st) ?? st.group;
      const tKey = `${gKey}|${townName}`;
      let t = tm.get(tKey);
      if (!t) {
        t = { key: tKey, name: townName, x: 0, y: 0, ext: 0, stations: [] };
        tm.set(tKey, t);
        g.towns.push(t);
      }
      t.stations.push(st);
      tOf.set(st.id, t);
    }

    for (const g of gm.values()) centroid(g, pos);
    for (const t of tm.values()) centroid(t, pos);
    return {
      groups: [...gm.values()],
      towns: [...tm.values()],
      groupOfStation: gOf,
      townOfStation: tOf,
    };
  }, [pos]);

  const zoneOf = (st: Station) =>
    ZONES.find(
      (z) => st.lon >= z.box[0] && st.lon <= z.box[2] && st.lat >= z.box[1] && st.lat <= z.box[3],
    );

  const zoneView = (z: Zone): View => {
    const c = project((z.box[0] + z.box[2]) / 2, (z.box[1] + z.box[3]) / 2);
    return { x: c.x, y: c.y, s: zoneFitScale(z) };
  };
  const groupView = (g: GroupInfo): View => ({
    x: g.x,
    y: g.y,
    s: clamp(0.4 / Math.max(g.ext, 0.035), 4.6, 9),
  });
  const townView = (t: Cluster): View => ({
    x: t.x,
    y: t.y,
    s: clamp(0.28 / Math.max(t.ext, 0.02), 7, 14),
  });
  const spotView = (st: Station): View => {
    const p = pos.get(st.id)!;
    // 하단 카드에 가리지 않도록 지점을 화면 위쪽에 두는 오프셋
    return { x: p.x, y: p.y + 0.22 / SPOT_SCALE, s: SPOT_SCALE };
  };

  /** 단계 이동 — 카메라·상태·빵부스러기를 한 번에 맞춘다 */
  const goTo = (lv: Level, steps: View[], p: typeof path.current, st: Station | null) => {
    level.current = lv;
    path.current = p;
    queue.current = steps;
    setNav({ zone: p.zone?.name, group: p.group?.name, town: p.town?.name, spot: st?.name });
    selectRef.current(st);
  };

  const enterZone = (z: Zone) => goTo('zone', [zoneView(z)], { zone: z }, null);
  const enterGroup = (g: GroupInfo, z?: Zone) =>
    goTo('group', [groupView(g)], { zone: z ?? path.current.zone, group: g }, null);
  const enterTown = (t: Cluster, g?: GroupInfo) =>
    goTo('town', [townView(t)], { ...path.current, group: g ?? path.current.group, town: t }, null);

  /** 지점으로 향하는 토스식 다단계 줌 체인 (자치도 → 시·군 → 읍·면 → 지점) */
  const zoomToStation = (st: Station) => {
    const g = groupOfStation.get(st.id)!;
    const t = townOfStation.get(st.id)!;
    const z = zoneOf(st);
    const steps: View[] = [];
    const lv = level.current;
    if (lv === 'nation' && z) steps.push(zoneView(z));
    if (lv === 'nation' || lv === 'zone') steps.push(groupView(g));
    if (lv !== 'spot' && t.stations.length > 1) steps.push(townView(t));
    steps.push(spotView(st));
    goTo('spot', steps, { zone: z, group: g, town: t }, st);
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

    // 월드 좌표 링을 화면 경로로 (dy: 3D 두께용 세로 오프셋 px)
    const traceRing = (ring: [number, number][], v: View, dy = 0) => {
      for (let i = 0; i < ring.length; i++) {
        const p = toScreen(ring[i][0], ring[i][1], v);
        if (i === 0) ctx.moveTo(p.x, p.y + dy);
        else ctx.lineTo(p.x, p.y + dy);
      }
      ctx.closePath();
    };
    const traceAll = (v: View, dy = 0) => {
      ctx.beginPath();
      for (const pr of PROV_RINGS) for (const ring of pr.rings) traceRing(ring, v, dy);
    };

    // ── 라벨 배치 — 이미 놓인 글자와 겹치면 건너뛴다 (이름이 뭉개지지 않도록) ──
    let placed: [number, number, number, number][] = [];
    const room = (x0: number, y0: number, x1: number, y1: number) =>
      placed.every((r) => x1 < r[0] || x0 > r[2] || y1 < r[1] || y0 > r[3]);

    interface LabelOpt {
      font: string;
      fill: string;
      halo?: string;
      align?: 'center' | 'left';
      pad?: number;
    }
    const putLabel = (text: string, x: number, y: number, o: LabelOpt): boolean => {
      ctx.font = o.font;
      const w = ctx.measureText(text).width;
      const pad = o.pad ?? 2;
      const x0 = (o.align === 'left' ? x : x - w / 2) - pad;
      const x1 = x0 + w + pad * 2;
      const y0 = y - 9;
      const y1 = y + 4;
      if (x1 < -10 || x0 > W + 10 || y1 < -10 || y0 > H + 10) return false;
      if (!room(x0, y0, x1, y1)) return false;
      placed.push([x0, y0, x1, y1]);
      ctx.textAlign = o.align ?? 'center';
      if (o.halo) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = o.halo;
        ctx.strokeText(text, x, y);
      }
      ctx.fillStyle = o.fill;
      ctx.fillText(text, x, y);
      return true;
    };

    const draw = (t: number) => {
      const v = cur.current;
      const { visits: vm, favs: fv, selected: sel } = propsRef.current;
      const fd = fade.current;
      placed = [];

      // 밝은 배경 (은은한 하늘빛 그라데이션)
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#f6f9fd');
      g.addColorStop(1, '#e9f1f9');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // ① 바닥 그림자 — 지도가 떠 있는 듯한 소프트 섀도
      ctx.save();
      ctx.shadowColor = 'rgba(37,53,84,0.20)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 16;
      ctx.fillStyle = '#ffffff';
      traceAll(v);
      ctx.fill();
      ctx.restore();

      // ② 옆면(3D 두께) — 실루엣을 아래로 밀어 채운다
      const depth = 7;
      ctx.fillStyle = '#c5cedc';
      traceAll(v, depth);
      ctx.fill();
      ctx.fillStyle = '#cfd7e3';
      traceAll(v, depth * 0.5);
      ctx.fill();

      // ③ 윗면 — 시·도별로 권역 파스텔 틴트
      for (const pr of PROV_RINGS) {
        ctx.fillStyle = ZONE_COLOR[pr.zone] ?? '#ffffff';
        ctx.beginPath();
        for (const ring of pr.rings) traceRing(ring, v);
        ctx.fill();
      }

      // ④ 시·도 경계선 — 가늘고 옅은 회색
      ctx.strokeStyle = 'rgba(146,159,180,0.55)';
      ctx.lineWidth = 1;
      traceAll(v);
      ctx.stroke();

      // ── 지점 점 ──
      const f = Math.min(2.2, Math.sqrt(v.s));
      const wide = v.s < 2.1;
      const dotAlpha = wide ? 0.28 : 0.55;
      const dotR = wide ? 1.1 : 1.6 * f;
      const favSet = new Set(fv);
      const named: { st: Station; x: number; y: number; marked: boolean; color: string }[] = [];

      for (const st of STATIONS) {
        const w = pos.get(st.id)!;
        const p = toScreen(w.x, w.y, v);
        if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) continue;
        const state = vm[st.id];
        const isFavd = favSet.has(st.id);
        const marked = Boolean(state) || isFavd;
        const color = state === 'visited' ? '#3182F6' : state === 'wish' ? '#F5A623' : '#2AC77F';

        if (!marked) {
          ctx.fillStyle = `rgba(150,162,178,${dotAlpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, dotR, 0, Math.PI * 2);
          ctx.fill();
        } else {
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
        }
        named.push({ st, x: p.x, y: p.y, marked, color });
      }

      // ── 라벨: 선택된 지점 > 표시한 바다 > 나머지 순으로 자리를 차지한다 ──
      // 읍·면 화면(지점 이름)에서만 전부 보이고, 표시해 둔 바다는 시·군 화면부터 보인다
      const stationAlpha = fd.spot;
      const markedAlpha = Math.max(fd.spot, fd.town);
      // 지금 들어와 있는 읍·면의 바다를 앞세운다 (옆 동네는 참고용으로 옅게)
      const tKey = path.current.town?.key;
      const here = (st: Station) => !tKey || townOfStation.get(st.id)?.key === tKey;
      named.sort((a, b) => {
        const rank = (n: typeof a) =>
          sel && n.st.id === sel.id ? 0 : n.marked ? 1 : here(n.st) ? 2 : 3;
        return rank(a) - rank(b);
      });
      for (const n of named) {
        const isSel = sel?.id === n.st.id;
        const a = isSel ? 1 : n.marked ? markedAlpha : stationAlpha * (here(n.st) ? 1 : 0.34);
        if (a < 0.04) continue;
        putLabel(n.st.name, n.x + 7 * f, n.y + 4, {
          font: n.marked ? '600 11px Pretendard, sans-serif' : '500 10.5px Pretendard, sans-serif',
          fill: n.marked ? `rgba(58,68,84,${a})` : `rgba(78,89,104,${a * 0.85})`,
          halo: `rgba(255,255,255,${0.85 * a})`,
          align: 'left',
        });
      }

      // ── 읍·면 이름 (시·군 화면) ──
      // 지금 들어와 있는 시·군의 면을 먼저·진하게, 옆 시·군의 면은 옅게 (눌러서 건너갈 수는 있다)
      if (fd.town > 0.03) {
        const gKey = path.current.group?.key;
        const mine = (tw: Cluster) => !gKey || tw.key.startsWith(`${gKey}|`);
        const ordered = [...towns].sort((a, b) => Number(mine(b)) - Number(mine(a)));
        for (const tw of ordered) {
          const a = fd.town * (mine(tw) ? 1 : 0.3);
          const p = toScreen(tw.x, tw.y, v);
          putLabel(tw.name, p.x, p.y - 9, {
            font: mine(tw)
              ? '700 12.5px Pretendard, sans-serif'
              : '600 11.5px Pretendard, sans-serif',
            fill: `rgba(64,74,90,${a})`,
            halo: `rgba(255,255,255,${0.92 * a})`,
            pad: 5,
          });
        }
      }

      // ── 시·군 이름 (자치도 화면) ──
      if (fd.group > 0.03) {
        for (const gp of groups) {
          const p = toScreen(gp.x, gp.y, v);
          putLabel(gp.name, p.x, p.y - 8, {
            font: '700 12.5px Pretendard, sans-serif',
            fill: `rgba(70,80,95,${fd.group})`,
            halo: `rgba(255,255,255,${0.92 * fd.group})`,
            pad: 5,
          });
        }
      }

      // ── 자치도 이름 (전국 화면) ──
      if (fd.zone > 0.03) {
        for (const z of ZONES) {
          const c = project(z.label[0], z.label[1]);
          const p = toScreen(c.x, c.y, v);
          putLabel(z.name, p.x, p.y, {
            font: '800 13px Pretendard, sans-serif',
            fill: `rgba(90,100,115,${fd.zone})`,
            halo: `rgba(255,255,255,${0.9 * fd.zone})`,
            pad: 5,
          });
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

      // 단계에 맞춰 라벨 페이드
      const lv = level.current;
      const want = {
        zone: lv === 'nation' ? 1 : 0,
        group: lv === 'zone' ? 1 : 0,
        town: lv === 'group' ? 1 : 0,
        spot: lv === 'town' || lv === 'spot' ? 1 : 0,
      };
      const fk = 1 - Math.exp(-dt * 7);
      const fd = fade.current;
      fd.zone += (want.zone - fd.zone) * fk;
      fd.group += (want.group - fd.group) * fk;
      fd.town += (want.town - fd.town) * fk;
      fd.spot += (want.spot - fd.spot) * fk;

      draw(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // ── 포인터: 탭 = 한 단계 들어가기, 드래그 = 이동 ──
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

    const nearestCluster = <T extends Cluster>(list: T[], px: number, py: number, max: number) => {
      const v = cur.current;
      let best: T | null = null;
      let bestD = max;
      for (const c of list) {
        const p = toScreen(c.x, c.y, v);
        const d = Math.hypot(p.x - px, p.y - py);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      return best;
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
        v.x = clamp(v.x, 0.05, 0.95);
        v.y = clamp(v.y, 0.05, 0.95);
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
      const lv = level.current;
      const near = nearestStation(px, py);

      if (lv === 'nation') {
        // ① 전국 → 탭한 자치도
        const w = worldOf(px, py);
        const { lon, lat } = unproject(w.x, w.y);
        const z = ZONES.find(
          (z) => lon >= z.box[0] && lon <= z.box[2] && lat >= z.box[1] && lat <= z.box[3],
        );
        if (z) enterZone(z);
        else if (near.st && near.d < 18) {
          // 구역 밖(울릉도 등) 지점은 바로 시·군으로
          enterGroup(groupOfStation.get(near.st.id)!, zoneOf(near.st));
        }
        return;
      }

      if (lv === 'zone') {
        // ② 자치도 → 탭한 시·군 (예: 전남에서 신안군)
        const g =
          nearestCluster(groups, px, py, 56) ??
          (near.st && near.d < 34 ? groupOfStation.get(near.st.id)! : null);
        if (!g) return;
        if (g.stations.length === 1) zoomToStation(g.stations[0]);
        else if (g.towns.length === 1) enterTown(g.towns[0], g);
        else enterGroup(g);
        return;
      }

      if (lv === 'group') {
        // ③ 시·군 → 탭한 읍·면 (예: 신안군에서 임자면)
        const tw =
          nearestCluster(towns, px, py, 60) ??
          (near.st && near.d < 30 ? townOfStation.get(near.st.id)! : null);
        if (!tw) return;
        if (tw.stations.length === 1) zoomToStation(tw.stations[0]);
        else enterTown(tw);
        return;
      }

      // ④ 읍·면 → 지점 선택 + 카드 (빈 곳을 누르면 카드를 닫는다)
      if (near.st && near.d < 34) zoomToStation(near.st);
      else if (lv === 'spot' && path.current.town) enterTown(path.current.town);
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

  const goNation = () => goTo('nation', [{ x: 0.5, y: 0.5, s: 1 }], {}, null);
  const goZone = () => path.current.zone && enterZone(path.current.zone);
  const goGroup = () => path.current.group && enterGroup(path.current.group);
  const goTown = () => path.current.town && enterTown(path.current.town);

  // 빵부스러기 — 어느 단계인지 보이고, 눌러서 되돌아갈 수 있다
  const crumbs: { label: string; go?: () => void }[] = [{ label: '전국', go: goNation }];
  if (nav.zone) crumbs.push({ label: nav.zone, go: goZone });
  if (nav.group) crumbs.push({ label: nav.group, go: goGroup });
  if (nav.town && nav.town !== nav.group) crumbs.push({ label: nav.town, go: goTown });
  if (nav.spot) crumbs.push({ label: nav.spot });
  const deep = crumbs.length > 1;
  if (deep) crumbs[crumbs.length - 1].go = undefined; // 현재 단계는 누를 필요 없음

  return (
    <>
      <canvas ref={canvasRef} className="map-canvas" />
      {deep ? (
        <div className="map-crumb">
          {crumbs.map((c, i) => (
            <span key={`${c.label}-${i}`}>
              {i > 0 && <i>›</i>}
              {c.go ? (
                <button onClick={c.go}>{c.label}</button>
              ) : (
                <b>{c.label}</b>
              )}
            </span>
          ))}
        </div>
      ) : (
        <div className="map-legend">
          <span><i style={{ background: '#3182F6' }} /> 가본 바다</span>
          <span><i style={{ background: '#F5A623' }} /> 가고싶은</span>
          <span><i style={{ background: '#2AC77F' }} /> 즐겨찾기</span>
        </div>
      )}
      {deep && (
        <button className="map-reset" onClick={goNation}>
          🗺️ 전체 지도
        </button>
      )}
      {!deep && <div className="map-hint">지역을 눌러 들어가 보세요</div>}
    </>
  );
}
