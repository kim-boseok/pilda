// 물때 알림 예약 — localStorage 저장, 앱이 열려 있는 동안 브라우저 알림 발화
// 백그라운드 보장이 필요한 경우를 위해 .ics(캘린더) 내보내기 지원

export interface TideAlarm {
  id: string;
  stationId: string;
  stationName: string;
  type: 'high' | 'low';
  /** 만조/간조 시각 (ISO) */
  eventTime: string;
  level: number;
  /** 몇 분 전에 알릴지 (0=정각) */
  offsetMin: number;
  fired: boolean;
}

const STORAGE_KEY = 'pilda_alarms';

export const OFFSET_OPTIONS = [
  { min: 0, label: '정각에' },
  { min: 30, label: '30분 전' },
  { min: 60, label: '1시간 전' },
  { min: 120, label: '2시간 전' },
] as const;

export function typeName(t: 'high' | 'low'): string {
  return t === 'high' ? '만조' : '간조';
}

export function offsetLabel(min: number): string {
  return OFFSET_OPTIONS.find((o) => o.min === min)?.label ?? `${min}분 전`;
}

export function fireTime(a: TideAlarm): Date {
  return new Date(new Date(a.eventTime).getTime() - a.offsetMin * 60000);
}

export function loadAlarms(): TideAlarm[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as TideAlarm[];
    // 지난 지 1시간 넘은 알림은 자동 정리
    const cutoff = Date.now() - 3600000;
    return list.filter((a) => new Date(a.eventTime).getTime() > cutoff);
  } catch {
    return [];
  }
}

function save(list: TideAlarm[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addAlarm(a: Omit<TideAlarm, 'id' | 'fired'>): TideAlarm[] {
  const list = loadAlarms();
  const id = `${a.stationId}|${a.eventTime}|${a.offsetMin}`;
  if (!list.some((x) => x.id === id)) {
    list.push({ ...a, id, fired: false });
    list.sort((x, y) => fireTime(x).getTime() - fireTime(y).getTime());
    save(list);
  }
  return list;
}

export function removeAlarm(id: string): TideAlarm[] {
  const list = loadAlarms().filter((a) => a.id !== id);
  save(list);
  return list;
}

export async function ensureNotifyPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
}

export function alarmText(a: TideAlarm): string {
  const t = new Date(a.eventTime);
  const hh = String(t.getHours()).padStart(2, '0');
  const mm = String(t.getMinutes()).padStart(2, '0');
  const when = a.offsetMin === 0 ? '지금이에요' : `${offsetLabel(a.offsetMin)}이에요`;
  return `${a.stationName} ${typeName(a.type)}(${hh}:${mm}) ${when}`;
}

/** 발화 시각이 지난 미발화 알림을 찾아 알림 발송 후 fired 처리 */
export function checkAlarms(): TideAlarm[] {
  const list = loadAlarms();
  const now = Date.now();
  const due = list.filter((a) => !a.fired && fireTime(a).getTime() <= now);
  if (due.length === 0) {
    save(list);
    return [];
  }
  for (const a of due) {
    a.fired = true;
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('필다 🌊 물때 알림', { body: alarmText(a), tag: a.id });
      } catch {
        // 일부 모바일 브라우저는 페이지 컨텍스트 알림 미지원 — 인앱 토스트로 대체
      }
    }
  }
  save(list);
  return due;
}

function icsDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
}

/** 캘린더 앱에 등록할 .ics 파일 다운로드 — 앱이 꺼져 있어도 폰 알림 보장 */
export function downloadIcs(a: Omit<TideAlarm, 'id' | 'fired'>): void {
  const event = new Date(a.eventTime);
  const start = new Date(event.getTime() - a.offsetMin * 60000);
  const end = new Date(start.getTime() + 30 * 60000);
  const title = `🌊 ${a.stationName} ${typeName(a.type)} ${a.offsetMin ? offsetLabel(a.offsetMin) : ''}`.trim();
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//pilda//tide//KO',
    'BEGIN:VEVENT',
    `UID:pilda-${a.stationId}-${icsDate(event)}@pilda`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${typeName(a.type)} 시각 ${icsDate(event).slice(9, 11)}:${icsDate(event).slice(11, 13)} · 필다`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'TRIGGER:PT0M',
    `DESCRIPTION:${title}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pilda-${a.stationName}-${typeName(a.type)}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}
