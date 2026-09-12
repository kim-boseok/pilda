import type { DayTide, Station, SunInfo, TideProvider, WindInfo } from '../types';
import { demoProvider } from './demoProvider';
import { khoaProvider, getKhoaKey } from './khoaProvider';

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/**
 * KHOA 우선, 실패 시 데모 폴백 + station+date 메모리 캐시.
 */
class SafeProvider implements TideProvider {
  private tideCache = new Map<string, DayTide[]>();
  private windCache = new Map<string, WindInfo>();
  private primary: TideProvider;
  private fallback: TideProvider | null;

  constructor(primary: TideProvider, fallback: TideProvider | null) {
    this.primary = primary;
    this.fallback = fallback;
  }

  async getTides(stationId: string, date: Date): Promise<DayTide[]> {
    const key = `${stationId}|${dayKey(date)}`;
    const cached = this.tideCache.get(key);
    if (cached) return cached;

    let tides: DayTide[];
    try {
      tides = await this.primary.getTides(stationId, date);
    } catch (e) {
      if (!this.fallback) throw e;
      console.warn('[pilda] KHOA 실패 → 데모 데이터로 폴백:', e);
      tides = await this.fallback.getTides(stationId, date);
    }
    this.tideCache.set(key, tides);
    return tides;
  }

  async getWind(stationId: string, date: Date): Promise<WindInfo> {
    const key = `${stationId}|${dayKey(date)}`;
    const cached = this.windCache.get(key);
    if (cached) return cached;

    let wind: WindInfo;
    try {
      wind = await this.primary.getWind(stationId, date);
    } catch (e) {
      if (!this.fallback) throw e;
      wind = await this.fallback.getWind(stationId, date);
    }
    this.windCache.set(key, wind);
    return wind;
  }

  getSun(station: Station, date: Date): SunInfo {
    return this.primary.getSun(station, date);
  }
}

let instance: TideProvider | null = null;
let instanceUsedKhoa = false;

/**
 * localStorage에 KHOA 키가 있으면 khoa(+데모 폴백), 없으면 데모.
 * 키 존재 여부가 바뀌면 인스턴스 재생성.
 */
export function getProvider(): TideProvider {
  const hasKey = getKhoaKey() !== null;
  if (!instance || instanceUsedKhoa !== hasKey) {
    instance = hasKey
      ? new SafeProvider(khoaProvider, demoProvider)
      : new SafeProvider(demoProvider, null);
    instanceUsedKhoa = hasKey;
  }
  return instance;
}

/** 현재 실데이터(KHOA) 모드인지 — UI 배지 표시용 */
export function isLiveMode(): boolean {
  return getKhoaKey() !== null;
}
