// TourAPI(한국관광공사 국문 관광정보) 상세기능들이 필다에 어떤 값을 줄 수 있는지 조사
// 실행: node scripts/probeTourApi.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const KEY = readFileSync(join(root, '.env.local'), 'utf8').match(/VITE_KHOA_KEY\s*=\s*(\S+)/)[1];
const BASE = 'https://apis.data.go.kr/B551011/KorService2';
const COMMON = `serviceKey=${KEY}&MobileOS=ETC&MobileApp=pilda&_type=json`;

async function call(path, params) {
  const res = await fetch(`${BASE}/${path}?${COMMON}&${params}`);
  const j = await res.json();
  if (j.response?.header?.resultCode !== '0000') throw new Error(JSON.stringify(j.response?.header ?? j).slice(0, 200));
  const raw = j.response.body.items?.item;
  return Array.isArray(raw) ? raw : raw ? [raw] : [];
}

const show = (label, obj, keys) => {
  console.log(`\n── ${label} ──`);
  if (!obj) return console.log('(없음)');
  for (const [k, v] of Object.entries(obj)) {
    if (keys && !keys.includes(k)) continue;
    if (v === '' || v == null) continue;
    console.log(`  ${k}: ${String(v).replace(/<[^>]+>/g, '').slice(0, 160)}`);
  }
};

// 1) 위치기반 조회 — 대광해수욕장 주변
console.log('=== 1. locationBasedList2 (대광해수욕장 주변, 관광지만) ===');
const near = await call('locationBasedList2', 'mapX=126.062&mapY=35.093&radius=5000&numOfRows=10&arrange=E&contentTypeId=12');
for (const r of near) console.log(`  ${r.dist.padStart?.(6) ?? Math.round(r.dist)}m  ${r.title} | ${r.addr1} | img:${r.firstimage ? 'O' : 'X'} | id:${r.contentid}`);

// 2) 키워드 검색 — 이름으로 정확히 찾기
console.log('\n=== 2. searchKeyword2 ("대광해수욕장") ===');
const kw = await call('searchKeyword2', `keyword=${encodeURIComponent('대광해수욕장')}&numOfRows=5`);
for (const r of kw) console.log(`  ${r.title} | ${r.addr1} | type:${r.contenttypeid} | id:${r.contentid} | ${r.mapy},${r.mapx}`);

const id = kw[0]?.contentid ?? near[0]?.contentid;

// 3) 공통정보 — 주소·개요·길안내
console.log(`\n=== 3. detailCommon2 (contentid=${id}) ===`);
const common = await call('detailCommon2', `contentId=${id}`);
show('공통정보 전체 필드', common[0]);

// 4) 소개정보 — 관광지(12) 기준 편의시설
console.log(`\n=== 4. detailIntro2 (contentid=${id}, type=12) ===`);
try {
  const intro = await call('detailIntro2', `contentId=${id}&contentTypeId=12`);
  show('소개정보 전체 필드', intro[0]);
} catch (e) { console.log('  오류:', e.message); }

// 5) 이미지
console.log(`\n=== 5. detailImage2 (contentid=${id}) ===`);
try {
  const imgs = await call('detailImage2', `contentId=${id}&imageYN=Y`);
  console.log(`  ${imgs.length}장`);
  imgs.slice(0, 3).forEach((i) => console.log(`   - ${i.originimgurl}`));
} catch (e) { console.log('  오류:', e.message); }

// 6) 주변 음식점
console.log('\n=== 6. locationBasedList2 (주변 음식점 contentTypeId=39) ===');
try {
  const food = await call('locationBasedList2', 'mapX=126.062&mapY=35.093&radius=10000&numOfRows=5&arrange=E&contentTypeId=39');
  for (const r of food) console.log(`  ${Math.round(r.dist)}m  ${r.title} | ${r.addr1}`);
} catch (e) { console.log('  오류:', e.message); }
