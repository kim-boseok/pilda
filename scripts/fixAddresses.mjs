// genAddresses.mjs 실행 후 수동 검토로 확정한 주소 보정 스크립트
// - 바다 위 좌표라 역지오코딩이 건너편 시·군으로 붙은 지점 (예: 부안 모항→고창, 국화도→당진)
// - '부산 서부', '중구·영종', '제주 서귀포 동부' 같은 설명용 그룹명이 주소로 들어간 지점
// 실행: node scripts/fixAddresses.mjs  (genAddresses.mjs 재실행 시 이 스크립트도 다시 실행)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const FIXES = {
  // ── 동해 ──
  PT_E_NASA: '울산광역시 울주군 서생면', // 나사리
  PT_E_JANGSAENGPO: '울산광역시 남구 장생포동',
  DT_0020: '울산광역시 남구', // 울산항
  PT_E_DAEWANGAM: '울산광역시 동구 일산동',
  PT_E_ILSAN: '울산광역시 동구 일산동',
  PT_E_JUJEON: '울산광역시 동구 주전동',
  PT_E_JEONGJA: '울산광역시 북구 정자동',
  PT_E_GANGDONG: '울산광역시 북구',
  PT_E_NAJEONG: '경상북도 경주시 감포읍', // 나정리
  PT_E_JANGSA: '경상북도 영덕군 남정면', // 장사리 (OSM이 포항 송라면으로 오인)
  PT_E_DOKDO: '경상북도 울릉군 울릉읍', // 독도리
  PT_E_CHUAM: '강원특별자치도 동해시 추암동', // OSM이 삼척으로 오인 (경계)
  DT_0006: '강원특별자치도 동해시 묵호진동', // 묵호항
  PT_E_MANGSANG: '강원특별자치도 동해시 망상동',
  PT_E_DAEJIN_DH: '강원특별자치도 동해시 대진동',
  PT_E_GANGMUN: '강원특별자치도 강릉시 강문동',
  PT_E_MULCHI: '강원특별자치도 양양군 강현면', // 물치리 (OSM이 속초로 오인)
  // ── 남해 ──
  PT_S_USUYEONG: '전남광주통합특별시 해남군 문내면', // OSM이 진도로 오인 (명량해협)
  PT_S_BEOLGYO: '전남광주통합특별시 보성군 벌교읍', // OSM이 고흥으로 오인 (여자만)
  DT_0031: '전남광주통합특별시 여수시 삼산면', // 거문도
  PT_S_CHODO: '전남광주통합특별시 여수시 삼산면',
  PT_S_SADO: '전남광주통합특별시 여수시 화정면', // OSM이 고흥으로 오인
  PT_S_GAEDO: '전남광주통합특별시 여수시 화정면',
  PT_S_MANSEONGRI: '전남광주통합특별시 여수시 만흥동',
  PT_S_WAON: '전남광주통합특별시 순천시 해룡면', // OSM이 여수로 오인 (순천만)
  PT_S_GACHEON: '경상남도 남해군 남면', // 홍현리
  PT_S_BITO: '경상남도 사천시 서포면',
  PT_S_DAEBANGJIN: '경상남도 사천시 대방동',
  PT_S_NAMILDAE: '경상남도 사천시 향촌동',
  PT_S_CHUDO: '경상남도 통영시 산양읍',
  PT_S_MAEMULDO: '경상남도 통영시 한산면',
  PT_S_SOMAEMULDO: '경상남도 통영시 한산면',
  PT_S_OKPO: '경상남도 거제시 옥포동',
  PT_S_NEUNGPO: '경상남도 거제시 능포동',
  DT_0062: '경상남도 창원시 마산합포구', // 마산항
  PT_S_JINHAE_MYEONGDONG: '경상남도 창원시 진해구 명동',
  PT_S_GADEOK_DAEHANG: '부산광역시 강서구 대항동',
  PT_S_DADAEPO: '부산광역시 사하구 다대동',
  PT_S_SONGDO_BUSAN: '부산광역시 서구 암남동',
  PT_S_AMNAM: '부산광역시 서구 암남동',
  DT_0005: '부산광역시 중구', // 부산항
  PT_S_GWANGALLI: '부산광역시 수영구 광안동',
  PT_S_CHEONGSAPO: '부산광역시 해운대구 중동',
  PT_S_IMRANG: '부산광역시 기장군 장안읍',
  // ── 제주 ──
  PT_J_YONGDAM: '제주특별자치도 제주시 용담이동',
  PT_J_DODU: '제주특별자치도 제주시 도두동',
  PT_J_IHO: '제주특별자치도 제주시 이호동',
  PT_J_SAMYANG: '제주특별자치도 제주시 삼양동',
  DT_0022: '제주특별자치도 서귀포시 성산읍', // 성산포
  PT_J_GWANGCHIGI: '제주특별자치도 서귀포시 성산읍',
  PT_J_SINYANG: '제주특별자치도 서귀포시 성산읍',
  PT_J_ONPYEONG: '제주특별자치도 서귀포시 성산읍',
  PT_J_PYOSEON: '제주특별자치도 서귀포시 표선면',
  PT_J_NAMWON: '제주특별자치도 서귀포시 남원읍',
  PT_J_WIMI: '제주특별자치도 서귀포시 남원읍',
  PT_J_SOESOKKAK: '제주특별자치도 서귀포시 하효동',
  PT_J_BOMOK: '제주특별자치도 서귀포시 보목동',
  DT_0010: '제주특별자치도 서귀포시', // 서귀포항
  PT_J_JAGURI: '제주특별자치도 서귀포시',
  PT_J_OEDOLGAE: '제주특별자치도 서귀포시 서홍동',
  PT_J_BEOPHWAN: '제주특별자치도 서귀포시 법환동',
  PT_J_GANGJEONG: '제주특별자치도 서귀포시 강정동',
  PT_J_WOLPYEONG: '제주특별자치도 서귀포시 월평동',
  PT_J_JUNGMUN: '제주특별자치도 서귀포시 색달동',
  PT_J_DAEPYEONG: '제주특별자치도 서귀포시 안덕면', // 대평리
  PT_J_HWASUN: '제주특별자치도 서귀포시 안덕면',
  PT_J_YONGMEORI: '제주특별자치도 서귀포시 안덕면',
  PT_J_SAGYE: '제주특별자치도 서귀포시 안덕면',
  PT_J_SONGAKSAN: '제주특별자치도 서귀포시 대정읍',
  DT_0023: '제주특별자치도 서귀포시 대정읍', // 모슬포항
  PT_J_GAPADO: '제주특별자치도 서귀포시 대정읍', // 가파리
  PT_J_MARADO: '제주특별자치도 서귀포시 대정읍', // 마라리
  // ── 서해 전남 ──
  PT_WJ_GAMAMI: '전남광주통합특별시 영광군 홍농읍', // OSM이 고창으로 오인
  PT_WJ_DORIPO: '전남광주통합특별시 무안군 해제면', // OSM이 영광으로 오인
  PT_WJ_CHUPO: '전남광주통합특별시 신안군 암태면',
  PT_WJ_PALGEUMDO: '전남광주통합특별시 신안군 팔금면',
  PT_WJ_SONGGONG: '전남광주통합특별시 신안군 압해읍',
  PT_WJ_ANJWADO: '전남광주통합특별시 신안군 안좌면',
  PT_WJ_BAKJIDO: '전남광주통합특별시 신안군 안좌면', // 퍼플섬
  PT_WJ_BANWOLDO: '전남광주통합특별시 신안군 안좌면', // 퍼플섬
  PT_WJ_JARADO: '전남광주통합특별시 신안군 안좌면',
  PT_WJ_DAEMADO: '전남광주통합특별시 진도군 조도면',
  // ── 서해 중북부 ──
  DT_0044: '인천광역시 중구', // 영종대교
  PT_WN_YEDANPO: '인천광역시 중구 영종동',
  PT_WN_EULWANGRI: '인천광역시 중구 을왕동',
  PT_WN_WANGSAN: '인천광역시 중구 을왕동',
  PT_WN_YONGYU: '인천광역시 중구',
  PT_WN_MASIAN: '인천광역시 중구',
  PT_WN_JAMJINDO: '인천광역시 중구',
  PT_WN_SILMIDO: '인천광역시 중구 무의동',
  PT_WN_HANAGAE: '인천광역시 중구 무의동',
  DT_0093: '인천광역시 중구 무의동', // 소무의도
  PT_WN_WOLMIDO: '인천광역시 중구 북성동',
  DT_0001: '인천광역시 중구', // 인천항
  DT_0052: '인천광역시 연수구 송도동',
  PT_WN_SORAE: '인천광역시 남동구 논현동',
  PT_WN_IPPADO: '경기도 화성시 우정읍', // OSM이 당진으로 오인
  PT_WN_GUKHWADO: '경기도 화성시 우정읍', // OSM이 당진으로 오인
  DT_0002: '경기도 평택시 포승읍', // 평택항 (OSM이 당진으로 오인)
  PT_WN_BUAN_MOHANG: '전북특별자치도 부안군 변산면', // OSM이 고창으로 오인
  PT_WN_SIKDO: '전북특별자치도 부안군 위도면', // 식도리
  DT_0037: '전북특별자치도 군산시 옥도면', // 어청도리
};

// 앱 내부 그룹명(설명용)이 주소에 섞여 들어간 경우 제거
// 예: 제주 지점 그룹 '제주시 동부'·'제주 부속섬' → 실제 행정구역은 모두 '제주시'
const CLEANUP = [
  ['제주특별자치도 제주시 동부 ', '제주특별자치도 제주시 '],
  ['제주특별자치도 제주시 서부 ', '제주특별자치도 제주시 '],
  ['제주특별자치도 제주 부속섬 ', '제주특별자치도 제주시 '],
];

const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'stations', 'addresses.ts');
let src = readFileSync(file, 'utf8');
let applied = 0;
for (const [id, addr] of Object.entries(FIXES)) {
  const re = new RegExp(`^(\\s*${id}:\\s*)'[^']*'`, 'm');
  if (!re.test(src)) { console.log(`! 못 찾음: ${id}`); continue; }
  src = src.replace(re, `$1'${addr}'`);
  applied++;
}
for (const [from, to] of CLEANUP) src = src.split(from).join(to);
writeFileSync(file, src, 'utf8');
console.log(`보정 ${applied}/${Object.keys(FIXES).length}곳 + 그룹명 정리 적용`);
