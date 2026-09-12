import type { DayTide, SeaState, TideExtreme } from '../types';

const HALF_M2_MS = (12.4206 / 2) * 3_600_000;
const SLACK_WINDOW_MS = 15 * 60_000;

function sameLocalDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** 데이터 범위 밖일 때 반주기 미러링으로 가상 극값 생성 */
function mirror(from: TideExtreme, dir: -1 | 1, refLevel: number): TideExtreme {
  return {
    time: new Date(from.time.getTime() + dir * HALF_M2_MS),
    level: refLevel,
    type: from.type === 'high' ? 'low' : 'high',
  };
}

/**
 * 3일치 DayTide에서 time 시점의 바다 상태 계산.
 * 표준 코사인 보간: level = h1 + (h2-h1)·(1-cos(π·x))/2, x=(t-t1)/(t2-t1)
 */
export function getSeaState(days: DayTide[], time: Date): SeaState {
  const all: TideExtreme[] = days
    .flatMap((d) => d.extremes)
    .slice()
    .sort((a, b) => a.time.getTime() - b.time.getTime());

  if (all.length === 0) {
    throw new Error('getSeaState: extremes가 비어 있습니다');
  }

  const t = time.getTime();
  let prev: TideExtreme | null = null;
  let next: TideExtreme | null = null;
  for (const e of all) {
    if (e.time.getTime() <= t) prev = e;
    else {
      next = e;
      break;
    }
  }
  // 경계 밖 극값 보정 (3일치를 넘는 시각 요청 시)
  if (!prev && next) {
    const avgOpp = averageLevel(all, next.type === 'high' ? 'low' : 'high');
    prev = mirror(next, -1, avgOpp);
  }
  if (!next && prev) {
    const avgOpp = averageLevel(all, prev.type === 'high' ? 'low' : 'high');
    next = mirror(prev, 1, avgOpp);
  }
  if (!prev || !next) throw new Error('getSeaState: 극값 탐색 실패');

  const t1 = prev.time.getTime();
  const t2 = next.time.getTime();
  const span = Math.max(t2 - t1, 60_000);
  const x = Math.min(1, Math.max(0, (t - t1) / span));

  const h1 = prev.level;
  const h2 = next.level;
  const level = h1 + ((h2 - h1) * (1 - Math.cos(Math.PI * x))) / 2;

  // 보간 함수의 시간 미분 (cm/h)
  const spanH = span / 3_600_000;
  const rate = ((h2 - h1) * Math.PI * Math.sin(Math.PI * x)) / (2 * spanH);

  const nearExtreme =
    t - t1 <= SLACK_WINDOW_MS || t2 - t <= SLACK_WINDOW_MS;
  const direction: SeaState['direction'] = nearExtreme
    ? 'slack'
    : next.type === 'high'
      ? 'rising'
      : 'falling';

  // ratio: '오늘' extremes 기준 정규화
  const today =
    days.find((d) => sameLocalDate(d.date, time)) ??
    days[Math.min(1, days.length - 1)];
  const lows = today.extremes.filter((e) => e.type === 'low').map((e) => e.level);
  const highs = today.extremes.filter((e) => e.type === 'high').map((e) => e.level);
  const lo = lows.length ? Math.min(...lows) : Math.min(...today.extremes.map((e) => e.level));
  const hi = highs.length ? Math.max(...highs) : Math.max(...today.extremes.map((e) => e.level));
  const range = hi - lo;
  const ratio = range > 0 ? Math.min(1, Math.max(0, (level - lo) / range)) : 0.5;

  return {
    time,
    level: Math.round(level * 10) / 10,
    ratio,
    direction,
    rate: Math.round(rate * 10) / 10,
    prev,
    next,
  };
}

function averageLevel(all: TideExtreme[], type: 'high' | 'low'): number {
  const xs = all.filter((e) => e.type === type);
  if (xs.length === 0) return all[0].level;
  return xs.reduce((s, e) => s + e.level, 0) / xs.length;
}
