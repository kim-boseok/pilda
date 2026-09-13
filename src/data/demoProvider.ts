import type {
  DayTide, HourWeather, Station, SunInfo, TideExtreme, TideProvider, WeatherInfo, WindInfo,
} from '../types';

// ── 천문 상수 ──
const M2_HOURS = 12.4206;          // 반일주조 M2 주기 (h)
const SYNODIC_DAYS = 29.53059;     // 삭망월 (d)
const HALF_SYNODIC = SYNODIC_DAYS / 2; // 스프링-닙 사이클 (d)
const NEW_MOON_REF_MS = Date.UTC(2000, 0, 6, 18, 14); // 기준 신월

const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

// ─────────────────────────────────────────────
// 음력/물때 (khoaProvider와 공유)
// ─────────────────────────────────────────────

/** 신월 기준 경과일 (0 ≤ age < 29.53) */
export function lunarAge(date: Date): number {
  const days = (date.getTime() - NEW_MOON_REF_MS) / MS_PER_DAY;
  return ((days % SYNODIC_DAYS) + SYNODIC_DAYS) % SYNODIC_DAYS;
}

/** 물때 1~15물 (서해 7물때식: 삭·망 = 7물 사리) */
export function getMul(date: Date): number {
  const idx = Math.floor(lunarAge(date) + 0.5) % 15;
  return ((idx + 6) % 15) + 1;
}

export function getMulName(mul: number): string {
  if (mul === 7) return '사리';
  if (mul === 14) return '조금';
  if (mul === 15) return '무시';
  return `${mul}물`;
}

/** 사리(1.45)~조금(0.55) 진폭 변조 계수 */
export function springNeapFactor(date: Date): number {
  return 1 + 0.45 * Math.cos((2 * Math.PI * lunarAge(date)) / HALF_SYNODIC);
}

// ─────────────────────────────────────────────
// 결정적 시드
// ─────────────────────────────────────────────

function hashString(s: string): number {
  // FNV-1a 32bit
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** [0, 1) 결정적 의사난수 */
function unitHash(s: string): number {
  return hashString(s) / 0x100000000;
}

// ─────────────────────────────────────────────
// 지점별 평균 진폭 (cm, 조위 반진폭)
// ─────────────────────────────────────────────

const MEAN_AMP: Record<string, number> = {
  DT_0001: 285, DT_0032: 300, DT_0008: 270, DT_0043: 265, DT_0002: 290,
  DT_0017: 240, DT_0050: 220, DT_0025: 215, DT_0024: 205,
  DT_0018: 200, DT_0015: 185,
  DT_0003: 175, PT_JEUNGDO: 135, DT_0007: 130, DT_0028: 120,
  DT_0027: 115, DT_0029: 85, DT_0016: 95,
  DT_0014: 75, DT_0031: 70, DT_0035: 55, DT_0005: 40,
  DT_0004: 75, DT_0010: 85, DT_0023: 80,
  DT_0020: 12, DT_0022: 8, DT_0011: 8, DT_0006: 9, DT_0012: 10, DT_0013: 7,
};

function meanAmp(stationId: string): number {
  return MEAN_AMP[stationId] ?? 100 + unitHash(stationId) * 100;
}

// ─────────────────────────────────────────────
// 조석 생성
// ─────────────────────────────────────────────

function localMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function buildDayTide(stationId: string, dayStart: Date): DayTide {
  const A = meanAmp(stationId);
  const z0 = A * 1.55; // 기준면 위 평균 해면
  const phaseHours = unitHash(stationId) * M2_HOURS;      // 지점별 고조 위상
  const diurnalPhase = unitHash(stationId + ':d') * 2 * Math.PI;

  const startH = dayStart.getTime() / MS_PER_HOUR;
  const endH = startH + 24;

  const extremes: TideExtreme[] = [];
  // 고조: t ≡ phase (mod M2), 저조: 반주기 오프셋
  for (const [offset, type] of [[0, 'high'], [M2_HOURS / 2, 'low']] as const) {
    const base = phaseHours + offset;
    let k = Math.ceil((startH - base) / M2_HOURS);
    for (; base + k * M2_HOURS < endH; k++) {
      const tH = base + k * M2_HOURS;
      const time = new Date(tH * MS_PER_HOUR);
      const amp = A * springNeapFactor(time);
      // 일조부등: 하루 두 번의 고조(저조) 높이가 서로 다르게
      const ineq = 1 + 0.13 * Math.cos((2 * Math.PI * tH) / 25.8193 + diurnalPhase);
      const level = type === 'high' ? z0 + amp * ineq : z0 - amp * ineq;
      extremes.push({ time, level: Math.round(Math.max(level, 2)), type });
    }
  }
  extremes.sort((a, b) => a.time.getTime() - b.time.getTime());

  const mul = getMul(dayStart);
  return { stationId, date: dayStart, extremes, mul, mulName: getMulName(mul) };
}

// ─────────────────────────────────────────────
// 일출/일몰 (NOAA 간이 공식)
// ─────────────────────────────────────────────

export function computeSun(station: Station, date: Date): SunInfo {
  const d0 = localMidnight(date);
  const start = new Date(d0.getFullYear(), 0, 1);
  const doy = Math.round((d0.getTime() - start.getTime()) / MS_PER_DAY) + 1;
  const g = ((2 * Math.PI) / 365) * (doy - 1 + 0.5); // fractional year (정오 기준)

  const eqtime =
    229.18 *
    (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) -
      0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl =
    0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) -
    0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) -
    0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);

  const latR = (station.lat * Math.PI) / 180;
  const zenith = (90.833 * Math.PI) / 180;
  const cosHa =
    Math.cos(zenith) / (Math.cos(latR) * Math.cos(decl)) - Math.tan(latR) * Math.tan(decl);
  const ha = (Math.acos(Math.min(1, Math.max(-1, cosHa))) * 180) / Math.PI;

  // UTC 분 → KST(+540분)
  const sunriseMin = 720 - 4 * (station.lon + ha) - eqtime + 540;
  const sunsetMin = 720 - 4 * (station.lon - ha) - eqtime + 540;

  return {
    sunrise: new Date(d0.getTime() + sunriseMin * 60_000),
    sunset: new Date(d0.getTime() + sunsetMin * 60_000),
  };
}

// ─────────────────────────────────────────────
// 바람 (시드 기반)
// ─────────────────────────────────────────────

const DIR_NAMES = ['북풍', '북동풍', '동풍', '남동풍', '남풍', '남서풍', '서풍', '북서풍'];

export function computeWind(stationId: string, date: Date): WindInfo {
  const key = `${stationId}:${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  const u1 = unitHash(key + ':spd');
  const u2 = unitHash(key + ':dir');
  const speed = Math.round((1.5 + u1 * 8) * 10) / 10;
  const idx = Math.floor(u2 * 8);
  const direction = idx * 45 + Math.round((unitHash(key + ':jit') - 0.5) * 20);
  return {
    speed,
    direction: ((direction % 360) + 360) % 360,
    directionName: DIR_NAMES[idx],
  };
}

// ─────────────────────────────────────────────
// 날씨 (시드 기반 — 하루 단위 분위기 + 시간대별 변주)
// ─────────────────────────────────────────────

export function computeWeather(stationId: string, date: Date): WeatherInfo {
  const d0 = localMidnight(date);
  const hours: HourWeather[] = [];
  for (let day = -1; day <= 2; day++) {
    const dayStart = new Date(d0.getTime() + day * MS_PER_DAY);
    const key = `${stationId}:${dayStart.getFullYear()}-${dayStart.getMonth()}-${dayStart.getDate()}`;
    const mood = unitHash(key + ':wx'); // 하루 분위기: 맑음/구름/비
    for (let h = 0; h < 24; h++) {
      const u = unitHash(key + ':h' + h);
      let sky = 1;
      let pty = 0;
      let pop = 10;
      if (mood > 0.86) {
        sky = 4;
        pty = u > 0.45 ? 1 : 0;
        pop = 70;
      } else if (mood > 0.62) {
        sky = u > 0.5 ? 3 : 4;
        pop = 30;
      } else if (u > 0.78) {
        sky = 3;
        pop = 20;
      }
      hours.push({ time: new Date(dayStart.getTime() + h * MS_PER_HOUR), sky, pty, pop });
    }
  }
  return { hours, source: 'demo' };
}

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

export const demoProvider: TideProvider = {
  async getTides(stationId: string, date: Date): Promise<DayTide[]> {
    const d0 = localMidnight(date);
    return [-1, 0, 1].map((off) =>
      buildDayTide(stationId, new Date(d0.getTime() + off * MS_PER_DAY)),
    );
  },

  async getWind(stationId: string, date: Date): Promise<WindInfo> {
    return computeWind(stationId, date);
  },

  getSun(station: Station, date: Date): SunInfo {
    return computeSun(station, date);
  },

  async getWeather(station: Station, date: Date): Promise<WeatherInfo> {
    return computeWeather(station.id, date);
  },
};
