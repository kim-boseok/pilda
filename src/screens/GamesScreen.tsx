import { Suspense, lazy, useCallback, useState } from 'react';
import {
  DAILY_CAP,
  SHOP_ITEMS,
  buyItem,
  earnPoints,
  getPoints,
  getTodayEarned,
  hasItem,
} from '../lib/points';

const MudflatGame = lazy(() => import('../games/MudflatGame'));
const FishingGame = lazy(() => import('../games/FishingGame'));

type GameKey = 'mudflat' | 'fishing' | null;

export default function GamesScreen() {
  const [game, setGame] = useState<GameKey>(null);
  const [points, setPoints] = useState(getPoints);
  const [earnedToday, setEarnedToday] = useState(getTodayEarned);
  const [notice, setNotice] = useState<string | null>(null);

  const flash = useCallback((msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice((cur) => (cur === msg ? null : cur)), 3500);
  }, []);

  const handleExit = useCallback(
    (earned: number) => {
      setGame(null);
      if (earned > 0) {
        const granted = earnPoints(earned);
        if (granted > 0) {
          flash(`+${granted}P 획득! 🎉`);
        } else {
          flash('오늘 포인트 한도를 다 채웠어요. 내일 또 만나요 🌙');
        }
      }
      setPoints(getPoints());
      setEarnedToday(getTodayEarned());
    },
    [flash],
  );

  const handleBuy = (id: string) => {
    const item = SHOP_ITEMS.find((s) => s.id === id);
    if (!item) return;
    if (buyItem(id)) {
      setPoints(getPoints());
      flash(`${item.icon} ${item.name} 구매 완료! 바다 화면에서 확인해 보세요`);
    } else {
      flash('포인트가 조금 모자라요. 게임으로 더 모아볼까요?');
    }
  };

  const capPct = Math.min(100, Math.round((earnedToday / DAILY_CAP) * 100));

  return (
    <div className="screen has-tabbar">
      <header className="games-head">
        <h1>🎮 바다 게임</h1>
        <p>바다에 못 가는 날에도, 잠깐 쉬면서 바다를 즐겨요</p>
      </header>

      <section className="point-card">
        <div className="point-label">내 포인트</div>
        <div className="point-value">{points.toLocaleString()}P</div>
        <div className="point-cap">
          오늘 획득 {earnedToday.toLocaleString()}P / {DAILY_CAP.toLocaleString()}P
        </div>
        <div className="point-cap-bar">
          <div style={{ width: `${capPct}%` }} />
        </div>
      </section>

      <section className="game-cards">
        <button className="game-card mud" onClick={() => setGame('mudflat')}>
          <span className="game-emoji" aria-hidden="true">
            🦀
          </span>
          <span className="game-card-info">
            <b>갯벌 체험</b>
            <p>호미로 콕콕! 숨어 있는 꽃게·낙지·조개를 잡아보세요</p>
          </span>
          <span className="game-go" aria-hidden="true">
            ›
          </span>
        </button>
        <button className="game-card fish" onClick={() => setGame('fishing')}>
          <span className="game-emoji" aria-hidden="true">
            🎣
          </span>
          <span className="game-card-info">
            <b>바다 낚시</b>
            <p>낚싯대를 던지고 기다리다, 입질 오면 낚아채세요</p>
          </span>
          <span className="game-go" aria-hidden="true">
            ›
          </span>
        </button>
      </section>

      <section className="shop-section">
        <h2>🛍️ 포인트 상점</h2>
        <p className="shop-sub">모은 포인트로 내 바다 화면을 꾸밀 수 있어요</p>
        <div className="shop-list">
          {SHOP_ITEMS.map((item) => {
            const owned = hasItem(item.id);
            const affordable = points >= item.price;
            return (
              <div className="shop-item" key={item.id}>
                <span className="shop-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="shop-item-info">
                  <b>{item.name}</b>
                  <p>{item.desc}</p>
                </span>
                {owned ? (
                  <button className="shop-buy owned" disabled>
                    보유 중 ✓
                  </button>
                ) : (
                  <button
                    className="shop-buy"
                    disabled={!affordable}
                    onClick={() => handleBuy(item.id)}
                  >
                    {item.price.toLocaleString()}P
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {notice && (
        <div className="toast-wrap">
          <div className="toast">{notice}</div>
        </div>
      )}

      {game && (
        <Suspense
          fallback={
            <div
              className="game-overlay"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8fa8c4',
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              바다로 가는 중… 🌊
            </div>
          }
        >
          {game === 'mudflat' ? (
            <MudflatGame onExit={handleExit} />
          ) : (
            <FishingGame onExit={handleExit} />
          )}
        </Suspense>
      )}
    </div>
  );
}
