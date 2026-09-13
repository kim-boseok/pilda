// TourAPI 좌표·주소 조회 (수동 확인용)
// 실행: node scripts/tourLookup.mjs "칠산타워" "설도항" ...
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const KEY = readFileSync(join(root, '.env.local'), 'utf8').match(/VITE_KHOA_KEY\s*=\s*(\S+)/)[1];
const BASE = 'https://apis.data.go.kr/B551011/KorService2';
const COMMON = `serviceKey=${KEY}&MobileOS=ETC&MobileApp=pilda&_type=json`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (const q of process.argv.slice(2)) {
  const res = await fetch(
    `${BASE}/searchKeyword2?${COMMON}&keyword=${encodeURIComponent(q)}&numOfRows=6&arrange=A`,
  );
  const j = await res.json().catch(() => null);
  const raw = j?.response?.body?.items?.item;
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  if (!list.length) { console.log(`${q} → 없음 (${j?.response?.header?.resultMsg ?? '?'})`); continue; }
  for (const it of list) {
    console.log(`${q.padEnd(12)} → ${(+it.mapy).toFixed(4)}, ${(+it.mapx).toFixed(4)} | ${it.title} | ${it.addr1 ?? ''}`);
  }
  console.log('');
  await sleep(200);
}
