// 갯벌 생물(조개/게/숨구멍), 갈매기, 섬 실루엣
import { mulberry } from './sky.ts';

export interface Shell { x: number; d: number; r: number; rot: number }
export interface Crab { x: number; d: number; dir: number; phase: number; pause: number }
export interface Hole { x: number; d: number; next: number; t: number }
export interface Sparkle { x: number; d: number; tw: number }
export interface Gull { x: number; y: number; vx: number; flap: number; alive: boolean }
/** 짱뚱어 — 갯벌 위를 폴짝폴짝 */
export interface Skipper { x: number; d: number; dir: number; phase: number; hop: number; rest: number }
/** 낙지 — 물골 옆에 느긋하게 */
export interface Octo { x: number; d: number }

export interface FlatLife {
  shells: Shell[];
  crabs: Crab[];
  holes: Hole[];
  sparkles: Sparkle[];
  skippers: Skipper[];
  octo: Octo;
}

/** d: 0(물가)~1(화면 아래) 갯벌 깊이 좌표 */
export function makeFlatLife(seed: number): FlatLife {
  const rnd = mulberry(seed);
  const shells: Shell[] = [];
  for (let i = 0; i < 7; i++) {
    shells.push({ x: 0.06 + rnd() * 0.88, d: 0.25 + rnd() * 0.65, r: 5 + rnd() * 4, rot: (rnd() - 0.5) * 0.9 });
  }
  const crabs: Crab[] = [];
  for (let i = 0; i < 3; i++) {
    crabs.push({ x: 0.15 + rnd() * 0.7, d: 0.45 + rnd() * 0.4, dir: rnd() > 0.5 ? 1 : -1, phase: rnd() * 7, pause: 0 });
  }
  const holes: Hole[] = [];
  for (let i = 0; i < 6; i++) {
    holes.push({ x: 0.05 + rnd() * 0.9, d: 0.3 + rnd() * 0.6, next: rnd() * 4, t: -1 });
  }
  const sparkles: Sparkle[] = [];
  for (let i = 0; i < 26; i++) {
    sparkles.push({ x: rnd(), d: rnd(), tw: rnd() * Math.PI * 2 });
  }
  const skippers: Skipper[] = [];
  for (let i = 0; i < 2; i++) {
    skippers.push({
      x: 0.2 + rnd() * 0.55,
      d: 0.35 + rnd() * 0.45,
      dir: rnd() > 0.5 ? 1 : -1,
      phase: rnd() * 6,
      hop: 0,
      rest: rnd() * 2,
    });
  }
  const octo: Octo = { x: 0.34 + rnd() * 0.3, d: 0.5 + rnd() * 0.3 };
  return { shells, crabs, holes, sparkles, skippers, octo };
}

export function drawShell(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number, alpha: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#efe3d3';
  ctx.beginPath();
  ctx.arc(0, 0, r, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(160,130,105,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = -2; i <= 2; i++) {
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.sin((i / 2.6) * 1.2) * r * 0.9, -Math.cos((i / 2.6) * 1.2) * r * 0.9);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function stepCrab(c: Crab, dt: number, rnd: () => number): void {
  c.phase += dt * 9;
  if (c.pause > 0) {
    c.pause -= dt;
    return;
  }
  c.x += c.dir * dt * 0.018;
  if (rnd() < dt * 0.25) c.pause = 0.5 + rnd() * 1.2;
  if (rnd() < dt * 0.12) c.dir *= -1;
  if (c.x < 0.06) { c.x = 0.06; c.dir = 1; }
  if (c.x > 0.94) { c.x = 0.94; c.dir = -1; }
}

export function drawCrab(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, phase: number, moving: boolean, alpha: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  const wob = moving ? Math.sin(phase) * 1.2 * s : 0;
  // 다리
  ctx.strokeStyle = '#d9714e';
  ctx.lineWidth = 1.6 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const lx = (4 + i * 2.6) * s;
    const ly = (2 + i * 1.1) * s + (moving ? Math.sin(phase + i) * 1.5 * s : 0);
    ctx.moveTo(-3 * s, 1 * s); ctx.lineTo(-lx, ly);
    ctx.moveTo(3 * s, 1 * s); ctx.lineTo(lx, (2 + i * 1.1) * s + (moving ? Math.cos(phase + i) * 1.5 * s : 0));
  }
  ctx.stroke();
  // 몸통
  ctx.fillStyle = '#ec8a63';
  ctx.beginPath();
  ctx.ellipse(0, wob * 0.3, 6.5 * s, 5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // 집게
  ctx.fillStyle = '#e07a52';
  ctx.beginPath();
  ctx.arc(-6.5 * s, -3.5 * s + wob * 0.4, 2.4 * s, 0, Math.PI * 2);
  ctx.arc(6.5 * s, -3.5 * s - wob * 0.4, 2.4 * s, 0, Math.PI * 2);
  ctx.fill();
  // 눈
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-2 * s, -4 * s, 1.7 * s, 0, Math.PI * 2);
  ctx.arc(2 * s, -4 * s, 1.7 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a3a46';
  ctx.beginPath();
  ctx.arc(-2 * s, -4 * s, 0.8 * s, 0, Math.PI * 2);
  ctx.arc(2 * s, -4 * s, 0.8 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function stepSkipper(k: Skipper, dt: number, rnd: () => number): void {
  if (k.rest > 0) {
    k.rest -= dt;
    k.hop *= Math.max(0, 1 - dt * 6);
    return;
  }
  k.phase += dt * 9;
  k.hop = Math.abs(Math.sin(k.phase));
  k.x += k.dir * dt * 0.032;
  if (rnd() < dt * 0.45) k.rest = 0.7 + rnd() * 1.8;
  if (rnd() < dt * 0.1) k.dir *= -1;
  if (k.x < 0.08) { k.x = 0.08; k.dir = 1; }
  if (k.x > 0.92) { k.x = 0.92; k.dir = -1; }
}

/** 짱뚱어 — 올라간 머리, 툭 튀어나온 눈, 폴짝 점프 */
export function drawSkipper(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  dir: number,
  hop: number,
  alpha: number,
): void {
  ctx.save();
  ctx.translate(x, y - hop * 5 * s);
  ctx.scale(dir, 1);
  ctx.globalAlpha = alpha;
  // 그림자
  ctx.fillStyle = 'rgba(50,34,24,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, (2.5 + hop * 5) * s, 8 * s, 1.6 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // 꼬리지느러미
  ctx.fillStyle = '#6d7f4b';
  ctx.beginPath();
  ctx.moveTo(-8 * s, 0);
  ctx.lineTo(-11.5 * s, -3 * s);
  ctx.lineTo(-11.5 * s, 3 * s);
  ctx.closePath();
  ctx.fill();
  // 몸통
  ctx.fillStyle = '#7d8f56';
  ctx.beginPath();
  ctx.ellipse(0, 0, 8.5 * s, 3.1 * s, -0.08, 0, Math.PI * 2);
  ctx.fill();
  // 배
  ctx.fillStyle = 'rgba(232,230,206,0.55)';
  ctx.beginPath();
  ctx.ellipse(0.5 * s, 1.4 * s, 6 * s, 1.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // 등지느러미 (부채꼴)
  ctx.fillStyle = '#5f7343';
  ctx.beginPath();
  ctx.moveTo(-4.5 * s, -2.3 * s);
  ctx.quadraticCurveTo(-1 * s, (-6.5 - hop * 2) * s, 3.5 * s, -2.6 * s);
  ctx.closePath();
  ctx.fill();
  // 머리 (들려 있음)
  ctx.fillStyle = '#879960';
  ctx.beginPath();
  ctx.ellipse(6.8 * s, -2.2 * s, 3.9 * s, 3.2 * s, -0.35, 0, Math.PI * 2);
  ctx.fill();
  // 가슴지느러미 — 팔처럼 짚는다
  ctx.strokeStyle = '#5f7343';
  ctx.lineWidth = 1.7 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(4.6 * s, 0.6 * s);
  ctx.lineTo(5.8 * s, 3.4 * s);
  ctx.stroke();
  // 튀어나온 눈
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(6 * s, -5.6 * s, 1.6 * s, 0, Math.PI * 2);
  ctx.arc(8.6 * s, -5.2 * s, 1.6 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2f3a2a';
  ctx.beginPath();
  ctx.arc(6.2 * s, -5.5 * s, 0.8 * s, 0, Math.PI * 2);
  ctx.arc(8.8 * s, -5.1 * s, 0.8 * s, 0, Math.PI * 2);
  ctx.fill();
  // 반점
  ctx.fillStyle = 'rgba(70,86,46,0.6)';
  ctx.beginPath();
  ctx.arc(-3 * s, -0.8 * s, 0.7 * s, 0, Math.PI * 2);
  ctx.arc(0.5 * s, -1.4 * s, 0.6 * s, 0, Math.PI * 2);
  ctx.arc(-5.5 * s, 0.4 * s, 0.6 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

/** 낙지 — 둥근 머리에 가늘고 긴 다리가 하늘하늘 */
export function drawOcto(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  t: number,
  alpha: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  // 그림자
  ctx.fillStyle = 'rgba(50,34,24,0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 2 * s, 9 * s, 1.8 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // 다리 5개 — 가늘고 길게, 끝이 살랑
  ctx.strokeStyle = '#9a7263';
  ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const a = (i - 2) / 2; // -1 ~ 1
    const sway = Math.sin(t * 1.6 + i * 1.9) * 2 * s;
    ctx.lineWidth = 1.9 * s;
    ctx.beginPath();
    ctx.moveTo(a * 2.2 * s, -3 * s);
    ctx.quadraticCurveTo(a * 8 * s, 0.5 * s, a * 11 * s + sway, 1.8 * s);
    ctx.stroke();
  }
  // 머리(외투막) — 갸름한 물방울형
  ctx.fillStyle = '#a97f6e';
  ctx.beginPath();
  ctx.ellipse(0, -7 * s, 3.6 * s, 4.6 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.beginPath();
  ctx.ellipse(-1.1 * s, -8.2 * s, 1.3 * s, 2 * s, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // 눈
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-1.5 * s, -4.4 * s, 1.3 * s, 0, Math.PI * 2);
  ctx.arc(1.5 * s, -4.4 * s, 1.3 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#332a28';
  ctx.beginPath();
  ctx.arc(-1.5 * s, -4.3 * s, 0.65 * s, 0, Math.PI * 2);
  ctx.arc(1.5 * s, -4.3 * s, 0.65 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

/** 숨구멍 뽀글 — t 0~1 진행, 작은 거품이 커졌다 톡 */
export function drawBubble(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, s: number): void {
  const r = (1 + t * 2.6) * s;
  const a = t < 0.8 ? 0.55 : 0.55 * (1 - (t - 0.8) / 0.2);
  ctx.strokeStyle = `rgba(255,255,255,${a})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y - t * 4 * s, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(90,64,48,0.55)';
  ctx.beginPath();
  ctx.ellipse(x, y + 1.5 * s, 2.2 * s, 1 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function makeGull(): Gull {
  return { x: -0.1, y: 0.2, vx: 0.03, flap: 0, alive: false };
}

export function spawnGull(g: Gull, rnd: () => number): void {
  g.alive = true;
  const ltr = rnd() > 0.5;
  g.x = ltr ? -0.08 : 1.08;
  g.vx = (0.025 + rnd() * 0.02) * (ltr ? 1 : -1);
  g.y = 0.08 + rnd() * 0.3;
  g.flap = rnd() * 6;
}

export function drawGull(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, flap: number, color: string): void {
  const wing = Math.sin(flap) * 4 * s;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 7 * s, y - wing);
  ctx.quadraticCurveTo(x - 2.5 * s, y + 2 * s, x, y);
  ctx.quadraticCurveTo(x + 2.5 * s, y + 2 * s, x + 7 * s, y - wing);
  ctx.stroke();
}

export function drawIsland(ctx: CanvasRenderingContext2D, cx: number, baseY: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, baseY);
  ctx.quadraticCurveTo(cx - w * 0.2, baseY - h, cx + w * 0.08, baseY - h * 0.75);
  ctx.quadraticCurveTo(cx + w * 0.3, baseY - h * 0.5, cx + w / 2, baseY);
  ctx.closePath();
  ctx.fill();
}
