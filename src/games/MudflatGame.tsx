// 갯벌체험 미니게임 — 60초 동안 호미로 갯벌 생물을 잡아 포인트 획득
import { useEffect, useRef, useState } from 'react';
import type { JSX, CSSProperties } from 'react';
import { drawCrab, drawShell, drawOcto, drawSkipper, drawBubble } from '../scenes/creatures.ts';
import { mulberry } from '../scenes/sky.ts';

// ---- 상수 ----
const ROUND_SEC = 60;
const TEASE_DUR = 0.6;
const EMERGE_DUR = 0.25;
const FLEE_DUR = 0.3;
const SWING_DUR = 0.18;
const FLY_DUR = 0.5;
const MAX_ACTIVE = 4;

interface Species {
  name: string;
  emoji: string;
  weight: number;   // 등장 확률 가중치
  pts: number;
  baseCatch: number;
  waitMin: number;
  waitMax: number;
}
const SPECIES: Species[] = [
  { name: '바지락', emoji: '🐚', weight: 0.40, pts: 5, baseCatch: 0.90, waitMin: 1.8, waitMax: 2.4 },
  { name: '소라', emoji: '🐚', weight: 0.15, pts: 8, baseCatch: 0.85, waitMin: 1.6, waitMax: 2.2 },
  { name: '꽃게', emoji: '🦀', weight: 0.25, pts: 10, baseCatch: 0.65, waitMin: 1.2, waitMax: 1.8 },
  { name: '짱뚱어', emoji: '🐟', weight: 0.12, pts: 15, baseCatch: 0.55, waitMin: 1.4, waitMax: 1.4 },
  { name: '낙지', emoji: '🐙', weight: 0.08, pts: 25, baseCatch: 0.45, waitMin: 0.8, waitMax: 1.2 },
];

// ---- 이징 ----
const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;
const easeInCubic = (t: number): number => t * t * t;
const easeInQuad = (t: number): number => t * t;
const easeInOut = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

// 스팟 상태: 0 idle / 1 예고 / 2 등장 / 3 대기 / 4 도망
interface Spot {
  fx: number; fy: number; sc: number;
  st: number;
  t: number;       // 현재 상태 경과
  dur: number;     // 현재 상태 길이 (idle=다음 예고까지, wait=대기시간)
  kind: number;
  aliveT: number;  // 등장 시작 이후 경과 (빠른 탭 보너스 판정)
  wob: number;     // 흔들림 위상
  rot: number;     // 조개 회전
  dir: number;     // 좌우 방향
  hopAt: number;   // 짱뚱어 폴짝 시작 시각(대기 내)
  hopT: number;    // 폴짝 진행 (-1: 없음)
  hopFrom: number; hopTo: number; // x 오프셋(px)
  offX: number;
}
interface Particle { on: boolean; x: number; y: number; vx: number; vy: number; age: number; life: number; r: number; light: boolean }
interface Floater { on: boolean; x: number; y: number; age: number; text: string; color: string }
interface Flier { on: boolean; kind: number; x0: number; y0: number; t: number; sc: number; dir: number; rot: number }
interface Swing { on: boolean; x: number; y: number; t: number; hitDone: boolean }

interface Game {
  w: number; h: number; t: number;
  phase: 'intro' | 'count' | 'play' | 'end';
  countT: number;
  time: number;
  score: number;
  combo: number;
  counts: number[];
  gained: number[];
  spots: Spot[];
  particles: Particle[];
  floaters: Floater[];
  fliers: Flier[];
  swings: Swing[];
  basketBounce: number;
  rnd: () => number;
  // 배경 캐시
  seaGrad: CanvasGradient | null;
  mudGrad: CanvasGradient | null;
  speckles: { x: number; y: number; r: number; dark: boolean }[];
  pools: { x: number; y: number; rx: number; tw: number }[];
  channels: { x: number; s1: number; s2: number; lw: number }[];
}

function makeGame(): Game {
  const rnd = mulberry(20260913);
  const spots: Spot[] = [];
  const rowY = [0.42, 0.6, 0.79];
  const rowS = [0.85, 1.1, 1.4];
  const colX = [0.2, 0.5, 0.8];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      spots.push({
        fx: colX[c] + (rnd() - 0.5) * 0.07,
        fy: rowY[r] + (rnd() - 0.5) * 0.03,
        sc: rowS[r],
        st: 0, t: 1 + rnd() * 3, dur: 0,
        kind: 0, aliveT: 0, wob: rnd() * Math.PI * 2, rot: 0,
        dir: rnd() > 0.5 ? 1 : -1,
        hopAt: -1, hopT: -1, hopFrom: 0, hopTo: 0, offX: 0,
      });
    }
  }
  return {
    w: 0, h: 0, t: 0,
    phase: 'intro', countT: 3, time: ROUND_SEC, score: 0, combo: 0,
    counts: [0, 0, 0, 0, 0], gained: [0, 0, 0, 0, 0],
    spots,
    particles: Array.from({ length: 64 }, () => ({ on: false, x: 0, y: 0, vx: 0, vy: 0, age: 0, life: 0, r: 0, light: false })),
    floaters: Array.from({ length: 10 }, () => ({ on: false, x: 0, y: 0, age: 0, text: '', color: '' })),
    fliers: Array.from({ length: 6 }, () => ({ on: false, kind: 0, x0: 0, y0: 0, t: 0, sc: 1, dir: 1, rot: 0 })),
    swings: Array.from({ length: 4 }, () => ({ on: false, x: 0, y: 0, t: 0, hitDone: false })),
    basketBounce: 0,
    rnd,
    seaGrad: null, mudGrad: null,
    speckles: Array.from({ length: 40 }, () => ({ x: rnd(), y: rnd(), r: 0.7 + rnd() * 1.4, dark: rnd() > 0.45 })),
    pools: Array.from({ length: 3 }, () => ({ x: 0.1 + rnd() * 0.8, y: 0.15 + rnd() * 0.7, rx: 0.05 + rnd() * 0.06, tw: rnd() * Math.PI * 2 })),
    channels: [
      { x: 0.3, s1: -0.06, s2: 0.05, lw: 9 },
      { x: 0.68, s1: 0.05, s2: -0.04, lw: 7 },
    ],
  };
}

function pickSpecies(rnd: () => number): number {
  let roll = rnd();
  for (let i = 0; i < SPECIES.length; i++) {
    roll -= SPECIES[i].weight;
    if (roll <= 0) return i;
  }
  return 0;
}

function spawnMud(G: Game, x: number, y: number, n: number, power: number): void {
  let made = 0;
  for (let i = 0; i < G.particles.length && made < n; i++) {
    const p = G.particles[i];
    if (p.on) continue;
    const a = -Math.PI * (0.2 + G.rnd() * 0.6);
    const sp = (40 + G.rnd() * 90) * power;
    p.on = true; p.x = x + (G.rnd() - 0.5) * 10; p.y = y;
    p.vx = Math.cos(a) * sp * (G.rnd() > 0.5 ? 1 : -1) * 0.6;
    p.vy = Math.sin(a) * sp;
    p.age = 0; p.life = 0.45 + G.rnd() * 0.35;
    p.r = 1.4 + G.rnd() * 2.2;
    p.light = G.rnd() > 0.6;
    made++;
  }
}

function spawnFloater(G: Game, x: number, y: number, text: string, color: string): void {
  for (let i = 0; i < G.floaters.length; i++) {
    const f = G.floaters[i];
    if (f.on) continue;
    f.on = true; f.x = x; f.y = y; f.age = 0; f.text = text; f.color = color;
    return;
  }
}

/** 스팟을 idle로 되돌림 */
function resetSpot(G: Game, s: Spot): void {
  s.st = 0;
  s.t = 1 + G.rnd() * 3;
  s.offX = 0; s.hopT = -1; s.hopAt = -1;
}

/** 등장~대기 중 생물의 그리기 파라미터 계산 없이 즉석 렌더 */
function drawCreature(ctx: CanvasRenderingContext2D, G: Game, kind: number, x: number, y: number, sc: number, dir: number, rot: number, alpha: number, hop: number): void {
  switch (kind) {
    case 0: drawShell(ctx, x, y - 3 * sc, 9 * sc, rot, alpha); break;
    case 1: // 소라 — 크고 기울어진 껍데기 2겹
      drawShell(ctx, x, y - 3 * sc, 11.5 * sc, rot + 0.65, alpha);
      drawShell(ctx, x + 3 * sc, y - 1.5 * sc, 6 * sc, rot - 0.5, alpha * 0.85);
      break;
    case 2: drawCrab(ctx, x, y - 4 * sc, 0.95 * sc, G.t * 9, true, alpha); break;
    case 3: drawSkipper(ctx, x, y - 3 * sc, 0.85 * sc, dir, hop, alpha); break;
    default: drawOcto(ctx, x, y - 2 * sc, 0.85 * sc, G.t, alpha);
  }
}

export default function MudflatGame({ onExit }: { onExit: (points: number) => void }): JSX.Element {
  const gRef = useRef<Game | null>(null);
  if (!gRef.current) gRef.current = makeGame();
  const boxRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<Game['phase']>('intro');
  const [time, setTime] = useState(ROUND_SEC);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    const G = gRef.current;
    if (!box || !canvas || !G) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const r = box.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      G.w = Math.max(1, r.width);
      G.h = Math.max(1, r.height);
      canvas.width = Math.round(G.w * dpr);
      canvas.height = Math.round(G.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const seaH = G.h * 0.18;
      const sg = ctx.createLinearGradient(0, 0, 0, seaH);
      sg.addColorStop(0, 'rgb(150,210,236)');
      sg.addColorStop(0.55, 'rgb(96,186,196)');
      sg.addColorStop(1, 'rgb(64,164,170)');
      G.seaGrad = sg;
      const mg = ctx.createLinearGradient(0, seaH, 0, G.h);
      mg.addColorStop(0, 'rgb(138,104,80)');
      mg.addColorStop(1, 'rgb(92,66,50)');
      G.mudGrad = mg;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(box);

    let lastTimeInt = ROUND_SEC;
    let lastCombo = 0;
    let lastScore = 0;

    const syncHud = () => {
      const ti = Math.max(0, Math.ceil(G.time));
      if (ti !== lastTimeInt) { lastTimeInt = ti; setTime(ti); }
      if (G.score !== lastScore) { lastScore = G.score; setScore(G.score); }
      if (G.combo !== lastCombo) { lastCombo = G.combo; setCombo(G.combo); }
    };

    // ---- 탭 → 호미 스윙 + 판정 ----
    const onPointer = (e: PointerEvent) => {
      if (G.phase !== 'play') return;
      const r = canvas.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      // 스윙 시작
      for (let i = 0; i < G.swings.length; i++) {
        const sw = G.swings[i];
        if (sw.on) continue;
        sw.on = true; sw.x = px; sw.y = py; sw.t = 0; sw.hitDone = false;
        break;
      }
      // 히트 판정 — 앞줄(큰 스케일) 우선
      for (let i = G.spots.length - 1; i >= 0; i--) {
        const s = G.spots[i];
        if (s.st !== 2 && s.st !== 3) continue;
        const cx = s.fx * G.w + s.offX;
        const cy = s.fy * G.h - 5 * s.sc;
        const rad = 24 * s.sc; // 스케일 비례 약 22~34px
        const dx = px - cx;
        const dy = py - cy;
        if (dx * dx + dy * dy > rad * rad) continue;
        const sp = SPECIES[s.kind];
        const bonus = s.aliveT <= 0.5 ? 0.15 : 0;
        if (G.rnd() < sp.baseCatch + bonus) {
          // 성공 — 콤보·점수·바구니 비행
          G.combo += 1;
          const mul = G.combo >= 3 ? 1.5 : 1;
          const got = Math.round(sp.pts * mul);
          G.score += got;
          G.counts[s.kind] += 1;
          G.gained[s.kind] += got;
          spawnFloater(G, cx, cy - 14 * s.sc, `+${got}P`, '#4ade80');
          spawnMud(G, cx, s.fy * G.h, 5, 0.8);
          for (let j = 0; j < G.fliers.length; j++) {
            const fl = G.fliers[j];
            if (fl.on) continue;
            fl.on = true; fl.kind = s.kind; fl.x0 = cx; fl.y0 = cy;
            fl.t = 0; fl.sc = s.sc; fl.dir = s.dir; fl.rot = 0;
            break;
          }
          resetSpot(G, s);
        } else {
          // 실패 — 즉시 도망
          G.combo = 0;
          spawnFloater(G, cx, cy - 12 * s.sc, '앗, 놓쳤다!', '#cbd5e1');
          s.st = 4; s.t = 0;
        }
        syncHud();
        break;
      }
    };
    canvas.addEventListener('pointerdown', onPointer);

    // ---- 업데이트 ----
    const step = (dt: number) => {
      G.t += dt;
      G.phase = phaseRef.current;

      if (G.phase === 'count') {
        G.countT -= dt;
        if (G.countT <= 0) {
          G.time = ROUND_SEC;
          setPhase('play');
          phaseRef.current = 'play';
          G.phase = 'play';
        }
      }

      if (G.phase === 'play') {
        G.time -= dt;
        if (G.time <= 0) {
          G.time = 0;
          setPhase('end');
          phaseRef.current = 'end';
          G.phase = 'end';
        }
        // 스팟 상태머신
        let active = 0;
        for (let i = 0; i < G.spots.length; i++) if (G.spots[i].st > 0) active++;
        for (let i = 0; i < G.spots.length; i++) {
          const s = G.spots[i];
          if (s.st === 0) {
            s.t -= dt;
            if (s.t <= 0 && active < MAX_ACTIVE) {
              active++;
              s.st = 1; s.t = 0;
              s.kind = pickSpecies(G.rnd);
              const sp = SPECIES[s.kind];
              s.dur = sp.waitMin + G.rnd() * (sp.waitMax - sp.waitMin);
              s.rot = (G.rnd() - 0.5) * 0.8;
              s.dir = G.rnd() > 0.5 ? 1 : -1;
              s.hopAt = s.kind === 3 ? 0.25 + G.rnd() * 0.5 : -1;
              s.hopT = -1; s.offX = 0;
            }
          } else if (s.st === 1) {
            s.t += dt;
            if (s.t >= TEASE_DUR) {
              s.st = 2; s.t = 0; s.aliveT = 0;
              spawnMud(G, s.fx * G.w, s.fy * G.h, 6 + ((G.rnd() * 5) | 0), 1);
            }
          } else if (s.st === 2) {
            s.t += dt; s.aliveT += dt;
            if (s.t >= EMERGE_DUR) { s.st = 3; s.t = 0; }
          } else if (s.st === 3) {
            s.t += dt; s.aliveT += dt;
            // 짱뚱어 폴짝 — 옆으로 한 번 이동
            if (s.hopAt >= 0 && s.t >= s.hopAt && s.hopT < 0) {
              s.hopT = 0;
              s.hopFrom = s.offX;
              s.hopTo = s.offX + s.dir * 34 * s.sc;
              s.hopAt = -1;
            }
            if (s.hopT >= 0 && s.hopT < 1) {
              s.hopT = Math.min(1, s.hopT + dt / 0.3);
              s.offX = s.hopFrom + (s.hopTo - s.hopFrom) * easeInOut(s.hopT);
            }
            if (s.t >= s.dur) { s.st = 4; s.t = 0; }
          } else {
            s.t += dt;
            if (s.t >= FLEE_DUR) resetSpot(G, s);
          }
        }
        syncHud();
      }

      // 풀 오브젝트 갱신 (모든 단계에서 잔여 애니 마무리)
      for (let i = 0; i < G.particles.length; i++) {
        const p = G.particles[i];
        if (!p.on) continue;
        p.age += dt;
        if (p.age >= p.life) { p.on = false; continue; }
        p.vy += 460 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      for (let i = 0; i < G.floaters.length; i++) {
        const f = G.floaters[i];
        if (!f.on) continue;
        f.age += dt;
        if (f.age >= 0.9) f.on = false;
      }
      for (let i = 0; i < G.fliers.length; i++) {
        const fl = G.fliers[i];
        if (!fl.on) continue;
        fl.t += dt / FLY_DUR;
        if (fl.t >= 1) { fl.on = false; G.basketBounce = 1; }
      }
      for (let i = 0; i < G.swings.length; i++) {
        const sw = G.swings[i];
        if (!sw.on) continue;
        sw.t += dt;
        if (!sw.hitDone && sw.t >= SWING_DUR) {
          sw.hitDone = true;
          spawnMud(G, sw.x, sw.y + 4, 4, 0.55);
        }
        if (sw.t >= SWING_DUR + 0.14) sw.on = false;
      }
      if (G.basketBounce > 0) G.basketBounce = Math.max(0, G.basketBounce - dt / 0.4);
    };

    // ---- 렌더 ----
    const render = () => {
      const { w, h, t } = G;
      const seaH = h * 0.18;
      // 먼바다 + 펄
      ctx.fillStyle = G.seaGrad ?? '#5ab0b8';
      ctx.fillRect(0, 0, w, seaH + 1);
      ctx.fillStyle = G.mudGrad ?? '#8a6850';
      ctx.fillRect(0, seaH, w, h - seaH);
      // 물가 흰 선 — 잔잔히 밀려오는 스와시
      ctx.lineCap = 'round';
      ctx.strokeStyle = `rgba(255,255,255,${0.72 + 0.18 * Math.sin(t * 2.1)})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 14) {
        const yy = seaH + Math.sin(x * 0.045 + t * 1.5) * 2;
        if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${0.26 + 0.12 * Math.sin(t * 1.6 + 2)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 14) {
        const yy = seaH + 7 + Math.sin(x * 0.05 + t * 1.2 + 1) * 2.4;
        if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
      // 물골 곡선
      ctx.strokeStyle = 'rgba(58,40,30,0.3)';
      for (let i = 0; i < G.channels.length; i++) {
        const c = G.channels[i];
        ctx.lineWidth = c.lw;
        ctx.beginPath();
        ctx.moveTo(c.x * w, seaH + 8);
        ctx.quadraticCurveTo((c.x + c.s1) * w, seaH + (h - seaH) * 0.5, (c.x + c.s2) * w, h + 10);
        ctx.stroke();
      }
      // 물웅덩이 — 하늘빛 반사
      for (let i = 0; i < G.pools.length; i++) {
        const pl = G.pools[i];
        const py = seaH + pl.y * (h - seaH);
        const rx = pl.rx * w;
        const ry = Math.max(3, rx * 0.28);
        ctx.fillStyle = 'rgba(150,206,228,0.42)';
        ctx.beginPath();
        ctx.ellipse(pl.x * w, py, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255,255,255,${0.16 + 0.1 * Math.sin(t * 1.9 + pl.tw)})`;
        ctx.beginPath();
        ctx.ellipse(pl.x * w - rx * 0.22, py - ry * 0.3, rx * 0.5, ry * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // 펄 질감 알갱이
      for (let i = 0; i < G.speckles.length; i++) {
        const sp = G.speckles[i];
        ctx.fillStyle = sp.dark ? 'rgba(38,25,17,0.14)' : 'rgba(255,242,222,0.1)';
        ctx.beginPath();
        ctx.arc(sp.x * w, seaH + sp.y * (h - seaH), sp.r * (0.6 + sp.y * 0.8), 0, Math.PI * 2);
        ctx.fill();
      }

      // ---- 스팟 (구멍 + 생물), 윗줄부터 그려 원근 겹침 ----
      for (let i = 0; i < G.spots.length; i++) {
        const s = G.spots[i];
        const hx = s.fx * w;
        const hy = s.fy * h;
        const sc = s.sc;
        // 구멍
        ctx.fillStyle = 'rgba(46,30,20,0.5)';
        ctx.beginPath();
        ctx.ellipse(hx, hy, 9 * sc, 3.6 * sc, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(24,14,8,0.55)';
        ctx.beginPath();
        ctx.ellipse(hx, hy, 5.5 * sc, 2.1 * sc, 0, 0, Math.PI * 2);
        ctx.fill();

        if (s.st === 1) {
          // 예고 — 뽀글뽀글 거품 2개 위상차
          drawBubble(ctx, hx - 3 * sc, hy - 1, clamp01(s.t / TEASE_DUR), sc * 0.9);
          const t2 = s.t / TEASE_DUR - 0.35;
          if (t2 > 0) drawBubble(ctx, hx + 4 * sc, hy, clamp01(t2 / 0.65), sc * 0.7);
        } else if (s.st === 2 || s.st === 3 || s.st === 4) {
          let yOff = 0;
          let alpha = 1;
          let clip = false;
          if (s.st === 2) {
            const e = easeOutCubic(clamp01(s.t / EMERGE_DUR));
            yOff = (1 - e) * 24 * sc;
            alpha = 0.35 + e * 0.65;
            clip = true;
          } else if (s.st === 4) {
            const e = easeInCubic(clamp01(s.t / FLEE_DUR));
            yOff = e * 28 * sc;
            alpha = 1 - e * 0.9;
            clip = true;
          }
          const wobY = s.st === 3 ? Math.sin(t * 5.5 + s.wob) * 1.1 * sc : 0;
          const hop = s.hopT >= 0 && s.hopT < 1 ? Math.sin(Math.PI * s.hopT) : 0;
          const cx = hx + s.offX;
          const cy = hy + yOff + wobY - hop * 8 * sc;
          if (clip) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(cx - 40 * sc, hy - 60 * sc, 80 * sc, 60 * sc + 4 * sc);
            ctx.clip();
          }
          drawCreature(ctx, G, s.kind, cx, cy, sc, s.dir, s.rot, alpha, hop);
          if (clip) ctx.restore();
        }
      }

      // ---- 포물선 비행 (잡힌 생물 → 바구니) ----
      const bx = w - 54;
      const by = h - 66;
      for (let i = 0; i < G.fliers.length; i++) {
        const fl = G.fliers[i];
        if (!fl.on) continue;
        const te = easeInOut(clamp01(fl.t));
        const fx = fl.x0 + (bx - fl.x0) * te;
        const fy = fl.y0 + (by - 18 - fl.y0) * te - Math.sin(Math.PI * te) * 90;
        const fsc = fl.sc * (1 - 0.45 * te);
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(te * 1.9 * fl.dir);
        drawCreature(ctx, G, fl.kind, 0, 0, fsc, fl.dir, 0.3, 1, 0);
        ctx.restore();
      }

      // ---- 대나무 바구니 ----
      {
        const bounce = G.basketBounce;
        const squash = bounce > 0 ? 1 + Math.sin(bounce * Math.PI) * 0.14 : 1;
        ctx.save();
        ctx.translate(bx, by + 16);
        ctx.scale(2 - squash, squash);
        ctx.fillStyle = 'rgba(40,26,16,0.28)';
        ctx.beginPath();
        ctx.ellipse(0, 16, 30, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // 몸통 (사다리꼴)
        ctx.fillStyle = '#b98b4f';
        ctx.beginPath();
        ctx.moveTo(-26, -10);
        ctx.lineTo(26, -10);
        ctx.lineTo(19, 15);
        ctx.lineTo(-19, 15);
        ctx.closePath();
        ctx.fill();
        // 가로 결
        ctx.strokeStyle = 'rgba(122,84,44,0.75)';
        ctx.lineWidth = 1.4;
        for (let yy = -5; yy <= 11; yy += 5.4) {
          const kx = 26 - ((yy + 10) / 25) * 7;
          ctx.beginPath();
          ctx.moveTo(-kx, yy);
          ctx.quadraticCurveTo(0, yy + 2, kx, yy);
          ctx.stroke();
        }
        // 세로 살
        ctx.strokeStyle = 'rgba(150,106,58,0.6)';
        ctx.lineWidth = 1.8;
        for (let k = -2; k <= 2; k++) {
          ctx.beginPath();
          ctx.moveTo(k * 10.5, -10);
          ctx.lineTo(k * 8, 15);
          ctx.stroke();
        }
        // 테두리 림
        ctx.fillStyle = '#caa05f';
        ctx.beginPath();
        ctx.ellipse(0, -10, 27.5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7d5836';
        ctx.beginPath();
        ctx.ellipse(0, -10, 22.5, 4.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // ---- 펄 파티클 ----
      for (let i = 0; i < G.particles.length; i++) {
        const p = G.particles[i];
        if (!p.on) continue;
        const a = 1 - p.age / p.life;
        ctx.fillStyle = p.light ? `rgba(168,128,96,${0.85 * a})` : `rgba(74,50,36,${0.85 * a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (0.6 + 0.4 * a), 0, Math.PI * 2);
        ctx.fill();
      }

      // ---- 호미 스윙 ----
      for (let i = 0; i < G.swings.length; i++) {
        const sw = G.swings[i];
        if (!sw.on) continue;
        const p = clamp01(sw.t / SWING_DUR);
        const ang = -1.75 + easeInQuad(p) * 1.55;
        const fade = sw.t > SWING_DUR ? 1 - (sw.t - SWING_DUR) / 0.14 : 1;
        ctx.save();
        ctx.globalAlpha = Math.max(0, fade);
        ctx.translate(sw.x + 30, sw.y - 36);
        ctx.rotate(ang);
        // 나무 손잡이
        ctx.strokeStyle = '#a8794a';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, -2);
        ctx.lineTo(0, 42);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,230,190,0.35)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-1.4, 2);
        ctx.lineTo(-1.4, 38);
        ctx.stroke();
        // ㄱ자 쇠날
        ctx.fillStyle = '#5b6470';
        ctx.beginPath();
        ctx.moveTo(-2.6, 40);
        ctx.lineTo(3.2, 40);
        ctx.lineTo(3.2, 46);
        ctx.lineTo(-15, 52);
        ctx.lineTo(-17, 47.6);
        ctx.lineTo(-2.6, 44);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.fillRect(-13, 47.2, 10, 1.6);
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      // ---- 플로팅 텍스트 ----
      ctx.font = '800 15px -apple-system, "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      for (let i = 0; i < G.floaters.length; i++) {
        const f = G.floaters[i];
        if (!f.on) continue;
        const p = f.age / 0.9;
        const a = p < 0.55 ? 1 : 1 - (p - 0.55) / 0.45;
        const yy = f.y - easeOutCubic(p) * 34;
        ctx.globalAlpha = a;
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillText(f.text, f.x + 1, yy + 1);
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, f.x, yy);
      }
      ctx.globalAlpha = 1;

      // ---- 카운트다운 ----
      if (G.phase === 'count' && G.countT > 0) {
        const n = Math.ceil(G.countT);
        const frac = G.countT - (n - 1); // 1→0
        const pop = 1 - frac;            // 0→1
        const scl = 1.45 - 0.45 * easeOutCubic(Math.min(1, pop * 3.2));
        const a = pop > 0.82 ? (1 - pop) / 0.18 : 1;
        ctx.fillStyle = 'rgba(9,20,32,0.28)';
        ctx.fillRect(0, 0, w, h);
        ctx.save();
        ctx.translate(w / 2, h * 0.42);
        ctx.scale(scl, scl);
        ctx.globalAlpha = a;
        ctx.font = '800 76px -apple-system, "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillText(String(n), 2, 4);
        ctx.fillStyle = '#fff';
        ctx.fillText(String(n), 0, 0);
        ctx.restore();
        ctx.textBaseline = 'alphabetic';
      }
    };

    let raf = 0;
    let last = performance.now();
    let running = false;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      // dt 하한 0 — 탭 전환 직후 음수 dt가 타이머·파티클을 역행시키는 문제 방지
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      step(dt);
      render();
    };
    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);
    start();

    return () => {
      stop();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('pointerdown', onPointer);
    };
  }, []);

  const G = gRef.current;
  const quit = () => onExit(G ? G.score : 0);
  const timeLow = time <= 10;

  const chipStyle: CSSProperties = {
    padding: '8px 14px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.16)',
    backdropFilter: 'blur(8px)',
    color: timeLow ? '#ff7b6b' : '#fff',
    fontSize: 15,
    fontWeight: 800,
    fontVariantNumeric: 'tabular-nums',
  };

  return (
    <div className="game-overlay">
      <div ref={boxRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
        />
      </div>

      {/* 상단 HUD */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: 'calc(env(safe-area-inset-top) + 10px) 16px 10px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <button className="icon-btn" onClick={quit} aria-label="나가기">←</button>
        <div style={chipStyle}>⏱ {time}초</div>
        <div style={{ ...chipStyle, color: '#ffd66b' }}>⭐ {score}</div>
      </div>
      {phase === 'play' && combo >= 3 && (
        <div
          style={{
            position: 'absolute', top: 'calc(env(safe-area-inset-top) + 64px)', right: 16,
            padding: '6px 12px', borderRadius: 999,
            background: 'rgba(255,177,66,0.92)', color: '#4a2c00',
            fontSize: 13, fontWeight: 800,
          }}
        >
          콤보 x1.5
        </div>
      )}

      {/* 시작 안내 */}
      {phase === 'intro' && (
        <div
          style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: 28,
            background: 'rgba(9,20,32,0.45)',
          }}
        >
          <div
            style={{
              width: '100%', maxWidth: 320, borderRadius: 24, padding: '28px 22px',
              background: 'rgba(13,27,42,0.72)', backdropFilter: 'blur(10px)',
              textAlign: 'center', color: '#fff',
            }}
          >
            <div style={{ fontSize: 40 }}>🦀</div>
            <div style={{ fontSize: 19, fontWeight: 800, marginTop: 10 }}>갯벌체험</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 10, color: 'rgba(255,255,255,0.82)' }}>
              생물이 고개를 내밀면 재빨리 탭!
              <br />
              ⏱ 60초 동안 최대한 많이 잡아보세요
            </p>
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 20 }}
              onClick={() => setPhase('count')}
            >
              시작하기
            </button>
          </div>
        </div>
      )}

      {/* 결과 시트 */}
      {phase === 'end' && G && (
        <div className="sheet-backdrop" style={{ position: 'absolute' }}>
          <div className="sheet">
            <h3>갯벌체험 끝! 🧺</h3>
            <p>오늘의 수확이에요</p>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SPECIES.map((sp, i) =>
                G.counts[i] > 0 ? (
                  <div
                    key={sp.name}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 14, background: '#f2f4f6',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{sp.emoji}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>{sp.name}</span>
                    <span style={{ fontSize: 14, color: '#6b7684' }}>{G.counts[i]}마리</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#1b8f5a', minWidth: 52, textAlign: 'right' }}>
                      +{G.gained[i]}P
                    </span>
                  </div>
                ) : null,
              )}
              {G.counts.every((c) => c === 0) && (
                <div style={{ padding: '14px 0', textAlign: 'center', fontSize: 14, color: '#6b7684' }}>
                  아쉽게도 한 마리도 못 잡았어요 🥲
                </div>
              )}
            </div>
            <div style={{ marginTop: 18, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#6b7684', fontWeight: 600 }}>총 획득 포인트</div>
              <div style={{ fontSize: 34, fontWeight: 800, marginTop: 4 }}>⭐ {G.score}P</div>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 20 }}
              onClick={() => onExit(G.score)}
            >
              포인트 받기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
