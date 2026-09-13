// addresses.ts의 주소를 정방향 지오코딩으로 역검증하는 스크립트
// "이 주소가 실제로 존재하는 행정구역인가?" + "그 위치가 해당 지점 좌표 근처인가?"를 확인
// (역지오코딩과 반대 방향으로 한 번 더 검사 — 정확성 최우선)
// 실행: node scripts/verifyAddresses.mjs
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const stDir = join(root, 'src', 'data', 'stations');

// 지점 좌표
const coords = new Map();
for (const f of readdirSync(stDir)) {
  if (!f.endsWith('.ts') || f === 'addresses.ts') continue;
  const src = readFileSync(join(stDir, f), 'utf8');
  const re = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*region:\s*'\w+',\s*lat:\s*([\d.]+),\s*lon:\s*([\d.]+)/g;
  let m;
  while ((m = re.exec(src))) coords.set(m[1], { name: m[2], lat: +m[3], lon: +m[4] });
}

// 주소 목록
const addrSrc = readFileSync(join(stDir, 'addresses.ts'), 'utf8');
const entries = [];
const re = /^\s*'?([A-Za-z0-9_]+)'?:\s*'([^']+)',/gm;
let m;
while ((m = re.exec(addrSrc))) entries.push({ id: m[1], addr: m[2] });
console.log(`주소 ${entries.length}개 · 좌표 ${coords.size}개`);

// OSM도 이미 '전남광주통합특별시'를 쓰므로 이름 변환 없이 그대로 조회한다
// (예전엔 '전라남도'로 바꿔 조회했는데, 그게 오히려 전남 지역 전체를 '검색 실패'로 만들었다)
function toQuery(addr) {
  return addr;
}

function havKm(a, b, c, d) {
  const R = 6371, r = (x) => (x * Math.PI) / 180;
  const dLat = r(c - a), dLon = r(d - b);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const cache = new Map();
async function geocode(q, attempt = 0) {
  if (cache.has(q)) return cache.get(q);
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=kr&format=jsonv2&accept-language=ko&limit=1`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'pilda-address-verify/1.0 (kimbos2ok@gmail.com)' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    const hit = j[0] ? { lat: +j[0].lat, lon: +j[0].lon, name: j[0].display_name } : null;
    cache.set(q, hit);
    await new Promise((r) => setTimeout(r, 1100));
    return hit;
  } catch (e) {
    if (attempt < 2) { await new Promise((r) => setTimeout(r, 3000)); return geocode(q, attempt + 1); }
    console.log(`  ! ${q}: ${e.message}`);
    return null;
  }
}

// 같은 주소는 한 번만 조회
const byAddr = new Map();
for (const e of entries) {
  if (!byAddr.has(e.addr)) byAddr.set(e.addr, []);
  byAddr.get(e.addr).push(e.id);
}
console.log(`고유 주소 ${byAddr.size}개 조회 시작 (약 ${Math.ceil(byAddr.size * 1.15 / 60)}분)`);

const FAR_KM = 20;   // 주소 중심에서 이보다 멀면 의심
const bad = [], far = [], ok = [];
let i = 0;
for (const [addr, ids] of byAddr) {
  const hit = await geocode(toQuery(addr));
  if (++i % 25 === 0) console.log(`${i}/${byAddr.size}…`);
  if (!hit) { bad.push(`${addr} → 검색 결과 없음 (${ids.join(', ')})`); continue; }
  // 이 주소를 쓰는 지점 중 가장 가까운 것과의 거리
  let best = Infinity, bestId = '';
  for (const id of ids) {
    const c = coords.get(id);
    if (!c) continue;
    const d = havKm(c.lat, c.lon, hit.lat, hit.lon);
    if (d < best) { best = d; bestId = id; }
  }
  if (best > FAR_KM) far.push(`${addr} → ${best.toFixed(1)}km (${bestId} ${coords.get(bestId)?.name}) | OSM: ${hit.name}`);
  else ok.push(addr);
}

const out = `[검증 결과]\n정상 ${ok.length} · 멀리 떨어짐 ${far.length} · 검색불가 ${bad.length}\n\n[검색 결과 없음 — 존재하지 않는 주소일 수 있음]\n${bad.join('\n')}\n\n[주소 중심에서 ${FAR_KM}km 초과 — 섬·먼바다면 정상일 수 있음]\n${far.join('\n')}\n`;
writeFileSync(join(root, 'scripts', 'verifyAddresses.report.txt'), out, 'utf8');
console.log(out.slice(0, 4000));
