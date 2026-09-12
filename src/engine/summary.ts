import type { DayTide, SeaState, SeaSummary, Station } from '../types';

function fmt(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 특정 시각의 상태를 일반인용 한줄 요약으로 변환 */
export function getSummary(state: SeaState, station: Station, day: DayTide): SeaSummary {
  const { ratio, direction, next } = state;
  const nextLabel = next.type === 'high' ? '만조' : '간조';
  const nextTime = fmt(next.time);

  const detailParts: string[] = [];
  let headline: string;
  let tags: string[];

  // ── 동해: 조차가 작아 갯벌 개념 없음 ──
  if (station.region === 'east') {
    if (ratio > 0.75) {
      headline = '동해 바다가 잔잔히 차올랐어요 🌊';
    } else {
      headline = '동해는 늘 물이 있어요. 지금 파도 보기 좋아요 🌊';
    }
    tags = ['파도멍', '해변산책', '물놀이'];
    detailParts.push(`동해는 조차가 작아 하루 종일 바다를 즐길 수 있어요`);
    detailParts.push(`다음 ${nextLabel} ${nextTime}`);
    return { headline, detail: detailParts.join(' · '), tags };
  }

  // ── 정조(고·저조 전후 15분) ──
  if (direction === 'slack') {
    if (ratio < 0.35) {
      headline = station.mudflat
        ? '지금이 간조! 갯벌이 활짝 열렸어요 🦀'
        : '지금이 간조예요. 물이 가장 낮아요';
      tags = station.mudflat ? ['갯벌체험', '조개잡이', '바다산책'] : ['바다산책', '낚시'];
      detailParts.push(
        next.type === 'high'
          ? `곧 물이 들어와요 · 만조 ${nextTime}`
          : `간조 ${nextTime}`,
      );
    } else if (ratio > 0.65) {
      headline = '지금이 만조! 물이 가득 찬 바다예요 🌊';
      tags = ['물멍', '바다뷰', '물놀이'];
      detailParts.push(`${nextTime}까지 천천히 물이 빠져요`);
    } else {
      headline = '물이 잠시 멈춘 정조 시간이에요';
      tags = ['바다산책', '물멍'];
      detailParts.push(`다음 ${nextLabel} ${nextTime}`);
    }
    if (station.mudflat && next.type === 'high' && ratio < 0.5) {
      detailParts.push('곧 물이 들어오니 갯벌에서는 시간을 꼭 확인하세요 ⚠️');
    }
    return { headline, detail: detailParts.join(' · '), tags };
  }

  // ── 갯벌 지점 + 물 빠짐 + 낮은 수위 → 갯벌체험 최적 ──
  if (station.mudflat && ratio < 0.35 && direction === 'falling') {
    headline = '지금 갯벌체험 딱 좋아요 🦀';
    tags = ['갯벌체험', '조개잡이'];
    detailParts.push(`${nextTime}까지 물이 계속 빠져요`);
    detailParts.push(`오늘은 ${day.mulName}이에요`);
    return { headline, detail: detailParts.join(' · '), tags };
  }

  // ── 만수위 ──
  if (ratio > 0.75) {
    headline = '물이 가득 찬 바다예요 🌊';
    tags = ['물멍', '바다뷰', '물놀이'];
    detailParts.push(
      direction === 'rising'
        ? `${nextTime}에 가장 높아요`
        : `${nextTime}까지 물이 빠져요`,
    );
    return { headline, detail: detailParts.join(' · '), tags };
  }

  // ── 들물 중간 구간 ──
  if (direction === 'rising' && ratio >= 0.4 && ratio <= 0.7) {
    headline = `물이 들어오고 있어요. ${nextTime}에 가장 높아요`;
    tags = ['바다뷰', '물놀이 준비'];
    if (station.mudflat) {
      detailParts.push('물이 들어오니 갯벌에서 나와야 해요 ⚠️');
    }
    detailParts.push(`만조 ${nextTime}`);
    return { headline, detail: detailParts.join(' · '), tags };
  }

  // ── 들물 초반 (아직 낮은 수위) ──
  if (direction === 'rising') {
    headline = '물이 슬슬 들어오기 시작했어요';
    tags = station.mudflat ? ['갯벌 마무리', '바다산책'] : ['바다산책'];
    if (station.mudflat) {
      detailParts.push('물이 들어오니 갯벌에서 나와야 해요 ⚠️');
    }
    detailParts.push(`만조 ${nextTime}`);
    return { headline, detail: detailParts.join(' · '), tags };
  }

  // ── 날물 (falling) ──
  if (ratio < 0.4) {
    headline = station.mudflat
      ? `물이 빠지고 있어요. 곧 갯벌이 열려요 🐚`
      : `물이 빠지고 있어요. ${nextTime}에 가장 낮아요`;
    tags = station.mudflat ? ['갯벌체험 준비', '조개잡이'] : ['바다산책', '낚시'];
  } else {
    headline = `물이 빠지는 중이에요. ${nextTime}에 가장 낮아요`;
    tags = ['바다산책', '노을'];
  }
  detailParts.push(`간조 ${nextTime}`);
  detailParts.push(`오늘은 ${day.mulName}이에요`);
  return { headline, detail: detailParts.join(' · '), tags };
}
