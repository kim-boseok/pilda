// 한국관광공사 TourAPI에서 지점별 공식 주소·사진·소개·편의정보를 수집해
// src/data/stations/tourInfo.ts 로 저장하는 스크립트
//
// 정확성 원칙: "같은 장소를 가리키는 게 확실한" 관광정보만 채택한다.
//   - 이름이 안 맞으면 옆 동네 다른 장소의 주소가 붙어버리므로 절대 쓰지 않는다
//   - 지명을 상호에 넣은 숙박·음식점을 걸러낸다
//     (예: '장생포' → '브라운도트호텔 장생포점'을 잡으면 호텔 주소가 붙어버림)
//   - 매칭 실패한 지점은 기존 OSM 행정구역 주소를 그대로 쓴다
//
// API 응답은 scripts/.tourCache.json 에 캐시된다 (일일 트래픽 1000/기능 보호 — 재실행은 무료)
// 실행: node scripts/genTourData.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const stDir = join(root, 'src', 'data', 'stations');
const KEY = readFileSync(join(root, '.env.local'), 'utf8').match(/VITE_KHOA_KEY\s*=\s*(\S+)/)[1];
const BASE = 'https://apis.data.go.kr/B551011/KorService2';
const COMMON = `serviceKey=${KEY}&MobileOS=ETC&MobileApp=pilda&_type=json`;

// ── 지점 목록 ──
const stations = [];
for (const f of readdirSync(stDir)) {
  if (!f.endsWith('.ts') || f === 'addresses.ts' || f === 'tourInfo.ts') continue;
  const src = readFileSync(join(stDir, f), 'utf8');
  const re = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*region:\s*'\w+',\s*lat:\s*([\d.]+),\s*lon:\s*([\d.]+)/g;
  let m;
  while ((m = re.exec(src))) stations.push({ id: m[1], name: m[2], lat: +m[3], lon: +m[4] });
}
console.log(`지점 ${stations.length}개`);

// ── 응답 캐시 (같은 요청은 두 번 부르지 않는다) ──
const cachePath = join(root, 'scripts', '.tourCache.json');
const cache = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, 'utf8')) : {};
let cacheDirty = 0;
const saveCache = () => { writeFileSync(cachePath, JSON.stringify(cache), 'utf8'); cacheDirty = 0; };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(path, params, attempt = 0) {
  const key = `${path}?${params}`;
  if (key in cache) return cache[key];
  try {
    const res = await fetch(`${BASE}/${path}?${COMMON}&${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    const code = j.response?.header?.resultCode;
    if (code !== '0000') {
      if (code === '0003') { cache[key] = []; return []; } // 결과 없음
      throw new Error(j.response?.header?.resultMsg ?? 'unknown');
    }
    const raw = j.response.body.items?.item;
    const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
    cache[key] = list;
    if (++cacheDirty >= 40) saveCache();
    await sleep(120);
    return list;
  } catch (e) {
    if (attempt < 2) { await sleep(2000); return call(path, params, attempt + 1); }
    throw e;
  }
}

function havKm(a, b, c, d) {
  const R = 6371, r = (x) => (x * Math.PI) / 180;
  const dLat = r(c - a), dLon = r(d - b);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ── 이름 매칭 ──
// 정규화: 괄호·공백·중점 제거, '해수욕장/해변' 통일
const norm = (s) =>
  s.replace(/\([^)]*\)/g, '')
    .replace(/[\s·・]/g, '')
    .replace(/해수욕장/g, '해변')
    .replace(/관광지|유원지|일원/g, '')
    .trim();

// 지명 뒤에 흔히 붙는 일반 명사 — 이것만 더 붙어 있으면 같은 장소로 본다
// (구룡포 → '구룡포항' ○ / '구룡포 근대문화역사관' ✕)
const PLACE_SUFFIX = /(해변|해안|백사장|몽돌|간이|항|포구|어항|해상|해양|수변|근린|공원|등대|전망대|방파제|해맞이|일출|일몰|선착장|갯벌|해수|욕장|가|섬|도)/g;

// 지명을 상호에 넣은 업소 — 절대 채택하지 않는다
const BIZ = /(호텔|펜션|모텔|리조트|카라반|캠핑|글램핑|콘도|게스트하우스|민박|풀빌라|카페|식당|횟집|마트|스테이|리버사이드|아파트|오토캠)/;
// 숙박(32)·음식점(39)·쇼핑(38)·축제행사(15)는 '장소 정보'가 아니라 제외
const BAD_TYPE = new Set(['32', '39', '38', '15']);

/** 지점명과 관광정보 제목이 같은 장소를 가리키는가 */
function nameMatches(stationName, title) {
  if (BIZ.test(title)) return false;
  const a = norm(stationName), b = norm(title);
  if (!a || !b) return false;
  if (a === b) return 2; // 완전 일치
  // ① 지점명 = [지역 접두사] + [제목]  (임자도 대광해변 → 대광해변, 울진 후포항 ← 후포항)
  //    반드시 '끝'이 일치해야 한다. 앞쪽만 일치하면 섬 이름만 잡는다
  //    ('무의도 하나개해변' → '무의도'는 섬 정보라 해변 주소가 안 나옴)
  //    접두사는 2글자 이상 — '소무의도' → '무의도' 같은 다른 섬 오인을 막는다
  if (a.length - b.length >= 2 && b.length >= 3 && a.endsWith(b)) return 1;
  if (b.length - a.length >= 2 && a.length >= 3 && b.endsWith(a)) return 1;
  // ② 한쪽 = 다른 쪽 + [일반 지명 접사]  (구룡포 ↔ 구룡포항 ○ / 구룡포 근대문화역사관 ✕)
  const tail = (long, short) => long.startsWith(short) && long.slice(short.length).replace(PLACE_SUFFIX, '') === '';
  if (b.length > a.length && a.length >= 2 && tail(b, a)) return 1;
  if (a.length > b.length && b.length >= 2 && tail(a, b)) return 1;
  return false;
}

// 매칭 허용 거리 — 해변은 백사장이 길어 대표좌표가 꽤 멀 수 있다
// 이름이 완전히 같으면 6km까지, 부분 일치면 4km까지만 인정한다
const NEAR_RADIUS_M = 4000; // 좌표 검색 반경 (캐시 키라 바꾸면 재호출됨)
const MAX_KM = 6;
const maxKmFor = (score) => (score === 2 ? 6 : 4);

/** 후보 중 가장 믿을 만한 것 — 완전 일치 우선, 그다음 가까운 것 */
function pickBest(cands) {
  let best = null;
  for (const c of cands) {
    if (!best || c.score > best.score || (c.score === best.score && c.dist < best.dist)) best = c;
  }
  return best;
}

const out = [];
const unmatched = [];
let i = 0;

for (const s of stations) {
  i++;
  const cands = [];
  try {
    // 1) 이름으로 검색 → 좌표가 가까운 것
    const kw = await call('searchKeyword2', `keyword=${encodeURIComponent(s.name.replace(/\([^)]*\)/g, '').trim())}&numOfRows=20`);
    for (const r of kw) {
      if (BAD_TYPE.has(String(r.contenttypeid))) continue;
      const score = nameMatches(s.name, r.title);
      if (!score) continue;
      const d = havKm(s.lat, s.lon, +r.mapy, +r.mapx);
      if (d <= maxKmFor(score)) cands.push({ ...r, dist: d, score });
    }

    // 2) 좌표 주변에서도 훑어서 더 나은 후보가 있는지 본다
    const near = await call('locationBasedList2', `mapX=${s.lon}&mapY=${s.lat}&radius=${NEAR_RADIUS_M}&numOfRows=30&arrange=E`);
    for (const r of near) {
      if (BAD_TYPE.has(String(r.contenttypeid))) continue;
      if (cands.some((c) => c.contentid === r.contentid)) continue;
      const score = nameMatches(s.name, r.title);
      if (score) cands.push({ ...r, dist: +r.dist / 1000, score });
    }
  } catch (e) {
    console.log(`  ! ${s.name}: ${e.message}`);
  }

  const hit = pickBest(cands);
  if (!hit) { unmatched.push(`${s.id} ${s.name}`); if (i % 25 === 0) console.log(`${i}/${stations.length}…`); continue; }

  const info = {
    id: s.id,
    contentId: String(hit.contentid),
    title: hit.title,
    addr: [hit.addr1, hit.addr2].filter(Boolean).join(' ').trim(),
    image: hit.firstimage || '',
    dist: hit.dist,
  };

  // 3) 소개글·전화·주차 등 부가정보
  try {
    const c = await call('detailCommon2', `contentId=${info.contentId}`);
    if (c[0]) {
      info.overview = (c[0].overview ?? '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
      info.homepage = (c[0].homepage ?? '').match(/https?:\/\/[^\s"'<>]+/)?.[0] ?? '';
      if (!info.addr && c[0].addr1) info.addr = c[0].addr1;
    }
    const d = await call('detailIntro2', `contentId=${info.contentId}&contentTypeId=${hit.contenttypeid}`);
    if (d[0]) {
      info.tel = (d[0].infocenter ?? '').replace(/<[^>]+>/g, '').trim();
      info.parking = (d[0].parking ?? '').replace(/<[^>]+>/g, '').trim();
      info.usetime = (d[0].usetime ?? '').replace(/<[^>]+>/g, '').trim();
      info.restdate = (d[0].restdate ?? '').replace(/<[^>]+>/g, '').trim();
    }
  } catch (e) {
    console.log(`  ! ${s.name} 상세: ${e.message}`);
  }

  out.push(info);
  if (i % 25 === 0) console.log(`${i}/${stations.length}… (매칭 ${out.length})`);
}
saveCache();

// ── tourInfo.ts 생성 ──
const esc = (v) => String(v ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const clean = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();
const trim = (v, n) => { const t = clean(v); return t.length > n ? t.slice(0, n).trim() + '…' : t; };

const lines = out.map((o) => {
  const f = [`addr: '${esc(clean(o.addr))}'`];
  if (o.image) f.push(`image: '${esc(o.image.replace(/^http:/, 'https:'))}'`);
  if (o.overview) f.push(`overview: '${esc(trim(o.overview, 220))}'`);
  if (o.tel) f.push(`tel: '${esc(trim(o.tel, 40))}'`);
  if (o.parking) f.push(`parking: '${esc(trim(o.parking, 40))}'`);
  if (o.usetime) f.push(`usetime: '${esc(trim(o.usetime, 40))}'`);
  if (o.restdate) f.push(`restdate: '${esc(trim(o.restdate, 40))}'`);
  if (o.homepage) f.push(`homepage: '${esc(o.homepage)}'`);
  const key = /^[A-Za-z_][A-Za-z0-9_]*$/.test(o.id) ? o.id : `'${o.id}'`;
  return `  ${key}: { ${f.join(', ')} }, // ${o.title} (${o.dist.toFixed(1)}km)`;
});

writeFileSync(join(stDir, 'tourInfo.ts'), `// 자동 생성 (scripts/genTourData.mjs) — 한국관광공사 TourAPI 기반 지점 정보
// 지점명과 관광정보 제목이 같은 장소를 가리키고 ${MAX_KM}km 이내인 것만 담았다
// (다른 장소·숙박업소 정보가 섞이지 않도록 이름 규칙을 엄격히 적용)
export interface TourInfo {
  /** 공식 주소 (도로명 또는 지번) */
  addr: string;
  image?: string;
  overview?: string;
  tel?: string;
  parking?: string;
  usetime?: string;
  restdate?: string;
  homepage?: string;
}

export const TOUR_INFO: Record<string, TourInfo> = {
${lines.join('\n')}
};
`, 'utf8');

writeFileSync(join(root, 'scripts', 'genTourData.report.txt'),
  `매칭 ${out.length}/${stations.length}곳\n\n[매칭 목록]\n${out.map((o) => `${o.id} ${stations.find((s) => s.id === o.id).name} → ${o.title} (${o.dist.toFixed(1)}km) | ${o.addr}`).join('\n')}\n\n[매칭 실패 ${unmatched.length}곳 — 기존 행정구역 주소 사용]\n${unmatched.join('\n')}\n`, 'utf8');
console.log(`\n완료 — 매칭 ${out.length}/${stations.length}곳 · 실패 ${unmatched.length}곳`);
