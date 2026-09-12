import type { Station } from '../types';
import { STATIONS_WN, CODE_MAP_WN } from './stations/westNorth';
import { STATIONS_WJ, CODE_MAP_WJ } from './stations/westJeonnam';
import { STATIONS_S, CODE_MAP_S } from './stations/south';
import { STATIONS_J, CODE_MAP_J } from './stations/jeju';
import { STATIONS_E, CODE_MAP_E } from './stations/east';

// 전국 지점 — 서해 북→남, 남해 서→동, 제주, 동해 남→북 (해안선 순서)
export const STATIONS: Station[] = [
  ...STATIONS_WN,
  ...STATIONS_WJ,
  ...STATIONS_S,
  ...STATIONS_J,
  ...STATIONS_E,
];

/** 가상 지점(PT_) → 검증된 KHOA 관측소 코드 */
const KHOA_CODE_MAP: Record<string, string> = {
  ...CODE_MAP_WN,
  ...CODE_MAP_WJ,
  ...CODE_MAP_S,
  ...CODE_MAP_J,
  ...CODE_MAP_E,
};

export function getKhoaCode(stationId: string): string {
  return KHOA_CODE_MAP[stationId] ?? stationId;
}

export function findStation(id: string): Station | undefined {
  return STATIONS.find((s) => s.id === id);
}
