import { useEffect, useState } from 'react';
import type { DayTide, Station, TideExtreme } from '../types';
import { getProvider } from '../data/provider';
import { fmtTime } from '../lib/format';

const DAY_MS = 86400000;
const DOW = ['일', '월', '화', '수', '목', '금', '토'];

/** 오늘부터 7일치 조석 — provider가 3일 단위라 3회 호출 후 병합 */
async function getWeek(stationId: string): Promise<DayTide[]> {
  const provider = getProvider();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const batches = await Promise.all(
    [1, 4, 7].map((off) => provider.getTides(stationId, new Date(today.getTime() + off * DAY_MS))),
  );
  const byDay = new Map<string, DayTide>();
  for (const d of batches.flat()) byDay.set(d.date.toDateString(), d);
  const out: DayTide[] = [];
  for (let i = 0; i < 7; i++) {
    const d = byDay.get(new Date(today.getTime() + i * DAY_MS).toDateString());
    if (d) out.push(d);
  }
  return out;
}

function dayLabel(d: Date): string {
  const today = new Date();
  const diff = Math.round(
    (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() -
      new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) /
      DAY_MS,
  );
  const dow = DOW[d.getDay()];
  if (diff === 0) return '오늘';
  if (diff === 1) return `내일 (${dow})`;
  return `${d.getMonth() + 1}/${d.getDate()} (${dow})`;
}

export default function WeekView({
  station,
  onPick,
}: {
  station: Station;
  onPick: (e: TideExtreme) => void;
}) {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState<DayTide[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setOpen(false);
    setDays(null);
    setFailed(false);
  }, [station]);

  useEffect(() => {
    if (!open || days) return;
    let alive = true;
    getWeek(station.id)
      .then((d) => alive && setDays(d))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [open, days, station]);

  return (
    <section className={`week-card${open ? ' open' : ''}`}>
      <button className="week-head" onClick={() => setOpen((o) => !o)}>
        <span className="week-title">📅 주간 물때</span>
        <span className="week-sub">{open ? '' : '7일치 만조·간조 한눈에'}</span>
        <span className="province-chevron">{open ? '︿' : '﹀'}</span>
      </button>
      {open && (
        <div className="week-body">
          {failed && <p className="empty-note">주간 물때를 불러오지 못했어요</p>}
          {!days && !failed && <p className="empty-note">불러오는 중…</p>}
          {days?.map((d) => {
            const isToday = d.date.toDateString() === new Date().toDateString();
            return (
              <div key={d.date.toISOString()} className={`week-row${isToday ? ' today' : ''}`}>
                <div className="week-day">
                  <span className="week-day-label">{dayLabel(d.date)}</span>
                  <span className="week-mul">{d.mulName}</span>
                </div>
                <div className="week-tides">
                  {d.extremes.map((e) => (
                    <button
                      key={e.time.toISOString()}
                      className={`tide-pill ${e.type}`}
                      onClick={() => onPick(e)}
                      disabled={e.time.getTime() <= Date.now()}
                    >
                      {e.type === 'high' ? '▲' : '▽'} {fmtTime(e.time)}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {days && <p className="week-hint">시간을 누르면 알림을 예약할 수 있어요 🔔</p>}
        </div>
      )}
    </section>
  );
}
