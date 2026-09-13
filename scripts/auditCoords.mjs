// 지점 좌표 전수 감사 — 한국관광공사 공식 좌표와 대조
//
// genTourData.mjs 는 "6km 이내"인 것만 채택하므로, 이름이 확실히 같은데 멀리 떨어진 경우
// (= 우리 좌표가 틀린 경우)는 그냥 '매칭 실패'로 조용히 지나간다.
// 이 스크립트는 거리 제한 없이 이름만 맞으면 거리를 출력해 좌표 오류를 드러낸다.
//
// scripts/.tourCache.json 만 읽으므로 API 호출이 없다 (무료·즉시).
// 실행: node scripts/auditCoords.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const stDir = join(root, 'src', 'data', 'stations');

const stations = [];
for (const f of readdirSync(stDir)) {
  if (!f.endsWith('.ts') || f === 'addresses.ts' || f === 'tourInfo.ts') continue;
  const src = readFileSync(join(stDir, f), 'utf8');
  const re = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*region:\s*'\w+',\s*lat:\s*([\d.]+),\s*lon:\s*([\d.]+)/g;
  let m;
  while ((m = re.exec(src))) stations.push({ id: m[1], name: m[2], lat: +m[3], lon: +m[4] });
}

const cache = JSON.parse(readFileSync(join(root, 'scripts', '.tourCache.json'), 'utf8'));

function havKm(a, b, c, d) {
  const R = 6371, r = (x) => (x * Math.PI) / 180;
  const dLat = r(c - a), dLon = r(d - b);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const norm = (s) =>
  s.replace(/\([^)]*\)/g, '').replace(/[\s·・]/g, '').replace(/해수욕장/g, '해변')
    .replace(/관광지|유원지|일원/g, '').trim();
const BIZ = /(호텔|펜션|모텔|리조트|카라반|캠핑|글램핑|콘도|게스트하우스|민박|풀빌라|카페|식당|횟집|마트|스테이|리버사이드|아파트|오토캠)/;
const BAD_TYPE = new Set(['32', '39', '38', '15']);

// 좌표 감사는 "완전 일치"만 믿는다 — 부분 일치는 옆 동네를 잡을 수 있어 오탐이 된다
function exactMatch(stationName, title) {
  if (BIZ.test(title)) return false;
  const a = norm(stationName), b = norm(title);
  return !!a && a === b;
}

const rows = [];
for (const s of stations) {
  const kw = s.name.replace(/\([^)]*\)/g, '').trim();
  const key = `searchKeyword2?keyword=${encodeURIComponent(kw)}&numOfRows=20`;
  const list = cache[key];
  if (!Array.isArray(list) || !list.length) continue;
  let best = null;
  for (const r of list) {
    if (BAD_TYPE.has(String(r.contenttypeid))) continue;
    if (!exactMatch(s.name, r.title)) continue;
    const d = havKm(s.lat, s.lon, +r.mapy, +r.mapx);
    if (!best || d < best.d) best = { d, r };
  }
  if (!best) continue;
  rows.push({ ...s, d: best.d, t: best.r.title, addr: best.r.addr1 ?? '', lat2: +best.r.mapy, lon2: +best.r.mapx });
}

rows.sort((a, b) => b.d - a.d);
const bad = rows.filter((r) => r.d > 3);
const lines = [
  `[좌표 감사] 이름 완전일치 ${rows.length}곳 대조 · 3km 초과 ${bad.length}곳`,
  '',
  '[관광공사 공식 좌표와 3km 이상 차이 — 우리 좌표가 틀렸을 가능성]',
];
for (const r of bad) {
  lines.push(
    `${r.d.toFixed(1).padStart(6)}km  ${r.id.padEnd(20)} ${r.name.padEnd(22)}` +
      ` 현재 ${r.lat},${r.lon} → 공식 ${r.lat2.toFixed(4)},${r.lon2.toFixed(4)}  | ${r.addr}`,
  );
}
const text = lines.join('\n') + '\n';
writeFileSync(join(root, 'scripts', 'auditCoords.report.txt'), text, 'utf8');
console.log(text);
