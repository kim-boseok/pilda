import type { SunInfo, WindInfo } from '../types';
import { fmtTime } from '../lib/format';

interface Props {
  wind: WindInfo;
  sun: SunInfo;
  mulName: string;
  levelText: string;
}

export default function InfoCards({ wind, sun, mulName, levelText }: Props) {
  const windLevel = wind.speed < 4 ? '잔잔해요' : wind.speed < 9 ? '조금 불어요' : '강해요, 주의!';
  return (
    <div className="info-grid">
      <div className="info-card">
        <div className="k">바람</div>
        <div className="v">
          <span className="wind-arrow" style={{ transform: `rotate(${wind.direction + 180}deg)` }}>
            ↑
          </span>
          {wind.speed.toFixed(1)}
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-weak)' }}>m/s</span>
        </div>
        <div className="s">
          {wind.directionName} · {windLevel}
        </div>
      </div>
      <div className="info-card">
        <div className="k">물때</div>
        <div className="v">{mulName}</div>
        <div className="s">{levelText}</div>
      </div>
      <div className="info-card">
        <div className="k">일출</div>
        <div className="v">🌅 {fmtTime(sun.sunrise)}</div>
      </div>
      <div className="info-card">
        <div className="k">일몰</div>
        <div className="v">🌇 {fmtTime(sun.sunset)}</div>
      </div>
    </div>
  );
}
