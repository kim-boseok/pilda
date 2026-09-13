// 전 지점(470곳)의 행정구역 주소를 OSM Nominatim 역지오코딩(zoom 12)으로 생성하는 1회성 스크립트
// - 검증된 province/group(시·군·구)을 기준으로 삼고, Nominatim의 시군구가 일치할 때만 읍·면·동을 덧붙인다
// - 불일치·미확인 지점은 province+group까지만 쓰고 리포트에 남긴다 (정확성 최우선)
// 실행: node scripts/genAddresses.mjs   (약 9분, 1초당 1요청 — Nominatim 정책)
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const stDir = join(root, 'src', 'data', 'stations');

// ── 지점 파싱 (stations/*.ts 전체, addresses.ts 제외) ──
const stations = [];
for (const f of readdirSync(stDir)) {
  if (!f.endsWith('.ts') || f === 'addresses.ts') continue;
  const src = readFileSync(join(stDir, f), 'utf8');
  const re = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*region:\s*'(\w+)',\s*lat:\s*([\d.]+),\s*lon:\s*([\d.]+),\s*mudflat:\s*(true|false),\s*group:\s*'([^']+)',\s*province:\s*'([^']+)'/g;
  let m;
  while ((m = re.exec(src))) {
    stations.push({ id: m[1], name: m[2], lat: +m[4], lon: +m[5], group: m[7], province: m[8] });
  }
}
console.log(`지점 ${stations.length}개 파싱`);

// 통합 광역시 이름 ↔ 실제 OSM 명칭 대응 (2026-07 출범 전남광주통합특별시)
const PROVINCE_ALIAS = {
  전남광주통합특별시: ['전라남도', '광주광역시'],
};

function provinceMatches(ours, nom) {
  if (!nom) return false;
  if (ours === nom) return true;
  return (PROVINCE_ALIAS[ours] ?? []).includes(nom);
}

// 시·군·구 이름 매칭: '해운대·기장' 같은 복합 그룹은 어간(마지막 시/군/구 떼고) 포함 여부로 판단
function groupMatches(group, sigungu) {
  if (!group || !sigungu) return false;
  if (group === sigungu) return true;
  const stem = sigungu.replace(/(특별자치시|광역시|특별시|시|군|구)$/, '');
  if (!stem) return false;
  return group.split('·').some((g) => g === stem || g === sigungu || g.startsWith(stem));
}

async function reverse(lat, lon, attempt = 0) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&accept-language=ko&zoom=12&addressdetails=1`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'pilda-station-address-script/1.0 (kimbos2ok@gmail.com)' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()).address ?? null;
  } catch (e) {
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 3000));
      return reverse(lat, lon, attempt + 1);
    }
    console.log(`  ! 요청 실패: ${e.message}`);
    return null;
  }
}

const IS_METRO = /(도|광역시|특별시|특별자치시|특별자치도)$/;
const IS_SIGUNGU = /(시|군|구)$/;

function parts(addr) {
  if (!addr) return { metro: null, sigungu: null, emd: null };
  const cand = [addr.province, addr.state, addr.city, addr.county, addr.borough, addr.municipality].filter(Boolean);
  const metro = cand.find((c) => IS_METRO.test(c)) ?? null;
  const sigungu = cand.find((c) => c !== metro && IS_SIGUNGU.test(c)) ?? null;
  const emd = addr.town ?? addr.suburb ?? addr.village ?? addr.quarter ?? null;
  return { metro, sigungu, emd };
}

const out = {}; // id → 주소
const report = { full: 0, base: [], provinceOff: [] };

for (let i = 0; i < stations.length; i++) {
  const s = stations[i];
  const addr = await reverse(s.lat, s.lon);
  const { metro, sigungu, emd } = parts(addr);

  const base = `${s.province} ${s.group}`;
  const sigunguOk = groupMatches(s.group, sigungu);
  const provinceOk = provinceMatches(s.province, metro);

  if (sigunguOk && emd) {
    // 검증된 시군구 + OSM 읍면동. 복합 그룹('해운대·기장')이면 OSM의 실제 구 이름 사용
    const sg = s.group.includes('·') && sigungu ? sigungu : s.group;
    out[s.id] = `${s.province} ${sg} ${emd}`;
    report.full++;
    if (!provinceOk && metro) report.provinceOff.push(`${s.id} ${s.name}: 광역 불일치 우리='${s.province}' OSM='${metro}'`);
  } else {
    out[s.id] = base;
    report.base.push(`${s.id} ${s.name} (${base}) ← OSM: ${metro ?? '-'} / ${sigungu ?? '-'} / ${emd ?? '-'}`);
  }

  if ((i + 1) % 25 === 0) console.log(`${i + 1}/${stations.length}…`);
  await new Promise((r) => setTimeout(r, 1100));
}

// ── addresses.ts 생성 ──
const lines = stations.map((s) => `  ${/^[A-Za-z_][A-Za-z0-9_]*$/.test(s.id) ? s.id : `'${s.id}'`}: '${out[s.id]}', // ${s.name}`);
const file = `// 자동 생성 (scripts/genAddresses.mjs) — 지점별 행정구역 주소
// 시·군·구까지는 검증된 데이터, 읍·면·동은 OSM Nominatim 역지오코딩(시군구 일치 확인된 것만)
export const ADDRESSES: Record<string, string> = {
${lines.join('\n')}
};
`;
writeFileSync(join(stDir, 'addresses.ts'), file, 'utf8');
writeFileSync(join(root, 'scripts', 'genAddresses.report.txt'),
  `읍면동까지 확정: ${report.full}곳\n\n[시군구까지만 (검토 필요) ${report.base.length}곳]\n${report.base.join('\n')}\n\n[광역 명칭 불일치 ${report.provinceOff.length}곳]\n${report.provinceOff.join('\n')}\n`, 'utf8');
console.log(`완료 — 읍면동 확정 ${report.full}곳 · 시군구만 ${report.base.length}곳 (scripts/genAddresses.report.txt 참고)`);
