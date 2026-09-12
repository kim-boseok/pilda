import { useEffect, useState } from 'react';
import type { Station, TideExtreme } from '../types';
import {
  OFFSET_OPTIONS,
  addAlarm,
  downloadIcs,
  ensureNotifyPermission,
  fireTime,
  loadAlarms,
  offsetLabel,
  removeAlarm,
  typeName,
  type TideAlarm,
} from '../lib/alarms';
import { fmtDayLabel, fmtTime } from '../lib/format';

export default function AlarmSheet({
  station,
  pick,
  onClose,
}: {
  station: Station;
  pick: TideExtreme | null;
  onClose: () => void;
}) {
  const [offsetMin, setOffsetMin] = useState(60);
  const [alarms, setAlarms] = useState<TideAlarm[]>(loadAlarms);
  const [saved, setSaved] = useState(false);
  const [permWarn, setPermWarn] = useState(false);

  useEffect(() => {
    setSaved(false);
  }, [pick]);

  const base = pick && {
    stationId: station.id,
    stationName: station.name,
    type: pick.type,
    eventTime: pick.time.toISOString(),
    level: pick.level,
    offsetMin,
  };

  const saveAlarm = async () => {
    if (!base) return;
    const ok = await ensureNotifyPermission();
    setPermWarn(!ok);
    setAlarms(addAlarm(base));
    setSaved(true);
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        {pick ? (
          <>
            <h3>🔔 물때 알림 예약</h3>
            <p className="alarm-event">
              <strong>{station.name}</strong> · {fmtDayLabel(pick.time, new Date())}{' '}
              {fmtTime(pick.time)} <strong>{typeName(pick.type)}</strong> ({pick.level}cm)
            </p>
            <div className="alarm-offsets">
              {OFFSET_OPTIONS.map((o) => (
                <button
                  key={o.min}
                  className={`alarm-offset${offsetMin === o.min ? ' active' : ''}`}
                  onClick={() => {
                    setOffsetMin(o.min);
                    setSaved(false);
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <div className="sheet-actions">
              <button className="btn btn-primary" onClick={saveAlarm} disabled={saved}>
                {saved ? '✓ 예약 완료' : '알림 예약'}
              </button>
              <button className="btn btn-ghost" onClick={() => base && downloadIcs(base)}>
                📅 캘린더에 추가
              </button>
            </div>
            {saved && (
              <p className="alarm-note">
                {permWarn
                  ? '브라우저 알림이 차단되어 있어요. 확실한 알림은 캘린더 추가를 이용하세요.'
                  : '필다가 열려 있을 때 알려드려요. 앱을 꺼둘 예정이면 캘린더 추가가 확실해요.'}
              </p>
            )}
          </>
        ) : (
          <h3>🔔 내 물때 알림</h3>
        )}

        {alarms.length > 0 && (
          <div className="alarm-list">
            {alarms.map((a) => (
              <div key={a.id} className={`alarm-item${a.fired ? ' fired' : ''}`}>
                <div className="alarm-item-info">
                  <span className="alarm-item-title">
                    {a.stationName} {typeName(a.type)} {offsetLabel(a.offsetMin)}
                  </span>
                  <span className="alarm-item-time">
                    {fmtDayLabel(fireTime(a), new Date())} {fmtTime(fireTime(a))} 알림
                    {a.fired ? ' · 완료' : ''}
                  </span>
                </div>
                <button
                  className="alarm-del"
                  aria-label="알림 삭제"
                  onClick={() => setAlarms(removeAlarm(a.id))}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        {!pick && alarms.length === 0 && (
          <p className="alarm-note">주간 물때에서 만조·간조 시간을 눌러 알림을 예약해보세요.</p>
        )}

        <div className="sheet-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
