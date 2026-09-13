import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DayTide, Station, SunInfo, TideExtreme, WeatherInfo, WindInfo } from '../types';
import { getProvider, isLiveMode } from '../data/provider';
import { cloudCoverOf, pickHour, precipOf, weatherEmoji } from '../data/kmaWeather';
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
import { getBuoyObs } from '../data/khoaObs';
import type { BuoyObs } from '../data/khoaObs';
import { getBeachIndex, getFishingIndex, getMudflatIndex } from '../data/khoaIndices';
import type { BeachIndex, FishingIndex, MudflatIndex } from '../data/khoaIndices';
import SeaIndexCards from '../components/SeaIndexCards';
import { fmtDayLabel, fmtTime, hourFloat } from '../lib/format';
import { copyText } from '../lib/clipboard';
import { getAddress, getTourInfo } from '../data/stations';
import PlaceCard from '../components/PlaceCard';

const SLIDER_HOURS = 36;

function todayStart(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export default function DetailScreen({ station, onBack }: { station: Station; onBack: () => void }) {
  const [days, setDays] = useState<DayTide[] | null>(null);
  const [wind, setWind] = useState<WindInfo | null>(null);
  const [sun, setSun] = useState<SunInfo | null>(null);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [viewTime, setViewTime] = useState(() => new Date());
  const [isNow, setIsNow] = useState(true);
  const [alarmOpen, setAlarmOpen] = useState(false);
  const [alarmPick, setAlarmPick] = useState<TideExtreme | null>(null);
  const [fav, setFav] = useState(() => isFav(station.id));
  const [copied, setCopied] = useState(false);
  const [obs, setObs] = useState<BuoyObs | null>(null);
  const [indices, setIndices] = useState<{
    mud: MudflatIndex | null;
    beach: BeachIndex | null;
    fish: FishingIndex | null;
  }>({ mud: null, beach: null, fish: null });

  useEffect(() => {
    setFav(isFav(station.id));
  }, [station]);

  const feature = useMemo(() => getFeature(station), [station]);
  const tour = useMemo(() => getTourInfo(station), [station]);
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
    // 날씨는 씬 연출용 — 실패해도 화면은 뜨도록 따로 받는다
    setWeather(null);
    provider
      .getWeather(station, new Date())
      .then((wx) => {
        if (alive) setWeather(wx);
      })
      .catch(() => {});
    // 가까운 부이의 실측 파고·수온·바람 — 없으면 조용히 추정치 유지
    setObs(null);
    getBuoyObs(station)
      .then((o) => {
        if (alive) setObs(o);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [station]);

  // 바다 지수 (갯벌체험·해수욕·갯바위낚시) — 보고 있는 날짜 기준, 지점 성격에 맞는 것만
  const viewDayStr = days
    ? (days.find((d) => d.date.toDateString() === viewTime.toDateString()) ?? days[1] ?? days[0])
        .date.toDateString()
    : null;
  useEffect(() => {
    if (!viewDayStr) return;
    let alive = true;
    const d = new Date(viewDayStr);
    const wantMud = station.mudflat || feature.tags.includes('mudflat');
    const wantBeach =
      feature.tags.includes('beach') || /해수욕장|해변/.test(station.name);
    const wantFish = feature.tags.includes('fishing');
    Promise.all([
      wantMud ? getMudflatIndex(station, d) : Promise.resolve(null),
      wantBeach ? getBeachIndex(station, d) : Promise.resolve(null),
      wantFish ? getFishingIndex(station, d) : Promise.resolve(null),
    ]).then(([mud, beach, fish]) => {
      if (alive) setIndices({ mud, beach, fish });
    });
    return () => {
      alive = false;
    };
  }, [station, feature, viewDayStr]);

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

  // 이 바다의 공유 주소를 클립보드에 복사
  const copyLink = useCallback(async () => {
    const url = `${location.origin}${location.pathname}#sea/${encodeURIComponent(station.id)}`;
    await copyText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [station.id]);

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

  // 보고 있는 시각의 하늘 상태 — 씬 연출(흐림·비·눈)에 반영
  const hw = pickHour(weather, viewTime);
  const isNight = viewTime < viewSun.sunrise || viewTime > viewSun.sunset;
  const wxEmoji = weatherEmoji(hw, isNight);

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
          cloudCover={cloudCoverOf(hw)}
          precip={precipOf(hw)}
        />
        <div className="detail-topbar">
          <button className="icon-btn" onClick={onBack} aria-label="뒤로">
            ←
          </button>
          <span className="detail-station-name">{station.name}</span>
          <span className="topbar-actions">
            <button className="icon-btn" aria-label="주소 복사" onClick={() => void copyLink()}>
              {copied ? '✅' : '🔗'}
            </button>
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
        {copied && <div className="copy-toast">주소를 복사했어요 ✓</div>}
        <div className="scene-time-chip">
          {fmtDayLabel(viewTime, new Date())} {fmtTime(viewTime)}
          {wxEmoji ? ` ${wxEmoji}` : ''} · {dirText}
        </div>
      </div>

      <div className="detail-body">
        <SummaryCard summary={summary} address={getAddress(station)} />
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
        <SeaIndexCards mud={indices.mud} beach={indices.beach} fish={indices.fish} />
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
          obs={obs}
          showObs={isNow}
        />
        {tour && <div className="section-title place-title">이곳은 어떤 곳인가요</div>}
        <PlaceCard info={tour} name={station.name} />
      </div>

      {alarmOpen && (
        <AlarmSheet station={station} pick={alarmPick} onClose={() => setAlarmOpen(false)} />
      )}

      <div className="data-note">
        {isLiveMode()
          ? '국립해양조사원 조석예보 · 기상청 단기예보 기준'
          : '지금은 시뮬레이션 데이터예요. 실제 물때와 달라요!'}
      </div>
    </div>
  );
}
