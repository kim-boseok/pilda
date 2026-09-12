// featureOverrides 전수 검증: id 실존, 태그·생물 허용 목록, 갯벌 아닌 곳의 종 표기
import { STATIONS } from '../src/data/stations';
import { FEATURE_OVERRIDES } from '../src/data/featureOverrides';

const TAGS = new Set([
  'mudflat', 'beach', 'view', 'fishing', 'sunrise', 'sunset', 'port', 'island', 'walk', 'surf',
]);
const SPECIES = new Set([
  '짱뚱어', '낙지', '주꾸미', '문어', '꽃게', '칠게', '농게', '달랑게',
  '바지락', '꼬막', '백합', '동죽', '맛조개', '소라', '굴', '새우',
]);

const ids = new Set(STATIONS.map((s) => s.id));
let bad = 0;
const warn: string[] = [];

for (const [id, f] of Object.entries(FEATURE_OVERRIDES)) {
  const st = STATIONS.find((s) => s.id === id);
  if (!st) {
    console.log(`❌ 존재하지 않는 id: ${id}`);
    bad++;
    continue;
  }
  for (const t of f.tags ?? []) {
    if (!TAGS.has(t)) { console.log(`❌ ${id}(${st.name}) 잘못된 태그: ${t}`); bad++; }
  }
  if ((f.tags?.length ?? 0) > 3) { console.log(`❌ ${id} 태그 4개 이상`); bad++; }
  for (const sp of f.species ?? []) {
    if (!SPECIES.has(sp)) { console.log(`❌ ${id}(${st.name}) 잘못된 종: ${sp}`); bad++; }
  }
  if (f.species?.length && !st.mudflat) warn.push(`⚠️ ${id}(${st.name}) mudflat=false인데 species 있음`);
  if (f.tags?.includes('mudflat') && !st.mudflat) warn.push(`⚠️ ${id}(${st.name}) mudflat=false인데 mudflat 태그`);
}

warn.forEach((w) => console.log(w));
console.log(`total=${Object.keys(FEATURE_OVERRIDES).length} bad=${bad} warn=${warn.length} (전체 지점 ${ids.size})`);
