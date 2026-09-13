// 필다 공유 타입 정의 — 모든 모듈은 이 계약을 따른다

/** 한국 해역 구분 */
export type SeaRegion = 'west' | 'south' | 'east';

/** 조석 관측 지점(포인트) */
export interface Station {
  id: string;           // KHOA 관측소 코드 또는 자체 id (예: 'DT_0001')
  name: string;         // 표시 이름 (예: '인천', '증도 우전해변')
  region: SeaRegion;
  lat: number;
  lon: number;
  /** 갯벌 체험 가능 지점 여부 (서해/남해 일부) */
  mudflat: boolean;
  /** 시·군·구 단위 그룹 라벨 (예: '옹진군', '신안군', '해운대·기장') */
  group: string;
  /** 광역 자치단체 (예: '인천광역시', '전남광주통합특별시') */
  province: string;
}

/** 고조(만조) 또는 저조(간조) 이벤트 */
export interface TideExtreme {
  time: Date;
  /** 조위 (cm, 관측 기준면 기준) */
  level: number;
  type: 'high' | 'low';
}

/** 하루치 조석 데이터 */
export interface DayTide {
  stationId: string;
  date: Date;              // 해당 일자 00:00 (KST)
  extremes: TideExtreme[]; // 시간순 3~4개
  /** 물때 (1~15물, 한국 서해 기준 표기) */
  mul: number;
  mulName: string;         // 예: '7물', '조금', '사리'
}

/** 특정 시각의 계산된 바다 상태 */
export interface SeaState {
  time: Date;
  /** 현재 조위 (cm) */
  level: number;
  /** 0(오늘 최저 간조)~1(오늘 최고 만조) 정규화 수위 — 애니메이션용 */
  ratio: number;
  /** 물이 들어오는 중(+) / 나가는 중(-) / 정조(0) */
  direction: 'rising' | 'falling' | 'slack';
  /** 시간당 수위 변화율 (cm/h) — 모션 속도에 활용 */
  rate: number;
  prev: TideExtreme;   // 직전 고/저조
  next: TideExtreme;   // 다음 고/저조
}

/** 일반인용 한줄 요약 */
export interface SeaSummary {
  /** 예: '지금 갯벌체험 딱 좋아요 🦀' */
  headline: string;
  /** 예: '17:40까지 물이 계속 빠져요' */
  detail: string;
  /** 추천 활동 태그 */
  tags: string[];
}

/** 바람/날씨 (간단) */
export interface WindInfo {
  speed: number;      // m/s
  direction: number;  // 0~360 (북 기준 시계방향, 바람이 불어오는 방향)
  directionName: string; // 예: '북서풍'
}

export interface SunInfo {
  sunrise: Date;
  sunset: Date;
}

/** 시간대별 하늘 상태 (기상청 단기예보 SKY/PTY/POP) */
export interface HourWeather {
  time: Date;
  /** 하늘: 1 맑음 · 3 구름많음 · 4 흐림 */
  sky: number;
  /** 강수형태: 0 없음 · 1 비 · 2 비/눈 · 3 눈 · 4 소나기 */
  pty: number;
  /** 강수확률 % */
  pop: number;
}

export interface WeatherInfo {
  hours: HourWeather[];
  source: 'kma' | 'demo';
}

/** 조석 데이터 공급자 인터페이스 — 데모/KHOA 모두 구현 */
export interface TideProvider {
  /** date가 속한 날 포함 전후 하루씩, 총 3일치 반환 (보간 경계 처리용) */
  getTides(stationId: string, date: Date): Promise<DayTide[]>;
  getWind(stationId: string, date: Date): Promise<WindInfo>;
  getSun(station: Station, date: Date): SunInfo;
  /** 시간대별 하늘/강수 예보 — 씬 연출용 */
  getWeather(station: Station, date: Date): Promise<WeatherInfo>;
}
