// 낚시 미니게임 — 노을 방파제에서 캐스팅→기다림→입질→낚아채기
// 전부 캔버스 드로잉, 외부 에셋 없음. dt 상한 0.05, dpr≤2, 풀 재사용.
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, JSX } from 'react';
import { mulberry } from '../scenes/sky.ts';
import { makeGull, spawnGull, drawGull } from '../scenes/creatures.ts';
import type { Gull } from '../scenes/creatures.ts';

// ---------- 어종 ----------
interface SpeciesArt {
  body: string;
  belly: string;
  fin: string;
  pattern: 'spots' | 'vbars' | 'dots';
  pc: string;
  flat: boolean;
  aspect: number;
}
interface Species {
  name: string;
  w: number;        // 기본 가중치
  pts: number;      // 포인트
  catchP: number;   // 잡힐 확률
  minCm: number;
  maxCm: number;
  pMult: number;    // 파워 최대 시 가중치 배수
  rank: number;     // 릴링 난이도(시간)
  art: SpeciesArt;
}

const SPECIES: Species[] = [
  { name: '망둥어', w: 38, pts: 10, catchP: 0.85, minCm: 12, maxCm: 20, pMult: 1.0, rank: 0,
    art: { body: '#c8a35f', belly: '#ecdcb2', fin: '#a07f42', pattern: 'spots', pc: 'rgba(122,88,40,0.75)', flat: false, aspect: 0.34 } },
  { name: '도다리', w: 25, pts: 15, catchP: 0.8, minCm: 18, maxCm: 28, pMult: 1.1, rank: 0,
    art: { body: '#9a7648', belly: '#e4d5b8', fin: '#7c5c34', pattern: 'spots', pc: 'rgba(96,70,38,0.7)', flat: true, aspect: 0.58 } },
  { name: '우럭', w: 17, pts: 20, catchP: 0.72, minCm: 20, maxCm: 35, pMult: 1.5, rank: 1,
    art: { body: '#57544a', belly: '#948d7c', fin: '#3e3c34', pattern: 'vbars', pc: 'rgba(28,26,20,0.5)', flat: false, aspect: 0.4 } },
  { name: '감성돔', w: 12, pts: 40, catchP: 0.62, minCm: 25, maxCm: 45, pMult: 1.6, rank: 1,
    art: { body: '#b7bec6', belly: '#e8ecf0', fin: '#8b939c', pattern: 'vbars', pc: 'rgba(40,44,54,0.55)', flat: false, aspect: 0.46 } },
  { name: '참돔', w: 6, pts: 60, catchP: 0.55, minCm: 30, maxCm: 60, pMult: 1.8, rank: 2,
    art: { body: '#e8858a', belly: '#f8ddd4', fin: '#c96066', pattern: 'dots', pc: 'rgba(150,214,236,0.9)', flat: false, aspect: 0.42 } },
  { name: '광어', w: 2, pts: 100, catchP: 0.5, minCm: 40, maxCm: 70, pMult: 2.0, rank: 2,
    art: { body: '#5d4630', belly: '#f0ece0', fin: '#46331f', pattern: 'spots', pc: 'rgba(238,232,214,0.55)', flat: true, aspect: 0.62 } },
];

function pickSpecies(power: number): Species {
  let tot = 0;
  for (let i = 0; i < SPECIES.length; i++) tot += SPECIES[i].w * (1 + (SPECIES[i].pMult - 1) * power);
  let r = Math.random() * tot;
  for (let i = 0; i < SPECIES.length; i++) {
    r -= SPECIES[i].w * (1 + (SPECIES[i].pMult - 1) * power);
    if (r <= 0) return SPECIES[i];
  }
  return SPECIES[0];
}

// ---------- 헬퍼 ----------
const eOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);
const sstep = (x: number): number => x * x * (3 - 2 * x);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 2차 베지어 위의 점 */
function qp(a: number, c: number, b: number, t: number): number {
  const u = 1 - t;
  return u * u * a + 2 * u * t * c + t * t * b;
}

// ---------- 물고기 드로잉 (어종별 색/무늬) ----------
const SPOT_POS: readonly (readonly [number, number])[] = [
  [-0.52, -0.3], [-0.18, 0.25], [0.18, -0.32], [-0.36, 0.42], [0.42, 0.22], [0.02, -0.02], [0.3, 0.45],
];
const DOT_POS: readonly (readonly [number, number])[] = [
  [-0.5, -0.5], [-0.3, -0.25], [-0.08, -0.55], [0.12, -0.3], [0.32, -0.5], [0.5, -0.2], [-0.15, -0.05], [0.28, 0.02],
];

function drawFishArt(ctx: CanvasRenderingContext2D, sp: Species, x: number, y: number, s: number, rot: number): void {
  const a = sp.art;
  const rx = 13 * s;
  const ry = rx * a.aspect;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  // 꼬리
  ctx.fillStyle = a.fin;
  ctx.beginPath();
  ctx.moveTo(-rx + 2 * s, 0);
  ctx.lineTo(-rx - 7 * s, -ry * 0.85);
  ctx.lineTo(-rx - 7 * s, ry * 0.85);
  ctx.closePath();
  ctx.fill();
  // 등지느러미
  ctx.beginPath();
  ctx.moveTo(-rx * 0.55, -ry * 0.8);
  ctx.quadraticCurveTo(-rx * 0.1, -ry - 5 * s, rx * 0.3, -ry * 0.82);
  ctx.closePath();
  ctx.fill();
  // 배지느러미
  ctx.beginPath();
  ctx.moveTo(-rx * 0.15, ry * 0.8);
  ctx.lineTo(-rx * 0.02, ry + 3.4 * s);
  ctx.lineTo(rx * 0.2, ry * 0.82);
  ctx.closePath();
  ctx.fill();
  // 몸통
  ctx.fillStyle = a.body;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  // 몸통 클립 안에 배·무늬
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = a.belly;
  ctx.beginPath();
  ctx.ellipse(0.5 * s, ry * 0.62, rx * 0.86, ry * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = a.pc;
  if (a.pattern === 'spots') {
    for (let i = 0; i < SPOT_POS.length; i++) {
      ctx.beginPath();
      ctx.ellipse(SPOT_POS[i][0] * rx, SPOT_POS[i][1] * ry, 1.9 * s, 1.4 * s, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (a.pattern === 'vbars') {
    for (let i = 0; i < 5; i++) {
      ctx.fillRect((-0.62 + i * 0.3) * rx, -ry, rx * 0.11, ry * 2);
    }
  } else {
    for (let i = 0; i < DOT_POS.length; i++) {
      ctx.beginPath();
      ctx.arc(DOT_POS[i][0] * rx, DOT_POS[i][1] * ry, 1.1 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
  // 아가미선
  ctx.strokeStyle = 'rgba(20,16,12,0.3)';
  ctx.lineWidth = 1.1 * s;
  ctx.beginPath();
  ctx.arc(rx * 0.42, 0, ry * 0.82, -1.05, 1.05);
  ctx.stroke();
  // 눈 (납작이는 양눈 몰림)
  const eyes: readonly (readonly [number, number])[] = a.flat
    ? [[rx * 0.52, -ry * 0.42], [rx * 0.72, -ry * 0.1]]
    : [[rx * 0.62, -ry * 0.25]];
  for (let i = 0; i < eyes.length; i++) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(eyes[i][0], eyes[i][1], 2 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2c2c34';
    ctx.beginPath();
    ctx.arc(eyes[i][0] + 0.5 * s, eyes[i][1], 1 * s, 0, Math.PI * 2);
    ctx.fill();
  }
  // 입
  ctx.strokeStyle = 'rgba(20,16,12,0.4)';
  ctx.lineWidth = 1 * s;
  ctx.beginPath();
  ctx.moveTo(rx * 0.92, ry * 0.15);
  ctx.quadraticCurveTo(rx * 0.98, ry * 0.28, rx * 0.84, ry * 0.34);
  ctx.stroke();
  ctx.restore();
}

// ---------- 찌 ----------
function drawBobberBody(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  // 안테나
  ctx.strokeStyle = '#f5e9d0';
  ctx.lineWidth = 1.2 * s;
  ctx.beginPath();
  ctx.moveTo(x, y - 6 * s);
  ctx.lineTo(x, y - 11 * s);
  ctx.stroke();
  // 몸통 (빨강 + 흰 띠)
  ctx.fillStyle = '#e2413c';
  ctx.beginPath();
  ctx.ellipse(x, y, 3.4 * s, 6.4 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, 3.4 * s, 6.4 * s, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#fdf7ec';
  ctx.fillRect(x - 4 * s, y - 1.2 * s, 8 * s, 2.6 * s);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(x - 1.2 * s, y - 2.4 * s, 1 * s, 2.6 * s, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ---------- 게임 코어 상태 ----------
type Phase = 'ready' | 'casting' | 'waiting' | 'bite' | 'reeling' | 'jump' | 'card' | 'cool' | 'done';

interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number; kind: number }
interface Ripple { x: number; y: number; t: number; max: number; s: number }
interface Seam { x: number; row: number }
interface Glint { x: number; f: number; tw: number }

interface Game {
  phase: Phase;
  pt: number;          // 현재 단계 경과 시간
  t: number;           // 전체 시간
  w: number; h: number;
  horizonY: number; deckY: number;
  // 캐스팅
  charging: boolean; chargeClock: number; power: number;
  castsLeft: number; score: number;
  // 찌
  waterY: number; bobX: number; bobScale: number; bobOff: number; bobShake: number;
  castFrom: { x: number; y: number }; castTo: { x: number; y: number; scale: number }; castArc: number;
  // 대기·입질
  waitDur: number; fakes: number[]; fi: number; fakeT: number;
  fish: Species; success: boolean; fishCm: number;
  reelDur: number; reelFrom: { x: number; y: number };
  jumpFrom: { x: number; y: number }; jumpDur: number; sparkAcc: number;
  coolNext: 'ready' | 'sheet';
  rodBend: number; reelSpin: number;
  // 연출 풀
  parts: Particle[]; rips: Ripple[];
  // 배경
  gull: Gull; gull2: Gull; gullTimer: number;
  rnd: () => number;
  seams: Seam[]; glints: Glint[]; grains: { x: number; row: number; len: number }[];
  skyGrad: CanvasGradient | null; seaGrad: CanvasGradient | null; deckGrad: CanvasGradient | null;
  gradKey: string;
}

const CASTS = 8;
const BITE_WINDOW = 0.9;
const GUIDE_TS: readonly number[] = [0.55, 0.85];
const P_N = 48;
const R_N = 14;

function spawnP(g: Game, x: number, y: number, vx: number, vy: number, r: number, kind: number, life: number): void {
  for (let i = 0; i < P_N; i++) {
    const p = g.parts[i];
    if (p.life <= 0) {
      p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.r = r; p.kind = kind; p.life = life; p.max = life;
      return;
    }
  }
}

function spawnRip(g: Game, x: number, y: number, s: number, max: number): void {
  for (let i = 0; i < R_N; i++) {
    const r = g.rips[i];
    if (r.t >= r.max) {
      r.x = x; r.y = y; r.t = 0; r.max = max; r.s = s;
      return;
    }
  }
}

function splash(g: Game, x: number, y: number, s: number, n: number): void {
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
    const sp = (60 + Math.random() * 110) * s;
    spawnP(g, x, y, Math.cos(a) * sp, Math.sin(a) * sp, (1 + Math.random() * 1.6) * s, 0, 0.45 + Math.random() * 0.3);
  }
  spawnRip(g, x, y, s, 0.9);
  spawnRip(g, x, y, s * 0.7, 1.3);
}

// ---------- 카드용 물고기 캔버스 ----------
function FishCanvas({ spIdx }: { spIdx: number }): JSX.Element {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = 260;
    const H = 132;
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sp = SPECIES[spIdx];
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      // 은은한 물빛 배경
      ctx.fillStyle = 'rgba(46,120,140,0.12)';
      ctx.beginPath();
      ctx.ellipse(W / 2, H / 2 + 6, 108, 46, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(20,60,80,0.14)';
      ctx.beginPath();
      ctx.ellipse(W / 2, H - 14, 74, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      drawFishArt(ctx, sp, W / 2, H / 2 + Math.sin(t * 1.8) * 3, 3.1, Math.sin(t * 1.2) * 0.05);
      // 반짝
      const tw = Math.sin(t * 2.6);
      if (tw > 0.4) {
        const a = (tw - 0.4) * 1.2;
        ctx.strokeStyle = `rgba(255,240,200,${a})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(W / 2 + 52, H / 2 - 34);
        ctx.lineTo(W / 2 + 52, H / 2 - 22);
        ctx.moveTo(W / 2 + 46, H / 2 - 28);
        ctx.lineTo(W / 2 + 58, H / 2 - 28);
        ctx.stroke();
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [spIdx]);
  return <canvas ref={ref} style={{ width: 260, height: 132, display: 'block', margin: '0 auto' }} />;
}

// ---------- 메인 컴포넌트 ----------
interface CardInfo { spIdx: number; cm: string; pts: number }
interface CaughtFish { name: string; cm: string; pts: number }

export default function FishingGame({ onExit }: { onExit: (points: number) => void }): JSX.Element {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<Game | null>(null);
  const apiRef = useRef<{ closeCard: () => void } | null>(null);
  const toastTimer = useRef<number>(0);

  const [hud, setHud] = useState({ casts: CASTS, score: 0 });
  const [uiPhase, setUiPhase] = useState<'ready' | 'charge' | 'busy' | 'done'>('ready');
  const [card, setCard] = useState<CardInfo | null>(null);
  const [toast, setToast] = useState<{ msg: string; k: number } | null>(null);
  const [caught, setCaught] = useState<CaughtFish[]>([]);
  const [showSheet, setShowSheet] = useState(false);

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!box || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rnd = mulberry(20260913);
    const parts: Particle[] = [];
    for (let i = 0; i < P_N; i++) parts.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, r: 1, kind: 0 });
    const rips: Ripple[] = [];
    for (let i = 0; i < R_N; i++) rips.push({ x: 0, y: 0, t: 9, max: 1, s: 1 });

    const g: Game = {
      phase: 'ready', pt: 0, t: 0, w: 0, h: 0, horizonY: 0, deckY: 0,
      charging: false, chargeClock: 0, power: 0,
      castsLeft: CASTS, score: 0,
      waterY: 0, bobX: 0, bobScale: 1, bobOff: 0, bobShake: 0,
      castFrom: { x: 0, y: 0 }, castTo: { x: 0, y: 0, scale: 1 }, castArc: 90,
      waitDur: 3, fakes: [], fi: 0, fakeT: 0,
      fish: SPECIES[0], success: false, fishCm: 15,
      reelDur: 1, reelFrom: { x: 0, y: 0 },
      jumpFrom: { x: 0, y: 0 }, jumpDur: 0.95, sparkAcc: 0,
      coolNext: 'ready',
      rodBend: 0, reelSpin: 0,
      parts, rips,
      gull: makeGull(), gull2: makeGull(), gullTimer: 2.5,
      rnd,
      seams: [], glints: [], grains: [],
      skyGrad: null, seaGrad: null, deckGrad: null, gradKey: '',
    };
    gameRef.current = g;

    for (let i = 0; i < 20; i++) g.glints.push({ x: rnd(), f: 0.1 + rnd() * 0.85, tw: rnd() * Math.PI * 2 });
    for (let row = 0; row < 4; row++) {
      const n = 1 + ((rnd() * 2) | 0);
      for (let i = 0; i < n; i++) g.seams.push({ x: 0.12 + rnd() * 0.76, row });
      for (let i = 0; i < 3; i++) g.grains.push({ x: rnd() * 0.9, row, len: 0.04 + rnd() * 0.09 });
    }

    const resize = () => {
      const r = box.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      g.w = Math.max(1, r.width);
      g.h = Math.max(1, r.height);
      canvas.width = Math.round(g.w * dpr);
      canvas.height = Math.round(g.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.horizonY = g.h * 0.32;
      g.deckY = g.h * 0.85;
      g.gradKey = '';
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(box);

    // ---- 토스트 ----
    let toastK = 0;
    const showToast = (msg: string) => {
      toastK += 1;
      setToast({ msg, k: toastK });
      window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(null), 1500);
    };

    // ---- 플로우 ----
    const toReady = () => {
      g.phase = 'ready';
      g.pt = 0;
      g.charging = false;
      g.rodBend = 0;
      setUiPhase('ready');
    };

    const endCast = () => {
      g.phase = 'cool';
      g.pt = 0;
      g.rodBend = 0;
      g.coolNext = g.castsLeft <= 0 ? 'sheet' : 'ready';
    };

    const startCast = (power: number) => {
      g.power = power;
      g.castsLeft -= 1;
      setHud({ casts: g.castsLeft, score: g.score });
      setUiPhase('busy');
      const f = 0.2 + 0.72 * power;
      const tipX = g.w * 0.6;
      const tipY = g.h * 0.485;
      g.castFrom.x = tipX;
      g.castFrom.y = tipY;
      g.castTo.x = g.w * (0.5 - 0.26 * f) + (Math.random() - 0.5) * g.w * 0.08;
      g.castTo.y = lerp(g.deckY - 44, g.horizonY + 26, f);
      g.castTo.scale = lerp(1.05, 0.55, f);
      g.castArc = 70 + power * 70;
      g.phase = 'casting';
      g.pt = 0;
      g.charging = false;
    };

    const landBobber = () => {
      g.waterY = g.castTo.y;
      g.bobX = g.castTo.x;
      g.bobScale = g.castTo.scale;
      g.bobOff = 0;
      splash(g, g.bobX, g.waterY, g.bobScale, 9);
      // 대기 셋업
      g.phase = 'waiting';
      g.pt = 0;
      g.waitDur = 2 + Math.random() * 5;
      g.fakes.length = 0;
      g.fi = 0;
      g.fakeT = 0;
      const nFake = (Math.random() * 3) | 0;
      for (let i = 0; i < nFake; i++) {
        const lo = 0.7;
        const hi = g.waitDur - 0.9;
        if (hi > lo) g.fakes.push(lo + Math.random() * (hi - lo));
      }
      g.fakes.sort((a, b) => a - b);
    };

    const startBite = () => {
      g.phase = 'bite';
      g.pt = 0;
      g.fish = pickSpecies(g.power);
      g.success = Math.random() < g.fish.catchP;
      g.fishCm = g.fish.minCm + Math.random() * (g.fish.maxCm - g.fish.minCm);
      g.reelDur = 0.9 + g.fish.rank * 0.3;
      spawnRip(g, g.bobX, g.waterY, g.bobScale * 1.2, 0.8);
      spawnRip(g, g.bobX, g.waterY, g.bobScale * 0.8, 1.1);
    };

    const startReel = () => {
      g.phase = 'reeling';
      g.pt = 0;
      g.reelFrom.x = g.bobX;
      g.reelFrom.y = g.waterY;
      g.reelSpin = 0;
      splash(g, g.bobX, g.waterY, g.bobScale, 6);
    };

    const finishReel = () => {
      if (g.success) {
        g.phase = 'jump';
        g.pt = 0;
        g.jumpFrom.x = g.bobX;
        g.jumpFrom.y = g.waterY;
        g.jumpDur = 0.95;
        g.sparkAcc = 0;
        splash(g, g.bobX, g.waterY, g.bobScale * 1.3, 12);
      } else {
        showToast('앗! 바늘만 남았어요 🪝');
        endCast();
      }
    };

    const showCard = () => {
      g.phase = 'card';
      g.score += g.fish.pts;
      const spIdx = SPECIES.indexOf(g.fish);
      const cm = g.fishCm.toFixed(1);
      setHud({ casts: g.castsLeft, score: g.score });
      setCaught((prev) => [...prev, { name: g.fish.name, cm, pts: g.fish.pts }]);
      setCard({ spIdx, cm, pts: g.fish.pts });
    };

    apiRef.current = {
      closeCard: () => {
        setCard(null);
        if (g.castsLeft <= 0) {
          g.phase = 'done';
          setUiPhase('done');
          setShowSheet(true);
        } else {
          toReady();
        }
      },
    };

    // ---- 입력 ----
    const onDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      if (g.phase === 'ready') {
        g.charging = true;
        g.chargeClock = 0;
        setUiPhase('charge');
      } else if (g.phase === 'waiting') {
        // 성급한 챔질 — 물고기 도망
        showToast('너무 성급했어요 💦');
        spawnRip(g, g.bobX, g.waterY, g.bobScale, 0.9);
        // 도망가는 그림자
        spawnP(g, g.bobX, g.waterY + 6, -80 * g.bobScale, 14, 5 * g.bobScale, 2, 0.55);
        endCast();
      } else if (g.phase === 'bite') {
        startReel();
      }
    };
    const onUp = () => {
      if (g.phase === 'ready' && g.charging) {
        const ph = (g.chargeClock % 1.2) / 1.2;
        const tri = ph < 0.5 ? ph * 2 : 2 - ph * 2;
        startCast(tri);
      }
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);

    // ---- 시뮬레이션 ----
    const update = (dt: number) => {
      g.t += dt;
      g.pt += dt;
      g.bobShake = 0;

      switch (g.phase) {
        case 'ready':
          if (g.charging) g.chargeClock += dt;
          break;
        case 'casting': {
          const e = Math.min(1, g.pt / 0.7);
          if (e >= 1) landBobber();
          break;
        }
        case 'waiting': {
          g.bobOff = Math.sin(g.t * 2.1) * 1.5 * g.bobScale;
          if (g.fakeT > 0) {
            g.fakeT -= dt;
            g.bobOff += Math.sin(((0.15 - Math.max(0, g.fakeT)) / 0.15) * Math.PI) * 2.8 * g.bobScale;
          }
          if (g.fi < g.fakes.length && g.pt >= g.fakes[g.fi]) {
            g.fi += 1;
            g.fakeT = 0.15;
            spawnRip(g, g.bobX, g.waterY, g.bobScale * 0.7, 0.8);
          }
          if (g.pt >= g.waitDur) startBite();
          break;
        }
        case 'bite': {
          const dipE = Math.min(1, g.pt / 0.2);
          g.bobOff = dipE * dipE * 9 * g.bobScale + Math.sin(g.t * 6) * 0.6;
          g.bobShake = Math.sin(g.pt * 42) * 1.3 * g.bobScale;
          if (g.pt > BITE_WINDOW) {
            showToast('입질이 끊겼어요…');
            spawnRip(g, g.bobX, g.waterY, g.bobScale * 0.8, 1.0);
            endCast();
          }
          break;
        }
        case 'reeling': {
          const e = Math.min(1, g.pt / g.reelDur);
          const es = sstep(e);
          const tx = g.w * 0.62;
          const ty = g.deckY - 20;
          g.bobX = lerp(g.reelFrom.x, tx, es) + Math.sin(g.pt * 16) * 10 * (1 - es);
          g.waterY = lerp(g.reelFrom.y, ty, es);
          g.bobScale = lerp(g.castTo.scale, 1, es * 0.7);
          g.bobOff = 3 * g.bobScale + Math.sin(g.pt * 30) * 1.2;
          g.rodBend = Math.sin(Math.PI * Math.min(1, e * 1.25)) * (0.6 + 0.4 * g.fish.rank * 0.5);
          g.reelSpin += dt * 22;
          // 물보라
          if ((g.t * 30 | 0) % 2 === 0) {
            spawnP(g, g.bobX + (Math.random() - 0.5) * 8, g.waterY, (Math.random() - 0.5) * 60, -60 - Math.random() * 60, 1.4 * g.bobScale, 0, 0.35);
          }
          if ((g.t * 10 | 0) % 3 === 0) spawnRip(g, g.bobX, g.waterY, g.bobScale * 0.6, 0.6);
          if (e >= 1) finishReel();
          break;
        }
        case 'jump': {
          const e = Math.min(1, g.pt / g.jumpDur);
          g.sparkAcc += dt;
          if (g.sparkAcc > 0.05 && e < 0.85) {
            g.sparkAcc = 0;
            const jx = g.jumpFrom.x + 44 * e * g.bobScale;
            const jy = g.jumpFrom.y - Math.sin(Math.PI * e) * 95 * g.bobScale;
            spawnP(g, jx, jy, (Math.random() - 0.5) * 50, -20 - Math.random() * 40, 1.2, 1, 0.5);
          }
          if (e >= 1) showCard();
          break;
        }
        case 'cool':
          if (g.pt >= 1.0) {
            if (g.coolNext === 'sheet') {
              g.phase = 'done';
              setUiPhase('done');
              setShowSheet(true);
            } else {
              toReady();
            }
          }
          break;
        case 'card':
        case 'done':
          break;
      }

      // 갈매기
      g.gullTimer -= dt;
      if (g.gullTimer <= 0) {
        if (!g.gull.alive) spawnGull(g.gull, g.rnd);
        else if (!g.gull2.alive && g.rnd() > 0.5) spawnGull(g.gull2, g.rnd);
        g.gullTimer = 7 + g.rnd() * 8;
      }
      if (g.gull.alive) {
        g.gull.x += g.gull.vx * dt;
        g.gull.flap += dt * 7;
        if (g.gull.x < -0.12 || g.gull.x > 1.12) g.gull.alive = false;
      }
      if (g.gull2.alive) {
        g.gull2.x += g.gull2.vx * dt;
        g.gull2.flap += dt * 7;
        if (g.gull2.x < -0.12 || g.gull2.x > 1.12) g.gull2.alive = false;
      }

      // 파티클
      for (let i = 0; i < P_N; i++) {
        const p = g.parts[i];
        if (p.life <= 0) continue;
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.kind === 0) p.vy += 480 * dt;       // 물방울 중력
        else if (p.kind === 1) p.vy += 120 * dt;  // 반짝이 살짝
        else p.vx *= 1 - dt * 1.5;                // 도망 그림자 감속
      }
      // 물결
      for (let i = 0; i < R_N; i++) {
        const r = g.rips[i];
        if (r.t < r.max) r.t += dt;
      }
    };

    // ---- 렌더 ----
    const render = () => {
      const { w, h, horizonY, deckY, t } = g;

      // 그라데이션 캐시
      const key = `${w | 0}x${h | 0}`;
      if (key !== g.gradKey) {
        const sky = ctx.createLinearGradient(0, 0, 0, horizonY);
        sky.addColorStop(0, '#4a3d7c');
        sky.addColorStop(0.5, '#8a5583');
        sky.addColorStop(0.82, '#d97a5e');
        sky.addColorStop(1, '#ffb473');
        g.skyGrad = sky;
        const sea = ctx.createLinearGradient(0, horizonY, 0, deckY);
        sea.addColorStop(0, '#c97a52');
        sea.addColorStop(0.09, '#33707a');
        sea.addColorStop(0.5, '#175263');
        sea.addColorStop(1, '#0e3d4e');
        g.seaGrad = sea;
        const deck = ctx.createLinearGradient(0, deckY, 0, h);
        deck.addColorStop(0, '#7c5836');
        deck.addColorStop(1, '#4a321e');
        g.deckGrad = deck;
        g.gradKey = key;
      }

      // 하늘
      if (g.skyGrad) ctx.fillStyle = g.skyGrad;
      ctx.fillRect(0, 0, w, horizonY + 2);

      // 낮은 태양
      const sunX = w * 0.3;
      const sunY = horizonY - 12;
      ctx.fillStyle = 'rgba(255,190,120,0.22)';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 58, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,206,140,0.3)';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffdca2';
      ctx.beginPath();
      ctx.arc(sunX, sunY, 17, 0, Math.PI * 2);
      ctx.fill();

      // 갈매기
      if (g.gull.alive) {
        drawGull(ctx, g.gull.x * w, g.gull.y * horizonY * 1.6 + Math.sin(t * 0.8) * 5, Math.max(0.7, w / 420), g.gull.flap, 'rgba(80,60,90,0.7)');
      }
      if (g.gull2.alive) {
        drawGull(ctx, g.gull2.x * w, g.gull2.y * horizonY * 1.6 + Math.sin(t * 0.7 + 2) * 5, Math.max(0.6, w / 480), g.gull2.flap, 'rgba(80,60,90,0.6)');
      }

      // 바다
      if (g.seaGrad) ctx.fillStyle = g.seaGrad;
      ctx.fillRect(0, horizonY, w, deckY - horizonY);

      // 태양 금빛 글리터 기둥
      ctx.fillStyle = 'rgba(255,214,150,0.2)';
      for (let y = horizonY + 5; y < deckY - 8; y += 8) {
        const f = (y - horizonY) / (deckY - horizonY);
        const ww = (5 + f * 26) * (0.55 + 0.45 * Math.sin(t * 2.3 + y * 0.4));
        ctx.fillRect(sunX - ww / 2 + Math.sin(t * 1.5 + y * 0.23) * 6 * f, y, ww, 2.2);
      }
      // 잔반짝임
      for (let i = 0; i < g.glints.length; i++) {
        const sp = g.glints[i];
        const a = 0.05 + 0.13 * Math.max(0, Math.sin(t * 2.4 + sp.tw));
        const y = horizonY + sp.f * (deckY - horizonY - 12) + 6;
        ctx.fillStyle = `rgba(255,226,180,${a})`;
        ctx.fillRect(sp.x * w, y, (0.8 + sp.f * 1.6) * 2.4, (0.8 + sp.f * 1.6) * 0.8);
      }

      // 파도 하이라이트 2줄
      ctx.lineCap = 'round';
      for (let i = 0; i < 2; i++) {
        const baseY = horizonY + (deckY - horizonY) * (0.34 + i * 0.3);
        ctx.strokeStyle = `rgba(255,255,255,${0.09 + i * 0.05})`;
        ctx.lineWidth = 1.2 + i * 0.5;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 16) {
          const yy = baseY + Math.sin(x * 0.03 + t * (0.7 + i * 0.3) + i * 3) * (2 + i * 1.5);
          if (x === 0) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }

      // 물결(동심원)
      for (let i = 0; i < R_N; i++) {
        const r = g.rips[i];
        if (r.t >= r.max) continue;
        const e = r.t / r.max;
        const rad = (3 + e * 26) * r.s;
        ctx.strokeStyle = `rgba(255,244,224,${0.5 * (1 - e)})`;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, rad, rad * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // ---- 낚싯대 지오메트리 ----
      const bend = g.rodBend;
      const baseX = w * 0.97;
      const baseY = h * 1.02;
      const ctrlX = w * 0.8 + bend * 10;
      const ctrlY = h * 0.72 + bend * 20;
      const tipX = w * 0.6 + bend * 16;
      const tipY = h * 0.485 + bend * 30;

      // ---- 찌 위치 계산 & 수중 그림자 ----
      let bx = -100;
      let by = -100;
      let bs = 1;
      let inWater = false;
      if (g.phase === 'casting') {
        const e = Math.min(1, g.pt / 0.7);
        const ex = eOutCubic(e);
        bx = lerp(g.castFrom.x, g.castTo.x, ex);
        by = lerp(g.castFrom.y, g.castTo.y, e) - Math.sin(Math.PI * e) * g.castArc;
        bs = lerp(0.9, g.castTo.scale, ex);
      } else if (g.phase === 'waiting' || g.phase === 'bite' || g.phase === 'reeling') {
        bx = g.bobX + g.bobShake;
        by = g.waterY - 4.5 * g.bobScale + g.bobOff;
        bs = g.bobScale;
        inWater = true;
      } else if (g.phase === 'ready') {
        // 로드 끝에 대롱대롱
        const chg = g.charging ? Math.min(1, g.chargeClock * 1.5) : 0;
        const sway = Math.sin(t * 2.4) * (0.14 + chg * 0.4);
        const len = 30 + chg * 8;
        bx = tipX + Math.sin(sway) * len;
        by = tipY + Math.cos(sway) * len;
        bs = 0.85;
      }

      // 릴링 중 물고기 그림자
      if (g.phase === 'reeling') {
        ctx.fillStyle = 'rgba(8,26,32,0.45)';
        ctx.beginPath();
        ctx.ellipse(g.bobX + Math.sin(g.pt * 12) * 6, g.waterY + 10 * g.bobScale, 16 * g.bobScale, 5 * g.bobScale, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // ---- 데크 (방파제) ----
      if (g.deckGrad) ctx.fillStyle = g.deckGrad;
      ctx.fillRect(0, deckY, w, h - deckY);
      const boardH = (h - deckY) / 4;
      ctx.strokeStyle = 'rgba(28,16,8,0.4)';
      ctx.lineWidth = 1.6;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, deckY + boardH * i);
        ctx.lineTo(w, deckY + boardH * i);
        ctx.stroke();
      }
      // 판자 이음새 + 못
      ctx.lineWidth = 1.4;
      for (let i = 0; i < g.seams.length; i++) {
        const sm = g.seams[i];
        const sy = deckY + boardH * sm.row;
        ctx.beginPath();
        ctx.moveTo(sm.x * w, sy + 1);
        ctx.lineTo(sm.x * w, sy + boardH - 1);
        ctx.stroke();
        ctx.fillStyle = 'rgba(20,12,6,0.55)';
        ctx.beginPath();
        ctx.arc(sm.x * w - 5, sy + boardH * 0.3, 1.3, 0, Math.PI * 2);
        ctx.arc(sm.x * w + 5, sy + boardH * 0.7, 1.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(28,16,8,0.4)';
      }
      // 나무 결
      ctx.strokeStyle = 'rgba(255,214,170,0.07)';
      ctx.lineWidth = 1;
      for (let i = 0; i < g.grains.length; i++) {
        const gr = g.grains[i];
        const gy = deckY + boardH * gr.row + boardH * 0.5;
        ctx.beginPath();
        ctx.moveTo(gr.x * w, gy);
        ctx.quadraticCurveTo((gr.x + gr.len / 2) * w, gy - 2, (gr.x + gr.len) * w, gy);
        ctx.stroke();
      }
      // 데크 가장자리 하이라이트
      ctx.fillStyle = 'rgba(255,200,140,0.18)';
      ctx.fillRect(0, deckY, w, 2.5);

      // ---- 낚싯줄 ----
      if (g.phase !== 'card' && g.phase !== 'done' && g.phase !== 'cool') {
        const taut = g.phase === 'reeling' || g.phase === 'bite';
        const midX = (tipX + bx) / 2;
        const midY = (tipY + (by - 9 * bs)) / 2;
        const sag = g.phase === 'ready' ? 2 : taut ? 3 : 24 + 26 * bs;
        ctx.strokeStyle = 'rgba(255,252,240,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.quadraticCurveTo(midX, midY + sag, bx, by - 9 * bs);
        ctx.stroke();
      }

      // ---- 낚싯대 ----
      ctx.strokeStyle = '#5c3d22';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
      ctx.stroke();
      ctx.strokeStyle = '#8a5a34';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
      ctx.stroke();
      // 가이드링 2개
      ctx.strokeStyle = '#e8dcc2';
      ctx.lineWidth = 1.4;
      for (const gt of GUIDE_TS) {
        const gx = qp(baseX, ctrlX, tipX, gt);
        const gy = qp(baseY, ctrlY, tipY, gt);
        ctx.beginPath();
        ctx.arc(gx, gy - 4, 3.2, 0, Math.PI * 2);
        ctx.stroke();
      }
      // 릴
      const rlX = qp(baseX, ctrlX, tipX, 0.13);
      const rlY = qp(baseY, ctrlY, tipY, 0.13) + 8;
      ctx.fillStyle = '#33333e';
      ctx.beginPath();
      ctx.arc(rlX, rlY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#565664';
      ctx.beginPath();
      ctx.arc(rlX, rlY, 5.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c9c9d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rlX, rlY);
      ctx.lineTo(rlX + Math.cos(g.reelSpin) * 8, rlY + Math.sin(g.reelSpin) * 8);
      ctx.stroke();

      // ---- 찌 ----
      if (g.phase === 'ready' || g.phase === 'casting' || inWater) {
        drawBobberBody(ctx, bx, by, bs);
        if (inWater) {
          // 수면 아래 부분 가리기 (잠김 표현)
          ctx.fillStyle = 'rgba(14,62,76,0.88)';
          ctx.fillRect(bx - 7 * bs, g.waterY, 14 * bs, 16 * bs);
          // 수면 링
          ctx.strokeStyle = 'rgba(255,244,224,0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(bx, g.waterY, 5 * bs, 1.6 * bs, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // ---- 입질 "!" 말풍선 ----
      if (g.phase === 'bite') {
        const pop = Math.min(1, g.pt / 0.12);
        const sc = pop < 1 ? 1.25 * pop : 1 + Math.sin(g.t * 10) * 0.05;
        const byy = g.waterY - 40 * g.bobScale;
        ctx.save();
        ctx.translate(bx, byy);
        ctx.scale(sc, sc);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-4, 9);
        ctx.lineTo(0, 17);
        ctx.lineTo(4, 9);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#e2413c';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', 0, 1);
        ctx.restore();
      }

      // ---- 물고기 점프 ----
      if (g.phase === 'jump') {
        const e = Math.min(1, g.pt / g.jumpDur);
        const jx = g.jumpFrom.x + 44 * e * g.bobScale;
        const jy = g.jumpFrom.y - Math.sin(Math.PI * e) * 95 * g.bobScale;
        const rot = -0.8 + e * 3.0;
        drawFishArt(ctx, g.fish, jx, jy, 0.55 + g.bobScale * 0.5, rot);
      }

      // ---- 파티클 ----
      for (let i = 0; i < P_N; i++) {
        const p = g.parts[i];
        if (p.life <= 0) continue;
        const a = clamp01(p.life / p.max);
        if (p.kind === 0) {
          ctx.fillStyle = `rgba(238,248,252,${0.85 * a})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.kind === 1) {
          ctx.fillStyle = `rgba(255,232,170,${a})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = `rgba(8,26,32,${0.5 * a})`;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.r * 2.4, p.r, 0.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ---- 파워 게이지 ----
      if (g.phase === 'ready' && g.charging) {
        const ph = (g.chargeClock % 1.2) / 1.2;
        const tri = ph < 0.5 ? ph * 2 : 2 - ph * 2;
        const gx = 16;
        const gy = h * 0.3;
        const gh = h * 0.42;
        const gw = 12;
        ctx.fillStyle = 'rgba(255,255,255,0.16)';
        rr(ctx, gx, gy, gw, gh, 6);
        ctx.fill();
        const fh = gh * tri;
        ctx.fillStyle = `hsl(${120 - 120 * tri},80%,55%)`;
        rr(ctx, gx + 2, gy + gh - fh, gw - 4, Math.max(4, fh), 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1;
        rr(ctx, gx, gy, gw, gh, 6);
        ctx.stroke();
      }
    };

    // ---- rAF 루프 ----
    let raf = 0;
    let last = performance.now();
    let running = false;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      // dt 하한 0 — 탭 전환 직후 rAF 타임스탬프가 뒤로 가면 음수 dt로 물결 반지름이 음수가 되는 버그 방지
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      update(dt);
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
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      window.clearTimeout(toastTimer.current);
      gameRef.current = null;
      apiRef.current = null;
    };
  }, []);

  const chip: CSSProperties = {
    background: 'rgba(255,255,255,0.16)',
    backdropFilter: 'blur(6px)',
    color: '#fff',
    borderRadius: 999,
    padding: '8px 14px',
    fontSize: 14,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  };

  return (
    <div className="game-overlay" style={{ position: 'fixed', inset: 0, zIndex: 300, background: '#0d1b2a' }}>
      <div ref={boxRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
        />
      </div>

      {/* HUD 상단바 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: 'calc(10px + env(safe-area-inset-top)) 16px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pointerEvents: 'none',
        }}
      >
        <button
          type="button"
          className="icon-btn"
          style={{ background: 'rgba(255,255,255,0.16)', color: '#fff', pointerEvents: 'auto' }}
          onClick={() => onExit(hud.score)}
          aria-label="나가기"
        >
          ←
        </button>
        <div style={chip}>🎣 x {hud.casts}</div>
        <div style={chip}>⭐ {hud.score}</div>
      </div>

      {/* 안내 문구 */}
      {(uiPhase === 'ready' || uiPhase === 'charge') && !card && !showSheet && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 'calc(18% + 16px)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              background: 'rgba(6,20,32,0.55)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              padding: '10px 18px',
              borderRadius: 999,
              backdropFilter: 'blur(4px)',
            }}
          >
            {uiPhase === 'charge' ? '지금이에요! 놓으면 던져요 🎯' : '꾹 눌러서 힘을 모으고, 놓으면 던져요 🎣'}
          </span>
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div
          key={toast.k}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '30%',
            textAlign: 'center',
            pointerEvents: 'none',
            animation: 'fade-in 0.2s ease',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              background: 'rgba(6,20,32,0.7)',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              padding: '12px 22px',
              borderRadius: 16,
            }}
          >
            {toast.msg}
          </span>
        </div>
      )}

      {/* 포획 카드 */}
      {card && (
        <div className="sheet-backdrop" style={{ zIndex: 320, alignItems: 'center' }}>
          <div
            style={{
              width: 'min(320px, 86%)',
              background: '#fff',
              borderRadius: 24,
              padding: '26px 22px 22px',
              textAlign: 'center',
              animation: 'sheet-up 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#8b95a1', letterSpacing: 2 }}>잡았다!</div>
            <FishCanvas spIdx={card.spIdx} />
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>{SPECIES[card.spIdx].name}</div>
            <div style={{ fontSize: 15, color: '#6b7684', marginTop: 4 }}>{card.cm}cm</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#f5a623', marginTop: 10 }}>+{card.pts} P</div>
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 18 }}
              onClick={() => apiRef.current?.closeCard()}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 결과 시트 */}
      {showSheet && (
        <div className="sheet-backdrop" style={{ zIndex: 330 }}>
          <div className="sheet">
            <h3>오늘의 조과 🎣</h3>
            {caught.length === 0 ? (
              <p>한 마리도 못 잡았어요… 다음 물때를 노려봐요!</p>
            ) : (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '32dvh', overflowY: 'auto' }}>
                {caught.map((f, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#f7f8fa',
                      borderRadius: 12,
                      padding: '10px 14px',
                      fontSize: 14,
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>{f.name}</span>
                    <span style={{ color: '#6b7684' }}>{f.cm}cm</span>
                    <span style={{ fontWeight: 800, color: '#f5a623' }}>+{f.pts} P</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ textAlign: 'center', marginTop: 18 }}>
              <div style={{ fontSize: 13, color: '#8b95a1', fontWeight: 600 }}>총 획득 포인트</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#1b1e23', marginTop: 2 }}>{hud.score} P</div>
            </div>
            <div className="sheet-actions">
              <button type="button" className="btn btn-primary" onClick={() => onExit(hud.score)}>
                포인트 받기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
