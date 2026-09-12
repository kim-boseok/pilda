import { useMemo } from 'react';
import { fmtDayLabel, fmtTime } from '../lib/format';

interface Props {
  /** 슬라이더 시작 시각 (오늘 00:00) */
  start: Date;
  /** 전체 범위 (분) */
  totalMinutes: number;
  /** 현재 선택된 시각 */
  value: Date;
  isNow: boolean;
  onChange: (d: Date) => void;
  onNow: () => void;
}

export default function TimeSlider({ start, totalMinutes, value, isNow, onChange, onNow }: Props) {
  const minutes = Math.round((value.getTime() - start.getTime()) / 60000);
  const pct = (minutes / totalMinutes) * 100;
  const now = useMemo(() => new Date(), []);

  return (
    <div className="card">
      <div className="slider-head">
        <span className="slider-title">시간 여행 ⏱️</span>
        {!isNow && (
          <button className="now-btn" onClick={onNow}>
            지금으로
          </button>
        )}
      </div>
      <div className="slider-time">
        <small>{fmtDayLabel(value, now)}</small>
        {fmtTime(value)}
        {isNow && <small style={{ marginLeft: 8, color: 'var(--good)' }}>● 실시간</small>}
      </div>
      <input
        type="range"
        className="time-range"
        min={0}
        max={totalMinutes}
        step={10}
        value={minutes}
        style={{ ['--fill' as string]: `${pct}%` }}
        onChange={(e) => onChange(new Date(start.getTime() + Number(e.target.value) * 60000))}
      />
      <div className="slider-scale">
        <span>오늘 0시</span>
        <span>12시</span>
        <span>내일 0시</span>
        <span>12시</span>
      </div>
    </div>
  );
}
