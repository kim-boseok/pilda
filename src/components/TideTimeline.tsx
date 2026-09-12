import type { TideExtreme } from '../types';
import { fmtDayLabel, fmtTime } from '../lib/format';

interface Props {
  extremes: TideExtreme[];
  viewTime: Date;
  nextTime: Date;
  /** 당일·내일 만조/간조에 바로 알림 예약 */
  onAlarm?: (e: TideExtreme) => void;
}

export default function TideTimeline({ extremes, viewTime, nextTime, onAlarm }: Props) {
  return (
    <div className="card">
      <div className="slider-title" style={{ marginBottom: 8 }}>
        만조 · 간조
      </div>
      <div className="tide-rows">
        {extremes.map((e) => {
          const past = e.time.getTime() < viewTime.getTime();
          const isNext = e.time.getTime() === nextTime.getTime();
          const canAlarm = !!onAlarm && e.time.getTime() > Date.now();
          return (
            <div key={e.time.getTime()} className={`tide-row${past ? ' past' : ''}`}>
              <div className={`tide-icon ${e.type}`}>{e.type === 'high' ? '🌊' : '🏖️'}</div>
              <div className="tide-label">
                <b>
                  {e.type === 'high' ? '만조' : '간조'}
                  {isNext && <span className="tide-next-chip">다음</span>}
                </b>
                <span>
                  {e.type === 'high' ? '물이 가장 높아요' : '물이 가장 낮아요'} · {e.level}cm
                </span>
              </div>
              <div className="tide-time">
                {fmtDayLabel(e.time, viewTime) !== '오늘' && (
                  <span style={{ fontSize: 12, color: 'var(--text-weak)', marginRight: 4 }}>
                    {fmtDayLabel(e.time, viewTime)}
                  </span>
                )}
                {fmtTime(e.time)}
              </div>
              {canAlarm && (
                <button
                  className="tide-alarm-btn"
                  aria-label="이 시간 알림 예약"
                  onClick={() => onAlarm(e)}
                >
                  🔔
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
