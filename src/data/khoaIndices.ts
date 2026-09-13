// 바다 지수 3종 — 갯벌체험지수 · 해수욕지수 · 바다낚시지수 (국립해양조사원)
// 하루 1회 조회하면 오늘부터 7일치 전국 예보가 오므로, 세션 캐시 후 지점과 좌표로 매칭한다
import type { Station } from '../types';
import { getKhoaKey } from './khoaProvider';
import { haversineKm } from './khoaObs';

const BASE = '/api/khoa/1192136';
const PAGE_SIZE = 300; // API가 약 400행 이상 요청 시 오류를 내므로 300행씩 나눠 받는다

/** 지수 등급 (API totalIndex 문자열 그대로) */
export type IndexGrade = '매우좋음' | '좋음' | '보통' | '나쁨' | '매우나쁨';

export const GRADE_INFO: Record<string, { emoji: string; color: string }> = {
  매우좋음: { emoji: '😍', color: '#1db954' },
  좋음: { emoji: '😊', color: '#4caf50' },
  보통: { emoji: '🙂', color: '#f0a75a' },
  나쁨: { emoji: '😕', color: '#e5735a' },
  매우나쁨: { emoji: '😣', color: '#d64545' },
};

export interface MudflatIndex {
  villageName: string;
  distanceKm: number;
  date: string;          // 'YYYY-MM-DD'
  beginTm: string;       // 체험 시작 'HH:mm'
  endTm: string;
  weather: string;
  grade: string;         // totalIndex
}

export interface BeachIndex {
  beachName: string;
  distanceKm: number;
  date: string;
  am: string | null;     // 오전 지수
  pm: string | null;     // 오후 지수
  maxWaveHeight: number | null;
  waterTemp: number | null;
  openStat: string;      // 개장/폐장
}

export interface FishingIndex {
  spotName: string;
  distanceKm: number;
  date: string;
  entries: { fish: string; am: string | null; pm: string | null }[];
}

function yyyymmdd(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

function dashDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

async function fetchPage(path: string, params: string, pageNo: number): Promise<{ rows: unknown[]; total: number }> {
  const key = getKhoaKey();
  if (!key) throw new Error('API 키가 없습니다');
  const keyParam = key.includes('%') ? key : encodeURIComponent(key);
  const url = `${BASE}/${path}?serviceKey=${keyParam}&type=json&numOfRows=${PAGE_SIZE}&pageNo=${pageNo}${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as {
    header?: { resultCode?: string; resultMsg?: string };
    body?: { items?: { item?: unknown }; totalCount?: number };
  };
  if (json.header?.resultCode !== '00') {
    throw new Error(`API 오류: ${json.header?.resultCode} ${json.header?.resultMsg ?? ''}`);
  }
  const raw = json.body?.items?.item;
  const rows = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return { rows, total: Number(json.body?.totalCount ?? rows.length) };
}

/** 전 페이지 수집 (첫 페이지로 총량 파악 후 나머지는 병렬) */
async function fetchAll(path: string, params: string): Promise<unknown[]> {
  const first = await fetchPage(path, params, 1);
  const pages = Math.min(10, Math.ceil(first.total / PAGE_SIZE)); // 안전 상한 10페이지
  if (pages <= 1) return first.rows;
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) => fetchPage(path, params, i + 2)),
  );
  return first.rows.concat(...rest.map((r) => r.rows));
}

// 세션 캐시 — 지수 예보는 자주 안 바뀌므로 30분
const listCache = new Map<string, { at: number; rows: unknown[] }>();
const CACHE_MS = 30 * 60_000;

async function cachedAll(cacheKey: string, path: string, params: string): Promise<unknown[]> {
  const hit = listCache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.rows;
  const rows = await fetchAll(path, params);
  listCache.set(cacheKey, { at: Date.now(), rows });
  return rows;
}

function nearestGroup<T extends { lat?: unknown; lot?: unknown }>(
  rows: T[],
  lat: number,
  lon: number,
  nameOf: (r: T) => string,
  maxKm: number,
): { name: string; distKm: number; rows: T[] } | null {
  let bestName: string | null = null;
  let bestDist = Infinity;
  for (const r of rows) {
    const rl = num(r.lat);
    const rn = num(r.lot);
    if (rl === null || rn === null) continue;
    const d = haversineKm(lat, lon, rl, rn);
    if (d < bestDist) {
      bestDist = d;
      bestName = nameOf(r);
    }
  }
  if (bestName === null || bestDist > maxKm) return null;
  const name = bestName;
  return { name, distKm: bestDist, rows: rows.filter((r) => nameOf(r) === name) };
}

interface MudflatRow {
  mdftExpcnVlgNm: string; lat: unknown; lot: unknown; predcYmd: string;
  mdftExprnBgngTm: string; mdftExprnEndTm: string; weather: string; totalIndex: string;
}

/** 갯벌체험지수 — 가까운 체험마을(25km 이내)의 해당 날짜 예보 */
export async function getMudflatIndex(station: Station, date: Date): Promise<MudflatIndex | null> {
  try {
    const rows = (await cachedAll(
      `mudflat|${yyyymmdd(new Date())}`,
      'fcstMudflatv2/GetFcstMudflatApiServicev2',
      `&reqDate=${yyyymmdd(new Date())}`,
    )) as MudflatRow[];
    const day = dashDate(date);
    const near = nearestGroup(rows.filter((r) => r.predcYmd === day), station.lat, station.lon,
      (r) => r.mdftExpcnVlgNm, 25);
    if (!near) return null;
    const r = near.rows[0];
    return {
      villageName: near.name,
      distanceKm: near.distKm,
      date: r.predcYmd,
      beginTm: r.mdftExprnBgngTm,
      endTm: r.mdftExprnEndTm,
      weather: r.weather,
      grade: r.totalIndex,
    };
  } catch {
    return null;
  }
}

interface BeachRow {
  bbchNm: string; lat: unknown; lot: unknown; predcYmd: string;
  predcNoonSeCd: string; maxWvhgt: unknown; avgWtem: unknown; opnStat: string; totalIndex: string;
}

/** 해수욕지수 — 가까운 해수욕장(15km 이내)의 해당 날짜 오전/오후 지수 */
export async function getBeachIndex(station: Station, date: Date): Promise<BeachIndex | null> {
  try {
    const rows = (await cachedAll(
      `beach|${yyyymmdd(new Date())}`,
      'fcstBeachv2/GetFcstBeachApiServicev2',
      `&reqDate=${yyyymmdd(new Date())}`,
    )) as BeachRow[];
    const day = dashDate(date);
    const near = nearestGroup(rows.filter((r) => r.predcYmd === day), station.lat, station.lon,
      (r) => r.bbchNm, 15);
    if (!near) return null;
    const am = near.rows.find((r) => r.predcNoonSeCd === '오전');
    const pm = near.rows.find((r) => r.predcNoonSeCd === '오후');
    const any = am ?? pm;
    if (!any) return null;
    return {
      beachName: near.name,
      distanceKm: near.distKm,
      date: day,
      am: am?.totalIndex ?? null,
      pm: pm?.totalIndex ?? null,
      maxWaveHeight: num((pm ?? am)?.maxWvhgt),
      waterTemp: num((pm ?? am)?.avgWtem),
      openStat: any.opnStat,
    };
  } catch {
    return null;
  }
}

interface FishingRow {
  seafsPstnNm: string; lat: unknown; lot: unknown; predcYmd: string;
  predcNoonSeCd: string; seafsTgfshNm: string; totalIndex: string;
}

/** 바다낚시지수(갯바위) — 가까운 낚시 포인트(40km 이내)의 해당 날짜 어종별 지수 */
export async function getFishingIndex(station: Station, date: Date): Promise<FishingIndex | null> {
  try {
    const rows = (await cachedAll(
      `fishing|${yyyymmdd(new Date())}`,
      'fcstFishingv2/GetFcstFishingApiServicev2',
      `&reqDate=${yyyymmdd(new Date())}&gubun=${encodeURIComponent('갯바위')}`,
    )) as FishingRow[];
    const day = dashDate(date);
    const near = nearestGroup(rows.filter((r) => r.predcYmd === day), station.lat, station.lon,
      (r) => r.seafsPstnNm, 40);
    if (!near) return null;
    const byFish = new Map<string, { fish: string; am: string | null; pm: string | null }>();
    for (const r of near.rows) {
      const e = byFish.get(r.seafsTgfshNm) ?? { fish: r.seafsTgfshNm, am: null, pm: null };
      if (r.predcNoonSeCd === '오전') e.am = r.totalIndex;
      else e.pm = r.totalIndex;
      byFish.set(r.seafsTgfshNm, e);
    }
    const entries = [...byFish.values()].slice(0, 4);
    if (entries.length === 0) return null;
    return { spotName: near.name, distanceKm: near.distKm, date: day, entries };
  } catch {
    return null;
  }
}
