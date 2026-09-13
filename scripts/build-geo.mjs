// 시·도 GeoJSON(kostat 2013 simple) → 앱용 경량 TS 데이터
// 사용: node scripts/build-geo.mjs  (프로젝트 루트의 scripts_geo_raw.json 필요)
// 원본: https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2013/json/skorea_provinces_geo_simple.json
import { readFileSync, writeFileSync } from 'node:fs';

const raw = JSON.parse(readFileSync('scripts_geo_raw.json', 'utf8'));

// 시·도 → 앱 권역(자치도 구역) 매핑
const ZONE_OF = {
  서울특별시: '경기·인천', 인천광역시: '경기·인천', 경기도: '경기·인천',
  강원도: '강원',
  충청북도: '충청', 충청남도: '충청', 대전광역시: '충청', 세종특별자치시: '충청',
  전라북도: '전북',
  전라남도: '전남·광주', 광주광역시: '전남·광주',
  경상북도: '경북', 대구광역시: '경북',
  경상남도: '경남·부산', 부산광역시: '경남·부산', 울산광역시: '경남·부산',
  제주특별자치도: '제주',
};

// Douglas-Peucker 단순화 (경위도 기준 허용 오차)
function simplify(ring, tol) {
  if (ring.length <= 4) return ring;
  const keep = new Array(ring.length).fill(false);
  keep[0] = keep[ring.length - 1] = true;
  const stack = [[0, ring.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let maxD = 0, idx = -1;
    const [ax, ay] = ring[a], [bx, by] = ring[b];
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy || 1e-12;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = ring[i];
      const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
      const qx = ax + t * dx, qy = ay + t * dy;
      const d = (px - qx) ** 2 + (py - qy) ** 2;
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (Math.sqrt(maxD) > tol && idx > 0) {
      keep[idx] = true;
      stack.push([a, idx], [idx, b]);
    }
  }
  return ring.filter((_, i) => keep[i]);
}

function ringBboxArea(ring) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of ring) {
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return (x1 - x0) * (y1 - y0);
}

const out = [];
let totalPts = 0;
for (const f of raw.features) {
  const name = f.properties.name;
  const zone = ZONE_OF[name];
  if (!zone) continue;
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  const rings = [];
  for (const poly of polys) {
    const outer = poly[0]; // 내부 구멍은 무시 (지도 스케일에서 불필요)
    const area = ringBboxArea(outer);
    const isEastIsland = outer[0][0] > 130; // 울릉도·독도는 크기와 무관하게 유지
    if (!isEastIsland && area < 0.004) continue; // 자잘한 섬 제거
    const tol = area > 0.1 ? 0.006 : 0.003; // 큰 땅은 더 과감히 단순화
    const s = simplify(outer, tol).map(([x, y]) => [Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000]);
    if (s.length >= 4) { rings.push(s); totalPts += s.length; }
  }
  if (rings.length) out.push({ name, zone, rings });
}

const ts = `// 자동 생성 파일 — scripts/build-geo.mjs 로 생성 (수정 금지)
// 출처: southkorea-maps (kostat 2013, 단순화) — 시·도 경계
export interface GeoProvince {
  name: string;
  zone: string;
  rings: [number, number][][];
}

export const PROVINCES: GeoProvince[] = ${JSON.stringify(out)};
`;
writeFileSync('src/data/koreaGeo.ts', ts);
console.log('provinces:', out.length, 'points:', totalPts, 'bytes:', Buffer.byteLength(ts));
