// 인천 행정구역 개편(중구 → 영종구·제물포구) 반영 후 해당 12곳만 재검증
// 실행: node scripts/verifyIncheon.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const stDir = join(root, 'src', 'data', 'stations');
const UA = { 'User-Agent': 'pilda-address-verify/1.0 (kimbos2ok@gmail.com)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function havKm(a, b, c, d) {
  const R = 6371, r = (x) => (x * Math.PI) / 180;
  const dLat = r(c - a), dLon = r(d - b);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const coords = new Map();
for (const f of readdirSync(stDir)) {
  if (!f.endsWith('.ts')) continue;
  const src = readFileSync(join(stDir, f), 'utf8');
  const re = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*region:\s*'\w+',\s*lat:\s*([\d.]+),\s*lon:\s*([\d.]+)/g;
  let m;
  while ((m = re.exec(src))) coords.set(m[1], { name: m[2], lat: +m[3], lon: +m[4] });
}

const addrSrc = readFileSync(join(stDir, 'addresses.ts'), 'utf8');
const entries = new Map();
const re = /^\s*'?([A-Za-z0-9_]+)'?:\s*'([^']+)',/gm;
let m;
while ((m = re.exec(addrSrc))) entries.set(m[1], m[2]);

const IDS = ['DT_0044', 'PT_WN_YEDANPO', 'PT_WN_EULWANGRI', 'PT_WN_WANGSAN', 'PT_WN_YONGYU',
  'PT_WN_MASIAN', 'PT_WN_JAMJINDO', 'PT_WN_SILMIDO', 'PT_WN_HANAGAE', 'DT_0093',
  'PT_WN_WOLMIDO', 'DT_0001'];

let ok = 0, ng = 0;
for (const id of IDS) {
  const addr = entries.get(id);
  const c = coords.get(id);
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&countrycodes=kr&format=jsonv2&accept-language=ko&limit=1`,
    { headers: UA });
  const j = await res.json();
  await sleep(1200);
  if (!j[0]) { console.log(`✗ ${c.name} | ${addr} → 검색 결과 없음`); ng++; continue; }
  const km = havKm(c.lat, c.lon, +j[0].lat, +j[0].lon);
  if (km <= 20) ok++; else ng++;
  console.log(`${km <= 20 ? '○' : '✗'} ${c.name.padEnd(14)} ${addr.padEnd(24)} ${km.toFixed(1)}km`);
}
console.log(`\n정상 ${ok} · 이상 ${ng}`);
