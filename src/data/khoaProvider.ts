import type {
  DayTide, Station, SunInfo, TideExtreme, TideProvider, WeatherInfo, WindInfo,
} from '../types';
import { getKhoaCode } from './stations';
import { computeSun, computeWind, getMul, getMulName } from './demoProvider';
import { fetchKmaWeather } from './kmaWeather';

export const KHOA_KEY_STORAGE = 'pilda_khoa_key';

// 공공데이터포털 신형 API — 개발 서버 프록시(/api/khoa)를 경유해 CORS 우회
const ENDPOINT = '/api/khoa/1192136/tideFcstHghLw/GetTideFcstHghLwApiService';
const MS_PER_DAY = 86_400_000;

export function getKhoaKey(): string | null {
  try {
    const key = localStorage.getItem(KHOA_KEY_STORAGE);
    if (key && key.trim()) return key.trim();
  } catch {
    // localStorage 접근 불가 환경이면 env로 진행
  }
  const envKey = import.meta.env.VITE_KHOA_KEY as string | undefined;
  return envKey && envKey.trim() ? envKey.trim() : null;
}

interface KhoaFcstRow {
  predcDt: string;      // 'YYYY-MM-DD HH:mm'
  predcTdlvVl: number;  // 예측조위 cm
  extrSe: string;       // 1 오전고조, 2 오전저조, 3 오후고조, 4 오후저조
}

function yyyymmdd(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

/** 'YYYY-MM-DD HH:mm:ss' → KST 로컬 Date */
function parseKstTime(s: string): Date {
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) throw new Error(`KHOA 시각 파싱 실패: ${s}`);
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? '0'));
}

async function fetchDay(obsCode: string, stationId: string, dayStart: Date, key: string): Promise<DayTide> {
  // 포털 인증키는 이미 URL 인코딩된 형태로 제공되므로 재인코딩하지 않는다
  const keyParam = key.includes('%') ? key : encodeURIComponent(key);
  const url =
    `${ENDPOINT}?serviceKey=${keyParam}` +
    `&obsCode=${encodeURIComponent(obsCode)}&reqDate=${yyyymmdd(dayStart)}&type=json&numOfRows=300`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    throw new Error(`KHOA API 네트워크 오류 (${obsCode} ${yyyymmdd(dayStart)}): ${String(e)}`);
  }
  if (!res.ok) {
    throw new Error(`KHOA API HTTP ${res.status} (${obsCode} ${yyyymmdd(dayStart)})`);
  }

  const json: unknown = await res.json();
  const parsed = json as {
    header?: { resultCode?: string; resultMsg?: string };
    body?: { items?: { item?: unknown } };
  };
  if (parsed.header?.resultCode !== '00') {
    throw new Error(
      `KHOA API 오류 (${obsCode} ${yyyymmdd(dayStart)}): ${parsed.header?.resultCode} ${parsed.header?.resultMsg ?? ''}`,
    );
  }
  const rawItem = parsed.body?.items?.item;
  const rows = Array.isArray(rawItem) ? rawItem : rawItem ? [rawItem] : [];
  if (rows.length === 0) {
    throw new Error(`KHOA API 응답에 데이터가 없습니다 (${obsCode} ${yyyymmdd(dayStart)})`);
  }

  const extremes: TideExtreme[] = (rows as KhoaFcstRow[])
    .filter((r) => ['1', '2', '3', '4'].includes(String(r.extrSe)))
    .map((r) => ({
      time: parseKstTime(r.predcDt),
      level: Math.round(Number(r.predcTdlvVl)),
      type: String(r.extrSe) === '1' || String(r.extrSe) === '3' ? ('high' as const) : ('low' as const),
    }))
    .filter((e) => Number.isFinite(e.level))
    .sort((a, b) => a.time.getTime() - b.time.getTime());

  if (extremes.length === 0) {
    throw new Error(`KHOA API 고/저조 데이터가 비어 있습니다 (${obsCode} ${yyyymmdd(dayStart)})`);
  }

  const mul = getMul(dayStart);
  return { stationId, date: dayStart, extremes, mul, mulName: getMulName(mul) };
}

export const khoaProvider: TideProvider = {
  async getTides(stationId: string, date: Date): Promise<DayTide[]> {
    const key = getKhoaKey();
    if (!key) throw new Error('KHOA API 키가 없습니다 (localStorage pilda_khoa_key)');

    const obsCode = getKhoaCode(stationId);
    const d0 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return Promise.all(
      [-1, 0, 1].map((off) =>
        fetchDay(obsCode, stationId, new Date(d0.getTime() + off * MS_PER_DAY), key),
      ),
    );
  },

  // KHOA 조위 외 기상은 데모 로직 재사용 (결정적 근사)
  async getWind(stationId: string, date: Date): Promise<WindInfo> {
    return computeWind(stationId, date);
  },

  getSun(station: Station, date: Date): SunInfo {
    return computeSun(station, date);
  },

  // 하늘/강수는 기상청 단기예보 — 공공데이터포털 키 그대로 사용
  async getWeather(station: Station): Promise<WeatherInfo> {
    const key = getKhoaKey();
    if (!key) throw new Error('API 키가 없습니다');
    return fetchKmaWeather(station.lat, station.lon, key);
  },
};
