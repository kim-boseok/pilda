import { useEffect, useState } from 'react';
import type { Station } from './types';
import { STATIONS } from './data/stations';
import HomeScreen from './screens/HomeScreen';
import DetailScreen from './screens/DetailScreen';
import AdminScreen from './screens/AdminScreen';
import GamesScreen from './screens/GamesScreen';
import SafetyNotice from './components/SafetyNotice';
import { alarmText, checkAlarms } from './lib/alarms';

const LAST_KEY = 'pilda_last_station';

export default function App() {
  const [hash, setHash] = useState(() => location.hash);
  const [station, setStation] = useState<Station | null>(() => {
    const id = localStorage.getItem(LAST_KEY);
    return STATIONS.find((s) => s.id === id) ?? null;
  });

  useEffect(() => {
    if (station) localStorage.setItem(LAST_KEY, station.id);
  }, [station]);

  const [toasts, setToasts] = useState<string[]>([]);
  const [tab, setTab] = useState<'sea' | 'games'>('sea');

  // 예약된 물때 알림 체커 — 앱이 열려 있는 동안 20초마다 확인
  useEffect(() => {
    const run = () => {
      const fired = checkAlarms();
      if (fired.length === 0) return;
      const msgs = fired.map(alarmText);
      setToasts((t) => [...t, ...msgs]);
      setTimeout(() => setToasts((t) => t.filter((m) => !msgs.includes(m))), 8000);
    };
    run();
    const t = setInterval(run, 20000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onPop = () => setStation(null);
    const onHash = () => setHash(location.hash);
    window.addEventListener('popstate', onPop);
    window.addEventListener('hashchange', onHash);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('hashchange', onHash);
    };
  }, []);

  const select = (s: Station) => {
    history.pushState({ station: s.id }, '');
    setStation(s);
  };

  // 숨은 관리자 페이지: URL 뒤에 #admin 을 붙여야만 접근 가능
  // 하단 탭바는 홈/게임 화면에서만 보인다 (상세·관리자 화면에서는 숨김)
  const showTabbar = hash !== '#admin' && !station;
  const screen =
    hash === '#admin' ? (
      <AdminScreen
        onBack={() => {
          location.hash = '';
        }}
      />
    ) : station ? (
      <DetailScreen station={station} onBack={() => setStation(null)} />
    ) : tab === 'games' ? (
      <GamesScreen />
    ) : (
      <HomeScreen onSelect={select} />
    );

  return (
    <>
      {screen}
      {showTabbar && (
        <nav className="tabbar" aria-label="메인 메뉴">
          <button
            className={tab === 'sea' ? 'active' : ''}
            onClick={() => setTab('sea')}
            aria-current={tab === 'sea' ? 'page' : undefined}
          >
            <span className="tab-icon" aria-hidden="true">
              🌊
            </span>
            바다
          </button>
          <button
            className={tab === 'games' ? 'active' : ''}
            onClick={() => setTab('games')}
            aria-current={tab === 'games' ? 'page' : undefined}
          >
            <span className="tab-icon" aria-hidden="true">
              🎮
            </span>
            게임
          </button>
        </nav>
      )}
      <SafetyNotice />
      {toasts.length > 0 && (
        <div className="toast-wrap">
          {toasts.map((m) => (
            <div key={m} className="toast">
              🔔 {m}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
