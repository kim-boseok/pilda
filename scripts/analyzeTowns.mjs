// 지도 '면 단위' 레벨 도입 전 점검 — 지점별 읍·면·동 추출 커버리지와 묶음 크기
// 실행: node scripts/analyzeTowns.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const stDir = join(root, 'src', 'data', 'stations');

// 지점 목록 (id, name, group, province)
const stations = [];
for (const f of readdirSync(stDir)) {
  if (!f.endsWith('.ts') || f === 'addresses.ts' || f === 'tourInfo.ts') continue;
  const src = readFileSync(join(stDir, f), 'utf8');
  const re = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',[^}]*?lat:\s*([\d.]+),\s*lon:\s*([\d.]+),[^}]*?group:\s*'([^']+)',\s*province:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src)))
    stations.push({ id: m[1], name: m[2], lat: +m[3], lon: +m[4], group: m[5], province: m[6] });
}

const grab = (src) => {
  const map = new Map();
  const re = /^\s*'?([A-Za-z0-9_]+)'?:\s*'([^']*)'/gm;
  let m;
  while ((m = re.exec(src))) map.set(m[1], m[2]);
  return map;
};
const addrs = grab(readFileSync(join(stDir, 'addresses.ts'), 'utf8'));

// tourInfo는 한 줄에 여러 필드 → addr만 뽑는다
const tour = new Map();
{
  const src = readFileSync(join(stDir, 'tourInfo.ts'), 'utf8');
  const re = /^\s*(\w+):\s*\{\s*addr:\s*'([^']*)'/gm;
  let m;
  while ((m = re.exec(src))) tour.set(m[1], m[2]);
}

/** 주소에서 읍·면·동 토큰 추출 (시·군·구 다음 토큰) */
function townOf(addr) {
  if (!addr) return null;
  const parts = addr.split(/\s+/);
  // 시군구 인덱스 찾기
  let gi = parts.findIndex((p, i) => i > 0 && /(시|군|구)$/.test(p));
  if (gi < 0) return null;
  // '창원시 마산합포구'처럼 구가 한 번 더 나오면 뒤쪽을 기준으로
  if (gi + 1 < parts.length && /구$/.test(parts[gi + 1])) gi++;
  const t = parts[gi + 1];
  if (!t || !/(읍|면|동)$/.test(t)) return null;
  return t;
}

let withTown = 0;
const byGroup = new Map();
for (const st of stations) {
  const t = townOf(addrs.get(st.id)) ?? townOf(tour.get(st.id));
  st.town = t;
  if (t) withTown++;
  const key = `${st.province}|${st.group}`;
  if (!byGroup.has(key)) byGroup.set(key, []);
  byGroup.get(key).push(st);
}

console.log(`지점 ${stations.length}곳 · 읍면동 추출 ${withTown} (${((withTown / stations.length) * 100).toFixed(1)}%)`);
console.log(`\n[읍면동 없음]`);
for (const st of stations) if (!st.town) console.log(`  ${st.id} ${st.name} | ${addrs.get(st.id) ?? '—'}`);

console.log(`\n[지점 8곳 이상인 시·군 — 면 단위로 쪼갠 결과]`);
const big = [...byGroup.entries()].filter(([, v]) => v.length >= 8).sort((a, b) => b[1].length - a[1].length);
for (const [key, list] of big) {
  const towns = new Map();
  for (const st of list) {
    const t = st.town ?? '(없음)';
    if (!towns.has(t)) towns.set(t, []);
    towns.get(t).push(st.name);
  }
  console.log(`\n● ${key.split('|')[1]} (${list.length}곳 → ${towns.size}개 면)`);
  for (const [t, names] of [...towns.entries()].sort((a, b) => b[1].length - a[1].length))
    console.log(`   ${t.padEnd(8)} ${names.length}곳  ${names.join(', ')}`);
}
