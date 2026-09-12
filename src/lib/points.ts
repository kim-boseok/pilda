// 필다 포인트 시스템 — 게임으로 모으고, 바다 꾸미기에 쓴다
// 저장은 전부 localStorage (기기 밖으로 나가지 않음)

const POINTS_KEY = 'pilda_points';
const EARNED_KEY = 'pilda_points_today'; // { date: 'YYYY-MM-DD', earned: number }
const ITEMS_KEY = 'pilda_items';

/** 하루에 게임으로 모을 수 있는 최대 포인트 */
export const DAILY_CAP = 1000;

export interface ShopItem {
  id: string;
  icon: string;
  name: string;
  price: number;
  desc: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'lighthouse',
    icon: '🗼',
    name: '등대',
    price: 500,
    desc: '바다 화면 수평선에 등대가 세워져요. 밤에는 불빛이 돌아요.',
  },
  {
    id: 'boat',
    icon: '⛵',
    name: '돛단배',
    price: 400,
    desc: '바다 위를 천천히 오가는 돛단배가 생겨요.',
  },
  {
    id: 'gulls',
    icon: '🕊️',
    name: '갈매기 친구들',
    price: 300,
    desc: '갈매기들이 더 자주 바다를 찾아와요.',
  },
];

function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function readNum(key: string): number {
  try {
    const v = Number(localStorage.getItem(key));
    return Number.isFinite(v) && v >= 0 ? v : 0;
  } catch {
    return 0;
  }
}

/** 현재 보유 포인트 */
export function getPoints(): number {
  return readNum(POINTS_KEY);
}

/** 오늘 게임으로 획득한 포인트 (일일 한도 계산용) */
export function getTodayEarned(): number {
  try {
    const raw = localStorage.getItem(EARNED_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { date?: string; earned?: number };
    if (parsed.date !== todayStr()) return 0;
    const e = Number(parsed.earned);
    return Number.isFinite(e) && e >= 0 ? e : 0;
  } catch {
    return 0;
  }
}

/**
 * 포인트 적립. 일일 한도(DAILY_CAP)를 넘는 부분은 잘라낸다.
 * @returns 실제로 적립된 포인트
 */
export function earnPoints(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const already = getTodayEarned();
  const grant = Math.max(0, Math.min(Math.floor(amount), DAILY_CAP - already));
  if (grant === 0) return 0;
  try {
    localStorage.setItem(POINTS_KEY, String(getPoints() + grant));
    localStorage.setItem(EARNED_KEY, JSON.stringify({ date: todayStr(), earned: already + grant }));
  } catch {
    // 저장 실패 시 조용히 무시 (다음 기회에)
  }
  return grant;
}

/** 포인트 차감. 잔액이 모자라면 false */
export function spendPoints(amount: number): boolean {
  const bal = getPoints();
  if (!Number.isFinite(amount) || amount <= 0 || bal < amount) return false;
  try {
    localStorage.setItem(POINTS_KEY, String(bal - Math.floor(amount)));
    return true;
  } catch {
    return false;
  }
}

/** 보유한 아이템 id 목록 */
export function ownedItems(): string[] {
  try {
    const raw = localStorage.getItem(ITEMS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function hasItem(id: string): boolean {
  return ownedItems().includes(id);
}

/** 상점 구매. 성공하면 true (포인트 차감 + 아이템 지급) */
export function buyItem(id: string): boolean {
  const item = SHOP_ITEMS.find((s) => s.id === id);
  if (!item || hasItem(id)) return false;
  if (!spendPoints(item.price)) return false;
  try {
    localStorage.setItem(ITEMS_KEY, JSON.stringify([...ownedItems(), id]));
    return true;
  } catch {
    return false;
  }
}
