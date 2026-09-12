import type { DayTide, Station, SunInfo, TideExtreme } from '../types';
import type { FeatureTag } from '../data/features';
import { getGoldenActivities, mulHint } from '../engine/goldenTime';
import { fmtDayLabel, fmtTime } from '../lib/format';

interface Props {
  day: DayTide;
  station: Station;
  tags: FeatureTag[];
  sun: SunInfo;
  viewTime: Date;
  /** 시간대의 만조/간조에 알림 예약 */
  onPick: (e: TideExtreme) => void;
}

export default function GoldenTimes({ day, station, tags, sun, viewTime, onPick }: Props) {
  const acts = getGoldenActivities(day, station, tags, sun);
  if (acts.length === 0) return null;

  const hint = mulHint(day, station);
  const dayLabel = fmtDayLabel(day.date, new Date());
  const t = viewTime.getTime();

  return (
    <div className="card">
      <div className="slider-title" style={{ marginBottom: 8 }}>
        ⏰ {dayLabel === '오늘' ? '오늘의' : `${dayLabel}의`} 골든타임
      </div>
      <div className="golden-rows">
        {acts.map((a) => (
          <div key={a.key} className="golden-row">
            <div className="golden-icon">{a.icon}</div>
            <div className="golden-info">
              <b>{a.label}</b>
              <span>{a.tip}</span>
              <div className="golden-chips">
                {a.allDay && <span className="golden-chip active">종일 OK</span>}
                {a.windows.map((w) => {
                  const active = t >= w.start.getTime() && t <= w.end.getTime();
                  const past = w.end.getTime() < t;
                  const canAlarm = !!w.extreme && w.extreme.time.getTime() > Date.now();
                  const cls = `golden-chip${active ? ' active' : ''}${past ? ' past' : ''}`;
                  const text = `${fmtTime(w.start)}~${fmtTime(w.end)}`;
                  return canAlarm ? (
                    <button
                      key={w.start.toISOString()}
                      className={cls}
                      onClick={() => onPick(w.extreme!)}
                      aria-label={`${a.label} ${text} 알림 예약`}
                    >
                      {text} 🔔
                    </button>
                  ) : (
                    <span key={w.start.toISOString()} className={cls}>
                      {text}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
      {hint && <p className="golden-hint">{hint}</p>}
    </div>
  );
}
