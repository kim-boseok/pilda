import type { Station } from '../../types';

// 제주 — 시계방향 (제주시 도심 → 동부 → 서귀포 → 서부) + 부속섬
// 실측 관측소: DT_0004 제주항 / DT_0022 성산포 / DT_0010 서귀포 / DT_0023 모슬포 / DT_0021 추자도
export const STATIONS_J: Station[] = [
  // ── 제주시 도심·북부 ──
  { id: 'DT_0004', name: '제주항', region: 'south', lat: 33.5275, lon: 126.5431, mudflat: false, group: '제주시 도심·북부', province: '제주특별자치도' },
  { id: 'PT_J_TAPDONG', name: '탑동해안', region: 'south', lat: 33.5195, lon: 126.522, mudflat: false, group: '제주시 도심·북부', province: '제주특별자치도' },
  { id: 'PT_J_YONGDAM', name: '용담해안도로(용두암)', region: 'south', lat: 33.5164, lon: 126.5119, mudflat: false, group: '제주시 도심·북부', province: '제주특별자치도' },
  { id: 'PT_J_DODU', name: '도두항', region: 'south', lat: 33.5086, lon: 126.467, mudflat: false, group: '제주시 도심·북부', province: '제주특별자치도' },
  { id: 'PT_J_IHO', name: '이호테우해변', region: 'south', lat: 33.4978, lon: 126.4529, mudflat: false, group: '제주시 도심·북부', province: '제주특별자치도' },
  { id: 'PT_J_SAMYANG', name: '삼양검은모래해변', region: 'south', lat: 33.525, lon: 126.585, mudflat: false, group: '제주시 도심·북부', province: '제주특별자치도' },
  { id: 'PT_J_HAMDEOK', name: '함덕해수욕장', region: 'south', lat: 33.5434, lon: 126.6694, mudflat: false, group: '제주시 도심·북부', province: '제주특별자치도' },

  // ── 제주시 동부 ──
  { id: 'PT_J_GIMNYEONG', name: '김녕해수욕장(성세기)', region: 'south', lat: 33.5575, lon: 126.759, mudflat: false, group: '제주시 동부', province: '제주특별자치도' },
  { id: 'PT_J_WOLJEONG', name: '월정리해변', region: 'south', lat: 33.5555, lon: 126.796, mudflat: false, group: '제주시 동부', province: '제주특별자치도' },
  { id: 'PT_J_HAENGWON', name: '행원포구', region: 'south', lat: 33.5565, lon: 126.8115, mudflat: false, group: '제주시 동부', province: '제주특별자치도' },
  { id: 'PT_J_PYEONGDAE', name: '평대해변', region: 'south', lat: 33.536, lon: 126.843, mudflat: false, group: '제주시 동부', province: '제주특별자치도' },
  { id: 'PT_J_SEHWA', name: '세화해변', region: 'south', lat: 33.5253, lon: 126.8598, mudflat: false, group: '제주시 동부', province: '제주특별자치도' },
  { id: 'PT_J_HADO', name: '하도해변', region: 'south', lat: 33.512, lon: 126.898, mudflat: false, group: '제주시 동부', province: '제주특별자치도' },
  { id: 'PT_J_JONGDAL', name: '종달리해변', region: 'south', lat: 33.4995, lon: 126.9145, mudflat: false, group: '제주시 동부', province: '제주특별자치도' },

  // ── 제주 서귀포 동부 ──
  { id: 'DT_0022', name: '성산포(성산일출봉)', region: 'south', lat: 33.474, lon: 126.9275, mudflat: false, group: '제주 서귀포 동부', province: '제주특별자치도' },
  { id: 'PT_J_GWANGCHIGI', name: '광치기해변', region: 'south', lat: 33.4497, lon: 126.9195, mudflat: false, group: '제주 서귀포 동부', province: '제주특별자치도' },
  { id: 'PT_J_SINYANG', name: '신양섭지해변', region: 'south', lat: 33.434, lon: 126.926, mudflat: false, group: '제주 서귀포 동부', province: '제주특별자치도' },
  { id: 'PT_J_ONPYEONG', name: '온평포구', region: 'south', lat: 33.414, lon: 126.905, mudflat: false, group: '제주 서귀포 동부', province: '제주특별자치도' },
  { id: 'PT_J_PYOSEON', name: '표선해수욕장(표선해비치)', region: 'south', lat: 33.3266, lon: 126.8433, mudflat: false, group: '제주 서귀포 동부', province: '제주특별자치도' },
  { id: 'PT_J_NAMWON', name: '남원큰엉해안', region: 'south', lat: 33.2725, lon: 126.712, mudflat: false, group: '제주 서귀포 동부', province: '제주특별자치도' },
  { id: 'PT_J_WIMI', name: '위미항', region: 'south', lat: 33.2735, lon: 126.6655, mudflat: false, group: '제주 서귀포 동부', province: '제주특별자치도' },
  { id: 'PT_J_SOESOKKAK', name: '쇠소깍', region: 'south', lat: 33.2523, lon: 126.6235, mudflat: false, group: '제주 서귀포 동부', province: '제주특별자치도' },
  { id: 'PT_J_BOMOK', name: '보목포구', region: 'south', lat: 33.2405, lon: 126.594, mudflat: false, group: '제주 서귀포 동부', province: '제주특별자치도' },

  // ── 제주 서귀포 도심 ──
  { id: 'DT_0010', name: '서귀포항', region: 'south', lat: 33.24, lon: 126.5617, mudflat: false, group: '제주 서귀포 도심', province: '제주특별자치도' },
  { id: 'PT_J_JAGURI', name: '자구리해안', region: 'south', lat: 33.2427, lon: 126.568, mudflat: false, group: '제주 서귀포 도심', province: '제주특별자치도' },
  { id: 'PT_J_OEDOLGAE', name: '외돌개', region: 'south', lat: 33.239, lon: 126.546, mudflat: false, group: '제주 서귀포 도심', province: '제주특별자치도' },
  { id: 'PT_J_BEOPHWAN', name: '법환포구', region: 'south', lat: 33.234, lon: 126.5155, mudflat: false, group: '제주 서귀포 도심', province: '제주특별자치도' },
  { id: 'PT_J_GANGJEONG', name: '강정', region: 'south', lat: 33.2265, lon: 126.4785, mudflat: false, group: '제주 서귀포 도심', province: '제주특별자치도' },
  { id: 'PT_J_WOLPYEONG', name: '월평포구', region: 'south', lat: 33.234, lon: 126.4655, mudflat: false, group: '제주 서귀포 도심', province: '제주특별자치도' },

  // ── 제주 서귀포 서부 ──
  { id: 'PT_J_JUNGMUN', name: '중문색달해변', region: 'south', lat: 33.244, lon: 126.412, mudflat: false, group: '제주 서귀포 서부', province: '제주특별자치도' },
  { id: 'PT_J_DAEPYEONG', name: '대평리(박수기정)', region: 'south', lat: 33.238, lon: 126.397, mudflat: false, group: '제주 서귀포 서부', province: '제주특별자치도' },
  { id: 'PT_J_HWASUN', name: '화순금모래해변', region: 'south', lat: 33.239, lon: 126.337, mudflat: false, group: '제주 서귀포 서부', province: '제주특별자치도' },
  { id: 'PT_J_YONGMEORI', name: '산방산 용머리해안', region: 'south', lat: 33.2315, lon: 126.3145, mudflat: false, group: '제주 서귀포 서부', province: '제주특별자치도' },
  { id: 'PT_J_SAGYE', name: '사계해변', region: 'south', lat: 33.225, lon: 126.305, mudflat: false, group: '제주 서귀포 서부', province: '제주특별자치도' },
  { id: 'PT_J_SONGAKSAN', name: '송악산', region: 'south', lat: 33.199, lon: 126.289, mudflat: false, group: '제주 서귀포 서부', province: '제주특별자치도' },
  { id: 'DT_0023', name: '모슬포항(하모)', region: 'south', lat: 33.214, lon: 126.251, mudflat: false, group: '제주 서귀포 서부', province: '제주특별자치도' },

  // ── 제주시 서부 ──
  { id: 'PT_J_SUWOLBONG', name: '수월봉(고산)', region: 'south', lat: 33.299, lon: 126.163, mudflat: false, group: '제주시 서부', province: '제주특별자치도' },
  { id: 'PT_J_SINCHANG', name: '신창풍차해안', region: 'south', lat: 33.3445, lon: 126.179, mudflat: false, group: '제주시 서부', province: '제주특별자치도' },
  { id: 'PT_J_PANPO', name: '판포포구', region: 'south', lat: 33.359, lon: 126.198, mudflat: false, group: '제주시 서부', province: '제주특별자치도' },
  { id: 'PT_J_GEUMNEUNG', name: '금능해수욕장', region: 'south', lat: 33.3903, lon: 126.2335, mudflat: false, group: '제주시 서부', province: '제주특별자치도' },
  { id: 'PT_J_HYEOPJAE', name: '협재해수욕장', region: 'south', lat: 33.394, lon: 126.2395, mudflat: false, group: '제주시 서부', province: '제주특별자치도' },
  { id: 'PT_J_ONGPO', name: '옹포', region: 'south', lat: 33.41, lon: 126.256, mudflat: false, group: '제주시 서부', province: '제주특별자치도' },
  { id: 'PT_J_GWAKJI', name: '곽지해수욕장', region: 'south', lat: 33.451, lon: 126.305, mudflat: false, group: '제주시 서부', province: '제주특별자치도' },
  { id: 'PT_J_HANDAM', name: '한담해안(애월)', region: 'south', lat: 33.464, lon: 126.307, mudflat: false, group: '제주시 서부', province: '제주특별자치도' },
  { id: 'PT_J_AEWOL', name: '애월항', region: 'south', lat: 33.466, lon: 126.319, mudflat: false, group: '제주시 서부', province: '제주특별자치도' },
  { id: 'PT_J_HAGWI', name: '하귀 가문동', region: 'south', lat: 33.487, lon: 126.397, mudflat: false, group: '제주시 서부', province: '제주특별자치도' },

  // ── 제주 부속섬 ──
  { id: 'PT_J_UDO_HAGOSUDONG', name: '우도 하고수동해변', region: 'south', lat: 33.51, lon: 126.959, mudflat: false, group: '제주 부속섬', province: '제주특별자치도' },
  { id: 'PT_J_UDO_SEOBIN', name: '우도 서빈백사', region: 'south', lat: 33.4967, lon: 126.943, mudflat: false, group: '제주 부속섬', province: '제주특별자치도' },
  { id: 'PT_J_GAPADO', name: '가파도', region: 'south', lat: 33.168, lon: 126.272, mudflat: false, group: '제주 부속섬', province: '제주특별자치도' },
  { id: 'PT_J_MARADO', name: '마라도', region: 'south', lat: 33.117, lon: 126.268, mudflat: false, group: '제주 부속섬', province: '제주특별자치도' },
  { id: 'PT_J_BIYANGDO', name: '비양도', region: 'south', lat: 33.409, lon: 126.229, mudflat: false, group: '제주 부속섬', province: '제주특별자치도' },
  { id: 'DT_0021', name: '추자도', region: 'south', lat: 33.962, lon: 126.3, mudflat: false, group: '제주 부속섬', province: '제주특별자치도' },
  { id: 'PT_J_CHAGWIDO', name: '차귀도(자구내포구)', region: 'south', lat: 33.3098, lon: 126.164, mudflat: false, group: '제주 부속섬', province: '제주특별자치도' },
];

// 가상 지점 → 가장 가까운 국립해양조사원 관측소 코드
export const CODE_MAP_J: Record<string, string> = {
  // 제주시 도심·북부 → 제주항
  PT_J_TAPDONG: 'DT_0004',
  PT_J_YONGDAM: 'DT_0004',
  PT_J_DODU: 'DT_0004',
  PT_J_IHO: 'DT_0004',
  PT_J_SAMYANG: 'DT_0004',
  PT_J_HAMDEOK: 'DT_0004',
  // 제주시 동부 → 성산포
  PT_J_GIMNYEONG: 'DT_0022',
  PT_J_WOLJEONG: 'DT_0022',
  PT_J_HAENGWON: 'DT_0022',
  PT_J_PYEONGDAE: 'DT_0022',
  PT_J_SEHWA: 'DT_0022',
  PT_J_HADO: 'DT_0022',
  PT_J_JONGDAL: 'DT_0022',
  // 서귀포 동부 → 성산포 / 서귀포
  PT_J_GWANGCHIGI: 'DT_0022',
  PT_J_SINYANG: 'DT_0022',
  PT_J_ONPYEONG: 'DT_0022',
  PT_J_PYOSEON: 'DT_0022',
  PT_J_NAMWON: 'DT_0010',
  PT_J_WIMI: 'DT_0010',
  PT_J_SOESOKKAK: 'DT_0010',
  PT_J_BOMOK: 'DT_0010',
  // 서귀포 도심 → 서귀포
  PT_J_JAGURI: 'DT_0010',
  PT_J_OEDOLGAE: 'DT_0010',
  PT_J_BEOPHWAN: 'DT_0010',
  PT_J_GANGJEONG: 'DT_0010',
  PT_J_WOLPYEONG: 'DT_0010',
  // 서귀포 서부 → 서귀포 / 모슬포
  PT_J_JUNGMUN: 'DT_0010',
  PT_J_DAEPYEONG: 'DT_0023',
  PT_J_HWASUN: 'DT_0023',
  PT_J_YONGMEORI: 'DT_0023',
  PT_J_SAGYE: 'DT_0023',
  PT_J_SONGAKSAN: 'DT_0023',
  // 제주시 서부 → 모슬포 / 제주항
  PT_J_SUWOLBONG: 'DT_0023',
  PT_J_SINCHANG: 'DT_0023',
  PT_J_PANPO: 'DT_0023',
  PT_J_GEUMNEUNG: 'DT_0023',
  PT_J_HYEOPJAE: 'DT_0023',
  PT_J_ONGPO: 'DT_0023',
  PT_J_GWAKJI: 'DT_0004',
  PT_J_HANDAM: 'DT_0004',
  PT_J_AEWOL: 'DT_0004',
  PT_J_HAGWI: 'DT_0004',
  // 부속섬
  PT_J_UDO_HAGOSUDONG: 'DT_0022',
  PT_J_UDO_SEOBIN: 'DT_0022',
  PT_J_GAPADO: 'DT_0023',
  PT_J_MARADO: 'DT_0023',
  PT_J_BIYANGDO: 'DT_0023',
  PT_J_CHAGWIDO: 'DT_0023',
};
