// 해수욕지수·갯벌체험지수 API의 전국 지점 목록과 앱 지점을 대조해
// 아직 없는 바다를 src/data/stations/extra.ts 로 생성하는 1회성 스크립트
// 실행: node scripts/genExtraStations.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// ── API 키 (.env.local의 VITE_KHOA_KEY) ──
const env = readFileSync(join(root, '.env.local'), 'utf8');
const keyMatch = env.match(/VITE_KHOA_KEY\s*=\s*(\S+)/);
if (!keyMatch) throw new Error('.env.local에 VITE_KHOA_KEY가 없습니다');
const KEY = keyMatch[1];

const BASE = 'https://apis.data.go.kr/1192136';

async function fetchPage(path, params, pageNo) {
  const url = `${BASE}/${path}?serviceKey=${KEY}&type=json&numOfRows=300&pageNo=${pageNo}${params}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.header?.resultCode !== '00') throw new Error(`${path} 오류: ${json.header?.resultMsg}`);
  const raw = json.body?.items?.item;
  return { rows: Array.isArray(raw) ? raw : raw ? [raw] : [], total: Number(json.body?.totalCount ?? 0) };
}

async function fetchAll(path, params) {
  const first = await fetchPage(path, params, 1);
  const pages = Math.min(10, Math.ceil(first.total / 300));
  let rows = first.rows;
  for (let p = 2; p <= pages; p++) rows = rows.concat((await fetchPage(path, params, p)).rows);
  return rows;
}

function reqDate() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

// ── 기존 지점 파싱 (stations/*.ts 정규식) ──
const stDir = join(root, 'src', 'data', 'stations');
const existing = [];
for (const f of readdirSync(stDir)) {
  if (!f.endsWith('.ts') || f === 'extra.ts') continue;
  const src = readFileSync(join(stDir, f), 'utf8');
  const re = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*region:\s*'(\w+)',\s*lat:\s*([\d.]+),\s*lon:\s*([\d.]+),\s*mudflat:\s*(true|false),\s*group:\s*'([^']+)',\s*province:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src))) {
    existing.push({ id: m[1], name: m[2], region: m[3], lat: +m[4], lon: +m[5], mudflat: m[6] === 'true', group: m[7], province: m[8] });
  }
}
console.log(`기존 지점 ${existing.length}개 파싱`);
const existingOrder = new Map(existing.map((s, i) => [s.id, i]));

function havKm(a, b, c, d) {
  const R = 6371, r = (x) => (x * Math.PI) / 180;
  const dLat = r(c - a), dLon = r(d - b);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function nearest(lat, lon, list) {
  let best = null, bd = Infinity;
  for (const s of list) {
    const d = havKm(lat, lon, s.lat, s.lon);
    if (d < bd) { bd = d; best = s; }
  }
  return { s: best, d: bd };
}

const dtStations = existing.filter((s) => s.id.startsWith('DT_'));

// ── API 지점 목록 수집 ──
const beachRows = await fetchAll('fcstBeachv2/GetFcstBeachApiServicev2', `&reqDate=${reqDate()}`);
const mudRows = await fetchAll('fcstMudflatv2/GetFcstMudflatApiServicev2', `&reqDate=${reqDate()}`);

const uniq = (rows, nameKey) => {
  const map = new Map();
  for (const r of rows) {
    const n = r[nameKey];
    const lat = Number(r.lat), lon = Number(r.lot);
    if (!n || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (!map.has(n)) map.set(n, { name: n, lat, lon });
  }
  return [...map.values()];
};

const beaches = uniq(beachRows, 'bbchNm');
const villages = uniq(mudRows, 'mdftExpcnVlgNm');
console.log(`해수욕장 ${beaches.length}곳 · 갯벌체험마을 ${villages.length}곳 수신`);

// ── 신규 지점 판정 ──
const NEW_DIST_KM = 2.0; // 이 거리 안에 기존 지점이 있으면 같은 바다로 본다
const out = [];
let skipped = 0;

function consider(place, isMudflat) {
  const dup = nearest(place.lat, place.lon, existing);
  const sameName = existing.some((s) => s.name === place.name || s.name.startsWith(place.name));
  if (dup.d <= NEW_DIST_KM || sameName) { skipped++; return; }
  const near = dup.s; // 가장 가까운 기존 지점에서 지역·행정구역 상속
  const dt = nearest(place.lat, place.lon, dtStations);
  out.push({
    name: place.name, lat: place.lat, lon: place.lon,
    mudflat: isMudflat,
    region: near.region, group: near.group, province: near.province,
    code: dt.s.id, order: existingOrder.get(near.id) ?? 0, nearName: near.name, nearKm: dup.d.toFixed(1),
  });
}

for (const b of beaches) consider(b, false);
for (const v of villages) consider(v, true);

// 신규끼리 중복 제거 (같은 이름 or 1km 이내)
const dedup = [];
for (const n of out) {
  if (dedup.some((x) => x.name === n.name || havKm(x.lat, x.lon, n.lat, n.lon) < 1.0)) continue;
  dedup.push(n);
}
dedup.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'ko'));
console.log(`신규 ${dedup.length}곳 (중복 제외 ${skipped}곳)`);

// ── extra.ts 생성 ──
let i = 0;
const lines = dedup.map((s) => {
  const id = `PT_X_${String(++i).padStart(3, '0')}`;
  s.id = id;
  return `  { id: '${id}', name: '${s.name}', region: '${s.region}', lat: ${s.lat}, lon: ${s.lon}, mudflat: ${s.mudflat}, group: '${s.group}', province: '${s.province}' }, // ${s.nearName} 인근 ${s.nearKm}km`;
});
const codeLines = dedup.map((s) => `  ${s.id}: '${s.code}',`);

const file = `import type { Station } from '../../types';

// 국립해양조사원 해수욕지수·갯벌체험지수 API의 전국 지점 목록에서 추가한 바다들
// (scripts/genExtraStations.mjs 로 생성 — 기존 지점 2km 이내는 제외)
export const STATIONS_X: Station[] = [
${lines.join('\n')}
];

export const CODE_MAP_X: Record<string, string> = {
${codeLines.join('\n')}
};
`;
writeFileSync(join(stDir, 'extra.ts'), file, 'utf8');
console.log('src/data/stations/extra.ts 생성 완료');
for (const s of dedup) console.log(`+ ${s.name} (${s.province} ${s.group})${s.mudflat ? ' 🦀' : ''}`);
