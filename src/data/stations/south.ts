import type { Station } from '../../types';

// 남해안 — 해남~부산 (해안선 서→동 순서)
export const STATIONS_S: Station[] = [
  // 해남군
  { id: 'PT_S_USUYEONG', name: '해남 우수영(명량)', region: 'south', lat: 34.5730, lon: 126.3020, mudflat: false, group: '해남군', province: '전남광주통합특별시' },
  { id: 'PT_S_EORANJIN', name: '해남 어란진항', region: 'south', lat: 34.3520, lon: 126.4700, mudflat: false, group: '해남군', province: '전남광주통합특별시' },
  { id: 'PT_S_TTANGKKEUT', name: '해남 땅끝', region: 'south', lat: 34.2977, lon: 126.5266, mudflat: false, group: '해남군', province: '전남광주통합특별시' },
  { id: 'PT_S_SONGHO', name: '해남 송호해수욕장', region: 'south', lat: 34.3100, lon: 126.5170, mudflat: false, group: '해남군', province: '전남광주통합특별시' },
  { id: 'PT_S_SAGUMI', name: '해남 사구미해변', region: 'south', lat: 34.3240, lon: 126.5560, mudflat: false, group: '해남군', province: '전남광주통합특별시' },

  // 완도군
  { id: 'PT_S_BOGIL_YESONG', name: '보길도 예송리', region: 'south', lat: 34.1300, lon: 126.5560, mudflat: false, group: '완도군', province: '전남광주통합특별시' },
  { id: 'PT_S_BOGIL_JUNGRI', name: '보길도 중리해변', region: 'south', lat: 34.1460, lon: 126.5760, mudflat: false, group: '완도군', province: '전남광주통합특별시' },
  { id: 'PT_S_NOHWADO', name: '노화도', region: 'south', lat: 34.1950, lon: 126.6000, mudflat: false, group: '완도군', province: '전남광주통합특별시' },
  { id: 'PT_S_SOANDO', name: '소안도', region: 'south', lat: 34.1570, lon: 126.6350, mudflat: false, group: '완도군', province: '전남광주통합특별시' },
  { id: 'DT_0027', name: '완도항', region: 'south', lat: 34.3150, lon: 126.7590, mudflat: false, group: '완도군', province: '전남광주통합특별시' },
  { id: 'PT_S_MYEONGSASIMNI', name: '신지도 명사십리', region: 'south', lat: 34.3260, lon: 126.8200, mudflat: false, group: '완도군', province: '전남광주통합특별시' },
  { id: 'PT_S_CHEONGSANDO', name: '청산도', region: 'south', lat: 34.1900, lon: 126.8540, mudflat: false, group: '완도군', province: '전남광주통합특별시' },
  { id: 'PT_S_GOGEUMDO', name: '고금도', region: 'south', lat: 34.3900, lon: 126.8000, mudflat: false, group: '완도군', province: '전남광주통합특별시' },
  { id: 'PT_S_YAKSANDO', name: '약산도', region: 'south', lat: 34.3850, lon: 126.9200, mudflat: false, group: '완도군', province: '전남광주통합특별시' },
  { id: 'PT_S_SAENGILDO', name: '생일도', region: 'south', lat: 34.3150, lon: 126.9630, mudflat: false, group: '완도군', province: '전남광주통합특별시' },
  { id: 'PT_S_GEUMILDO', name: '금일도(평일도)', region: 'south', lat: 34.3450, lon: 127.0400, mudflat: false, group: '완도군', province: '전남광주통합특별시' },

  // 강진군
  { id: 'PT_S_MARYANG', name: '강진 마량항', region: 'south', lat: 34.4570, lon: 126.8220, mudflat: false, group: '강진군', province: '전남광주통합특별시' },
  { id: 'PT_S_GAUDO', name: '강진 가우도', region: 'south', lat: 34.5520, lon: 126.7680, mudflat: true, group: '강진군', province: '전남광주통합특별시' },

  // 장흥군
  { id: 'PT_S_SODEUNGSEOM', name: '장흥 소등섬', region: 'south', lat: 34.4990, lon: 126.9510, mudflat: false, group: '장흥군', province: '전남광주통합특별시' },
  { id: 'PT_S_HOEJIN', name: '장흥 회진항', region: 'south', lat: 34.4620, lon: 126.9980, mudflat: false, group: '장흥군', province: '전남광주통합특별시' },
  { id: 'PT_S_SUMUN', name: '장흥 수문해변', region: 'south', lat: 34.5550, lon: 126.9740, mudflat: false, group: '장흥군', province: '전남광주통합특별시' },

  // 보성군
  { id: 'PT_S_YULPO', name: '보성 율포해수욕장', region: 'south', lat: 34.6600, lon: 127.0930, mudflat: false, group: '보성군', province: '전남광주통합특별시' },
  { id: 'PT_S_BEOLGYO', name: '보성 벌교 갯벌', region: 'south', lat: 34.7900, lon: 127.3550, mudflat: true, group: '보성군', province: '전남광주통합특별시' },

  // 고흥군
  { id: 'PT_S_SOROKDO', name: '고흥 소록도', region: 'south', lat: 34.5180, lon: 127.1100, mudflat: false, group: '고흥군', province: '전남광주통합특별시' },
  { id: 'PT_S_NOKDONG', name: '고흥 녹동항', region: 'south', lat: 34.5270, lon: 127.1330, mudflat: false, group: '고흥군', province: '전남광주통합특별시' },
  { id: 'PT_S_GEOGEUM_IKGEUM', name: '거금도 익금해변', region: 'south', lat: 34.4520, lon: 127.1630, mudflat: false, group: '고흥군', province: '전남광주통합특별시' },
  { id: 'DT_0026', name: '고흥 발포', region: 'south', lat: 34.4810, lon: 127.3420, mudflat: false, group: '고흥군', province: '전남광주통합특별시' },
  { id: 'PT_S_NARODO', name: '나로도(외나로도)', region: 'south', lat: 34.4900, lon: 127.4550, mudflat: false, group: '고흥군', province: '전남광주통합특별시' },
  { id: 'PT_S_NAMYEOL', name: '고흥 남열해돋이해변', region: 'south', lat: 34.5850, lon: 127.4700, mudflat: false, group: '고흥군', province: '전남광주통합특별시' },
  { id: 'PT_S_UJU_OBS', name: '고흥 우주발사전망대', region: 'south', lat: 34.6000, lon: 127.4750, mudflat: false, group: '고흥군', province: '전남광주통합특별시' },
  { id: 'DT_0092', name: '여호항', region: 'south', lat: 34.6060, lon: 127.3860, mudflat: false, group: '고흥군', province: '전남광주통합특별시' },

  // 여수시
  { id: 'DT_0031', name: '거문도', region: 'south', lat: 34.0280, lon: 127.3080, mudflat: false, group: '여수시', province: '전남광주통합특별시' },
  { id: 'PT_S_CHODO', name: '여수 초도', region: 'south', lat: 34.2350, lon: 127.2600, mudflat: false, group: '여수시', province: '전남광주통합특별시' },
  { id: 'PT_S_NANGDO', name: '여수 낭도', region: 'south', lat: 34.6040, lon: 127.5330, mudflat: false, group: '여수시', province: '전남광주통합특별시' },
  { id: 'PT_S_SADO', name: '여수 사도', region: 'south', lat: 34.5860, lon: 127.5200, mudflat: false, group: '여수시', province: '전남광주통합특별시' },
  { id: 'PT_S_BAEGYADO', name: '여수 백야도', region: 'south', lat: 34.6200, lon: 127.6100, mudflat: false, group: '여수시', province: '전남광주통합특별시' },
  { id: 'PT_S_GAEDO', name: '여수 개도', region: 'south', lat: 34.5050, lon: 127.6350, mudflat: false, group: '여수시', province: '전남광주통합특별시' },
  { id: 'PT_S_GEUMO_JIKPO', name: '금오도 직포', region: 'south', lat: 34.5160, lon: 127.7450, mudflat: false, group: '여수시', province: '전남광주통합특별시' },
  { id: 'PT_S_HYANGILAM', name: '여수 향일암(임포)', region: 'south', lat: 34.5930, lon: 127.8030, mudflat: false, group: '여수시', province: '전남광주통합특별시' },
  { id: 'PT_S_BANGJUKPO', name: '돌산 방죽포해수욕장', region: 'south', lat: 34.6460, lon: 127.7950, mudflat: false, group: '여수시', province: '전남광주통합특별시' },
  { id: 'PT_S_MUSEULMOK', name: '돌산 무슬목해변', region: 'south', lat: 34.6870, lon: 127.7920, mudflat: false, group: '여수시', province: '전남광주통합특별시' },
  { id: 'DT_0016', name: '여수항', region: 'south', lat: 34.7470, lon: 127.7660, mudflat: false, group: '여수시', province: '전남광주통합특별시' },
  { id: 'PT_S_MANSEONGRI', name: '여수 만성리검은모래해변', region: 'south', lat: 34.7780, lon: 127.7490, mudflat: false, group: '여수시', province: '전남광주통합특별시' },
  { id: 'PT_S_MOSAGEUM', name: '여수 모사금해변', region: 'south', lat: 34.7720, lon: 127.7720, mudflat: false, group: '여수시', province: '전남광주통합특별시' },

  // 순천시
  { id: 'PT_S_HWAPO', name: '순천 화포해변', region: 'south', lat: 34.8450, lon: 127.5050, mudflat: true, group: '순천시', province: '전남광주통합특별시' },
  { id: 'PT_S_SUNCHEONMAN', name: '순천만습지', region: 'south', lat: 34.8850, lon: 127.5120, mudflat: true, group: '순천시', province: '전남광주통합특별시' },
  { id: 'PT_S_WAON', name: '순천 와온해변', region: 'south', lat: 34.8580, lon: 127.5520, mudflat: true, group: '순천시', province: '전남광주통합특별시' },

  // 광양시
  { id: 'DT_0049', name: '광양항', region: 'south', lat: 34.9040, lon: 127.7550, mudflat: false, group: '광양시', province: '전남광주통합특별시' },
  { id: 'PT_S_MANGDEOK', name: '광양 망덕포구', region: 'south', lat: 34.9430, lon: 127.7550, mudflat: false, group: '광양시', province: '전남광주통합특별시' },

  // 남해군
  { id: 'PT_S_SACHON', name: '남해 사촌해변', region: 'south', lat: 34.7520, lon: 127.9100, mudflat: false, group: '남해군', province: '경상남도' },
  { id: 'PT_S_GACHEON', name: '남해 가천다랭이마을', region: 'south', lat: 34.7250, lon: 127.8990, mudflat: false, group: '남해군', province: '경상남도' },
  { id: 'PT_S_DUGOK_WOLPO', name: '남해 두곡·월포해변', region: 'south', lat: 34.7320, lon: 127.9370, mudflat: false, group: '남해군', province: '경상남도' },
  { id: 'PT_S_SANGJU', name: '남해 상주은모래비치', region: 'south', lat: 34.7200, lon: 127.9900, mudflat: false, group: '남해군', province: '경상남도' },
  { id: 'PT_S_SONGJEONG_NAMHAE', name: '남해 송정솔바람해변', region: 'south', lat: 34.7180, lon: 128.0150, mudflat: false, group: '남해군', province: '경상남도' },
  { id: 'PT_S_MIJO', name: '남해 미조항', region: 'south', lat: 34.7100, lon: 128.0450, mudflat: false, group: '남해군', province: '경상남도' },
  { id: 'PT_S_MULGEON', name: '남해 물건방조어부림', region: 'south', lat: 34.8050, lon: 128.0700, mudflat: false, group: '남해군', province: '경상남도' },
  { id: 'PT_S_JIJOK', name: '남해 지족(죽방렴)', region: 'south', lat: 34.8340, lon: 128.0030, mudflat: true, group: '남해군', province: '경상남도' },
  { id: 'PT_S_CHANGSEON', name: '남해 창선도', region: 'south', lat: 34.8500, lon: 128.0300, mudflat: false, group: '남해군', province: '경상남도' },

  // 사천시
  { id: 'PT_S_BITO', name: '사천 비토섬', region: 'south', lat: 34.9450, lon: 128.0300, mudflat: true, group: '사천시', province: '경상남도' },
  { id: 'PT_S_DAEBANGJIN', name: '사천 대방진굴항', region: 'south', lat: 34.9300, lon: 128.0600, mudflat: false, group: '사천시', province: '경상남도' },
  { id: 'DT_0061', name: '삼천포항', region: 'south', lat: 34.9240, lon: 128.0700, mudflat: false, group: '사천시', province: '경상남도' },
  { id: 'PT_S_NAMILDAE', name: '사천 남일대해수욕장', region: 'south', lat: 34.9130, lon: 128.0880, mudflat: false, group: '사천시', province: '경상남도' },

  // 하동군
  { id: 'PT_S_SULSANG', name: '하동 술상전어마을', region: 'south', lat: 34.9900, lon: 127.8800, mudflat: false, group: '하동군', province: '경상남도' },
  { id: 'PT_S_JUNGPYEONG', name: '하동 중평항', region: 'south', lat: 34.9600, lon: 127.8750, mudflat: false, group: '하동군', province: '경상남도' },

  // 고성군
  { id: 'PT_S_SANGJOGAM', name: '고성 상족암', region: 'south', lat: 34.9400, lon: 128.1800, mudflat: false, group: '고성군', province: '경상남도' },
  { id: 'PT_S_DANGHANGPO', name: '고성 당항포', region: 'south', lat: 35.0500, lon: 128.3550, mudflat: false, group: '고성군', province: '경상남도' },

  // 통영시
  { id: 'PT_S_SARYANGDO', name: '사량도', region: 'south', lat: 34.8360, lon: 128.2300, mudflat: false, group: '통영시', province: '경상남도' },
  { id: 'PT_S_YOKJIDO', name: '욕지도', region: 'south', lat: 34.6250, lon: 128.2700, mudflat: false, group: '통영시', province: '경상남도' },
  { id: 'PT_S_CHUDO', name: '통영 추도', region: 'south', lat: 34.7850, lon: 128.2950, mudflat: false, group: '통영시', province: '경상남도' },
  { id: 'PT_S_YEONHWADO', name: '연화도', region: 'south', lat: 34.6740, lon: 128.3120, mudflat: false, group: '통영시', province: '경상남도' },
  { id: 'PT_S_DALAHANG', name: '통영 달아항', region: 'south', lat: 34.7600, lon: 128.3950, mudflat: false, group: '통영시', province: '경상남도' },
  { id: 'PT_S_CHEOKPO', name: '통영 산양 척포', region: 'south', lat: 34.7300, lon: 128.4200, mudflat: false, group: '통영시', province: '경상남도' },
  { id: 'PT_S_DONAM', name: '통영 도남관광지', region: 'south', lat: 34.8260, lon: 128.4170, mudflat: false, group: '통영시', province: '경상남도' },
  { id: 'DT_0014', name: '통영항', region: 'south', lat: 34.8280, lon: 128.4340, mudflat: false, group: '통영시', province: '경상남도' },
  { id: 'PT_S_BIJINDO', name: '비진도', region: 'south', lat: 34.7200, lon: 128.4550, mudflat: false, group: '통영시', province: '경상남도' },
  { id: 'PT_S_HANSANDO', name: '한산도', region: 'south', lat: 34.7950, lon: 128.4900, mudflat: false, group: '통영시', province: '경상남도' },
  { id: 'PT_S_MAEMULDO', name: '매물도', region: 'south', lat: 34.6500, lon: 128.5450, mudflat: false, group: '통영시', province: '경상남도' },
  { id: 'PT_S_SOMAEMULDO', name: '소매물도', region: 'south', lat: 34.6230, lon: 128.5500, mudflat: false, group: '통영시', province: '경상남도' },

  // 거제시
  { id: 'PT_S_GAJODO', name: '거제 가조도', region: 'south', lat: 34.9300, lon: 128.5800, mudflat: false, group: '거제시', province: '경상남도' },
  { id: 'PT_S_HWANGPO', name: '거제 황포해변', region: 'south', lat: 34.9700, lon: 128.6250, mudflat: false, group: '거제시', province: '경상남도' },
  { id: 'PT_S_CHILCHEONDO', name: '거제 칠천도', region: 'south', lat: 34.9750, lon: 128.6500, mudflat: false, group: '거제시', province: '경상남도' },
  { id: 'PT_S_OKPO', name: '거제 옥포', region: 'south', lat: 34.8900, lon: 128.7000, mudflat: false, group: '거제시', province: '경상남도' },
  { id: 'PT_S_NEUNGPO', name: '거제 능포항', region: 'south', lat: 34.8920, lon: 128.7350, mudflat: false, group: '거제시', province: '경상남도' },
  { id: 'PT_S_JANGSEUNGPO', name: '거제 장승포', region: 'south', lat: 34.8680, lon: 128.7350, mudflat: false, group: '거제시', province: '경상남도' },
  { id: 'PT_S_JISEPO', name: '거제 지세포', region: 'south', lat: 34.8330, lon: 128.7000, mudflat: false, group: '거제시', province: '경상남도' },
  { id: 'PT_S_WAHYEON', name: '거제 와현모래숲해변', region: 'south', lat: 34.8180, lon: 128.7050, mudflat: false, group: '거제시', province: '경상남도' },
  { id: 'DT_0029', name: '거제 구조라', region: 'south', lat: 34.8050, lon: 128.6920, mudflat: false, group: '거제시', province: '경상남도' },
  { id: 'PT_S_OEDO', name: '거제 외도 인근', region: 'south', lat: 34.7970, lon: 128.7100, mudflat: false, group: '거제시', province: '경상남도' },
  { id: 'PT_S_HAEGEUMGANG', name: '거제 해금강', region: 'south', lat: 34.7430, lon: 128.6780, mudflat: false, group: '거제시', province: '경상남도' },
  { id: 'PT_S_HAKDONG', name: '거제 학동몽돌해변', region: 'south', lat: 34.7660, lon: 128.6390, mudflat: false, group: '거제시', province: '경상남도' },
  { id: 'PT_S_YEOCHA', name: '거제 여차몽돌해변', region: 'south', lat: 34.7160, lon: 128.6260, mudflat: false, group: '거제시', province: '경상남도' },
  { id: 'PT_S_HONGPO', name: '거제 홍포', region: 'south', lat: 34.7230, lon: 128.5980, mudflat: false, group: '거제시', province: '경상남도' },
  { id: 'PT_S_MYEONGSA_GEOJE', name: '거제 명사해수욕장', region: 'south', lat: 34.7100, lon: 128.5900, mudflat: false, group: '거제시', province: '경상남도' },
  { id: 'PT_S_GEUNPO', name: '거제 근포', region: 'south', lat: 34.7230, lon: 128.5730, mudflat: false, group: '거제시', province: '경상남도' },

  // 창원시
  { id: 'PT_S_GWANGAM', name: '창원 광암해수욕장', region: 'south', lat: 35.1130, lon: 128.5170, mudflat: false, group: '창원시', province: '경상남도' },
  { id: 'PT_S_JEODO', name: '창원 저도 콰이강의다리', region: 'south', lat: 35.1040, lon: 128.5540, mudflat: false, group: '창원시', province: '경상남도' },
  { id: 'DT_0062', name: '마산항', region: 'south', lat: 35.1970, lon: 128.5760, mudflat: false, group: '창원시', province: '경상남도' },
  { id: 'PT_S_JINHAE_MYEONGDONG', name: '진해 명동(음지도)', region: 'south', lat: 35.0870, lon: 128.7450, mudflat: false, group: '창원시', province: '경상남도' },

  // 부산 서부
  { id: 'PT_S_GADEOK_DAEHANG', name: '가덕도 대항', region: 'south', lat: 35.0050, lon: 128.8200, mudflat: false, group: '부산 서부', province: '부산광역시' },
  { id: 'PT_S_DADAEPO', name: '다대포해수욕장', region: 'south', lat: 35.0460, lon: 128.9650, mudflat: true, group: '부산 서부', province: '부산광역시' },
  { id: 'PT_S_SONGDO_BUSAN', name: '송도해수욕장', region: 'south', lat: 35.0760, lon: 129.0170, mudflat: false, group: '부산 서부', province: '부산광역시' },
  { id: 'PT_S_AMNAM', name: '암남공원', region: 'south', lat: 35.0630, lon: 129.0190, mudflat: false, group: '부산 서부', province: '부산광역시' },

  // 부산 도심·영도
  { id: 'DT_0005', name: '부산항', region: 'south', lat: 35.0960, lon: 129.0350, mudflat: false, group: '부산 도심·영도', province: '부산광역시' },
  { id: 'PT_S_HUINNYEOUL', name: '흰여울문화마을', region: 'south', lat: 35.0780, lon: 129.0450, mudflat: false, group: '부산 도심·영도', province: '부산광역시' },
  { id: 'PT_S_TAEJONGDAE', name: '태종대', region: 'south', lat: 35.0530, lon: 129.0870, mudflat: false, group: '부산 도심·영도', province: '부산광역시' },

  // 해운대·기장
  { id: 'PT_S_GWANGALLI', name: '광안리해수욕장', region: 'south', lat: 35.1530, lon: 129.1190, mudflat: false, group: '해운대·기장', province: '부산광역시' },
  { id: 'PT_S_HAEUNDAE', name: '해운대해수욕장', region: 'south', lat: 35.1590, lon: 129.1600, mudflat: false, group: '해운대·기장', province: '부산광역시' },
  { id: 'PT_S_CHEONGSAPO', name: '청사포', region: 'south', lat: 35.1570, lon: 129.1920, mudflat: false, group: '해운대·기장', province: '부산광역시' },
  { id: 'PT_S_SONGJEONG_BUSAN', name: '송정해수욕장', region: 'south', lat: 35.1790, lon: 129.2000, mudflat: false, group: '해운대·기장', province: '부산광역시' },
  { id: 'PT_S_DAEBYEON', name: '기장 대변항', region: 'south', lat: 35.2230, lon: 129.2230, mudflat: false, group: '해운대·기장', province: '부산광역시' },
  { id: 'PT_S_JUKSEONG', name: '기장 죽성리', region: 'south', lat: 35.2400, lon: 129.2400, mudflat: false, group: '해운대·기장', province: '부산광역시' },
  { id: 'PT_S_ILGWANG', name: '일광해수욕장', region: 'south', lat: 35.2600, lon: 129.2340, mudflat: false, group: '해운대·기장', province: '부산광역시' },
  { id: 'PT_S_IMRANG', name: '임랑해수욕장', region: 'south', lat: 35.3180, lon: 129.2640, mudflat: false, group: '해운대·기장', province: '부산광역시' },
];

export const CODE_MAP_S: Record<string, string> = {
  // 해남군
  PT_S_USUYEONG: 'DT_0028',
  PT_S_EORANJIN: 'DT_0027',
  PT_S_TTANGKKEUT: 'DT_0027',
  PT_S_SONGHO: 'DT_0027',
  PT_S_SAGUMI: 'DT_0027',
  // 완도군
  PT_S_BOGIL_YESONG: 'DT_0027',
  PT_S_BOGIL_JUNGRI: 'DT_0027',
  PT_S_NOHWADO: 'DT_0027',
  PT_S_SOANDO: 'DT_0027',
  PT_S_MYEONGSASIMNI: 'DT_0027',
  PT_S_CHEONGSANDO: 'DT_0027',
  PT_S_GOGEUMDO: 'DT_0027',
  PT_S_YAKSANDO: 'DT_0027',
  PT_S_SAENGILDO: 'DT_0027',
  PT_S_GEUMILDO: 'DT_0027',
  // 강진군
  PT_S_MARYANG: 'DT_0027',
  PT_S_GAUDO: 'DT_0027',
  // 장흥군
  PT_S_SODEUNGSEOM: 'DT_0027',
  PT_S_HOEJIN: 'DT_0027',
  PT_S_SUMUN: 'DT_0026',
  // 보성군
  PT_S_YULPO: 'DT_0026',
  PT_S_BEOLGYO: 'DT_0026',
  // 고흥군
  PT_S_SOROKDO: 'DT_0026',
  PT_S_NOKDONG: 'DT_0026',
  PT_S_GEOGEUM_IKGEUM: 'DT_0026',
  PT_S_NARODO: 'DT_0026',
  PT_S_NAMYEOL: 'DT_0092',
  PT_S_UJU_OBS: 'DT_0092',
  // 여수시
  PT_S_CHODO: 'DT_0031',
  PT_S_NANGDO: 'DT_0016',
  PT_S_SADO: 'DT_0016',
  PT_S_BAEGYADO: 'DT_0016',
  PT_S_GAEDO: 'DT_0016',
  PT_S_GEUMO_JIKPO: 'DT_0016',
  PT_S_HYANGILAM: 'DT_0016',
  PT_S_BANGJUKPO: 'DT_0016',
  PT_S_MUSEULMOK: 'DT_0016',
  PT_S_MANSEONGRI: 'DT_0016',
  PT_S_MOSAGEUM: 'DT_0016',
  // 순천시
  PT_S_HWAPO: 'DT_0016',
  PT_S_SUNCHEONMAN: 'DT_0016',
  PT_S_WAON: 'DT_0016',
  // 광양시
  PT_S_MANGDEOK: 'DT_0049',
  // 남해군
  PT_S_SACHON: 'DT_0061',
  PT_S_GACHEON: 'DT_0061',
  PT_S_DUGOK_WOLPO: 'DT_0061',
  PT_S_SANGJU: 'DT_0061',
  PT_S_SONGJEONG_NAMHAE: 'DT_0061',
  PT_S_MIJO: 'DT_0061',
  PT_S_MULGEON: 'DT_0061',
  PT_S_JIJOK: 'DT_0061',
  PT_S_CHANGSEON: 'DT_0061',
  // 사천시
  PT_S_BITO: 'DT_0061',
  PT_S_DAEBANGJIN: 'DT_0061',
  PT_S_NAMILDAE: 'DT_0061',
  // 하동군
  PT_S_SULSANG: 'DT_0061',
  PT_S_JUNGPYEONG: 'DT_0061',
  // 고성군
  PT_S_SANGJOGAM: 'DT_0061',
  PT_S_DANGHANGPO: 'DT_0062',
  // 통영시
  PT_S_SARYANGDO: 'DT_0014',
  PT_S_YOKJIDO: 'DT_0014',
  PT_S_CHUDO: 'DT_0014',
  PT_S_YEONHWADO: 'DT_0014',
  PT_S_DALAHANG: 'DT_0014',
  PT_S_CHEOKPO: 'DT_0014',
  PT_S_DONAM: 'DT_0014',
  PT_S_BIJINDO: 'DT_0014',
  PT_S_HANSANDO: 'DT_0014',
  PT_S_MAEMULDO: 'DT_0014',
  PT_S_SOMAEMULDO: 'DT_0014',
  // 거제시
  PT_S_GAJODO: 'DT_0054',
  PT_S_HWANGPO: 'DT_0054',
  PT_S_CHILCHEONDO: 'DT_0054',
  PT_S_OKPO: 'DT_0029',
  PT_S_NEUNGPO: 'DT_0029',
  PT_S_JANGSEUNGPO: 'DT_0029',
  PT_S_JISEPO: 'DT_0029',
  PT_S_WAHYEON: 'DT_0029',
  PT_S_OEDO: 'DT_0029',
  PT_S_HAEGEUMGANG: 'DT_0029',
  PT_S_HAKDONG: 'DT_0029',
  PT_S_YEOCHA: 'DT_0029',
  PT_S_HONGPO: 'DT_0029',
  PT_S_MYEONGSA_GEOJE: 'DT_0029',
  PT_S_GEUNPO: 'DT_0029',
  // 창원시
  PT_S_GWANGAM: 'DT_0062',
  PT_S_JEODO: 'DT_0062',
  PT_S_JINHAE_MYEONGDONG: 'DT_0054',
  // 부산 서부
  PT_S_GADEOK_DAEHANG: 'DT_0063',
  PT_S_DADAEPO: 'DT_0063',
  PT_S_SONGDO_BUSAN: 'DT_0005',
  PT_S_AMNAM: 'DT_0005',
  // 부산 도심·영도
  PT_S_HUINNYEOUL: 'DT_0005',
  PT_S_TAEJONGDAE: 'DT_0005',
  // 해운대·기장
  PT_S_GWANGALLI: 'DT_0005',
  PT_S_HAEUNDAE: 'DT_0005',
  PT_S_CHEONGSAPO: 'DT_0005',
  PT_S_SONGJEONG_BUSAN: 'DT_0005',
  PT_S_DAEBYEON: 'DT_0005',
  PT_S_JUKSEONG: 'DT_0005',
  PT_S_ILGWANG: 'DT_0005',
  PT_S_IMRANG: 'DT_0005',
};
