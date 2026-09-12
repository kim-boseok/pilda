import { useMemo, useState } from 'react';
import type { Station } from '../types';
import { STATIONS } from '../data/stations';
import KoreaMap from '../components/KoreaMap';
import { loadVisits, setVisit } from '../lib/visits';
import type { VisitState } from '../lib/visits';
import { loadFavs, toggleFav } from '../lib/favorites';

export default function MyScreen({ onSelect }: { onSelect: (s: Station) => void }) {
  const [visits, setVisits] = useState(loadVisits);
  const [favs, setFavs] = useState<string[]>(loadFavs);
  const [sel, setSel] = useState<Station | null>(null);
  const [focus, setFocus] = useState<{ st: Station; n: number } | null>(null);

  const visited = useMemo(
    () => STATIONS.filter((s) => visits[s.id] === 'visited'),
    [visits],
  );
  const wished = useMemo(
    () => STATIONS.filter((s) => visits[s.id] === 'wish'),
    [visits],
  );
  const favStations = useMemo(
    () => favs.map((id) => STATIONS.find((s) => s.id === id)).filter((s): s is Station => !!s),
    [favs],
  );

  const mark = (id: string, state: VisitState) => {
    setVisits({ ...setVisit(id, state) });
  };

  const pct = Math.round((visited.length / STATIONS.length) * 100);
  const selState = sel ? visits[sel.id] : undefined;
  const selFav = sel ? favs.includes(sel.id) : false;

  const goMap = (st: Station) => {
    setFocus((f) => ({ st, n: (f?.n ?? 0) + 1 }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="screen has-tabbar">
      <header className="games-head">
        <h1>나의 발자취 🗺️</h1>
        <p>다녀온 바다, 가고싶은 바다를 지도에 채워보세요</p>
      </header>

      <div className="my-stats">
        <div className="my-stat">
          <b style={{ color: '#3182F6' }}>{visited.length}</b>
          <span>가본 바다</span>
        </div>
        <div className="my-stat">
          <b style={{ color: '#F5A623' }}>{wished.length}</b>
          <span>가고싶은</span>
        </div>
        <div className="my-stat">
          <b style={{ color: '#2AC77F' }}>{favStations.length}</b>
          <span>즐겨찾기</span>
        </div>
      </div>

      <div className="map-wrap">
        <KoreaMap
          visits={visits}
          favs={favs}
          selected={sel}
          onSelect={setSel}
          focus={focus}
        />
        {sel && (
          <div className="map-card">
            <div className="map-card-head">
              <div>
                <b>{sel.name}</b>
                <span>
                  {sel.province} {sel.group}
                </span>
              </div>
              <button className="map-card-go" onClick={() => onSelect(sel)}>
                바다 보기 →
              </button>
            </div>
            <div className="map-card-btns">
              <button
                className={`vbtn${selState === 'visited' ? ' on-visited' : ''}`}
                onClick={() => mark(sel.id, 'visited')}
              >
                👣 가봤어요
              </button>
              <button
                className={`vbtn${selState === 'wish' ? ' on-wish' : ''}`}
                onClick={() => mark(sel.id, 'wish')}
              >
                💛 가고싶어요
              </button>
              <button
                className={`vbtn${selFav ? ' on-fav' : ''}`}
                onClick={() => {
                  toggleFav(sel.id);
                  setFavs(loadFavs());
                }}
              >
                ⭐ 즐겨찾기
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="foot-progress">
        <div className="foot-progress-label">
          전국 바다 {STATIONS.length}곳 중 <b>{visited.length}곳</b> 방문 ({pct}%)
        </div>
        <div className="point-cap-bar">
          <div style={{ width: `${Math.max(1, pct)}%`, background: '#3182F6' }} />
        </div>
      </div>

      {visited.length + wished.length + favStations.length === 0 && (
        <p className="empty-note">
          지도에서 바다를 콕 찍어 첫 발자취를 남겨보세요! 👣
        </p>
      )}

      {visited.length > 0 && (
        <div className="my-section">
          <div className="subgroup-label">👣 가본 바다</div>
          <div className="chip-grid">
            {visited.map((s) => (
              <button key={s.id} className="chip" onClick={() => goMap(s)}>
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {wished.length > 0 && (
        <div className="my-section">
          <div className="subgroup-label">💛 가고싶은 바다</div>
          <div className="chip-grid">
            {wished.map((s) => (
              <button key={s.id} className="chip" onClick={() => goMap(s)}>
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {favStations.length > 0 && (
        <div className="my-section">
          <div className="subgroup-label">⭐ 즐겨찾기</div>
          <div className="chip-grid">
            {favStations.map((s) => (
              <button key={s.id} className="chip" onClick={() => goMap(s)}>
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
