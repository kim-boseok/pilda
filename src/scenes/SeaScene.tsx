import { useEffect, useRef } from 'react';
import type { JSX } from 'react';
import {
  samplePalette, makePalette, makeStars, makeClouds, drawCloud, mulberry,
  lerp, lerpRGB, css,
} from './sky.ts';
import type { SkyPalette, Star, Cloud, RGB } from './sky.ts';
import { REGION, traceWave, waveY } from './waves.ts';
import {
  makeFlatLife, drawShell, stepCrab, drawCrab, drawBubble,
  makeGull, spawnGull, drawGull, drawIsland,
  stepSkipper, drawSkipper, drawOcto,
} from './creatures.ts';
import type { FlatLife, Gull } from './creatures.ts';
import { sceneCreatures } from '../data/features';
import { hasItem } from '../lib/points';

export interface SeaSceneProps {
  ratio: number;
  direction: 'rising' | 'falling' | 'slack';
  region: 'west' | 'south' | 'east';
  mudflat: boolean;
  windSpeed: number;
  hour: number;
  /** 이 갯벌의 대표 생물 — 씬에 등장할 생물 결정 */
  species?: string[];
}

const MUD_TOP: RGB = [138, 104, 80];
const MUD_BOTTOM: RGB = [92, 66, 50];
const DEEP_NIGHT: RGB = [0, 10, 30];
const SHALLOW_NIGHT: RGB = [4, 16, 36];
const ISLAND_DARK: RGB = [24, 44, 66];
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

interface Channel { x: number; s1: number; s2: number; lw: number }

interface SceneState {
  disp: number;
  t: number;
  w: number;
  h: number;
  pal: SkyPalette;
  stars: Star[];
  clouds: Cloud[];
  life: FlatLife;
  channels: Channel[];
  gull: Gull;
  gull2: Gull;
  gullTimer: number;
  rnd: () => number;
  skyKey: string;
  skyGrad: CanvasGradient | null;
  seaKey: string;
  seaGrad: CanvasGradient | null;
  landKey: string;
  landGrad: CanvasGradient | null;
  hazeKey: string;
  hazeGrad: CanvasGradient | null;
  sunKey: string;
  sunGrad: CanvasGradient | null;
  moonKey: string;
  moonGrad: CanvasGradient | null;
  /** 갯벌 물웅덩이 — 하늘을 반사하는 얕은 물 */
  pools: { x: number; d: number; rx: number; tw: number }[];
  /** 펄·모래 질감 점 */
  speckles: { x: number; d: number; r: number; dark: boolean }[];
  /** 수면 잔반짝임 */
  sparks: { x: number; f: number; tw: number }[];
  /** 밀려와 부서지는 파도(브레이커) — p: 진행도 0(수평선)~1(물가) */
  breakers: { p: number; ph: number; amp: number }[];
  breakTimer: number;
  /** 파도가 물가에 닿았을 때 확 밀려드는 스와시 서지 (0~1.2, 서서히 감쇠) */
  swashBoost: number;
  /** 바람 셀 때 먼바다에 이는 흰 물머리 */
  caps: { x: number; f: number; tw: number }[];
  /** 바람 결 — 하늘을 스치는 스우시 라인 */
  windLines: { x: number; y: number; len: number }[];
  /** 포인트 상점에서 구매한 꾸미기 아이템 */
  decor: { lighthouse: boolean; boat: boolean; gulls: boolean };
  /** 돛단배 위치 (0~1) 와 진행 방향 */
  boat: { x: number; dir: number };
  scratchA: RGB;
  scratchB: RGB;
}

export default function SeaScene(props: SeaSceneProps): JSX.Element {
  const propsRef = useRef(props);
  propsRef.current = props;
  const boxRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hiddenDrawRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // rAF가 멈춘 숨김 탭에서도 수위 변경이 반영되도록 스냅 렌더
    if (document.hidden) hiddenDrawRef.current?.();
  }, [props.ratio, props.hour, props.direction]);

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!box || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rnd = mulberry(20260912);
    const S: SceneState = {
      disp: clamp01(propsRef.current.ratio),
      t: 0, w: 0, h: 0,
      pal: makePalette(),
      stars: makeStars(34, 11),
      clouds: makeClouds(),
      life: makeFlatLife(77),
      channels: [
        { x: 0.22, s1: 0.05, s2: -0.04, lw: 7 },
        { x: 0.52, s1: -0.06, s2: 0.05, lw: 10 },
        { x: 0.8, s1: 0.04, s2: 0.06, lw: 6 },
      ],
      gull: makeGull(), gull2: makeGull(), gullTimer: 3,
      rnd,
      skyKey: '', skyGrad: null,
      seaKey: '', seaGrad: null,
      landKey: '', landGrad: null,
      hazeKey: '', hazeGrad: null,
      sunKey: '', sunGrad: null,
      moonKey: '', moonGrad: null,
      pools: Array.from({ length: 4 }, () => ({
        x: 0.08 + rnd() * 0.84,
        d: 0.25 + rnd() * 0.65,
        rx: 0.05 + rnd() * 0.07,
        tw: rnd() * Math.PI * 2,
      })),
      speckles: Array.from({ length: 46 }, () => ({
        x: rnd(),
        d: rnd(),
        r: 0.7 + rnd() * 1.3,
        dark: rnd() > 0.45,
      })),
      sparks: Array.from({ length: 18 }, () => ({
        x: rnd(),
        f: 0.15 + rnd() * 0.8,
        tw: rnd() * Math.PI * 2,
      })),
      // 처음부터 파도가 밀려오는 중이도록 미리 심어둔다
      breakers: [
        { p: 0.3 + rnd() * 0.1, ph: rnd() * Math.PI * 2, amp: 0.8 + rnd() * 0.4 },
        { p: 0.68 + rnd() * 0.1, ph: rnd() * Math.PI * 2, amp: 0.8 + rnd() * 0.4 },
      ],
      breakTimer: 1.2,
      swashBoost: 0,
      caps: Array.from({ length: 26 }, () => ({
        x: rnd(),
        f: rnd(),
        tw: rnd() * Math.PI * 2,
      })),
      windLines: Array.from({ length: 3 }, (_, i) => ({
        x: rnd() * 1.2 - 0.1,
        y: 0.18 + i * 0.22 + rnd() * 0.08,
        len: 40 + rnd() * 40,
      })),
      decor: {
        lighthouse: hasItem('lighthouse'),
        boat: hasItem('boat'),
        gulls: hasItem('gulls'),
      },
      boat: { x: 0.2 + rnd() * 0.5, dir: rnd() > 0.5 ? 1 : -1 },
      scratchA: [0, 0, 0], scratchB: [0, 0, 0],
    };

    const resize = () => {
      const r = box.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      S.w = Math.max(1, r.width);
      S.h = Math.max(1, r.height);
      canvas.width = Math.round(S.w * dpr);
      canvas.height = Math.round(S.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      S.skyKey = S.seaKey = S.landKey = S.hazeKey = S.sunKey = S.moonKey = '';
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(box);

    let raf = 0;
    let last = performance.now();
    let running = false;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      // dt 하한 0 — 탭 전환 직후 음수 dt 방지
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      S.t += dt;
      draw(ctx, S, propsRef.current, dt);
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
    // 숨김 탭에서는 rAF가 돌지 않으므로 첫 프레임은 동기로 그린다
    hiddenDrawRef.current = () => {
      S.disp = clamp01(propsRef.current.ratio);
      draw(ctx, S, propsRef.current, 0);
    };
    draw(ctx, S, propsRef.current, 0);
    start();

    return () => {
      stop();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <div ref={boxRef} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}

function draw(ctx: CanvasRenderingContext2D, S: SceneState, p: SeaSceneProps, dt: number): void {
  const { w, h, t } = S;
  const target = clamp01(p.ratio);
  S.disp += (target - S.disp) * (1 - Math.exp(-dt * 2.2));
  const disp = S.disp;

  const pal = samplePalette(p.hour, S.pal);
  const style = REGION[p.region];
  const wind = Math.max(0, Math.min(p.windSpeed, 20));
  const windK = 0.7 + wind * 0.09;
  // 바람 세기 0~1 정규화 — 2m/s 이하 잔잔, 13m/s 이상 최대치
  const windN = clamp01((wind - 2) / 11);
  const dirSign = p.direction === 'rising' ? 1 : p.direction === 'falling' ? -1 : 0.15;

  const horizonY = h * 0.3;
  const edgeBase = lerp(style.edgeLow, style.edgeHigh, disp) * h;
  const swash = (2.5 + wind * 0.5) * (p.direction === 'slack' ? 0.5 : 1);
  // 파도가 물가에 닿으면 잠깐 물이 확 밀려든다 (swashBoost는 서서히 잦아듦)
  S.swashBoost = Math.max(0, S.swashBoost - dt * 0.5);
  const edgeY = edgeBase + Math.sin(t * (0.7 + wind * 0.04)) * swash + dirSign * Math.sin(t * 0.33) * 3 + S.swashBoost * 5;

  // ---- 하늘 ----
  const skyKey = `${h | 0}|${pal.top[0] & ~3}${pal.top[1] & ~3}${pal.top[2] & ~3}|${pal.bottom[0] & ~3}${pal.bottom[2] & ~3}`;
  let skyGrad = S.skyGrad;
  if (skyKey !== S.skyKey || !skyGrad) {
    skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, css(pal.top));
    skyGrad.addColorStop(0.6, css(pal.mid));
    skyGrad.addColorStop(1, css(pal.bottom));
    S.skyGrad = skyGrad;
    S.skyKey = skyKey;
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, horizonY + 2);

  // 수평선 대기 안개 — 멀수록 뿌옇게 (대기 원근)
  const night = pal.night;
  const daylight = 1 - night;
  if (daylight > 0.05) {
    const hazeKey = `${skyKey}|hz${(daylight * 12) | 0}`;
    let hazeGrad = S.hazeGrad;
    if (hazeKey !== S.hazeKey || !hazeGrad) {
      hazeGrad = ctx.createLinearGradient(0, horizonY - h * 0.13, 0, horizonY);
      hazeGrad.addColorStop(0, 'rgba(255,255,255,0)');
      hazeGrad.addColorStop(1, `rgba(255,255,255,${0.22 * daylight})`);
      S.hazeGrad = hazeGrad;
      S.hazeKey = hazeKey;
    }
    ctx.fillStyle = hazeGrad;
    ctx.fillRect(0, horizonY - h * 0.13, w, h * 0.13 + 2);
  }

  // ---- 별·달 (밤) ----
  const moonX = w * 0.78;
  const moonY = horizonY * 0.38;
  if (night > 0.03) {
    for (let i = 0; i < S.stars.length; i++) {
      const st = S.stars[i];
      const a = night * (0.35 + 0.45 * Math.sin(t * 1.8 + st.tw));
      if (a <= 0.02) continue;
      ctx.fillStyle = `rgba(255,250,230,${a})`;
      ctx.beginPath();
      ctx.arc(st.x * w, st.y * horizonY, st.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // 달무리 (부드러운 글로우)
    const moonKey = `${(night * 20) | 0}|${w | 0}|${h | 0}`;
    let moonGrad = S.moonGrad;
    if (moonKey !== S.moonKey || !moonGrad) {
      moonGrad = ctx.createRadialGradient(moonX, moonY, 4, moonX, moonY, 58);
      moonGrad.addColorStop(0, `rgba(250,244,214,${0.5 * night})`);
      moonGrad.addColorStop(0.35, `rgba(250,244,214,${0.14 * night})`);
      moonGrad.addColorStop(1, 'rgba(250,244,214,0)');
      S.moonGrad = moonGrad;
      S.moonKey = moonKey;
    }
    ctx.fillStyle = moonGrad;
    ctx.fillRect(moonX - 60, moonY - 60, 120, 120);
    ctx.fillStyle = `rgba(250,244,214,${0.95 * night})`;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(216,208,176,${0.6 * night})`;
    ctx.beginPath();
    ctx.arc(moonX - 4, moonY - 2, 2.4, 0, Math.PI * 2);
    ctx.arc(moonX + 3, moonY + 4, 1.7, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- 태양 (낮) — 시각 따라 뜨고 지고, 낮게 뜰수록 붉고 커짐 ----
  const sunT = (p.hour - 6.0) / (18.8 - 6.0);
  let sunX = -1;
  let sunAlt = 0;
  if (sunT > 0 && sunT < 1 && daylight > 0.1) {
    sunAlt = Math.sin(Math.PI * sunT);
    sunX = lerp(0.14, 0.86, sunT) * w;
    const sy = horizonY * (1 - sunAlt * 0.82) - 2;
    const warm = 1 - clamp01(sunAlt * 2.4);
    const r = 14 + warm * 10;
    const cr = 255;
    const cg = (246 - warm * 82) | 0;
    const cb = (214 - warm * 126) | 0;
    const sunKey = `${(sunT * 170) | 0}|${w | 0}|${h | 0}`;
    let sunGrad = S.sunGrad;
    if (sunKey !== S.sunKey || !sunGrad) {
      sunGrad = ctx.createRadialGradient(sunX, sy, r * 0.4, sunX, sy, r * 5.5);
      sunGrad.addColorStop(0, `rgba(${cr},${cg},${cb},${0.5 * daylight})`);
      sunGrad.addColorStop(0.35, `rgba(${cr},${cg},${cb},${0.14 * daylight})`);
      sunGrad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      S.sunGrad = sunGrad;
      S.sunKey = sunKey;
    }
    ctx.fillStyle = sunGrad;
    ctx.fillRect(sunX - r * 5.5, sy - r * 5.5, r * 11, Math.min(r * 11, horizonY + 2 - (sy - r * 5.5)));
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${0.96 * daylight})`;
    ctx.beginPath();
    ctx.arc(sunX, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- 구름 (2톤: 그늘진 밑면 + 빛 받은 봉우리) ----
  const cloudCol = css(pal.cloud, pal.cloudAlpha);
  S.scratchA[0] = pal.cloud[0] + (255 - pal.cloud[0]) * 0.55;
  S.scratchA[1] = pal.cloud[1] + (255 - pal.cloud[1]) * 0.55;
  S.scratchA[2] = pal.cloud[2] + (255 - pal.cloud[2]) * 0.55;
  const cloudLite = css(S.scratchA, Math.min(1, pal.cloudAlpha + 0.06));
  for (let i = 0; i < S.clouds.length; i++) {
    const c = S.clouds[i];
    // 바람이 셀수록 구름이 빨리 흐른다
    c.x += c.speed * dt * (1 + windN * 2.2);
    if (c.x > 1.25) c.x = -0.25;
    drawCloud(ctx, c.x * w, c.y * horizonY, c.scale * (w / 380), cloudCol, cloudLite);
  }

  // ---- 바람 결 — 바람이 좀 불면 하늘에 스우시 라인이 흐른다 ----
  const windLineA = clamp01((wind - 4) / 9);
  if (windLineA > 0.02) {
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = `rgba(255,255,255,${(0.1 + 0.16 * windLineA) * (0.4 + 0.6 * daylight)})`;
    for (let i = 0; i < S.windLines.length; i++) {
      const wl = S.windLines[i];
      wl.x += dt * (0.08 + 0.3 * windN);
      if (wl.x > 1.25) {
        wl.x = -0.35;
        wl.y = 0.12 + S.rnd() * 0.55;
        wl.len = 34 + S.rnd() * 50;
      }
      const px = wl.x * w;
      const py = wl.y * horizonY;
      const L2 = wl.len;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.bezierCurveTo(px + L2 * 0.35, py - 7, px + L2 * 0.65, py + 7, px + L2, py - 2);
      ctx.stroke();
      // 끝에 살짝 말리는 곡선 — 바람의 소용돌이 느낌
      ctx.beginPath();
      ctx.arc(px + L2, py - 5, 3.2, Math.PI * 0.4, Math.PI * 1.4);
      ctx.stroke();
    }
  }

  // ---- 바닥 (모래/갯벌) ----
  const mudK = p.mudflat ? (p.region === 'west' ? 1 : p.region === 'south' ? 0.6 : 0) : 0;
  const landKey = `${h | 0}|${p.region}|${mudK}|${(pal.waterLight * 20) | 0}`;
  let landGrad = S.landGrad;
  if (landKey !== S.landKey || !landGrad) {
    const dim = 0.55 + pal.waterLight * 0.45;
    landGrad = ctx.createLinearGradient(0, horizonY, 0, h);
    const topC = lerpRGB(S.scratchA, style.sandTop, MUD_TOP, mudK);
    topC[0] *= dim; topC[1] *= dim; topC[2] *= dim;
    landGrad.addColorStop(0, css(topC));
    const botC = lerpRGB(S.scratchB, style.sandBottom, MUD_BOTTOM, mudK);
    botC[0] *= dim; botC[1] *= dim; botC[2] *= dim;
    landGrad.addColorStop(1, css(botC));
    S.landGrad = landGrad;
    S.landKey = landKey;
  }
  ctx.fillStyle = landGrad;
  ctx.fillRect(0, horizonY, w, h - horizonY);

  const exposure = 1 - disp;
  const flatH = h - edgeY;
  drawFlatDetail(ctx, S, p, pal, mudK, edgeY, flatH, exposure, dt);

  // ---- 바다 ----
  const light = pal.waterLight;
  const seaKey = `${h | 0}|${p.region}|${(light * 24) | 0}`;
  let seaGrad = S.seaGrad;
  if (seaKey !== S.seaKey || !seaGrad) {
    seaGrad = ctx.createLinearGradient(0, horizonY, 0, h);
    // 수평선 바로 아래는 한층 짙은 남색 띠 — 실제 바다의 원근감
    const dC = lerpRGB(S.scratchA, DEEP_NIGHT, style.deep, light);
    const deepCss = css(dC);
    dC[0] *= 0.55; dC[1] *= 0.66; dC[2] *= 0.9;
    seaGrad.addColorStop(0, css(dC));
    seaGrad.addColorStop(0.16, deepCss);
    const shC = lerpRGB(S.scratchB, SHALLOW_NIGHT, style.shallow, light);
    seaGrad.addColorStop(0.72, css(shC));
    // 물가 쪽은 햇빛에 밝게 비치는 옥빛
    shC[0] += (255 - shC[0]) * 0.25 * light;
    shC[1] += (255 - shC[1]) * 0.22 * light;
    shC[2] += (255 - shC[2]) * 0.18 * light;
    seaGrad.addColorStop(1, css(shC));
    S.seaGrad = seaGrad;
    S.seaKey = seaKey;
  }
  if (p.region === 'south') {
    const icc = css(lerpRGB(S.scratchA, pal.mid, ISLAND_DARK, 0.6), 0.9);
    drawIsland(ctx, w * 0.68, horizonY + 3, w * 0.2, h * 0.05, icc);
    drawIsland(ctx, w * 0.3, horizonY + 2, w * 0.11, h * 0.032, icc);
  }
  ctx.fillStyle = seaGrad;
  ctx.fillRect(0, horizonY - 1, w, edgeY + 4 - horizonY);
  // 먼바다 밝은 띠 — 수평선 쪽이 하늘빛을 받아 뿌옇게
  const farA = (0.05 + 0.11 * daylight) * light;
  ctx.fillStyle = `rgba(255,255,255,${farA})`;
  ctx.fillRect(0, horizonY - 1, w, Math.min(9, edgeY - horizonY));
  ctx.fillStyle = `rgba(255,255,255,${farA * 0.45})`;
  ctx.fillRect(0, horizonY + 8, w, Math.min(12, Math.max(0, edgeY - horizonY - 8)));

  // ---- 포인트 상점 데코: 등대·돛단배 ----
  if (S.decor.lighthouse) drawLighthouse(ctx, w, horizonY, night, t);
  if (S.decor.boat && edgeY > horizonY + 14) {
    S.boat.x += S.boat.dir * dt * 0.006;
    if (S.boat.x > 1.06) { S.boat.x = 1.06; S.boat.dir = -1; }
    else if (S.boat.x < -0.06) { S.boat.x = -0.06; S.boat.dir = 1; }
    drawBoat(ctx, S.boat.x * w, horizonY + 9 + Math.sin(t * 0.7) * 1.2, Math.max(0.7, w / 460), S.boat.dir, night, t);
  }
  const waveSign = dirSign >= 0 ? 1 : -1;
  const sh2 = lerpRGB(S.scratchB, SHALLOW_NIGHT, style.shallow, light);
  for (let i = 0; i < style.layers.length; i++) {
    const L = style.layers[i];
    const bright = i * 0.16;
    S.scratchA[0] = sh2[0] + (255 - sh2[0]) * bright;
    S.scratchA[1] = sh2[1] + (255 - sh2[1]) * bright;
    S.scratchA[2] = sh2[2] + (255 - sh2[2]) * bright;
    traceWave(ctx, w, edgeY + 5 + L.amp * windK, edgeY, L, t + i * 1.7, windK, waveSign);
    ctx.fillStyle = css(S.scratchA, i === style.layers.length - 1 ? 0.95 : L.alpha);
    ctx.fill();
  }

  // 파도 마루 하이라이트 — 빛을 받아 얇게 빛나는 능선
  if (edgeY > horizonY + 16) {
    ctx.lineCap = 'round';
    const stepC = Math.max(8, w / 60);
    for (let i = 1; i < style.layers.length; i++) {
      const L = style.layers[i];
      const aC = (i === style.layers.length - 1 ? 0.2 : 0.1) * (0.35 + 0.65 * light);
      ctx.strokeStyle = `rgba(255,255,255,${aC})`;
      ctx.lineWidth = i === style.layers.length - 1 ? 1.4 : 1.1;
      ctx.beginPath();
      ctx.moveTo(0, waveY(0, edgeY, L, t + i * 1.7, windK, waveSign) - 1);
      for (let x = stepC; x <= w + stepC; x += stepC) {
        ctx.lineTo(x, waveY(x, edgeY, L, t + i * 1.7, windK, waveSign) - 1);
      }
      ctx.stroke();
    }
  }

  // ---- 밀려와 부서지는 파도 (브레이커) ----
  drawBreakers(ctx, S, horizonY, edgeY, windN, light, dt);

  // 수면 잔반짝임 — 바람 따라 흩어지는 미세 글린트
  if (edgeY > horizonY + 30 && light > 0.5) {
    for (let i = 0; i < S.sparks.length; i++) {
      const sp = S.sparks[i];
      const a = light * daylight * (0.06 + 0.16 * Math.max(0, Math.sin(t * (2.2 + windK * 0.6) + sp.tw)));
      if (a <= 0.02) continue;
      const y = horizonY + sp.f * (edgeY - horizonY - 12) + 6;
      const s2 = 0.8 + sp.f * 1.7;
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect(sp.x * w, y, s2 * 2.4, s2 * 0.8);
    }
  }

  // 흰 물머리(화이트캡) — 바람이 셀 때 먼바다 여기저기서 부서지는 흰 점
  const capGate = clamp01((wind - 5) / 8) * light;
  if (capGate > 0.02 && edgeY > horizonY + 26) {
    for (let i = 0; i < S.caps.length; i++) {
      const cp = S.caps[i];
      const a = capGate * Math.max(0, Math.sin(t * (1.3 + cp.f) + cp.tw) - 0.35) * 0.5;
      if (a <= 0.02) continue;
      const y = horizonY + 8 + cp.f * (edgeY - horizonY - 18);
      const s3 = (0.5 + cp.f * 1.6) * (1 + windN * 0.6);
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect(cp.x * w + Math.sin(t * 0.5 + cp.tw) * 4, y, s3 * 3, s3 * 0.9);
    }
  }

  // 햇빛 물기둥 반영 (글리터)
  if (sunX >= 0 && edgeY > horizonY + 20) {
    const gA = (0.08 + 0.22 * (1 - sunAlt)) * daylight * light;
    ctx.fillStyle = `rgba(255,228,170,${gA})`;
    for (let y = horizonY + 6; y < edgeY - 6; y += 8) {
      const f = (y - horizonY) / (edgeY - horizonY);
      const ww = (5 + f * 22) * (0.55 + 0.45 * Math.sin(t * 2.3 + y * 0.4));
      ctx.fillRect(sunX - ww / 2 + Math.sin(t * 1.5 + y * 0.23) * 5 * f, y, ww, 2.2);
    }
  }

  // 달빛 반영
  if (night > 0.05 && edgeY > horizonY + 20) {
    const mx = w * 0.78;
    ctx.fillStyle = `rgba(246,240,206,${0.16 * night})`;
    for (let y = horizonY + 8; y < edgeY - 6; y += 9) {
      const f = (y - horizonY) / (edgeY - horizonY);
      const ww = (4 + f * 16) * (0.6 + 0.4 * Math.sin(t * 2 + y * 0.35));
      ctx.fillRect(mx - ww / 2 + Math.sin(t * 1.3 + y * 0.2) * 4 * f, y, ww, 2.5);
    }
  }

  // 물가 젖은 띠 — 하늘빛이 비치는 젖은 바닥 (거울 반사 느낌)
  ctx.fillStyle = css(pal.bottom, 0.16);
  ctx.fillRect(0, edgeY + 4, w, 9);
  ctx.fillStyle = css(pal.bottom, 0.08);
  ctx.fillRect(0, edgeY + 13, w, 12);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(0, edgeY + 4, w, 5);
  if (!style.foam) {
    // 서·남해 물가 스와시 — 파도가 닿는 순간 확 하얘졌다가 스르르 잦아든다
    const swA = 0.16 + 0.1 * Math.sin(t * 1.9) + 0.3 * S.swashBoost;
    ctx.strokeStyle = `rgba(255,255,255,${Math.max(0.06, Math.min(0.75, swA))})`;
    ctx.lineWidth = 1.6 + S.swashBoost * 1.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const yS = edgeY + 4 + Math.sin(t * 0.9) * 1.5;
    for (let x = 0; x <= w; x += 16) {
      const yy = yS + Math.sin(x * 0.045 + 1.3) * (1.8 + S.swashBoost);
      if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  if (style.foam) {
    const L = style.layers[2];
    ctx.strokeStyle = `rgba(255,255,255,${Math.min(1, 0.6 + 0.2 * Math.sin(t * 2.4) + 0.25 * S.swashBoost)})`;
    ctx.lineWidth = 2.5 + S.swashBoost;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const stepF = Math.max(8, w / 60);
    ctx.moveTo(0, waveY(0, edgeY, L, t + 3.4, windK, waveSign));
    for (let x = stepF; x <= w + stepF; x += stepF) {
      ctx.lineTo(x, waveY(x, edgeY, L, t + 3.4, windK, waveSign));
    }
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${0.3 + 0.15 * Math.sin(t * 1.7 + 2) + 0.2 * S.swashBoost})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const yF = edgeY + 14 + Math.sin(t * 1.1) * 3;
    for (let x = 0; x <= w; x += 14) {
      const yy = yF + Math.sin(x * 0.05 + 2) * 2.5;
      if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }

  // ---- 갈매기 ----
  S.gullTimer -= dt;
  if (S.gullTimer <= 0 && night < 0.6) {
    if (!S.gull.alive) spawnGull(S.gull, S.rnd);
    else if (!S.gull2.alive && S.rnd() > (S.decor.gulls ? 0.25 : 0.5)) spawnGull(S.gull2, S.rnd);
    // '갈매기 친구들' 아이템 보유 시 더 자주 찾아온다
    S.gullTimer = S.decor.gulls ? 3 + S.rnd() * 4 : 7 + S.rnd() * 9;
  }
  const gc = night > 0.4 ? 'rgba(210,214,232,0.5)' : 'rgba(90,104,128,0.75)';
  updateGull(ctx, S.gull, dt, t, w, horizonY, gc);
  updateGull(ctx, S.gull2, dt, t + 2, w, horizonY, gc);
}

/**
 * 밀려와 부서지는 파도 — 수평선 쪽에서 태어나 물가로 다가오며
 * 점점 솟아오르다(어두운 파면) 하얗게 부서진다(포말).
 * 바람이 셀수록 자주, 빠르게, 거칠게 부서진다.
 */
function drawBreakers(
  ctx: CanvasRenderingContext2D,
  S: SceneState,
  horizonY: number,
  edgeY: number,
  windN: number,
  light: number,
  dt: number,
): void {
  const { w, t } = S;
  const span = edgeY - horizonY;
  if (span < 46) return;

  // 스폰 — 바람 셀수록 간격이 짧고 동시에 더 많이 (잔잔해도 파도는 계속 온다)
  S.breakTimer -= dt;
  const maxN = 3 + Math.round(windN * 2);
  if (S.breakTimer <= 0 && S.breakers.length < maxN) {
    S.breakers.push({
      p: 0,
      ph: S.rnd() * Math.PI * 2,
      amp: 0.7 + S.rnd() * 0.55,
    });
    S.breakTimer = (4.6 - 3 * windN) * (0.6 + S.rnd() * 0.6);
  }

  ctx.lineCap = 'round';
  for (let bi = S.breakers.length - 1; bi >= 0; bi--) {
    const b = S.breakers[bi];
    b.p += dt * (0.095 + 0.075 * windN);
    if (b.p > 1.08) {
      S.breakers.splice(bi, 1);
      // 파도가 물가에 닿는 순간 — 물이 확 밀려들며 스와시가 살아난다
      S.swashBoost = Math.min(1.2, S.swashBoost + 0.7 + windN * 0.4);
      continue;
    }
    const p2 = b.p;
    const persp = 0.22 + 0.78 * p2; // 멀면 작게, 가까우면 크게
    const y = horizonY + span * (0.24 + 0.76 * p2 * p2);
    const breaking = clamp01((p2 - 0.45) / 0.3); // 중반부터 부서지기 시작
    const fade = 1 - clamp01((p2 - 0.92) / 0.16); // 물가에서 스러짐
    const foamA = (0.18 + 0.66 * breaking) * fade * (0.45 + 0.55 * light) * b.amp * (0.7 + 0.5 * windN);
    if (foamA <= 0.02) continue;
    const kx = 0.02 / (0.45 + 0.55 * persp);
    // 마루 파형은 제자리에서 숨쉬기만 — 가로로 흐르지 않는다
    const cAmp = (3.4 + 2.4 * breaking) * persp * (0.85 + 0.15 * Math.sin(t * 2 + b.ph));
    const crest = (x: number) => y + Math.sin(x * kx + b.ph) * cAmp;
    const step = Math.max(10, w / 46);

    // ① 파도가 솟아오른 어두운 앞면 (마루 위쪽 그늘 띠)
    const faceH = (3 + 11 * breaking) * persp;
    ctx.fillStyle = `rgba(12,44,80,${0.17 * persp * fade * light})`;
    ctx.beginPath();
    ctx.moveTo(0, crest(0) - faceH);
    for (let x = step; x <= w + step; x += step) ctx.lineTo(x, crest(x) - faceH);
    for (let x = w; x >= -step; x -= step) ctx.lineTo(Math.max(0, x), crest(Math.max(0, x)));
    ctx.closePath();
    ctx.fill();

    // ② 마루 아래로 번지는 하얀 포말 (부서진 뒤)
    if (breaking > 0.02) {
      const washH = (3 + 15 * breaking) * persp;
      ctx.fillStyle = `rgba(255,255,255,${foamA * 0.3})`;
      ctx.beginPath();
      ctx.moveTo(0, crest(0));
      for (let x = step; x <= w + step; x += step) ctx.lineTo(x, crest(x));
      for (let x = w; x >= -step; x -= step) ctx.lineTo(Math.max(0, x), crest(Math.max(0, x)) + washH);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${foamA * 0.28})`;
      ctx.beginPath();
      ctx.moveTo(0, crest(0));
      for (let x = step; x <= w + step; x += step) ctx.lineTo(x, crest(x));
      for (let x = w; x >= -step; x -= step) ctx.lineTo(Math.max(0, x), crest(Math.max(0, x)) + washH * 0.45);
      ctx.closePath();
      ctx.fill();

      // 포말 줄무늬 — 부서진 자리에서 아래로 흘러내리는 흰 결
      const ns = 8 + ((windN * 6) | 0);
      ctx.strokeStyle = `rgba(255,255,255,${foamA * 0.4})`;
      ctx.lineWidth = 1.2 * persp;
      ctx.beginPath();
      for (let k = 0; k < ns; k++) {
        const fx = (((b.ph * 0.31 + k * 0.617) % 1) + 1) % 1;
        const sx = fx * w;
        const sy = crest(sx) + 1;
        const sl = (3 + 10 * breaking) * persp * (0.5 + ((k * 37) % 10) / 10);
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + (k % 2 ? 2 : -2) * persp, sy + sl);
      }
      ctx.stroke();
    }

    // ③ 하얀 마루선
    ctx.strokeStyle = `rgba(255,255,255,${foamA})`;
    ctx.lineWidth = (1 + 2.6 * persp) * (0.7 + 0.8 * breaking);
    ctx.beginPath();
    ctx.moveTo(0, crest(0));
    for (let x = step; x <= w + step; x += step) ctx.lineTo(x, crest(x));
    ctx.stroke();

    // ④ 마루 위로 튀는 거품 덩어리
    if (breaking > 0.25) {
      const n = (4 + windN * 6) | 0;
      ctx.fillStyle = `rgba(255,255,255,${foamA * 0.75})`;
      for (let k = 0; k < n; k++) {
        const fx = ((b.ph + k * 0.83) % 1 + 1) % 1;
        const bx = fx * w;
        const by = crest(bx) - (1.5 + Math.sin(t * 3 + k * 2.1 + b.ph) * 1.2) * persp;
        ctx.beginPath();
        ctx.arc(bx, by, (0.9 + (k % 3) * 0.5) * persp * (0.6 + breaking * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

/** 상점 아이템: 수평선 등대 — 밤에는 불빛이 돈다 */
function drawLighthouse(ctx: CanvasRenderingContext2D, w: number, horizonY: number, night: number, t: number): void {
  const s = Math.max(0.75, w / 460);
  const x = w * 0.895;
  const base = horizonY + 2;
  const bodyH = 30 * s;
  const topY = base - bodyH;
  const day = 1 - night;

  // 몸통 (위로 갈수록 좁아지는 사다리꼴, 밤엔 실루엣)
  ctx.fillStyle = night > 0.45 ? 'rgba(46,58,80,0.95)' : 'rgba(224,230,238,0.95)';
  ctx.beginPath();
  ctx.moveTo(x - 5.5 * s, base);
  ctx.lineTo(x - 3.4 * s, topY);
  ctx.lineTo(x + 3.4 * s, topY);
  ctx.lineTo(x + 5.5 * s, base);
  ctx.closePath();
  ctx.fill();
  // 빨간 띠 2개 (낮에만 또렷하게)
  if (day > 0.25) {
    ctx.fillStyle = `rgba(224,82,74,${0.85 * day})`;
    ctx.fillRect(x - 4.9 * s, base - bodyH * 0.28, 9.8 * s, bodyH * 0.16);
    ctx.fillRect(x - 4.1 * s, base - bodyH * 0.66, 8.2 * s, bodyH * 0.14);
  }
  // 램프실 + 지붕
  ctx.fillStyle = night > 0.45 ? 'rgba(38,48,68,0.95)' : 'rgba(94,106,124,0.9)';
  ctx.fillRect(x - 3.8 * s, topY - 5 * s, 7.6 * s, 5 * s);
  ctx.beginPath();
  ctx.moveTo(x - 4.4 * s, topY - 5 * s);
  ctx.lineTo(x, topY - 9 * s);
  ctx.lineTo(x + 4.4 * s, topY - 5 * s);
  ctx.closePath();
  ctx.fill();

  // 밤: 회전하는 불빛
  if (night > 0.2) {
    const ly = topY - 2.5 * s;
    const sweep = Math.sin(t * 0.8); // -1(왼)~1(오른) 왕복 회전
    const len = 46 * s * (0.55 + 0.45 * Math.abs(sweep));
    const dir = sweep >= 0 ? 1 : -1;
    const spreadY = 5.5 * s;
    const beamA = 0.14 * night * (0.35 + 0.65 * Math.abs(sweep));
    const grad = ctx.createLinearGradient(x, ly, x + dir * len, ly);
    grad.addColorStop(0, `rgba(255,236,170,${beamA})`);
    grad.addColorStop(1, 'rgba(255,236,170,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x, ly - 1.5 * s);
    ctx.lineTo(x + dir * len, ly - spreadY);
    ctx.lineTo(x + dir * len, ly + spreadY);
    ctx.lineTo(x, ly + 1.5 * s);
    ctx.closePath();
    ctx.fill();
    // 램프 자체 광원
    ctx.fillStyle = `rgba(255,240,180,${(0.55 + 0.35 * Math.abs(sweep)) * night})`;
    ctx.beginPath();
    ctx.arc(x, ly, 2 * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** 상점 아이템: 먼바다를 오가는 돛단배 */
function drawBoat(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, dir: number, night: number, t: number): void {
  const rock = Math.sin(t * 0.9) * 0.05; // 잔잔한 흔들림
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rock);
  const hullC = night > 0.45 ? 'rgba(30,40,58,0.92)' : 'rgba(74,60,48,0.92)';
  const sailA = night > 0.45 ? 0.55 : 0.94;
  // 선체
  ctx.fillStyle = hullC;
  ctx.beginPath();
  ctx.moveTo(-11 * s, 0);
  ctx.lineTo(11 * s, 0);
  ctx.lineTo(7 * s, 4.5 * s);
  ctx.lineTo(-7 * s, 4.5 * s);
  ctx.closePath();
  ctx.fill();
  // 돛대
  ctx.strokeStyle = hullC;
  ctx.lineWidth = 1.2 * s;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -14 * s);
  ctx.stroke();
  // 큰 돛 (진행 방향으로 부풀어 있음)
  ctx.fillStyle = `rgba(250,248,240,${sailA})`;
  ctx.beginPath();
  ctx.moveTo(0, -13.5 * s);
  ctx.quadraticCurveTo(dir * 9 * s, -7 * s, dir * 7.5 * s, -1.5 * s);
  ctx.lineTo(0, -1.5 * s);
  ctx.closePath();
  ctx.fill();
  // 작은 앞돛
  ctx.fillStyle = `rgba(238,240,244,${sailA * 0.85})`;
  ctx.beginPath();
  ctx.moveTo(-dir * 1.5 * s, -11 * s);
  ctx.quadraticCurveTo(-dir * 7 * s, -6 * s, -dir * 6 * s, -1.5 * s);
  ctx.lineTo(-dir * 1.5 * s, -1.5 * s);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // 수면 반사 그림자
  ctx.fillStyle = `rgba(0,10,20,${night > 0.45 ? 0.2 : 0.12})`;
  ctx.beginPath();
  ctx.ellipse(x, y + 5.5 * s, 10 * s, 1.6 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}

function updateGull(ctx: CanvasRenderingContext2D, g: Gull, dt: number, t: number, w: number, horizonY: number, color: string): void {
  if (!g.alive) return;
  g.x += g.vx * dt;
  g.flap += dt * 7;
  if (g.x < -0.12 || g.x > 1.12) { g.alive = false; return; }
  const y = g.y * horizonY * 2 + Math.sin(t * 0.8) * 5;
  drawGull(ctx, g.x * w, y, Math.max(0.7, w / 420), g.flap, color);
}

function drawFlatDetail(
  ctx: CanvasRenderingContext2D,
  S: SceneState,
  p: SeaSceneProps,
  pal: SkyPalette,
  mudK: number,
  edgeY: number,
  flatH: number,
  exposure: number,
  dt: number,
): void {
  const { w, h, t } = S;
  if (flatH < 14) return;
  const persp = (d: number) => edgeY + 8 + d * Math.max(0, flatH - 18);
  const southClip = p.region === 'south';
  const maxX = southClip ? 0.58 : 1;

  // 바닥 질감 — 펄·모래 알갱이 (원근에 따라 크기 변화)
  const grainA = (mudK > 0 ? 0.11 : 0.07) * (0.35 + exposure * 0.65);
  for (let i = 0; i < S.speckles.length; i++) {
    const sp = S.speckles[i];
    if (sp.x > maxX) continue;
    ctx.fillStyle = sp.dark
      ? `rgba(38,25,17,${grainA})`
      : `rgba(255,242,222,${grainA * 0.75})`;
    ctx.beginPath();
    ctx.arc(sp.x * w, persp(sp.d), sp.r * (0.55 + sp.d * 0.85), 0, Math.PI * 2);
    ctx.fill();
  }

  if (mudK > 0) {
    // 물웅덩이 — 하늘빛을 담은 얕은 물이 남아 반짝임
    const poolA = 0.34 * exposure * mudK;
    if (poolA > 0.03) {
      for (let i = 0; i < S.pools.length; i++) {
        const pl = S.pools[i];
        if (pl.x > maxX) continue;
        const py = persp(pl.d);
        const rx = pl.rx * w * (0.45 + pl.d * 0.85);
        const ry = Math.max(2.5, rx * 0.26);
        ctx.fillStyle = css(pal.bottom, poolA);
        ctx.beginPath();
        ctx.ellipse(pl.x * w, py, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255,255,255,${poolA * 0.35})`;
        ctx.beginPath();
        ctx.ellipse(pl.x * w - rx * 0.2, py - ry * 0.3, rx * 0.55, ry * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        const twk = Math.sin(t * 2.1 + pl.tw);
        if (twk > 0.5) {
          ctx.fillStyle = `rgba(255,255,255,${(twk - 0.5) * 1.1 * exposure * mudK})`;
          ctx.beginPath();
          ctx.arc(pl.x * w + rx * 0.25, py - ry * 0.15, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    // 물골
    ctx.strokeStyle = `rgba(58,40,30,${0.28 * exposure * mudK})`;
    ctx.lineCap = 'round';
    for (let i = 0; i < S.channels.length; i++) {
      const c = S.channels[i];
      if (c.x > maxX) continue;
      ctx.lineWidth = c.lw * (flatH / (h * 0.4));
      ctx.beginPath();
      ctx.moveTo(c.x * w, edgeY + 4);
      ctx.quadraticCurveTo((c.x + c.s1) * w, edgeY + flatH * 0.45, (c.x + c.s2) * w, h + 8);
      ctx.stroke();
    }
    // 물기 반짝임
    for (let i = 0; i < S.life.sparkles.length; i++) {
      const sp = S.life.sparkles[i];
      if (sp.x > maxX) continue;
      const a = (0.18 + 0.3 * Math.sin(t * 2.6 + sp.tw)) * exposure * mudK * (1 - sp.d * 0.6);
      if (a <= 0.02) continue;
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.beginPath();
      ctx.arc(sp.x * w, persp(sp.d), 1.4 + sp.d, 0, Math.PI * 2);
      ctx.fill();
    }
    const kinds = sceneCreatures(p.species ?? []);
    // 조개 (ratio<0.4)
    const shellVis = clamp01((0.4 - S.disp) / 0.12) * mudK;
    if (kinds.shell && shellVis > 0.02) {
      const n = southClip ? 3 : S.life.shells.length;
      for (let i = 0; i < n; i++) {
        const sh = S.life.shells[i];
        if (sh.x > maxX) continue;
        drawShell(ctx, sh.x * w, persp(sh.d), sh.r * (0.7 + sh.d * 0.7), sh.rot, shellVis);
      }
    }
    // 게 (ratio<0.25) + 숨구멍
    const crabVis = clamp01((0.25 - S.disp) / 0.09) * mudK;
    if (crabVis > 0.02) {
      if (kinds.crab) {
        const n = southClip ? 1 : S.life.crabs.length;
        for (let i = 0; i < n; i++) {
          const c = S.life.crabs[i];
          stepCrab(c, dt, S.rnd);
          const cx = Math.min(c.x, maxX - 0.04);
          drawCrab(ctx, cx * w, persp(c.d), 0.75 + c.d * 0.65, c.phase, c.pause <= 0, crabVis);
        }
      }
      // 짱뚱어 — 물빠진 갯벌에서 폴짝폴짝
      if (kinds.skipper) {
        const n = southClip ? 1 : S.life.skippers.length;
        for (let i = 0; i < n; i++) {
          const k = S.life.skippers[i];
          stepSkipper(k, dt, S.rnd);
          const kx = Math.min(k.x, maxX - 0.05);
          drawSkipper(ctx, kx * w, persp(k.d), 0.7 + k.d * 0.6, k.dir, k.hop, crabVis);
        }
      }
      // 낙지 — 물골 근처에 한 마리
      if (kinds.octopus) {
        const o = S.life.octo;
        const ox = Math.min(o.x, maxX - 0.06);
        drawOcto(ctx, ox * w, persp(o.d), 0.8 + o.d * 0.55, S.t, crabVis);
      }
      for (let i = 0; i < S.life.holes.length; i++) {
        const ho = S.life.holes[i];
        if (ho.x > maxX) continue;
        if (ho.t < 0) {
          ho.next -= dt;
          if (ho.next <= 0) ho.t = 0;
        } else {
          ho.t += dt * 1.3;
          if (ho.t > 1) { ho.t = -1; ho.next = 1.5 + S.rnd() * 4; }
        }
        if (ho.t >= 0) drawBubble(ctx, ho.x * w, persp(ho.d), Math.min(ho.t, 1), (0.8 + ho.d * 0.6) * crabVis);
      }
    }
  } else if (p.region === 'east') {
    // 모래 결 — 은은한 가로 물결 자국
    ctx.strokeStyle = `rgba(255,255,255,${0.08 * exposure + 0.03})`;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const y = edgeY + flatH * (0.3 + i * 0.25);
      if (y > h - 4) break;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 18) {
        const yy = y + Math.sin(x * 0.04 + i * 2) * 2;
        if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
  }
}
