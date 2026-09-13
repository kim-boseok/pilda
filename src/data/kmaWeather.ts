// 기상청 단기예보 (VilageFcstInfoService_2.0) — 시간대별 하늘/강수
// 공공데이터포털 키 그대로 사용, 프록시(/api/khoa → apis.data.go.kr) 경유
import type { HourWeather, WeatherInfo } from '../types';

const ENDPOINT = '/api/khoa/1360000/VilageFcstInfoService_2.0/getVilageFcst';

/** 기상청 LCC DFS 격자 변환 (위경도 → nx, ny) — 기상청 공식 산식 */
export function latLonToGrid(lat: number, lon: number): { nx: number; ny: number } {
  const RE = 6371.00877; // 지구 반경 km
  const GRID = 5.0;      // 격자 간격 km
  const SLAT1 = 30.0 * (Math.PI / 180);
  const SLAT2 = 60.0 * (Math.PI / 180);
  const OLON = 126.0 * (Math.PI / 180);
  const OLAT = 38.0 * (Math.PI / 180);
  const XO = 43;
  const YO = 136;

  const re = RE / GRID;
  let sn = Math.tan(Math.PI * 0.25 + SLAT2 * 0.5) / Math.tan(Math.PI * 0.25 + SLAT1 * 0.5);
  sn = Math.log(Math.cos(SLAT1) / Math.cos(SLAT2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + SLAT1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(SLAT1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + OLAT * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + lat * (Math.PI / 180) * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lon * (Math.PI / 180) - OLON;
  if (theta > Math.PI) theta -= 2 * Math.PI;
  if (theta < -Math.PI) theta += 2 * Math.PI;
  theta *= sn;

  return {
    nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  };
}

/** 최신 발표 기준시각 (02·05·08·11·14·17·20·23시, 발표 후 여유 30분) */
function baseDateTime(now: Date): { base_date: string; base_time: string } {
  const t = new Date(now.getTime() - 30 * 60000);
  const HOURS = [23, 20, 17, 14, 11, 8, 5, 2];
  let day = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  let bh = HOURS.find((x) => x <= t.getHours());
  if (bh === undefined) {
    bh = 23;
    day = new Date(day.getTime() - 86_400_000);
  }
  const p = (n: number) => String(n).padStart(2, '0');
  return {
    base_date: `${day.getFullYear()}${p(day.getMonth() + 1)}${p(day.getDate())}`,
    base_time: `${p(bh)}00`,
  };
}

interface KmaItem {
  category: string;
  fcstDate: string;  // 'YYYYMMDD'
  fcstTime: string;  // 'HHMM'
  fcstValue: string;
}

export async function fetchKmaWeather(lat: number, lon: number, key: string): Promise<WeatherInfo> {
  const { nx, ny } = latLonToGrid(lat, lon);
  const { base_date, base_time } = baseDateTime(new Date());
  const keyParam = key.includes('%') ? key : encodeURIComponent(key);
  const url =
    `${ENDPOINT}?serviceKey=${keyParam}&pageNo=1&numOfRows=900&dataType=JSON` +
    `&base_date=${base_date}&base_time=${base_time}&nx=${nx}&ny=${ny}`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    throw new Error(`기상청 API 네트워크 오류: ${String(e)}`);
  }
  if (!res.ok) throw new Error(`기상청 API HTTP ${res.status}`);

  const json: unknown = await res.json();
  const parsed = json as {
    response?: {
      header?: { resultCode?: string; resultMsg?: string };
      body?: { items?: { item?: unknown } };
    };
  };
  const header = parsed.response?.header;
  if (header?.resultCode !== '00') {
    throw new Error(`기상청 API 오류: ${header?.resultCode} ${header?.resultMsg ?? ''}`);
  }
  const rawItem = parsed.response?.body?.items?.item;
  const items = (Array.isArray(rawItem) ? rawItem : rawItem ? [rawItem] : []) as KmaItem[];

  // fcstDate+fcstTime 별로 SKY/PTY/POP 모으기
  const map = new Map<string, { sky?: number; pty?: number; pop?: number }>();
  for (const it of items) {
    if (it.category !== 'SKY' && it.category !== 'PTY' && it.category !== 'POP') continue;
    const k = it.fcstDate + it.fcstTime;
    let e = map.get(k);
    if (!e) {
      e = {};
      map.set(k, e);
    }
    if (it.category === 'SKY') e.sky = Number(it.fcstValue);
    else if (it.category === 'PTY') e.pty = Number(it.fcstValue);
    else e.pop = Number(it.fcstValue);
  }

  const hours: HourWeather[] = [];
  for (const [k, v] of map) {
    if (v.sky === undefined && v.pty === undefined) continue;
    hours.push({
      time: new Date(+k.slice(0, 4), +k.slice(4, 6) - 1, +k.slice(6, 8), +k.slice(8, 10)),
      sky: v.sky ?? 1,
      pty: v.pty ?? 0,
      pop: v.pop ?? 0,
    });
  }
  hours.sort((a, b) => a.time.getTime() - b.time.getTime());
  if (hours.length === 0) throw new Error('기상청 예보 응답에 데이터가 없습니다');
  return { hours, source: 'kma' };
}

/** 보고 있는 시각에 가장 가까운 시간대 예보 */
export function pickHour(wx: WeatherInfo | null, time: Date): HourWeather | null {
  if (!wx || wx.hours.length === 0) return null;
  let best = wx.hours[0];
  let bd = Infinity;
  for (const hw of wx.hours) {
    const d = Math.abs(hw.time.getTime() - time.getTime());
    if (d < bd) {
      bd = d;
      best = hw;
    }
  }
  // 예보 범위에서 3시간 넘게 벗어나면 신뢰 불가 → 없음 처리
  return bd <= 3 * 3_600_000 ? best : null;
}

/** 하늘 상태 → 구름량 0~1 (씬 연출용) */
export function cloudCoverOf(hw: HourWeather | null): number {
  if (!hw) return 0.15;
  if (hw.pty > 0) return 0.92;
  return hw.sky >= 4 ? 0.88 : hw.sky >= 3 ? 0.5 : 0.08;
}

/** 강수형태 → 씬 강수 종류 */
export function precipOf(hw: HourWeather | null): 'none' | 'rain' | 'snow' {
  if (!hw || hw.pty === 0) return 'none';
  return hw.pty === 3 ? 'snow' : 'rain'; // 2(비/눈)·4(소나기)는 비로 표현
}

/** 날씨 이모지 — 씬 상단 칩 표시용 */
export function weatherEmoji(hw: HourWeather | null, isNight: boolean): string {
  if (!hw) return '';
  if (hw.pty === 3) return '🌨️';
  if (hw.pty > 0) return '🌧️';
  if (hw.sky >= 4) return '☁️';
  if (hw.sky >= 3) return isNight ? '☁️' : '⛅';
  return isNight ? '🌙' : '☀️';
}
