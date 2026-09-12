// 활동별 골든타임 계산 — 조개캐기(갯벌), 낚시, 물놀이
// 규칙은 보수적으로: 확실한 물때 원리(간조 전후 갯벌, 들물 낚시, 만조 물놀이)만 사용
import type { DayTide, Station, SunInfo, TideExtreme } from '../types';
import type { FeatureTag } from '../data/features';

const H = 3_600_000;
const MIN = 60_000;

export interface GoldenWindow {
  start: Date;
  end: Date;
  /** 알림 예약에 연결할 만조/간조 이벤트 (해 기준 창은 없음) */
  extreme?: TideExtreme;
}

export interface GoldenActivity {
  key: 'mudflat' | 'fishing' | 'swim';
  icon: string;
  label: string;
  tip: string;
  windows: GoldenWindow[];
  /** 동해 물놀이처럼 시간대 무관 */
  allDay?: boolean;
}

function win(e: TideExtreme, beforeH: number, afterH: number): GoldenWindow {
  return {
    start: new Date(e.time.getTime() - beforeH * H),
    end: new Date(e.time.getTime() + afterH * H),
    extreme: e,
  };
}

/** 만조/간조 시각 자체가 낮 시간(일출~일몰+30분)인지 — 초보자에게 야간 갯벌·물놀이는 권하지 않음 */
function extremeInDaylight(e: TideExtreme, sun: SunInfo): boolean {
  const t = e.time.getTime();
  return t >= sun.sunrise.getTime() && t <= sun.sunset.getTime() + 30 * MIN;
}

/**
 * 해당 날짜의 활동별 추천 시간대.
 * - 조개캐기: 간조 2시간 전 ~ 1시간 후 (낮 시간대만)
 * - 낚시: 만조 2시간 전 ~ 1시간 후 (들물) · 동해는 해뜰녘·해질녘
 * - 물놀이: 만조 ±1.5시간 (낮, beach 태그 지점) · 동해는 종일
 */
export function getGoldenActivities(
  day: DayTide,
  station: Station,
  tags: FeatureTag[],
  sun: SunInfo,
): GoldenActivity[] {
  const out: GoldenActivity[] = [];
  const lows = day.extremes.filter((e) => e.type === 'low');
  const highs = day.extremes.filter((e) => e.type === 'high');

  // ── 조개캐기·갯벌체험 ──
  if (station.mudflat) {
    const ws = lows.filter((e) => extremeInDaylight(e, sun)).map((e) => win(e, 2, 1));
    if (ws.length) {
      out.push({
        key: 'mudflat',
        icon: '🦀',
        label: '조개캐기·갯벌체험',
        tip: '간조 2시간 전부터 최적 · 물이 들어오기 시작하면 바로 나오세요',
        windows: ws,
      });
    }
  }

  // ── 낚시 ──
  if (station.region === 'east') {
    out.push({
      key: 'fishing',
      icon: '🎣',
      label: '낚시',
      tip: '동해는 물때 영향이 작아요 · 해 뜰 무렵과 해 질 무렵이 좋아요',
      windows: [
        { start: new Date(sun.sunrise.getTime() - H), end: new Date(sun.sunrise.getTime() + H) },
        { start: new Date(sun.sunset.getTime() - H), end: new Date(sun.sunset.getTime() + H) },
      ],
    });
  } else if (highs.length) {
    out.push({
      key: 'fishing',
      icon: '🎣',
      label: '낚시 (들물)',
      tip: '들물에 물고기가 따라 들어와 입질이 활발해요',
      windows: highs.map((e) => win(e, 2, 1)),
    });
  }

  // ── 물놀이 (해수욕장 지점) ──
  if (tags.includes('beach')) {
    if (station.region === 'east') {
      out.push({
        key: 'swim',
        icon: '🏖️',
        label: '물놀이',
        tip: '동해는 종일 수위가 비슷해 아무 때나 좋아요',
        windows: [],
        allDay: true,
      });
    } else {
      const ws = highs.filter((e) => extremeInDaylight(e, sun)).map((e) => win(e, 1.5, 1.5));
      if (ws.length) {
        out.push({
          key: 'swim',
          icon: '🏖️',
          label: '물놀이',
          tip: '물이 넉넉하게 들어왔을 때가 안전하고 좋아요',
          windows: ws,
        });
      }
    }
  }

  return out;
}

/** 물때 크기에 따른 갯벌 한 줄 안내 (사리권=넓게 열림, 조금권=좁게 열림) */
export function mulHint(day: DayTide, station: Station): string | null {
  if (!station.mudflat) return null;
  if (day.mul >= 6 && day.mul <= 8) {
    return `오늘은 ${day.mulName} — 물이 크게 빠져 갯벌이 넓게 열려요 🌊`;
  }
  if (day.mul >= 13 || day.mul <= 1) {
    return `오늘은 ${day.mulName} — 물이 적게 빠져 갯벌이 평소보다 좁게 열려요`;
  }
  return null;
}
