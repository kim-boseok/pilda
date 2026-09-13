// 물 표면 — 다층 사인파 + 지역별 색/수위 범위
import type { RGB } from './sky.ts';

export interface WaveLayer {
  amp: number;      // 기본 진폭(px)
  len: number;      // 파장(px)
  speed: number;    // rad/s
  alpha: number;
  lift: number;     // 물가선 위로 띄우는 오프셋(px)
}

export interface RegionStyle {
  deep: RGB;
  shallow: RGB;
  /** 물가선 y (씬 높이 비율) — 간조 때(멀리 후퇴) / 만조 때(앞까지 참) */
  edgeLow: number;
  edgeHigh: number;
  layers: WaveLayer[];
  foam: boolean;      // 해변 부서지는 거품 라인 (동해)
  sandTop: RGB;       // 드러나는 바닥 색 (모래/펄)
  sandBottom: RGB;
}

export const REGION: Record<'west' | 'south' | 'east', RegionStyle> = {
  west: {
    deep: [44, 118, 178],
    shallow: [138, 198, 216],
    edgeLow: 0.46,
    edgeHigh: 0.88,
    layers: [
      { amp: 5, len: 340, speed: 0.55, alpha: 0.35, lift: 26 },
      { amp: 7, len: 220, speed: 0.8, alpha: 0.45, lift: 13 },
      { amp: 9, len: 150, speed: 1.1, alpha: 1, lift: 0 },
    ],
    foam: false,
    sandTop: [150, 116, 92],
    sandBottom: [104, 76, 58],
  },
  south: {
    deep: [20, 148, 160],
    shallow: [118, 216, 202],
    edgeLow: 0.54,
    edgeHigh: 0.84,
    layers: [
      { amp: 4, len: 380, speed: 0.45, alpha: 0.35, lift: 22 },
      { amp: 5, len: 240, speed: 0.7, alpha: 0.45, lift: 11 },
      { amp: 6, len: 170, speed: 0.95, alpha: 1, lift: 0 },
    ],
    foam: false,
    sandTop: [214, 190, 152],
    sandBottom: [188, 160, 122],
  },
  east: {
    deep: [10, 96, 190],
    shallow: [76, 186, 214],
    edgeLow: 0.66,
    edgeHigh: 0.8,
    layers: [
      { amp: 5, len: 300, speed: 0.7, alpha: 0.35, lift: 24 },
      { amp: 7, len: 200, speed: 1.0, alpha: 0.45, lift: 12 },
      { amp: 9, len: 140, speed: 1.35, alpha: 1, lift: 0 },
    ],
    foam: true,
    sandTop: [232, 212, 176],
    sandBottom: [206, 182, 144],
  },
};

/**
 * 사인파 표면 y — traceWave/거품 라인이 공유.
 * 가로로 흐르지 않고 제자리에서 세로로만 출렁인다:
 * 파형은 숨쉬듯 커졌다 작아지고, 층 전체가 밀려왔다 물러난다.
 */
export function waveY(
  x: number,
  edgeY: number,
  layer: WaveLayer,
  t: number,
  windK: number,
  dirSign: number,
): number {
  const amp = layer.amp * windK;
  const k = (Math.PI * 2) / layer.len;
  const breathe = 0.72 + 0.28 * Math.sin(t * layer.speed * windK);
  // 층 전체의 상하 서지 — 물이 들어왔다 나가는 호흡 (slack일수록 잔잔)
  const surge = Math.sin(t * layer.speed * 0.6 * windK + layer.len * 0.013) * amp * 0.9 * (0.5 + 0.5 * Math.abs(dirSign));
  return (
    edgeY - layer.lift + surge +
    Math.sin(x * k + layer.len) * amp * breathe +
    Math.sin(x * k * 0.37 + 1.7) * amp * 0.45 * breathe
  );
}

/**
 * 한 겹의 물 표면 경로 (상단 사인파, 아래로 bottom까지 채움).
 * dirSign으로 파 진행 방향(밀물/썰물 느낌) 표현.
 */
export function traceWave(
  ctx: CanvasRenderingContext2D,
  w: number,
  bottom: number,
  edgeY: number,
  layer: WaveLayer,
  t: number,
  windK: number,
  dirSign: number,
): void {
  const step = Math.max(8, w / 60);
  ctx.beginPath();
  ctx.moveTo(0, bottom);
  ctx.lineTo(0, waveY(0, edgeY, layer, t, windK, dirSign));
  for (let x = step; x <= w + step; x += step) {
    ctx.lineTo(x, waveY(x, edgeY, layer, t, windK, dirSign));
  }
  ctx.lineTo(w, bottom);
  ctx.closePath();
}
