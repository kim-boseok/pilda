import type { Station } from '../../types';

// 동해안 — 울산~강원 고성 + 울릉·독도 (남→북 순서)
// 실제 관측소(DT_)는 CODE_MAP_E에 넣지 않고, 가상 지점(PT_E_)만 최근접 관측소로 매핑한다.
export const STATIONS_E: Station[] = [
  // ── 울산광역시 · 울주군 ──
  { id: 'PT_E_NASA', name: '나사해변', region: 'east', lat: 35.3459, lon: 129.3419, mudflat: false, group: '울주군', province: '울산광역시' },
  { id: 'PT_E_GANJEOLGOT', name: '간절곶', region: 'east', lat: 35.3590, lon: 129.3610, mudflat: false, group: '울주군', province: '울산광역시' },
  { id: 'PT_E_JINHA', name: '진하해수욕장', region: 'east', lat: 35.3830, lon: 129.3450, mudflat: false, group: '울주군', province: '울산광역시' },

  // ── 울산광역시 · 울산 시내 ──
  { id: 'PT_E_JANGSAENGPO', name: '장생포', region: 'east', lat: 35.4996, lon: 129.3809, mudflat: false, group: '울산 시내', province: '울산광역시' },
  { id: 'DT_0020', name: '울산항', region: 'east', lat: 35.5017, lon: 129.3872, mudflat: false, group: '울산 시내', province: '울산광역시' },

  // ── 울산광역시 · 동구·북구 ──
  { id: 'PT_E_DAEWANGAM', name: '대왕암공원', region: 'east', lat: 35.4870, lon: 129.4448, mudflat: false, group: '동구·북구', province: '울산광역시' },
  { id: 'PT_E_ILSAN', name: '일산해수욕장', region: 'east', lat: 35.4972, lon: 129.4306, mudflat: false, group: '동구·북구', province: '울산광역시' },
  { id: 'PT_E_JUJEON', name: '주전몽돌해변', region: 'east', lat: 35.5266, lon: 129.4570, mudflat: false, group: '동구·북구', province: '울산광역시' },
  { id: 'PT_E_JEONGJA', name: '정자해변', region: 'east', lat: 35.6175, lon: 129.4531, mudflat: false, group: '동구·북구', province: '울산광역시' },
  { id: 'PT_E_GANGDONG', name: '강동몽돌해변', region: 'east', lat: 35.6360, lon: 129.4520, mudflat: false, group: '동구·북구', province: '울산광역시' },

  // ── 경상북도 · 경주시 ──
  { id: 'PT_E_BONGGIL', name: '봉길해변(문무대왕릉)', region: 'east', lat: 35.7390, lon: 129.4930, mudflat: false, group: '경주시', province: '경상북도' },
  { id: 'PT_E_NAJEONG', name: '나정고운모래해변', region: 'east', lat: 35.7758, lon: 129.5091, mudflat: false, group: '경주시', province: '경상북도' },
  { id: 'PT_E_GAMPO', name: '감포항', region: 'east', lat: 35.8045, lon: 129.5064, mudflat: false, group: '경주시', province: '경상북도' },
  { id: 'PT_E_ORYU', name: '오류고아라해변', region: 'east', lat: 35.8267, lon: 129.5128, mudflat: false, group: '경주시', province: '경상북도' },

  // ── 경상북도 · 포항시 ──
  { id: 'PT_E_GURYONGPO', name: '구룡포', region: 'east', lat: 35.9886, lon: 129.5586, mudflat: false, group: '포항시', province: '경상북도' },
  { id: 'PT_E_HOMIGOT', name: '호미곶', region: 'east', lat: 36.0760, lon: 129.5670, mudflat: false, group: '포항시', province: '경상북도' },
  { id: 'PT_E_DOGU', name: '도구해변', region: 'east', lat: 35.9850, lon: 129.4020, mudflat: false, group: '포항시', province: '경상북도' },
  { id: 'PT_E_POHANG_SONGDO', name: '포항 송도해변', region: 'east', lat: 36.0330, lon: 129.3760, mudflat: false, group: '포항시', province: '경상북도' },
  { id: 'PT_E_YEONGILDAE', name: '영일대해수욕장', region: 'east', lat: 36.0560, lon: 129.3785, mudflat: false, group: '포항시', province: '경상북도' },
  { id: 'PT_E_CHILPO', name: '칠포해수욕장', region: 'east', lat: 36.1150, lon: 129.3940, mudflat: false, group: '포항시', province: '경상북도' },
  { id: 'PT_E_ODORI', name: '오도리해변', region: 'east', lat: 36.1450, lon: 129.3985, mudflat: false, group: '포항시', province: '경상북도' },
  { id: 'PT_E_IGARI', name: '이가리닻전망대', region: 'east', lat: 36.1580, lon: 129.3960, mudflat: false, group: '포항시', province: '경상북도' },
  { id: 'PT_E_WOLPO', name: '월포해수욕장', region: 'east', lat: 36.1790, lon: 129.3900, mudflat: false, group: '포항시', province: '경상북도' },
  { id: 'PT_E_HWAJIN', name: '화진해변', region: 'east', lat: 36.2110, lon: 129.3870, mudflat: false, group: '포항시', province: '경상북도' },

  // ── 경상북도 · 영덕군 ──
  { id: 'PT_E_JANGSA', name: '장사해수욕장', region: 'east', lat: 36.2630, lon: 129.3840, mudflat: false, group: '영덕군', province: '경상북도' },
  { id: 'PT_E_SAMSA', name: '삼사해상공원', region: 'east', lat: 36.3500, lon: 129.3880, mudflat: false, group: '영덕군', province: '경상북도' },
  { id: 'PT_E_GANGGU', name: '강구항', region: 'east', lat: 36.3590, lon: 129.3900, mudflat: false, group: '영덕군', province: '경상북도' },
  { id: 'PT_E_CHANGPOMAL', name: '영덕해맞이공원(창포말)', region: 'east', lat: 36.4180, lon: 129.4330, mudflat: false, group: '영덕군', province: '경상북도' },
  { id: 'PT_E_CHUKSAN', name: '축산항', region: 'east', lat: 36.5070, lon: 129.4470, mudflat: false, group: '영덕군', province: '경상북도' },
  { id: 'PT_E_DAEJIN_YD', name: '대진해수욕장(영덕)', region: 'east', lat: 36.5290, lon: 129.4430, mudflat: false, group: '영덕군', province: '경상북도' },
  { id: 'PT_E_GORAEBUL', name: '고래불해수욕장', region: 'east', lat: 36.5660, lon: 129.4280, mudflat: false, group: '영덕군', province: '경상북도' },

  // ── 경상북도 · 울진군 ──
  { id: 'DT_0011', name: '후포항', region: 'east', lat: 36.6776, lon: 129.4534, mudflat: false, group: '울진군', province: '경상북도' },
  { id: 'PT_E_MANGYANG', name: '망양해수욕장', region: 'east', lat: 36.7320, lon: 129.4740, mudflat: false, group: '울진군', province: '경상북도' },
  { id: 'PT_E_GUSAN', name: '구산해수욕장', region: 'east', lat: 36.7780, lon: 129.4660, mudflat: false, group: '울진군', province: '경상북도' },
  { id: 'PT_E_MANGYANGJEONG', name: '망양정해변', region: 'east', lat: 36.9580, lon: 129.4090, mudflat: false, group: '울진군', province: '경상북도' },
  { id: 'PT_E_BONGPYEONG', name: '봉평해변', region: 'east', lat: 37.0360, lon: 129.4120, mudflat: false, group: '울진군', province: '경상북도' },
  { id: 'PT_E_JUKBYEON', name: '죽변항', region: 'east', lat: 37.0530, lon: 129.4230, mudflat: false, group: '울진군', province: '경상북도' },
  { id: 'PT_E_NAGOK', name: '나곡해변', region: 'east', lat: 37.1070, lon: 129.3920, mudflat: false, group: '울진군', province: '경상북도' },

  // ── 경상북도 · 울릉군 (경북 마지막) ──
  { id: 'PT_E_NAMYANG', name: '남양항', region: 'east', lat: 37.4740, lon: 130.8360, mudflat: false, group: '울릉군', province: '경상북도' },
  { id: 'PT_E_SADONG', name: '사동항', region: 'east', lat: 37.4720, lon: 130.8860, mudflat: false, group: '울릉군', province: '경상북도' },
  { id: 'PT_E_DODONG', name: '도동항', region: 'east', lat: 37.4890, lon: 130.9070, mudflat: false, group: '울릉군', province: '경상북도' },
  { id: 'PT_E_JEODONG', name: '저동항', region: 'east', lat: 37.4970, lon: 130.9140, mudflat: false, group: '울릉군', province: '경상북도' },
  { id: 'PT_E_GWANEUMDO', name: '관음도', region: 'east', lat: 37.5440, lon: 130.9250, mudflat: false, group: '울릉군', province: '경상북도' },
  { id: 'PT_E_CHEONBU', name: '천부항', region: 'east', lat: 37.5450, lon: 130.8700, mudflat: false, group: '울릉군', province: '경상북도' },
  { id: 'PT_E_DOKDO', name: '독도', region: 'east', lat: 37.2417, lon: 131.8670, mudflat: false, group: '울릉군', province: '경상북도' },

  // ── 강원특별자치도 · 삼척시 ──
  { id: 'PT_E_IMWON', name: '임원항', region: 'east', lat: 37.2290, lon: 129.3500, mudflat: false, group: '삼척시', province: '강원특별자치도' },
  { id: 'PT_E_JANGHO', name: '장호항·장호해변', region: 'east', lat: 37.2870, lon: 129.3170, mudflat: false, group: '삼척시', province: '강원특별자치도' },
  { id: 'PT_E_YONGHWA', name: '용화해변', region: 'east', lat: 37.2960, lon: 129.3130, mudflat: false, group: '삼척시', province: '강원특별자치도' },
  { id: 'PT_E_CHOGOK', name: '초곡항', region: 'east', lat: 37.3070, lon: 129.3090, mudflat: false, group: '삼척시', province: '강원특별자치도' },
  { id: 'PT_E_GUNGCHON', name: '궁촌해변', region: 'east', lat: 37.3250, lon: 129.2980, mudflat: false, group: '삼척시', province: '강원특별자치도' },
  { id: 'PT_E_MAENGBANG', name: '맹방해수욕장', region: 'east', lat: 37.3950, lon: 129.2360, mudflat: false, group: '삼척시', province: '강원특별자치도' },
  { id: 'PT_E_HUJIN', name: '삼척 후진해변', region: 'east', lat: 37.4540, lon: 129.1860, mudflat: false, group: '삼척시', province: '강원특별자치도' },
  { id: 'PT_E_SAMCHEOK_BEACH', name: '삼척해수욕장', region: 'east', lat: 37.4610, lon: 129.1800, mudflat: false, group: '삼척시', province: '강원특별자치도' },

  // ── 강원특별자치도 · 동해시 ──
  { id: 'PT_E_CHUAM', name: '추암 촛대바위', region: 'east', lat: 37.4750, lon: 129.1610, mudflat: false, group: '동해시', province: '강원특별자치도' },
  { id: 'DT_0057', name: '동해항', region: 'east', lat: 37.4944, lon: 129.1438, mudflat: false, group: '동해시', province: '강원특별자치도' },
  { id: 'DT_0006', name: '묵호항', region: 'east', lat: 37.5502, lon: 129.1164, mudflat: false, group: '동해시', province: '강원특별자치도' },
  { id: 'PT_E_DAEJIN_DH', name: '대진해변(동해)', region: 'east', lat: 37.5660, lon: 129.1080, mudflat: false, group: '동해시', province: '강원특별자치도' },
  { id: 'PT_E_MANGSANG', name: '망상해수욕장', region: 'east', lat: 37.5880, lon: 129.0950, mudflat: false, group: '동해시', province: '강원특별자치도' },

  // ── 강원특별자치도 · 강릉시 ──
  { id: 'PT_E_OKGYE', name: '옥계해변', region: 'east', lat: 37.6250, lon: 129.0540, mudflat: false, group: '강릉시', province: '강원특별자치도' },
  { id: 'PT_E_JEONGDONGJIN', name: '정동진', region: 'east', lat: 37.6900, lon: 129.0340, mudflat: false, group: '강릉시', province: '강원특별자치도' },
  { id: 'PT_E_ANIN', name: '안인해변', region: 'east', lat: 37.7360, lon: 128.9890, mudflat: false, group: '강릉시', province: '강원특별자치도' },
  { id: 'PT_E_GANGMUN', name: '강문해변', region: 'east', lat: 37.7920, lon: 128.9180, mudflat: false, group: '강릉시', province: '강원특별자치도' },
  { id: 'PT_E_GYEONGPO', name: '경포해수욕장', region: 'east', lat: 37.8050, lon: 128.9090, mudflat: false, group: '강릉시', province: '강원특별자치도' },
  { id: 'PT_E_SACHEONJIN', name: '사천진해변', region: 'east', lat: 37.8400, lon: 128.8790, mudflat: false, group: '강릉시', province: '강원특별자치도' },
  { id: 'PT_E_YEONGOK', name: '연곡해변', region: 'east', lat: 37.8580, lon: 128.8680, mudflat: false, group: '강릉시', province: '강원특별자치도' },
  { id: 'PT_E_JUMUNJIN', name: '주문진항', region: 'east', lat: 37.8940, lon: 128.8310, mudflat: false, group: '강릉시', province: '강원특별자치도' },
  { id: 'PT_E_SODOL', name: '소돌해변(아들바위)', region: 'east', lat: 37.9010, lon: 128.8230, mudflat: false, group: '강릉시', province: '강원특별자치도' },

  // ── 강원특별자치도 · 양양군 ──
  { id: 'PT_E_NAMAE', name: '남애항', region: 'east', lat: 37.9430, lon: 128.7900, mudflat: false, group: '양양군', province: '강원특별자치도' },
  { id: 'PT_E_INGU', name: '인구해변', region: 'east', lat: 37.9640, lon: 128.7810, mudflat: false, group: '양양군', province: '강원특별자치도' },
  { id: 'PT_E_JUKDO', name: '죽도해변', region: 'east', lat: 37.9720, lon: 128.7780, mudflat: false, group: '양양군', province: '강원특별자치도' },
  { id: 'PT_E_DONGSAN', name: '동산항', region: 'east', lat: 38.0050, lon: 128.7500, mudflat: false, group: '양양군', province: '강원특별자치도' },
  { id: 'PT_E_HAJODAE', name: '하조대해수욕장', region: 'east', lat: 38.0210, lon: 128.7410, mudflat: false, group: '양양군', province: '강원특별자치도' },
  { id: 'PT_E_SUSAN', name: '수산항', region: 'east', lat: 38.0750, lon: 128.6750, mudflat: false, group: '양양군', province: '강원특별자치도' },
  { id: 'PT_E_NAKSAN', name: '낙산해수욕장', region: 'east', lat: 38.1130, lon: 128.6340, mudflat: false, group: '양양군', province: '강원특별자치도' },
  { id: 'PT_E_SEORAK_BEACH', name: '설악해변', region: 'east', lat: 38.1450, lon: 128.6120, mudflat: false, group: '양양군', province: '강원특별자치도' },
  { id: 'PT_E_MULCHI', name: '물치항', region: 'east', lat: 38.1610, lon: 128.6050, mudflat: false, group: '양양군', province: '강원특별자치도' },

  // ── 강원특별자치도 · 속초시 ──
  { id: 'PT_E_OEONGCHI', name: '외옹치해변', region: 'east', lat: 38.1850, lon: 128.6030, mudflat: false, group: '속초시', province: '강원특별자치도' },
  { id: 'PT_E_SOKCHO_BEACH', name: '속초해수욕장', region: 'east', lat: 38.1900, lon: 128.6010, mudflat: false, group: '속초시', province: '강원특별자치도' },
  { id: 'DT_0012', name: '속초항', region: 'east', lat: 38.2070, lon: 128.5940, mudflat: false, group: '속초시', province: '강원특별자치도' },
  { id: 'PT_E_YEONGGEUMJEONG', name: '영금정', region: 'east', lat: 38.2120, lon: 128.6010, mudflat: false, group: '속초시', province: '강원특별자치도' },
  { id: 'PT_E_JANGSA_SC', name: '장사항', region: 'east', lat: 38.2290, lon: 128.5900, mudflat: false, group: '속초시', province: '강원특별자치도' },

  // ── 강원특별자치도 · 고성군 ──
  { id: 'PT_E_CHEONGGAN', name: '청간해변', region: 'east', lat: 38.2640, lon: 128.5680, mudflat: false, group: '고성군', province: '강원특별자치도' },
  { id: 'PT_E_AYAJIN', name: '아야진해변', region: 'east', lat: 38.2760, lon: 128.5590, mudflat: false, group: '고성군', province: '강원특별자치도' },
  { id: 'PT_E_GYOAM', name: '교암해변(문암)', region: 'east', lat: 38.2960, lon: 128.5520, mudflat: false, group: '고성군', province: '강원특별자치도' },
  { id: 'PT_E_BAEKDO', name: '백도해변', region: 'east', lat: 38.3110, lon: 128.5460, mudflat: false, group: '고성군', province: '강원특별자치도' },
  { id: 'PT_E_SAMPO', name: '삼포해변', region: 'east', lat: 38.3190, lon: 128.5420, mudflat: false, group: '고성군', province: '강원특별자치도' },
  { id: 'PT_E_SONGJIHO', name: '송지호해변', region: 'east', lat: 38.3290, lon: 128.5360, mudflat: false, group: '고성군', province: '강원특별자치도' },
  { id: 'PT_E_GAJIN', name: '가진항', region: 'east', lat: 38.3730, lon: 128.5100, mudflat: false, group: '고성군', province: '강원특별자치도' },
  { id: 'PT_E_GEOJIN', name: '거진항', region: 'east', lat: 38.4460, lon: 128.4590, mudflat: false, group: '고성군', province: '강원특별자치도' },
  { id: 'PT_E_BANAM', name: '반암해변', region: 'east', lat: 38.4670, lon: 128.4440, mudflat: false, group: '고성군', province: '강원특별자치도' },
  { id: 'PT_E_HWAJINPO', name: '화진포', region: 'east', lat: 38.4780, lon: 128.4360, mudflat: false, group: '고성군', province: '강원특별자치도' },
  { id: 'PT_E_DAEJIN_GS', name: '대진항(고성)', region: 'east', lat: 38.5000, lon: 128.4250, mudflat: false, group: '고성군', province: '강원특별자치도' },
  { id: 'PT_E_MYEONGPA', name: '명파해변', region: 'east', lat: 38.5300, lon: 128.4070, mudflat: false, group: '고성군', province: '강원특별자치도' },
];

// 가상 지점 → 최근접 KHOA 조위관측소 코드
export const CODE_MAP_E: Record<string, string> = {
  // 울산 → DT_0020 울산
  PT_E_NASA: 'DT_0020',
  PT_E_GANJEOLGOT: 'DT_0020',
  PT_E_JINHA: 'DT_0020',
  PT_E_JANGSAENGPO: 'DT_0020',
  PT_E_DAEWANGAM: 'DT_0020',
  PT_E_ILSAN: 'DT_0020',
  PT_E_JUJEON: 'DT_0020',
  PT_E_JEONGJA: 'DT_0020',
  PT_E_GANGDONG: 'DT_0020',
  // 경주 남부 → 울산, 북부 → 포항
  PT_E_BONGGIL: 'DT_0020',
  PT_E_NAJEONG: 'DT_0020',
  PT_E_GAMPO: 'DT_0091',
  PT_E_ORYU: 'DT_0091',
  // 포항 → DT_0091 포항
  PT_E_GURYONGPO: 'DT_0091',
  PT_E_HOMIGOT: 'DT_0091',
  PT_E_DOGU: 'DT_0091',
  PT_E_POHANG_SONGDO: 'DT_0091',
  PT_E_YEONGILDAE: 'DT_0091',
  PT_E_CHILPO: 'DT_0091',
  PT_E_ODORI: 'DT_0091',
  PT_E_IGARI: 'DT_0091',
  PT_E_WOLPO: 'DT_0091',
  PT_E_HWAJIN: 'DT_0091',
  // 영덕 남부 → 포항, 북부 → 후포
  PT_E_JANGSA: 'DT_0091',
  PT_E_SAMSA: 'DT_0091',
  PT_E_GANGGU: 'DT_0091',
  PT_E_CHANGPOMAL: 'DT_0011',
  PT_E_CHUKSAN: 'DT_0011',
  PT_E_DAEJIN_YD: 'DT_0011',
  PT_E_GORAEBUL: 'DT_0011',
  // 울진 → DT_0011 후포
  PT_E_MANGYANG: 'DT_0011',
  PT_E_GUSAN: 'DT_0011',
  PT_E_MANGYANGJEONG: 'DT_0011',
  PT_E_BONGPYEONG: 'DT_0011',
  PT_E_JUKBYEON: 'DT_0011',
  PT_E_NAGOK: 'DT_0011',
  // 울릉·독도 → DT_0013 울릉도
  PT_E_NAMYANG: 'DT_0013',
  PT_E_SADONG: 'DT_0013',
  PT_E_DODONG: 'DT_0013',
  PT_E_JEODONG: 'DT_0013',
  PT_E_GWANEUMDO: 'DT_0013',
  PT_E_CHEONBU: 'DT_0013',
  PT_E_DOKDO: 'DT_0013',
  // 삼척 → DT_0057 동해항
  PT_E_IMWON: 'DT_0057',
  PT_E_JANGHO: 'DT_0057',
  PT_E_YONGHWA: 'DT_0057',
  PT_E_CHOGOK: 'DT_0057',
  PT_E_GUNGCHON: 'DT_0057',
  PT_E_MAENGBANG: 'DT_0057',
  PT_E_HUJIN: 'DT_0057',
  PT_E_SAMCHEOK_BEACH: 'DT_0057',
  // 동해 → 추암은 동해항, 북부는 묵호
  PT_E_CHUAM: 'DT_0057',
  PT_E_DAEJIN_DH: 'DT_0006',
  PT_E_MANGSANG: 'DT_0006',
  // 강릉 → 남부는 묵호, 주문진권은 속초
  PT_E_OKGYE: 'DT_0006',
  PT_E_JEONGDONGJIN: 'DT_0006',
  PT_E_ANIN: 'DT_0006',
  PT_E_GANGMUN: 'DT_0006',
  PT_E_GYEONGPO: 'DT_0006',
  PT_E_SACHEONJIN: 'DT_0006',
  PT_E_YEONGOK: 'DT_0006',
  PT_E_JUMUNJIN: 'DT_0012',
  PT_E_SODOL: 'DT_0012',
  // 양양 → DT_0012 속초
  PT_E_NAMAE: 'DT_0012',
  PT_E_INGU: 'DT_0012',
  PT_E_JUKDO: 'DT_0012',
  PT_E_DONGSAN: 'DT_0012',
  PT_E_HAJODAE: 'DT_0012',
  PT_E_SUSAN: 'DT_0012',
  PT_E_NAKSAN: 'DT_0012',
  PT_E_SEORAK_BEACH: 'DT_0012',
  PT_E_MULCHI: 'DT_0012',
  // 속초 → DT_0012 속초
  PT_E_OEONGCHI: 'DT_0012',
  PT_E_SOKCHO_BEACH: 'DT_0012',
  PT_E_YEONGGEUMJEONG: 'DT_0012',
  PT_E_JANGSA_SC: 'DT_0012',
  // 고성 → DT_0012 속초
  PT_E_CHEONGGAN: 'DT_0012',
  PT_E_AYAJIN: 'DT_0012',
  PT_E_GYOAM: 'DT_0012',
  PT_E_BAEKDO: 'DT_0012',
  PT_E_SAMPO: 'DT_0012',
  PT_E_SONGJIHO: 'DT_0012',
  PT_E_GAJIN: 'DT_0012',
  PT_E_GEOJIN: 'DT_0012',
  PT_E_BANAM: 'DT_0012',
  PT_E_HWAJINPO: 'DT_0012',
  PT_E_DAEJIN_GS: 'DT_0012',
  PT_E_MYEONGPA: 'DT_0012',
};
