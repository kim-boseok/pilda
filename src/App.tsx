import { useEffect, useState } from 'react';
import type { Station } from './types';
import HomeScreen from './screens/HomeScreen';
import DetailScreen from './screens/DetailScreen';
import AdminScreen from './screens/AdminScreen';
import GamesScreen from './screens/GamesScreen';
import MyScreen from './screens/MyScreen';
import SafetyNotice from './components/SafetyNotice';
import { alarmText, checkAlarms } from './lib/alarms';
import { findStation } from './data/stations';

/** 공유 주소(#sea/지점ID)에서 지점 찾기 */
function stationFromHash(): Station | null {
  const m = location.hash.match(/^#sea\/(.+)$/);
  return m ? (findStation(decodeURIComponent(m[1])) ?? null) : null;
}

export default function App() {
  const [hash, setHash] = useState(() => location.hash);
  const [path, setPath] = useState(() => location.pathname);
  // 기본은 홈 화면부터 시작하되, 공유 주소(#sea/…)로 들어오면 그 바다를 바로 연다
  const [station, setStation] = useState<Station | null>(stationFromHash);

  const [toasts, setToasts] = useState<string[]>([]);
  const [tab, setTab] = useState<'sea' | 'games' | 'my'>('sea');

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
    const onPop = () => {
      // 뒤로/앞으로 가기 시 주소의 #sea/… 를 보고 화면을 복원한다
      setStation(stationFromHash());
      setPath(location.pathname);
    };
    const onHash = () => setHash(location.hash);
    window.addEventListener('popstate', onPop);
    window.addEventListener('hashchange', onHash);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('hashchange', onHash);
    };
  }, []);

  const select = (s: Station) => {
    // 바다마다 복사·공유 가능한 고유 주소를 부여한다
    history.pushState({ station: s.id }, '', `#sea/${encodeURIComponent(s.id)}`);
    setStation(s);
  };

  const closeDetail = () => {
    const st = history.state as { station?: string } | null;
    if (st?.station) {
      history.back(); // popstate가 주소·화면을 함께 복원
    } else {
      // 공유 주소로 바로 들어온 경우 — 히스토리에 쌓인 게 없으니 주소만 정리
      history.replaceState(null, '', location.pathname);
      setStation(null);
    }
  };

  // 관리자 페이지: /admin 주소 또는 #admin 으로 접근 (비밀번호 필요)
  // 하단 탭바는 홈/게임 화면에서만 보인다 (상세·관리자 화면에서는 숨김)
  const isAdmin = hash === '#admin' || path === '/admin';
  const showTabbar = !isAdmin && !station;
  const screen =
    isAdmin ? (
      <AdminScreen
        onBack={() => {
          if (location.pathname === '/admin') {
            history.replaceState(null, '', '/');
            setPath('/');
          }
          location.hash = '';
        }}
      />
    ) : station ? (
      <DetailScreen station={station} onBack={closeDetail} />
    ) : tab === 'games' ? (
      <GamesScreen />
    ) : tab === 'my' ? (
      <MyScreen onSelect={select} />
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
          <button
            className={tab === 'my' ? 'active' : ''}
            onClick={() => setTab('my')}
            aria-current={tab === 'my' ? 'page' : undefined}
          >
            <span className="tab-icon" aria-hidden="true">
              🗺️
            </span>
            내정보
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
