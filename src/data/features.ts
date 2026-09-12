// 지점별 특징(태그)·갯벌 생물 — 큐레이션(featureOverrides) 우선, 없으면 규칙 기반 추론
import type { Station } from '../types';
import { FEATURE_OVERRIDES } from './featureOverrides';

export type FeatureTag =
  | 'mudflat' // 갯벌체험
  | 'beach' // 해수욕장
  | 'view' // 뷰 맛집
  | 'fishing' // 낚시
  | 'sunrise' // 일출 명소
  | 'sunset' // 일몰 명소
  | 'port' // 포구·수산시장
  | 'island' // 섬 여행
  | 'walk' // 해안 산책
  | 'surf'; // 서핑

export interface SeaFeature {
  tags: FeatureTag[];
  /** 대표 서식 생물 (갯벌 지점 위주) */
  species: string[];
}

export const TAG_INFO: Record<FeatureTag, { icon: string; label: string }> = {
  mudflat: { icon: '🦀', label: '갯벌체험' },
  beach: { icon: '🏖️', label: '해수욕장' },
  view: { icon: '📸', label: '뷰 맛집' },
  fishing: { icon: '🎣', label: '낚시' },
  sunrise: { icon: '🌅', label: '일출 명소' },
  sunset: { icon: '🌇', label: '일몰 명소' },
  port: { icon: '⚓', label: '포구·시장' },
  island: { icon: '⛴️', label: '섬 여행' },
  walk: { icon: '🚶', label: '해안 산책' },
  surf: { icon: '🏄', label: '서핑' },
};

const SPECIES_ICON: Record<string, string> = {
  짱뚱어: '🐟',
  낙지: '🐙',
  주꾸미: '🐙',
  문어: '🐙',
  꽃게: '🦀',
  칠게: '🦀',
  농게: '🦀',
  달랑게: '🦀',
  바지락: '🐚',
  꼬막: '🐚',
  백합: '🐚',
  동죽: '🐚',
  맛조개: '🐚',
  소라: '🐚',
  굴: '🦪',
  새우: '🦐',
};

export function speciesIcon(name: string): string {
  return SPECIES_ICON[name] ?? '🐚';
}

/** 씬(캔버스)에 표시할 생물 종류로 변환 */
export function sceneCreatures(species: string[]): {
  skipper: boolean;
  octopus: boolean;
  crab: boolean;
  shell: boolean;
} {
  const has = (...names: string[]) => names.some((n) => species.includes(n));
  return {
    skipper: has('짱뚱어'),
    octopus: has('낙지', '주꾸미', '문어'),
    crab: species.length === 0 || has('꽃게', '칠게', '농게', '달랑게', '새우'),
    shell: species.length === 0 || has('바지락', '꼬막', '백합', '동죽', '맛조개', '소라', '굴'),
  };
}

export function getFeature(s: Station): SeaFeature {
  const o = FEATURE_OVERRIDES[s.id];
  let tags: FeatureTag[];
  if (o?.tags && o.tags.length > 0) {
    tags = o.tags;
  } else {
    // 규칙 기반 추론 (이름·지역 기준의 안전한 기본값)
    tags = [];
    const add = (t: FeatureTag) => {
      if (!tags.includes(t) && tags.length < 3) tags.push(t);
    };
    const n = s.name;
    if (s.mudflat) add('mudflat');
    if (n.includes('해수욕장') || n.includes('해변')) add('beach');
    if (n.endsWith('항') || n.includes('포구')) add('port');
    if (s.region === 'east') add('sunrise');
    else if (s.region === 'west') add('sunset');
    if (s.province === '제주특별자치도') add('view');
    if (tags.length === 0) add('walk');
  }
  const species = o?.species ?? (s.mudflat ? ['조개', '꽃게'] : []);
  return { tags, species };
}
