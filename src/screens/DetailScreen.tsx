import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DayTide, Station, SunInfo, TideExtreme, WindInfo } from '../types';
import { getProvider, isLiveMode } from '../data/provider';
import { getSeaState } from '../engine/tide';
import { getSummary } from '../engine/summary';
import SeaScene from '../scenes/SeaScene';
import SummaryCard from '../components/SummaryCard';
import TimeSlider from '../components/TimeSlider';
import TideTimeline from '../components/TideTimeline';
import GoldenTimes from '../components/GoldenTimes';
import InfoCards from '../components/InfoCards';
import WeekView from '../components/WeekView';
import AlarmSheet from '../components/AlarmSheet';
import { isFav, toggleFav } from '../lib/favorites';
import { TAG_INFO, getFeature, speciesIcon } from '../data/features';
import { fmtDayLabel, fmtTime, hourFloat } from '../lib/format';

const SLIDER_HOURS = 36;

function todayStart(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export default function DetailScreen({ station, onBack }: { station: Station; onBack: () => void }) {
  const [days, setDays] = useState<DayTide[] | null>(null);
  const [wind, setWind] = useState<WindInfo | null>(null);
  const [sun, setSun] = useState<SunInfo | null>(null);
  const [viewTime, setViewTime] = useState(() => new Date());
  const [isNow, setIsNow] = useState(true);
  const [alarmOpen, setAlarmOpen] = useState(false);
  const [alarmPick, setAlarmPick] = useState<TideExtreme | null>(null);
  const [fav, setFav] = useState(() => isFav(station.id));

  useEffect(() => {
    setFav(isFav(station.id));
  }, [station]);

  const feature = useMemo(() => getFeature(station), [station]);
  const start = useMemo(todayStart, []);
  const isNowRef = useRef(isNow);
  isNowRef.current = isNow;

  useEffect(() => {
    let alive = true;
    const provider = getProvider();
    setDays(null);
    Promise.all([
      provider.getTides(station.id, new Date()),
      provider.getWind(station.id, new Date()),
    ]).then(([d, w]) => {
      if (!alive) return;
      setDays(d);
      setWind(w);
      setSun(provider.getSun(station, new Date()));
    });
    return () => {
      alive = false;
    };
  }, [station]);

  useEffect(() => {
    const t = setInterval(() => {
      if (isNowRef.current) setViewTime(new Date());
    }, 30000);
    return () => clearInterval(t);
  }, []);

  const onSlide = useCallback((d: Date) => {
    setViewTime(d);
    setIsNow(Math.abs(d.getTime() - Date.now()) < 5 * 60000);
  }, []);

  const goNow = useCallback(() => {
    setViewTime(new Date());
    setIsNow(true);
  }, []);

  if (!days || !wind || !sun) {
    return (
      <div className="loading-wrap">
        <div className="loading-wave">🌊</div>
      </div>
    );
  }

  const state = getSeaState(days, viewTime);
  const viewDay =
    days.find((d) => d.date.toDateString() === viewTime.toDateString()) ?? days[1] ?? days[0];
  const summary = getSummary(state, station, viewDay);
  // 골든타임은 보고 있는 날짜 기준의 일출·일몰로 계산
  const viewSun = getProvider().getSun(station, viewDay.date);

  const rangeEnd = start.getTime() + SLIDER_HOURS * 3600000;
  const visibleExtremes = days
    .flatMap((d) => d.extremes)
    .filter((e) => e.time.getTime() >= start.getTime() && e.time.getTime() <= rangeEnd);

  const dirText =
    state.direction === 'rising' ? '물이 들어오는 중' : state.direction === 'falling' ? '물이 빠지는 중' : '물이 잠시 멈춘 정조';

  return (
    <div className="screen">
      <div className="detail-scene">
        <SeaScene
          ratio={state.ratio}
          direction={state.direction}
          region={station.region}
          mudflat={station.mudflat}
          windSpeed={wind.speed}
          hour={hourFloat(viewTime)}
          species={feature.species}
        />
        <div className="detail-topbar">
          <button className="icon-btn" onClick={onBack} aria-label="뒤로">
            ←
          </button>
          <span className="detail-station-name">{station.name}</span>
          <span className="topbar-actions">
            <button
              className={`icon-btn${fav ? ' fav-on' : ''}`}
              aria-label="즐겨찾기"
              onClick={() => setFav(toggleFav(station.id))}
            >
              {fav ? '★' : '☆'}
            </button>
            <button
              className="icon-btn"
              aria-label="물때 알림"
              onClick={() => {
                setAlarmPick(null);
                setAlarmOpen(true);
              }}
            >
              🔔
            </button>
          </span>
        </div>
        <div className="scene-time-chip">
          {fmtDayLabel(viewTime, new Date())} {fmtTime(viewTime)} · {dirText}
        </div>
      </div>

      <div className="detail-body">
        <SummaryCard summary={summary} />
        {/* 시간 여행은 바다 씬 변화를 보면서 조작해야 하므로 화면 상단(씬 바로 아래)에 배치 */}
        <TimeSlider
          start={start}
          totalMinutes={SLIDER_HOURS * 60}
          value={viewTime}
          isNow={isNow}
          onChange={onSlide}
          onNow={goNow}
        />
        <div className="sea-tags">
          {feature.tags.map((t) => (
            <span key={t} className="sea-tag">
              {TAG_INFO[t].icon} {TAG_INFO[t].label}
            </span>
          ))}
          {feature.species
            .filter((sp) => sp !== '조개')
            .map((sp) => (
              <span key={sp} className="sea-tag species">
                {speciesIcon(sp)} {sp} 서식
              </span>
            ))}
        </div>
        <GoldenTimes
          day={viewDay}
          station={station}
          tags={feature.tags}
          sun={viewSun}
          viewTime={viewTime}
          onPick={(e) => {
            setAlarmPick(e);
            setAlarmOpen(true);
          }}
        />
        <TideTimeline
          extremes={visibleExtremes}
          viewTime={viewTime}
          nextTime={state.next.time}
          onAlarm={(e) => {
            setAlarmPick(e);
            setAlarmOpen(true);
          }}
        />
        <WeekView
          station={station}
          onPick={(e) => {
            setAlarmPick(e);
            setAlarmOpen(true);
          }}
        />
        <InfoCards
          wind={wind}
          sun={sun}
          mulName={viewDay.mulName}
          levelText={`현재 수위 ${Math.round(state.level)}cm`}
        />
      </div>

      {alarmOpen && (
        <AlarmSheet station={station} pick={alarmPick} onClose={() => setAlarmOpen(false)} />
      )}

      <div className="data-note">
        {isLiveMode()
          ? '국립해양조사원 조석예보 기준'
          : '지금은 시뮬레이션 데이터예요. 실제 물때와 달라요!'}
      </div>
    </div>
  );
}
