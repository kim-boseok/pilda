import type { SunInfo, WindInfo } from '../types';
import type { BuoyObs } from '../data/khoaObs';
import { fmtTime } from '../lib/format';

interface Props {
  wind: WindInfo;
  sun: SunInfo;
  mulName: string;
  levelText: string;
  /** 가까운 부이의 실측값 (없으면 null) */
  obs?: BuoyObs | null;
  /** '지금'을 보고 있을 때만 실측을 보여준다 (과거·미래 시간여행 중엔 추정치) */
  showObs?: boolean;
}

export default function InfoCards({ wind, sun, mulName, levelText, obs, showObs }: Props) {
  const live = !!showObs && !!obs;
  // 풍속·풍향: 실측이 있으면 실측 우선
  const ws = live && obs!.windSpeed !== null ? obs!.windSpeed : wind.speed;
  const wd = live && obs!.windDir !== null ? obs!.windDir : wind.direction;
  const windMeasured = live && obs!.windSpeed !== null;

  const windLevel = ws < 4 ? '잔잔해요' : ws < 9 ? '조금 불어요' : '강해요, 주의!';
  // 파고: 실측이 있으면 실측, 없으면 바람 기준 추정 (씬의 파도 높이와 같은 공식)
  const waveMeasured = live && obs!.waveHeight !== null;
  const waveH = waveMeasured ? obs!.waveHeight! : Math.min(3, 0.2 + ws * ws * 0.012);
  const waveText =
    waveH < 0.5 ? '잔잔한 물결' : waveH < 1 ? '나지막한 파도' : waveH < 2 ? '제법 이는 파도' : '높은 파도, 주의!';

  return (
    <div className="info-grid">
      <div className="info-card">
        <div className="k">바람 · 파도{windMeasured || waveMeasured ? ' · 실측' : ''}</div>
        <div className="v">
          <span className="wind-arrow" style={{ transform: `rotate(${wd + 180}deg)` }}>
            ↑
          </span>
          {ws.toFixed(1)}
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-weak)' }}>m/s</span>
        </div>
        <div className="s">
          {wind.directionName} · {windLevel}
        </div>
        <div className="s">
          🌊 {waveMeasured ? '' : '약 '}
          {waveH.toFixed(1)}m · {waveText}
        </div>
        {live && obs!.waterTemp !== null && (
          <div className="s">🌡️ 수온 {obs!.waterTemp.toFixed(1)}℃</div>
        )}
        {live && (
          <div className="s obs-src">
            {obs!.buoyName} 부이 {fmtTime(obs!.time)} 관측
          </div>
        )}
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
