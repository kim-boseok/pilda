// 발자취 기록 — 가본 바다 / 가고싶은 바다 (localStorage)
const KEY = 'pilda_visits';

export type VisitState = 'visited' | 'wish';
export type VisitMap = Record<string, VisitState>;

export function loadVisits(): VisitMap {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as VisitMap) : {};
  } catch {
    return {};
  }
}

/** state를 null로 주면 기록 삭제. 같은 상태를 다시 주면 토글로 해제된다. */
export function setVisit(id: string, state: VisitState | null): VisitMap {
  const map = loadVisits();
  if (state === null || map[id] === state) delete map[id];
  else map[id] = state;
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // 저장 실패는 무시 (프라이빗 모드 등)
  }
  return map;
}
