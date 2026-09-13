import type { Station } from '../types';
import { STATIONS_WN, CODE_MAP_WN } from './stations/westNorth';
import { STATIONS_WJ, CODE_MAP_WJ } from './stations/westJeonnam';
import { STATIONS_S, CODE_MAP_S } from './stations/south';
import { STATIONS_J, CODE_MAP_J } from './stations/jeju';
import { STATIONS_E, CODE_MAP_E } from './stations/east';
import { STATIONS_X, CODE_MAP_X } from './stations/extra';
import { ADDRESSES } from './stations/addresses';
import { TOUR_INFO } from './stations/tourInfo';

// 전국 지점 — 서해 북→남, 남해 서→동, 제주, 동해 남→북 (해안선 순서)
// STATIONS_X는 해양조사원 지수 API 목록에서 추가한 지점 (행정구역 그룹으로 자동 편입)
export const STATIONS: Station[] = [
  ...STATIONS_WN,
  ...STATIONS_WJ,
  ...STATIONS_S,
  ...STATIONS_J,
  ...STATIONS_E,
  ...STATIONS_X,
];

/** 가상 지점(PT_) → 검증된 KHOA 관측소 코드 */
const KHOA_CODE_MAP: Record<string, string> = {
  ...CODE_MAP_WN,
  ...CODE_MAP_WJ,
  ...CODE_MAP_S,
  ...CODE_MAP_J,
  ...CODE_MAP_E,
  ...CODE_MAP_X,
};

export function getKhoaCode(stationId: string): string {
  return KHOA_CODE_MAP[stationId] ?? stationId;
}

export function findStation(id: string): Station | undefined {
  return STATIONS.find((s) => s.id === id);
}

/**
 * 지점 주소 — 길찾기에 바로 붙여넣을 수 있는 가장 상세한 것을 고른다
 * ① 한국관광공사 공식 주소(도로명·지번까지) ② OSM 읍·면·동 ③ 광역시도+시군구
 */
export function getAddress(station: Station): string {
  const tour = TOUR_INFO[station.id]?.addr;
  if (tour) return tour;
  return ADDRESSES[station.id] ?? `${station.province} ${station.group}`;
}

/** 지점 소개 정보 (사진·소개글·전화·주차 등) — 없을 수 있다 */
export function getTourInfo(station: Station) {
  return TOUR_INFO[station.id];
}
