import { useEffect, useMemo, useState } from 'react';
import type { Station } from '../types';
import { STATIONS } from '../data/stations';
import { loadFavs } from '../lib/favorites';
import { TAG_INFO, getFeature } from '../data/features';

type Tab = 'west' | 'south' | 'east' | 'jeju';

const TABS: { key: Tab; label: string }[] = [
  { key: 'west', label: '서해' },
  { key: 'south', label: '남해' },
  { key: 'east', label: '동해' },
  { key: 'jeju', label: '제주' },
];

function isJeju(s: Station): boolean {
  return s.province === '제주특별자치도';
}

function inTab(s: Station, tab: Tab): boolean {
  if (tab === 'jeju') return isJeju(s);
  if (tab === 'south') return s.region === 'south' && !isJeju(s);
  return s.region === tab;
}

/** 지점의 대표 특징 태그 (아이콘·라벨) */
function mainTag(s: Station) {
  return TAG_INFO[getFeature(s).tags[0]];
}

interface ProvinceGroup {
  name: string;
  count: number;
  groups: { name: string; stations: Station[] }[];
}

// 상세 화면에서 뒤로 왔을 때 보던 자리 그대로 복원 (탭·열린 자치도·스크롤)
const homeMemo: { tab: Tab; open: string | null; scrollY: number } = {
  tab: 'west',
  open: null,
  scrollY: 0,
};

export default function HomeScreen({ onSelect }: { onSelect: (s: Station) => void }) {
  const [tab, setTab] = useState<Tab>(homeMemo.tab);
  const [query, setQuery] = useState('');
  // null = 기본(첫 자치도 열림), '' = 모두 닫힘, 그 외 = 해당 자치도만 열림
  const [open, setOpen] = useState<string | null>(homeMemo.open);
  const [locating, setLocating] = useState(false);
  const [favIds] = useState<string[]>(loadFavs);

  useEffect(() => {
    homeMemo.tab = tab;
    homeMemo.open = open;
  }, [tab, open]);

  useEffect(() => {
    window.scrollTo(0, homeMemo.scrollY);
  }, []);

  const pick = (s: Station) => {
    homeMemo.scrollY = window.scrollY;
    onSelect(s);
  };

  const favStations = useMemo(
    () => favIds.map((id) => STATIONS.find((s) => s.id === id)).filter((s): s is Station => !!s),
    [favIds],
  );

  const q = query.trim();

  const searchResults = useMemo(() => {
    if (!q) return [];
    return STATIONS.filter(
      (s) => s.name.includes(q) || s.group.includes(q) || s.province.includes(q),
    ).slice(0, 60);
  }, [q]);

  // 탭 → 자치도 → 시·군 (데이터 순서 = 해안선 순서 유지)
  const provinces = useMemo(() => {
    const out: ProvinceGroup[] = [];
    for (const s of STATIONS) {
      if (!inTab(s, tab)) continue;
      let p = out.find((x) => x.name === s.province);
      if (!p) {
        p = { name: s.province, count: 0, groups: [] };
        out.push(p);
      }
      p.count++;
      let g = p.groups.find((x) => x.name === s.group);
      if (!g) {
        g = { name: s.group, stations: [] };
        p.groups.push(g);
      }
      g.stations.push(s);
    }
    return out;
  }, [tab]);

  const openName = open ?? provinces[0]?.name ?? '';

  const switchTab = (t: Tab) => {
    setTab(t);
    setOpen(null);
  };

  // 단일 아코디언: 하나를 열면 나머지는 닫힘
  const toggle = (name: string) => {
    setOpen(openName === name ? '' : name);
  };

  const findNearby = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        let best: Station = STATIONS[0];
        let bestD = Infinity;
        for (const s of STATIONS) {
          const d = (s.lat - latitude) ** 2 + (s.lon - longitude) ** 2;
          if (d < bestD) {
            bestD = d;
            best = s;
          }
        }
        pick(best);
      },
      () => setLocating(false),
      { timeout: 8000 },
    );
  };

  return (
    <div className="screen has-tabbar">
      <header className="home-header">
        <h1>
          오늘은 어떤 바다가
          <br />
          <span className="accent">필요</span>하세요?
        </h1>
        <p>물이 가득한 바다도, 갯벌이 드러난 바다도 미리 보여드려요</p>
      </header>

      <div className="search-wrap">
        <input
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍  바다 이름 검색 (예: 대부도, 협재)"
        />
      </div>

      <button className="nearby-btn" onClick={findNearby}>
        📍 {locating ? '내 위치 찾는 중…' : '내 주변 바다 찾기'}
      </button>

      {q ? (
        <div className="station-list">
          {searchResults.length === 0 && (
            <p className="empty-note">'{query}' 바다를 찾지 못했어요</p>
          )}
          {searchResults.map((s) => (
            <button key={s.id} className="station-item" onClick={() => pick(s)}>
              <span className="station-emoji">{mainTag(s).icon}</span>
              <span className="station-info">
                <span className="station-name">{s.name}</span>
                <div className="station-group">
                  {s.province} {s.group}
                </div>
              </span>
              <span className="station-badge">{mainTag(s).label}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          {favStations.length > 0 && (
            <div className="fav-section">
              <div className="subgroup-label">⭐ 자주 가는 바다</div>
              <div className="chip-grid">
                {favStations.map((s) => (
                  <button key={s.id} className="chip fav-chip" onClick={() => pick(s)}>
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <nav className="region-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`region-tab${tab === t.key ? ' active' : ''}`}
                onClick={() => switchTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className="province-list">
            {provinces.map((p) => {
              const isOpen = p.name === openName;
              return (
                <section key={p.name} className={`province-item${isOpen ? ' open' : ''}`}>
                  <button className="province-head" onClick={() => toggle(p.name)}>
                    <span className="province-pin">📍</span>
                    <span className="province-name">{p.name}</span>
                    <span className="province-count">{p.count}</span>
                    <span className="province-chevron">{isOpen ? '︿' : '﹀'}</span>
                  </button>
                  {isOpen && (
                    <div className="province-body">
                      {p.groups.map((g) => (
                        <div key={g.name} className="subgroup">
                          <div className="subgroup-label">{g.name}</div>
                          <div className="chip-grid">
                            {g.stations.map((s) => (
                              <button key={s.id} className="chip" onClick={() => pick(s)}>
                                <span className="chip-mud">{mainTag(s).icon}</span>
                                {s.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
