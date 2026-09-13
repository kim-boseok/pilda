// 해양관측부이 최신 관측데이터 — 실측 파고·수온·바람 (국립해양조사원)
// 부이 목록은 API 전수 조사(TW_0001~0120)로 확보한 실제 운영 지점 25곳
import type { Station } from '../types';
import { getKhoaKey } from './khoaProvider';

const ENDPOINT = '/api/khoa/1192136/twRecent/GetTWRecentApiService';

/** 운영 중인 해양관측부이 (코드 · 이름 · 좌표) */
const BUOYS: { code: string; name: string; lat: number; lon: number }[] = [
  { code: 'TW_0062', name: '해운대해수욕장', lat: 35.14897, lon: 129.17016 },
  { code: 'TW_0069', name: '대천해수욕장', lat: 36.27411, lon: 126.4578 },
  { code: 'TW_0070', name: '평택당진항', lat: 37.13666, lon: 126.54083 },
  { code: 'TW_0072', name: '군산항', lat: 35.98416, lon: 126.50875 },
  { code: 'TW_0074', name: '광양항', lat: 34.85972, lon: 127.79277 },
  { code: 'TW_0075', name: '중문해수욕장', lat: 33.2345, lon: 126.40955 },
  { code: 'TW_0076', name: '인천항', lat: 37.38944, lon: 126.53305 },
  { code: 'TW_0078', name: '완도항', lat: 34.32508, lon: 126.76319 },
  { code: 'TW_0079', name: '상왕등도', lat: 35.65247, lon: 126.19425 },
  { code: 'TW_0080', name: '우이도', lat: 34.54305, lon: 125.80277 },
  { code: 'TW_0081', name: '생일도', lat: 34.25872, lon: 126.96027 },
  { code: 'TW_0082', name: '태안항', lat: 37.00672, lon: 126.27022 },
  { code: 'TW_0083', name: '여수항', lat: 34.79472, lon: 127.80805 },
  { code: 'TW_0084', name: '통영항', lat: 34.77333, lon: 128.46 },
  { code: 'TW_0085', name: '마산항', lat: 35.10319, lon: 128.63183 },
  { code: 'TW_0086', name: '부산항신항', lat: 35.04377, lon: 128.76175 },
  { code: 'TW_0087', name: '부산항', lat: 35.09175, lon: 129.08525 },
  { code: 'TW_0088', name: '감천항', lat: 35.0528, lon: 129.00308 },
  { code: 'TW_0089', name: '경포대해수욕장', lat: 37.80897, lon: 128.93188 },
  { code: 'TW_0090', name: '송정해수욕장', lat: 35.16472, lon: 129.21944 },
  { code: 'TW_0091', name: '낙산해수욕장', lat: 38.1225, lon: 128.65055 },
  { code: 'TW_0092', name: '임랑해수욕장', lat: 35.3025, lon: 129.2925 },
  { code: 'TW_0093', name: '속초해수욕장', lat: 38.19861, lon: 128.63138 },
  { code: 'TW_0094', name: '망상해수욕장', lat: 37.61611, lon: 129.10305 },
  { code: 'TW_0095', name: '고래불해수욕장', lat: 36.58, lon: 129.45408 },
];

/** 이 거리(km)보다 멀면 실측값이 그 바다를 대표한다고 보기 어려워 표시하지 않는다 */
const MAX_DIST_KM = 60;
/** 이 시간보다 오래된 관측값은 버린다 (부이 점검·통신 두절 대비) */
const MAX_AGE_MS = 3 * 3600_000;

export interface BuoyObs {
  buoyName: string;
  distanceKm: number;
  time: Date;               // 관측 시각
  waveHeight: number | null; // m
  waterTemp: number | null;  // ℃
  windSpeed: number | null;  // m/s
  windDir: number | null;    // 도 (불어오는 방향)
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function nearestBuoy(lat: number, lon: number): { code: string; name: string; distKm: number } | null {
  let best: { code: string; name: string; distKm: number } | null = null;
  for (const b of BUOYS) {
    const d = haversineKm(lat, lon, b.lat, b.lon);
    if (!best || d < best.distKm) best = { code: b.code, name: b.name, distKm: d };
  }
  return best && best.distKm <= MAX_DIST_KM ? best : null;
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseObsTime(s: string): Date {
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!m) return new Date(0);
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
}

// 세션 내 캐시 — 부이 관측은 5분 간격이므로 5분만 캐시
const cache = new Map<string, { at: number; obs: BuoyObs | null }>();
const CACHE_MS = 5 * 60_000;

/** 지점에서 가장 가까운 부이의 최신 실측값. 부이가 멀거나 실패하면 null */
export async function getBuoyObs(station: Station): Promise<BuoyObs | null> {
  const key = getKhoaKey();
  if (!key) return null;
  const near = nearestBuoy(station.lat, station.lon);
  if (!near) return null;

  const hit = cache.get(near.code);
  if (hit && Date.now() - hit.at < CACHE_MS) {
    return hit.obs ? { ...hit.obs, distanceKm: near.distKm } : null;
  }

  try {
    const keyParam = key.includes('%') ? key : encodeURIComponent(key);
    const url = `${ENDPOINT}?serviceKey=${keyParam}&type=json&numOfRows=1&obsCode=${near.code}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as {
      header?: { resultCode?: string };
      body?: { items?: { item?: unknown } };
    };
    if (json.header?.resultCode !== '00') throw new Error('API 오류');
    const raw = json.body?.items?.item;
    const row = (Array.isArray(raw) ? raw[0] : raw) as
      | { obsrvnDt?: string; wvhgt?: unknown; wtem?: unknown; wspd?: unknown; wndrct?: unknown }
      | undefined;
    if (!row?.obsrvnDt) throw new Error('데이터 없음');

    const time = parseObsTime(row.obsrvnDt);
    let obs: BuoyObs | null = null;
    if (Date.now() - time.getTime() <= MAX_AGE_MS) {
      obs = {
        buoyName: near.name,
        distanceKm: near.distKm,
        time,
        waveHeight: num(row.wvhgt),
        waterTemp: num(row.wtem),
        windSpeed: num(row.wspd),
        windDir: num(row.wndrct),
      };
      // 쓸만한 값이 하나도 없으면 표시하지 않는다
      if (obs.waveHeight === null && obs.waterTemp === null && obs.windSpeed === null) obs = null;
    }
    cache.set(near.code, { at: Date.now(), obs });
    return obs;
  } catch {
    cache.set(near.code, { at: Date.now(), obs: null });
    return null;
  }
}
