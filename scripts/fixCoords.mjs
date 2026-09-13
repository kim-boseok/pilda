// 지점 좌표 보정 — 한국관광공사 TourAPI 공식 좌표 기준
//
// scripts/auditCoords.mjs 로 "이름이 완전히 같은데 공식 좌표와 3km 이상 떨어진 지점"을 찾아,
// 동명이인(다른 지역의 같은 이름)과 KHOA 관측소 실측 위치를 걸러낸 뒤 여기에 모았다.
// 채택 근거: 공식 주소의 리(里) 이름이 지점 이름과 일치 (예: 송이도 → 낙월면 송이리).
//
// 실행: node scripts/fixCoords.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const FIX = {
  // ── 신안 — 경도가 약 0.2°(≈19km) 동쪽으로 밀려 바다 한가운데 찍혀 있었다 ──
  PT_WJ_DUNJANG: [34.9186, 126.0604], // 자은도 둔장해변 (자은면 한운리)
  PT_WJ_BUNGYE: [34.8709, 125.981], // 자은도 분계해변
  PT_WJ_BAEKGIL: [34.85, 126.0396], // 자은도 백길해변 (자은면 유각리)
  PT_WJ_CHUPO: [34.8053, 126.0675], // 암태도 추포해변 (암태면 추엽길)
  PT_WJ_PALGEUMDO: [34.7851, 126.1425], // 팔금도
  PT_WJ_SONGGONG: [34.8485, 126.2269], // 압해도 송공항(여객선터미널)
  PT_WJ_ANJWADO: [34.7561, 126.1246], // 안좌도
  PT_WJ_BAKJIDO: [34.708, 126.129], // 박지도(퍼플섬) — OSM
  PT_WJ_BANWOLDO: [34.704, 126.103], // 반월도(퍼플섬) — OSM
  PT_WJ_JARADO: [34.6914, 126.1694], // 자라도(선착장)
  PT_WJ_SINUIDO: [34.5835, 126.0917], // 신의도 (신의면 신의로)

  // ── 영광·무안 — 위도가 약 0.04~0.13°(4~14km) 북쪽으로 밀려 있었다 ──
  DT_0066: [35.1699, 126.3598], // 향화도항(칠산대교) — 염산면 향화로, 칠산타워 옆
  PT_WJ_YEOMSAN: [35.2116, 126.3755], // 염산포구(설도항) — 염산면 봉남리
  PT_WJ_DORIPO: [35.1567, 126.3465], // 도리포항 — 무안군 해제면
  PT_WJ_SONGIDO: [35.283, 126.1449], // 송이도 — 낙월면 송이리
  PT_WJ_GYEMA: [35.3896, 126.4072], // 계마항 — 홍농읍 계마리
  PT_WJ_GAMAMI: [35.3997, 126.4091], // 가마미해수욕장 — 홍농읍 가마미로

  // ── 진도 ──
  PT_WJ_HAJODO: [34.2967, 126.0478], // 하조도 창유항 — 조도면 창리길
  PT_WJ_GEUMGAP: [34.3958, 126.2774], // 금갑해변 — 의신면 금갑길
  PT_WJ_JEOPDO: [34.3791, 126.2954], // 접도(수품항) — 의신면 송정리

  // ── 서해 중북부 ──
  PT_WN_UNGDO: [36.924, 126.3785], // 웅도 — 서산시 대산읍 웅도리
  PT_WN_YAMIDO: [35.8483, 126.4976], // 야미도 — 군산시 옥도면 야미도리
  PT_WN_GUKHWADO: [37.0611, 126.559], // 국화도 — 화성시 우정읍 국화길
  PT_WN_SEUNGBONGDO: [37.1665, 126.3087], // 승봉도 — 옹진군 자월면 승봉리
  PT_WN_GODAEDO: [36.3879, 126.3669], // 고대도 — 보령시 오천면 고대도1길
  PT_WN_DALSANPO: [36.6563, 126.2956], // 달산포해수욕장 — 태안군 남면 달산리

  // ── 남해·동해 ──
  PT_S_YEONHWADO: [34.6452, 128.3541], // 연화도 — 통영시 욕지면 연화도
  PT_S_CHUDO: [34.7561, 128.2981], // 통영 추도 — 산양읍 추도리
  PT_E_JUJEON: [35.5656, 129.4552], // 주전몽돌해변 — 울산 동구 주전동
  PT_E_DAEJIN_YD: [36.5645, 129.4267], // 영덕 대진해수욕장 — 영해면
  PT_E_GORAEBUL: [36.5989, 129.411], // 고래불해수욕장 — 병곡면 병곡리
  PT_E_WOLPO: [36.2023, 129.3711], // 월포해수욕장 — 포항 북구 청하면
  PT_E_BANAM: [38.4215, 128.4628], // 반암해변 — 고성군 거진읍
};

const stDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'stations');
const files = readdirSync(stDir).filter((f) => f.endsWith('.ts') && f !== 'addresses.ts' && f !== 'tourInfo.ts');
const left = new Set(Object.keys(FIX));
let n = 0;

for (const f of files) {
  const path = join(stDir, f);
  let src = readFileSync(path, 'utf8');
  let dirty = false;
  for (const id of [...left]) {
    const [lat, lon] = FIX[id];
    const re = new RegExp(`(id: '${id}',[^}]*?lat: )[\\d.]+(, lon: )[\\d.]+`);
    if (!re.test(src)) continue;
    src = src.replace(re, `$1${lat}$2${lon}`);
    left.delete(id);
    dirty = true;
    n++;
  }
  if (dirty) writeFileSync(path, src, 'utf8');
}

for (const id of left) console.log(`! 못 찾음: ${id}`);
console.log(`좌표 보정 ${n}/${Object.keys(FIX).length}곳`);
