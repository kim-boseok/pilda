import type { Station } from '../../types';

// 국립해양조사원 해수욕지수·갯벌체험지수 API의 전국 지점 목록에서 추가한 바다들
// (scripts/genExtraStations.mjs 로 생성 — 기존 지점 2km 이내는 제외)
export const STATIONS_X: Station[] = [
  { id: 'PT_X_001', name: '관성해수욕장', region: 'east', lat: 35.659, lon: 129.451, mudflat: false, group: '경주시', province: '경상북도' }, // 경주 양남면 (강동몽돌해변 인근 2.6km)
  { id: 'PT_X_002', name: '백사마을 갯벌체험장', region: 'south', lat: 34.49288, lon: 126.7939, mudflat: true, group: '강진군', province: '전남광주통합특별시' }, // 강진 마량항 인근 4.7km
  { id: 'PT_X_003', name: '장양마을 갯벌체험장', region: 'south', lat: 34.8274, lon: 127.3944, mudflat: true, group: '보성군', province: '전남광주통합특별시' }, // 보성 벌교 갯벌 인근 5.5km
  { id: 'PT_X_004', name: '거차마을 갯벌체험장', region: 'south', lat: 34.8369, lon: 127.44654, mudflat: true, group: '순천시', province: '전남광주통합특별시' }, // 순천 화포해변 인근 5.4km
  { id: 'PT_X_005', name: '냉천마을 갯벌체험장', region: 'south', lat: 34.9008, lon: 128.02302, mudflat: true, group: '남해군', province: '경상남도' }, // 남해 창선면 당항리 — 물때는 건너편 삼천포항(DT_0061) 기준
  { id: 'PT_X_006', name: '문항마을 갯벌체험장', region: 'south', lat: 34.91482, lon: 127.92939, mudflat: true, group: '남해군', province: '경상남도' }, // 남해 설천면 (하동 중평항 인근 7.1km)
  { id: 'PT_X_007', name: '다대마을 갯벌체험장', region: 'south', lat: 34.73707, lon: 128.62805, mudflat: true, group: '거제시', province: '경상남도' }, // 거제 여차몽돌해변 인근 2.4km
  { id: 'PT_X_008', name: '돌머리마을 갯벌체험장', region: 'west', lat: 35.08682, lon: 126.43893, mudflat: true, group: '함평군', province: '전남광주통합특별시' }, // 주포항 인근 3.1km
  { id: 'PT_X_009', name: '둔장마을 갯벌체험장', region: 'west', lat: 34.91579, lon: 126.05738, mudflat: true, group: '신안군', province: '전남광주통합특별시' }, // 증도 우전해변 인근 10.9km
  { id: 'PT_X_011', name: '죽림마을 갯벌체험장', region: 'west', lat: 34.39148, lon: 126.25985, mudflat: true, group: '진도군', province: '전남광주통합특별시' }, // 굴포항 인근 2.5km
  { id: 'PT_X_012', name: '선감마을 갯벌체험장', region: 'west', lat: 37.21646, lon: 126.63152, mudflat: true, group: '안산시', province: '경기도' }, // 안산 선감도 (전곡항 인근 3.2km)
  { id: 'PT_X_013', name: '만대마을 갯벌체험장', region: 'west', lat: 36.9286, lon: 126.308, mudflat: true, group: '태안군', province: '충청남도' }, // 태안 이원면 (웅도 인근 9.0km)
  { id: 'PT_X_014', name: '월하성마을 갯벌체험장', region: 'west', lat: 36.13162, lon: 126.5627, mudflat: true, group: '서천군', province: '충청남도' }, // 춘장대해수욕장 인근 3.8km
  { id: 'PT_X_015', name: '신시도마을 갯벌체험장', region: 'west', lat: 35.81888, lon: 126.45203, mudflat: true, group: '군산시', province: '전북특별자치도' }, // 무녀도 인근 2.4km
  { id: 'PT_X_016', name: '만돌마을 갯벌체험장', region: 'west', lat: 35.53448, lon: 126.51427, mudflat: true, group: '고창군', province: '전북특별자치도' }, // 고창 심원면 (모항해수욕장 인근 4.2km)
  { id: 'PT_X_017', name: '하전마을 갯벌체험장', region: 'west', lat: 35.54835, lon: 126.5625, mudflat: true, group: '고창군', province: '전북특별자치도' }, // 고창 부안면 (모항해수욕장 인근 5.1km)
];

export const CODE_MAP_X: Record<string, string> = {
  PT_X_001: 'DT_0020',
  PT_X_002: 'DT_0027',
  PT_X_003: 'DT_0092',
  PT_X_004: 'DT_0092',
  PT_X_005: 'DT_0061',
  PT_X_006: 'DT_0061',
  PT_X_007: 'DT_0029',
  PT_X_008: 'DT_0066',
  PT_X_009: 'DT_0007',
  PT_X_011: 'DT_0028',
  PT_X_012: 'DT_0008',
  PT_X_013: 'DT_0017',
  PT_X_014: 'DT_0051',
  PT_X_015: 'DT_0018',
  PT_X_016: 'DT_0003',
  PT_X_017: 'DT_0003',
};
