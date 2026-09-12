const KEY = 'pilda_favorites';

export function loadFavs(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function isFav(id: string): boolean {
  return loadFavs().includes(id);
}

/** 토글 후 즐겨찾기 여부 반환 */
export function toggleFav(id: string): boolean {
  const list = loadFavs();
  const idx = list.indexOf(id);
  if (idx >= 0) list.splice(idx, 1);
  else list.push(id);
  localStorage.setItem(KEY, JSON.stringify(list));
  return idx < 0;
}
