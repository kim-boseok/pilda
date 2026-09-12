// 하늘 색/천체 — 시간(hour 0~24)에 따른 부드러운 팔레트 보간

export type RGB = [number, number, number];

export interface SkyPalette {
  top: RGB;
  mid: RGB;
  bottom: RGB;
  /** 0~1 밤 정도 (별/달 표시량) */
  night: number;
  /** 물 색에 곱해줄 밝기 0.4~1 */
  waterLight: number;
  cloud: RGB;
  cloudAlpha: number;
}

interface Keyframe extends SkyPalette {
  h: number;
}

const KEYS: Keyframe[] = [
  { h: 0.0,  top: [16, 24, 58],    mid: [28, 38, 82],    bottom: [46, 58, 108],   night: 1,   waterLight: 0.45, cloud: [70, 82, 128],  cloudAlpha: 0.5 },
  { h: 4.5,  top: [22, 30, 66],    mid: [40, 46, 96],    bottom: [88, 78, 128],   night: 0.9, waterLight: 0.5,  cloud: [90, 92, 138],  cloudAlpha: 0.5 },
  { h: 5.8,  top: [116, 108, 172], mid: [176, 142, 186], bottom: [246, 190, 160], night: 0.3, waterLight: 0.72, cloud: [244, 206, 190], cloudAlpha: 0.7 },
  { h: 7.0,  top: [140, 178, 232], mid: [176, 208, 244], bottom: [252, 226, 190], night: 0,   waterLight: 0.9,  cloud: [255, 244, 236], cloudAlpha: 0.85 },
  { h: 10.0, top: [110, 176, 244], mid: [156, 206, 250], bottom: [214, 236, 252], night: 0,   waterLight: 1,    cloud: [255, 255, 255], cloudAlpha: 0.9 },
  { h: 15.0, top: [104, 170, 240], mid: [152, 202, 248], bottom: [210, 232, 250], night: 0,   waterLight: 1,    cloud: [255, 255, 255], cloudAlpha: 0.9 },
  { h: 17.2, top: [130, 160, 220], mid: [214, 186, 196], bottom: [252, 206, 156], night: 0,   waterLight: 0.9,  cloud: [255, 228, 204], cloudAlpha: 0.85 },
  { h: 18.3, top: [110, 110, 180], mid: [232, 146, 148], bottom: [255, 176, 122], night: 0.1, waterLight: 0.8,  cloud: [255, 196, 168], cloudAlpha: 0.8 },
  { h: 19.4, top: [52, 52, 110],   mid: [120, 86, 140],  bottom: [216, 120, 120], night: 0.55, waterLight: 0.6, cloud: [140, 110, 150], cloudAlpha: 0.6 },
  { h: 21.0, top: [18, 26, 62],    mid: [30, 40, 86],    bottom: [50, 62, 112],   night: 1,   waterLight: 0.45, cloud: [72, 84, 130],  cloudAlpha: 0.5 },
  { h: 24.0, top: [16, 24, 58],    mid: [28, 38, 82],    bottom: [46, 58, 108],   night: 1,   waterLight: 0.45, cloud: [70, 82, 128],  cloudAlpha: 0.5 },
];

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpRGB(out: RGB, a: RGB, b: RGB, t: number): RGB {
  out[0] = lerp(a[0], b[0], t);
  out[1] = lerp(a[1], b[1], t);
  out[2] = lerp(a[2], b[2], t);
  return out;
}

export function css(c: RGB, a = 1): string {
  return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** hour → 보간된 팔레트 (out 재사용으로 할당 최소화) */
export function samplePalette(hour: number, out: SkyPalette): SkyPalette {
  const h = ((hour % 24) + 24) % 24;
  let i = 0;
  while (i < KEYS.length - 2 && KEYS[i + 1].h <= h) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const t = smooth(Math.min(1, Math.max(0, (h - a.h) / (b.h - a.h))));
  lerpRGB(out.top, a.top, b.top, t);
  lerpRGB(out.mid, a.mid, b.mid, t);
  lerpRGB(out.bottom, a.bottom, b.bottom, t);
  lerpRGB(out.cloud, a.cloud, b.cloud, t);
  out.night = lerp(a.night, b.night, t);
  out.waterLight = lerp(a.waterLight, b.waterLight, t);
  out.cloudAlpha = lerp(a.cloudAlpha, b.cloudAlpha, t);
  return out;
}

export function makePalette(): SkyPalette {
  return { top: [0, 0, 0], mid: [0, 0, 0], bottom: [0, 0, 0], night: 0, waterLight: 1, cloud: [255, 255, 255], cloudAlpha: 1 };
}

// ---- 별 ----
export interface Star {
  x: number; // 0~1
  y: number; // 0~1 (하늘 영역 내)
  r: number;
  tw: number; // 반짝임 위상
}

export function makeStars(n: number, seed: number): Star[] {
  const rnd = mulberry(seed);
  const arr: Star[] = [];
  for (let i = 0; i < n; i++) {
    arr.push({ x: rnd(), y: rnd() * 0.85, r: 0.6 + rnd() * 1.1, tw: rnd() * Math.PI * 2 });
  }
  return arr;
}

// ---- 구름 ----
export interface Cloud {
  x: number;   // 0~1 (래핑)
  y: number;   // 0~1
  scale: number;
  speed: number;
}

export function makeClouds(): Cloud[] {
  return [
    { x: 0.15, y: 0.22, scale: 1.0, speed: 0.006 },
    { x: 0.58, y: 0.42, scale: 0.72, speed: 0.009 },
    { x: 0.86, y: 0.14, scale: 0.55, speed: 0.012 },
    // 수평선 근처의 먼 구름 — 원근감
    { x: 0.34, y: 0.78, scale: 0.4, speed: 0.004 },
    { x: 0.72, y: 0.85, scale: 0.32, speed: 0.003 },
  ];
}

/**
 * 2톤 소프트 구름 — 아래는 그늘(base), 위는 빛 받은 면(lite).
 * 납작한 타원 겹침으로 뭉게구름의 부피감 표현.
 */
export function drawCloud(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  base: string,
  lite: string,
): void {
  // 그늘진 밑면 (넓고 납작하게)
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.ellipse(cx - 22 * s, cy + 3 * s, 20 * s, 11 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 4 * s, cy + 5 * s, 26 * s, 12 * s, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + 28 * s, cy + 4 * s, 17 * s, 9 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // 빛 받은 봉우리
  ctx.fillStyle = lite;
  ctx.beginPath();
  ctx.ellipse(cx - 12 * s, cy - 6 * s, 15 * s, 10 * s, -0.1, 0, Math.PI * 2);
  ctx.ellipse(cx + 7 * s, cy - 9 * s, 17 * s, 12 * s, 0.08, 0, Math.PI * 2);
  ctx.ellipse(cx + 24 * s, cy - 3 * s, 12 * s, 8 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** 결정적 난수 */
export function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
