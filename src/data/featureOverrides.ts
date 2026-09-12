import type { SeaFeature } from './features';

/**
 * 유명 지점 큐레이션 — 전국적으로 알려진 특징·서식 생물만 수록 (확신 없는 정보 금지)
 * 미수록 지점은 features.ts의 규칙 기반 추론을 따른다.
 */
export const FEATURE_OVERRIDES: Record<string, Partial<SeaFeature>> = {
  // ── 인천·경기 ──
  DT_0032: { tags: ['mudflat', 'island'], species: ['칠게', '농게'] }, // 강화도 갯벌
  PT_WN_DONGMAK: { tags: ['mudflat', 'beach'], species: ['칠게', '농게'] }, // 강화 동막해변
  PT_WN_EULWANGRI: { tags: ['sunset', 'beach'] }, // 을왕리 일몰
  PT_WN_HANAGAE: { tags: ['beach', 'mudflat'] }, // 무의도 하나개
  PT_WN_SILMIDO: { tags: ['island', 'mudflat'] }, // 실미도
  PT_WN_WOLMIDO: { tags: ['view', 'walk'] }, // 월미도
  PT_WN_SORAE: { tags: ['port'], species: ['꽃게', '새우'] }, // 소래포구(꽃게·새우젓)
  DT_0060: { tags: ['fishing', 'island'], species: ['꽃게'] }, // 연평도 꽃게
  DT_0059: { tags: ['island', 'view'] }, // 백령도
  PT_WN_SAGOT: { tags: ['beach', 'view'] }, // 백령도 사곶(천연활주로)
  PT_WN_KONGDOL: { tags: ['view', 'walk'] }, // 백령도 콩돌해안
  PT_WN_OIDO: { tags: ['mudflat', 'port'], species: ['바지락'] }, // 오이도
  PT_WN_BANGAMEORI: { tags: ['mudflat', 'beach'], species: ['바지락'] }, // 대부도 방아머리
  PT_WN_GUBONGDO: { tags: ['sunset', 'walk'] }, // 구봉도 낙조전망대
  DT_0008: { tags: ['sunset', 'mudflat'], species: ['바지락'] }, // 탄도항(누에섬 낙조)
  PT_WN_JEBUDO: { tags: ['mudflat', 'island'], species: ['바지락'] }, // 제부도 바닷길
  PT_WN_BAEKMIRI: { tags: ['mudflat'], species: ['바지락'] }, // 백미리 어촌체험마을
  PT_WN_GUNGPYEONG: { tags: ['sunset', 'port'], species: ['바지락'] }, // 궁평항 낙조
  PT_WN_SEONJAEDO: { tags: ['mudflat', 'view'], species: ['바지락'] }, // 선재도(측도)
  DT_0043: { tags: ['island', 'mudflat'], species: ['바지락'] }, // 영흥도
  // ── 충남 ──
  PT_WN_WAEMOK: { tags: ['sunrise', 'sunset'] }, // 왜목마을(일출·일몰 동시)
  PT_WN_SINDURI: { tags: ['beach', 'walk'] }, // 신두리 해안사구
  PT_WN_MANRIPO: { tags: ['beach', 'surf'] }, // 만리포 서핑
  PT_WN_MONGSANPO: { tags: ['mudflat', 'beach'], species: ['바지락', '맛조개'] }, // 몽산포
  DT_0050: { tags: ['sunset', 'beach'] }, // 꽃지 할미할아비바위 낙조
  PT_WN_BAEKSAJANG: { tags: ['port'], species: ['새우'] }, // 백사장항(대하)
  PT_WN_NAMDANG: { tags: ['port'], species: ['새우'] }, // 남당항(대하·새조개)
  DT_0025: { tags: ['beach'] }, // 대천해수욕장(머드축제)
  PT_WN_MUCHANGPO: { tags: ['mudflat', 'beach'], species: ['바지락'] }, // 무창포 신비의 바닷길
  DT_0051: { tags: ['sunrise', 'port'] }, // 마량포구(서해 일출 명소)
  DT_0024: { tags: ['mudflat'], species: ['주꾸미'] }, // 장항(서천 주꾸미)
  // ── 전북 ──
  DT_0018: { tags: ['port'], species: ['주꾸미'] }, // 군산항
  PT_WN_SEONYUDO: { tags: ['island', 'beach'] }, // 선유도
  PT_WN_BYEONSAN: { tags: ['beach'] }, // 변산해수욕장
  PT_WN_GYEOKPO: { tags: ['view', 'port', 'sunset'] }, // 격포항(채석강)
  PT_WN_GOMSO: { tags: ['port', 'mudflat'], species: ['바지락'] }, // 곰소항(젓갈)
  // ── 전남 서부 ──
  DT_0003: { tags: ['sunset', 'view'] }, // 영광 백수해안도로
  PT_WJ_BEOPSEONGPO: { tags: ['port'] }, // 법성포(굴비)
  PT_WJ_DORIPO: { tags: ['sunrise', 'port'], species: ['낙지'] }, // 무안 도리포(낙지)
  PT_WJ_JJANGTTUNGEO: { tags: ['mudflat', 'walk'], species: ['짱뚱어', '낙지'] }, // 증도 짱뚱어다리
  PT_WJ_UJEON: { tags: ['beach', 'sunset'] }, // 증도 우전해변
  PT_WJ_BAKJIDO: { tags: ['island', 'walk'], species: ['낙지'] }, // 퍼플섬 박지도
  PT_WJ_BANWOLDO: { tags: ['island', 'walk'], species: ['낙지'] }, // 퍼플섬 반월도
  DT_0035: { tags: ['island', 'port'] }, // 흑산도(홍어)
  PT_WJ_HONGDO: { tags: ['island', 'view'] }, // 홍도
  PT_WJ_GAGEODO: { tags: ['island', 'fishing'] }, // 가거도(낚시 성지)
  DT_0007: { tags: ['port'], species: ['낙지'] }, // 목포항(세발낙지)
  PT_WJ_GOHADO: { tags: ['view', 'walk'] }, // 고하도(해상케이블카)
  PT_WJ_HOEDONG: { tags: ['view', 'walk'] }, // 진도 신비의 바닷길
  // ── 남해안 ──
  PT_S_TTANGKKEUT: { tags: ['sunset', 'view'] }, // 해남 땅끝
  PT_S_CHEONGSANDO: { tags: ['island', 'walk'] }, // 청산도(슬로시티)
  DT_0027: { tags: ['port', 'island'] }, // 완도항
  PT_S_GAUDO: { tags: ['walk', 'view'] }, // 강진 가우도 출렁다리
  PT_S_SODEUNGSEOM: { tags: ['sunrise', 'view'] }, // 장흥 소등섬
  PT_S_BEOLGYO: { tags: ['mudflat', 'port'], species: ['꼬막', '짱뚱어'] }, // 벌교 꼬막
  PT_S_SUNCHEONMAN: { tags: ['mudflat', 'view'], species: ['짱뚱어', '칠게'] }, // 순천만습지
  PT_S_WAON: { tags: ['sunset', 'mudflat'], species: ['짱뚱어'] }, // 와온해변 일몰
  PT_S_HWAPO: { tags: ['sunrise', 'mudflat'], species: ['짱뚱어'] }, // 화포 일출
  PT_S_SOROKDO: { tags: ['island', 'walk'] }, // 소록도
  DT_0031: { tags: ['island', 'fishing'] }, // 거문도
  PT_S_HYANGILAM: { tags: ['sunrise', 'view'] }, // 여수 향일암 일출
  DT_0016: { tags: ['port', 'view'] }, // 여수항(여수 밤바다)
  PT_S_GEUMO_JIKPO: { tags: ['walk', 'island'] }, // 금오도 비렁길
  PT_S_GACHEON: { tags: ['view'] }, // 남해 가천다랭이마을
  PT_S_SANGJU: { tags: ['beach'] }, // 남해 상주은모래비치
  PT_S_MIJO: { tags: ['port', 'fishing'] }, // 남해 미조항(멸치)
  PT_S_JIJOK: { tags: ['view', 'port'] }, // 지족해협 죽방렴
  PT_S_SANGJOGAM: { tags: ['view', 'walk'] }, // 고성 상족암(공룡발자국)
  DT_0061: { tags: ['port'] }, // 삼천포항(수산시장)
  PT_S_DALAHANG: { tags: ['sunset', 'view'] }, // 통영 달아공원 일몰
  DT_0014: { tags: ['port', 'view'] }, // 통영항(중앙시장)
  PT_S_DONAM: { tags: ['view'] }, // 통영 도남(케이블카·루지)
  PT_S_SARYANGDO: { tags: ['island', 'walk'] }, // 사량도(지리망산)
  PT_S_YOKJIDO: { tags: ['island', 'fishing'] }, // 욕지도(고등어)
  PT_S_SOMAEMULDO: { tags: ['island', 'view', 'walk'] }, // 소매물도 등대섬
  PT_S_OEDO: { tags: ['island', 'view'] }, // 거제 외도 보타니아
  PT_S_HAEGEUMGANG: { tags: ['view'] }, // 거제 해금강
  PT_S_HAKDONG: { tags: ['beach', 'walk'] }, // 학동몽돌해변
  PT_S_JEODO: { tags: ['walk', 'view'] }, // 저도 콰이강의다리 스카이워크
  PT_S_DADAEPO: { tags: ['sunset', 'beach'] }, // 다대포 일몰
  PT_S_SONGDO_BUSAN: { tags: ['beach', 'view'] }, // 부산 송도(해상케이블카)
  PT_S_TAEJONGDAE: { tags: ['view', 'walk'] }, // 태종대
  PT_S_HUINNYEOUL: { tags: ['view', 'walk'] }, // 흰여울문화마을
  PT_S_GWANGALLI: { tags: ['view', 'beach'] }, // 광안리(광안대교 뷰)
  PT_S_HAEUNDAE: { tags: ['beach', 'walk'] }, // 해운대
  PT_S_CHEONGSAPO: { tags: ['view'] }, // 청사포 다릿돌전망대
  PT_S_SONGJEONG_BUSAN: { tags: ['surf', 'beach'] }, // 송정 서핑
  PT_S_DAEBYEON: { tags: ['port'] }, // 기장 대변항(멸치)
  // ── 제주 ──
  PT_J_YONGDAM: { tags: ['view', 'walk'] }, // 용두암 해안도로
  PT_J_IHO: { tags: ['beach', 'sunset'] }, // 이호테우(목마등대)
  PT_J_HAMDEOK: { tags: ['beach', 'view'] }, // 함덕(서우봉 뷰)
  PT_J_WOLJEONG: { tags: ['beach', 'view'] }, // 월정리
  PT_J_SEHWA: { tags: ['beach', 'view'] }, // 세화
  DT_0022: { tags: ['sunrise', 'view'] }, // 성산일출봉
  PT_J_GWANGCHIGI: { tags: ['sunrise', 'view'] }, // 광치기해변(성산 뷰)
  PT_J_NAMWON: { tags: ['walk', 'view'] }, // 남원큰엉해안
  PT_J_SOESOKKAK: { tags: ['view'] }, // 쇠소깍
  PT_J_OEDOLGAE: { tags: ['view', 'walk'] }, // 외돌개
  PT_J_JUNGMUN: { tags: ['beach', 'surf'] }, // 중문색달(서핑)
  PT_J_DAEPYEONG: { tags: ['view'] }, // 대평리 박수기정
  PT_J_YONGMEORI: { tags: ['view', 'walk'] }, // 산방산 용머리해안
  PT_J_SAGYE: { tags: ['view', 'walk'] }, // 사계(형제섬·산방산 뷰)
  PT_J_SONGAKSAN: { tags: ['view', 'walk'] }, // 송악산 둘레길
  DT_0023: { tags: ['port'] }, // 모슬포항(방어)
  PT_J_SUWOLBONG: { tags: ['sunset', 'view'] }, // 수월봉 일몰
  PT_J_SINCHANG: { tags: ['sunset', 'view'] }, // 신창풍차해안
  PT_J_GEUMNEUNG: { tags: ['beach', 'view'] }, // 금능(비양도 뷰)
  PT_J_HYEOPJAE: { tags: ['beach', 'view', 'sunset'] }, // 협재(비양도 뷰)
  PT_J_HANDAM: { tags: ['view', 'walk'] }, // 애월 한담(카페거리)
  PT_J_UDO_SEOBIN: { tags: ['beach', 'view'] }, // 우도 서빈백사(홍조단괴)
  PT_J_GAPADO: { tags: ['island', 'walk'] }, // 가파도(청보리)
  PT_J_MARADO: { tags: ['island'] }, // 마라도(국토 최남단)
  PT_J_CHAGWIDO: { tags: ['sunset', 'island'] }, // 차귀도 일몰
  DT_0021: { tags: ['island', 'fishing'] }, // 추자도(낚시)
  // ── 동해안 ──
  PT_E_GANJEOLGOT: { tags: ['sunrise', 'view'] }, // 간절곶
  PT_E_JANGSAENGPO: { tags: ['port'] }, // 장생포(고래문화마을)
  PT_E_DAEWANGAM: { tags: ['view', 'walk'] }, // 대왕암공원
  PT_E_BONGGIL: { tags: ['sunrise', 'view'] }, // 봉길(문무대왕릉)
  PT_E_GURYONGPO: { tags: ['port'] }, // 구룡포(과메기)
  PT_E_HOMIGOT: { tags: ['sunrise', 'view'] }, // 호미곶(상생의 손)
  PT_E_YEONGILDAE: { tags: ['beach', 'view'] }, // 영일대
  PT_E_IGARI: { tags: ['view'] }, // 이가리 닻전망대
  PT_E_GANGGU: { tags: ['port'] }, // 강구항(영덕대게)
  PT_E_CHANGPOMAL: { tags: ['sunrise', 'view'] }, // 영덕 해맞이공원
  DT_0011: { tags: ['port'] }, // 울진 후포항(대게)
  PT_E_JUKBYEON: { tags: ['port'] }, // 죽변항
  PT_E_DODONG: { tags: ['island', 'port'] }, // 울릉도 도동항
  PT_E_JEODONG: { tags: ['island', 'port'] }, // 울릉도 저동항(오징어)
  PT_E_GWANEUMDO: { tags: ['view', 'walk'] }, // 관음도
  PT_E_DOKDO: { tags: ['island'] }, // 독도
  PT_E_JANGHO: { tags: ['view', 'beach'] }, // 장호항(한국의 나폴리)
  PT_E_CHUAM: { tags: ['sunrise', 'view'] }, // 추암 촛대바위
  DT_0006: { tags: ['port', 'view'] }, // 묵호항(논골담길)
  PT_E_JEONGDONGJIN: { tags: ['sunrise', 'beach'] }, // 정동진
  PT_E_GYEONGPO: { tags: ['beach', 'walk'] }, // 경포해수욕장
  PT_E_JUMUNJIN: { tags: ['port'] }, // 주문진항(수산시장)
  PT_E_INGU: { tags: ['surf', 'beach'] }, // 양양 인구(서핑)
  PT_E_JUKDO: { tags: ['surf', 'beach'] }, // 양양 죽도(서핑)
  PT_E_HAJODAE: { tags: ['view', 'beach'] }, // 하조대
  PT_E_NAKSAN: { tags: ['beach', 'sunrise'] }, // 낙산(의상대 일출)
  DT_0012: { tags: ['port'] }, // 속초항(수산시장)
  PT_E_YEONGGEUMJEONG: { tags: ['sunrise', 'view'] }, // 영금정
  PT_E_GEOJIN: { tags: ['port'] }, // 거진항(명태)
  PT_E_HWAJINPO: { tags: ['beach', 'view'] }, // 화진포
};
