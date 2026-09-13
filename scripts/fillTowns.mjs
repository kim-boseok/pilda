// 읍·면·동이 비어 있는 지점의 동 이름을 좌표로 역지오코딩해 찾는다
// (verifyTowns 리포트의 '읍면동 정보 없음' 목록을 메우기 위한 조사용 — 파일은 고치지 않는다)
// 실행: node scripts/fillTowns.mjs
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const stDir = join(root, 'src', 'data', 'stations');
const UA = { 'User-Agent': 'pilda-address-verify/1.0 (kimbos2ok@gmail.com)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const IDS = [
  'DT_0020', 'PT_E_GANGDONG', 'PT_E_HUJIN', 'PT_E_SAMCHEOK_BEACH', 'DT_0057',
  'PT_E_GYEONGPO', 'DT_0016', 'PT_S_MOSAGEUM', 'DT_0049', 'DT_0061',
  'PT_S_JANGSEUNGPO', 'DT_0062', 'DT_0005', 'DT_0010', 'PT_J_JAGURI',
  'PT_WJ_BUKHANG', 'DT_0007', 'PT_WJ_SAMHAKDO', 'PT_WJ_YUDAL', 'DT_0044',
  'DT_0018', 'PT_X_005',
];

const stations = new Map();
for (const f of readdirSync(stDir)) {
  if (!f.endsWith('.ts') || f === 'addresses.ts' || f === 'tourInfo.ts') continue;
  const src = readFileSync(join(stDir, f), 'utf8');
  const re = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',[^}]*?lat:\s*([\d.]+),\s*lon:\s*([\d.]+)/g;
  let m;
  while ((m = re.exec(src))) stations.set(m[1], { id: m[1], name: m[2], lat: +m[3], lon: +m[4] });
}

const addrs = new Map();
{
  const re = /^\s*'?([A-Za-z0-9_]+)'?:\s*'([^']*)'/gm;
  const src = readFileSync(join(stDir, 'addresses.ts'), 'utf8');
  let m;
  while ((m = re.exec(src))) addrs.set(m[1], m[2]);
}

async function rev(lat, lon, zoom, tries = 0) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&zoom=${zoom}&format=jsonv2&accept-language=ko`,
    { headers: UA },
  );
  if (res.status === 429) {
    if (tries >= 5) throw new Error('429 반복');
    console.log(`  429 — ${2 ** tries * 30}초 쉬었다 재시도`);
    await sleep(2 ** tries * 30000);
    return rev(lat, lon, zoom, tries + 1);
  }
  const j = await res.json().catch(() => null);
  await sleep(1100);
  return j;
}

const lines = [];
for (const id of IDS) {
  const st = stations.get(id);
  if (!st) { lines.push(`! ${id} 지점 없음`); continue; }
  const a = await rev(st.lat, st.lon, 14);
  const ad = a?.address ?? {};
  // 항구는 바다 위 좌표라 육지 동이 안 잡힐 수 있다 → 넓은 줌으로 한 번 더
  const b = ad.quarter || ad.village || ad.suburb || ad.town ? null : await rev(st.lat, st.lon, 12);
  const bd = b?.address ?? {};
  const pick = (o) => o.quarter || o.village || o.suburb || o.town || o.city_district || '';
  lines.push(
    `${id.padEnd(20)} ${st.name.padEnd(20)} 현주소: ${addrs.get(id) ?? '—'}\n` +
      `${''.padEnd(20)} ${''.padEnd(20)} z14: ${pick(ad) || '—'} | ${a?.display_name ?? '—'}\n` +
      (b ? `${''.padEnd(20)} ${''.padEnd(20)} z12: ${pick(bd) || '—'} | ${b?.display_name ?? '—'}\n` : ''),
  );
  console.log(lines[lines.length - 1]);
}

writeFileSync(join(root, 'scripts', 'fillTowns.report.txt'), lines.join('\n'), 'utf8');
