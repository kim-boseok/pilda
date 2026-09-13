// 읍·면·동 주소 검증 — 지도 '면 단위' 레벨의 근거 데이터라 정확해야 한다
// 방법: '광역시도 시군구 읍면동'을 정방향 지오코딩해 그 중심과 지점 좌표의 거리를 잰다
//       면은 보통 반경 10km 안쪽이므로 크게 벗어나면 잘못 붙은 것
// 실행: node scripts/verifyTowns.mjs   (결과: scripts/verifyTowns.report.txt)
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
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

const stations = [];
for (const f of readdirSync(stDir)) {
  if (!f.endsWith('.ts') || f === 'addresses.ts' || f === 'tourInfo.ts') continue;
  const src = readFileSync(join(stDir, f), 'utf8');
  const re = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',[^}]*?lat:\s*([\d.]+),\s*lon:\s*([\d.]+),[^}]*?group:\s*'([^']+)',\s*province:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src)))
    stations.push({ id: m[1], name: m[2], lat: +m[3], lon: +m[4], group: m[5], province: m[6] });
}

const addrs = new Map();
{
  const re = /^\s*'?([A-Za-z0-9_]+)'?:\s*'([^']*)'/gm;
  const src = readFileSync(join(stDir, 'addresses.ts'), 'utf8');
  let m;
  while ((m = re.exec(src))) addrs.set(m[1], m[2]);
}

// 주소 → 읍·면·동 토큰
function split(addr) {
  if (!addr) return null;
  const parts = addr.split(/\s+/);
  let gi = parts.findIndex((p, i) => i > 0 && /(시|군|구)$/.test(p));
  if (gi < 0) return null;
  if (gi + 1 < parts.length && /구$/.test(parts[gi + 1])) gi++;
  const town = parts[gi + 1];
  if (!town || !/(읍|면|동)$/.test(town)) return null;
  return { head: parts.slice(0, gi + 1).join(' '), town };
}

const cache = new Map();
// Nominatim은 과하게 두드리면 429를 돌려준다. 그냥 넘기면 "검색불가"로 잘못 집계되므로
// 반드시 물러났다가 다시 묻는다 (0.5·1·2·4·8분)
async function geocode(q, tries = 0) {
  if (cache.has(q)) return cache.get(q);
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=kr&format=jsonv2&accept-language=ko&limit=1`,
    { headers: UA },
  );
  if (res.status === 429) {
    if (tries >= 5) throw new Error(`429 반복 — ${q}`);
    console.log(`  429 — ${2 ** tries * 30}초 쉬었다 재시도`);
    await sleep(2 ** tries * 30000);
    return geocode(q, tries + 1);
  }
  const j = await res.json().catch(() => []);
  const hit = j[0] ? { lat: +j[0].lat, lon: +j[0].lon, name: j[0].display_name } : null;
  cache.set(q, hit);
  await sleep(1100);
  return hit;
}

const out = [];
const bad = [];
const missing = [];
const none = [];
let n = 0;
for (const st of stations) {
  const s = split(addrs.get(st.id));
  if (!s) { missing.push(`${st.id} ${st.name} | ${addrs.get(st.id) ?? '—'}`); continue; }
  const q = `${s.head} ${s.town}`;
  const hit = await geocode(q);
  n++;
  if (n % 25 === 0) console.log(`... ${n}건 조회`);
  if (!hit) { none.push(`${st.name} | ${q}`); continue; }
  const km = havKm(st.lat, st.lon, hit.lat, hit.lon);
  const line = `${km.toFixed(1)}km  ${st.name.padEnd(18)} ${q}`;
  out.push(line);
  if (km > 12) bad.push(`${line}  | OSM: ${hit.name}`);
}

const report = [
  `[읍·면·동 검증] ${out.length}건 조회 · 12km 초과 ${bad.length} · 검색불가 ${none.length} · 읍면동 없음 ${missing.length}`,
  '',
  '[면 중심에서 12km 초과 — 잘못 붙었을 가능성]',
  ...bad.sort((a, b) => parseFloat(b) - parseFloat(a)),
  '',
  '[검색 결과 없음 — 존재하지 않는 읍면동일 수 있음]',
  ...none,
  '',
  '[읍면동 정보 없음 — 시·군까지만]',
  ...missing,
].join('\n');
writeFileSync(join(root, 'scripts', 'verifyTowns.report.txt'), report, 'utf8');
console.log(report.slice(0, 4000));
