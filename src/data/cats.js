// 고양이 로스터 (템플릿). 길거리에서 스폰되고, 입양 시 ownedCats 로 복제됩니다.
// 각 고양이는 묘생역전 스토리(diary)와 성격/최애간식/희귀도를 가집니다.

export const PERSONALITIES = {
  shy: { label: '소심함', affinitySpeed: 0.7, desc: '겁이 많아 천천히 마음을 엽니다' },
  friendly: { label: '친화력만렙', affinitySpeed: 1.4, desc: '사람을 좋아해 금방 친해져요' },
  proud: { label: '도도함', affinitySpeed: 0.85, desc: '관심 없는 척하지만 사실은…' },
  playful: { label: '장난꾸러기', affinitySpeed: 1.1, desc: '에너지가 넘쳐요' },
  lazy: { label: '느긋함', affinitySpeed: 0.95, desc: '식빵 굽는 게 취미' },
  brave: { label: '용감함', affinitySpeed: 1.0, desc: '골목대장 기질' },
}

export const SNACKS = ['츄르', '닭가슴살', '참치캔', '북어트릿', '연어슬라이스', '치즈볼']

// rarity: common / rare / epic / legendary
export const CAT_ROSTER = [
  {
    id: 'sikppang',
    baseName: '식빵이',
    emoji: '🐱',
    color: '#F4D9A0',
    personality: 'lazy',
    rarity: 'common',
    favoriteSnack: '츄르',
    ageGuess: '약 2살',
    weather: 'any',
    diary: [
      '비 오는 날, 식빵 자세로 처마 밑을 지키던 아이.',
      '사람 발소리에 도망치지 않고 빵 굽듯 앉아 있었다.',
      '사실은 따뜻한 이불이 세상에서 제일 좋았던 거였어.',
    ],
  },
  {
    id: 'cheese',
    baseName: '치즈',
    emoji: '🐈',
    color: '#F2B441',
    personality: 'friendly',
    rarity: 'common',
    favoriteSnack: '치즈볼',
    ageGuess: '약 1살',
    weather: 'any',
    diary: [
      '편의점 뒤편에서 삼각김밥 냄새를 맡으며 살던 아이.',
      '알바생 누나가 가끔 소시지를 나눠줬다.',
      '이제는 누구의 눈치도 보지 않고 밥을 먹는다.',
    ],
  },
  {
    id: 'turkish',
    baseName: '나비',
    emoji: '🐱',
    color: '#E8E2DA',
    personality: 'shy',
    rarity: 'rare',
    favoriteSnack: '참치캔',
    ageGuess: '약 3살',
    weather: 'any',
    diary: [
      '대장 고양이에게 영역을 뺏기고 굶주리던 날들.',
      '구석에서 몸을 떨며 사람을 경계하던 작은 나비.',
      '처음으로 등을 보이고 잠든 날, 집사는 울었다.',
    ],
  },
  {
    id: 'tuxedo',
    baseName: '턱시',
    emoji: '🐈‍⬛',
    color: '#2B2233',
    personality: 'proud',
    rarity: 'rare',
    favoriteSnack: '연어슬라이스',
    ageGuess: '약 4살',
    weather: 'any',
    diary: [
      '늘 정장처럼 단정했지만 발은 늘 더러웠던 길의 신사.',
      '관심 없는 척 고개를 돌리면서도 밥자리는 지켰다.',
      '도도함 뒤에 숨겨둔 외로움을, 이제는 안 숨겨도 돼.',
    ],
  },
  {
    id: 'calico',
    baseName: '삼색이',
    emoji: '🐈',
    color: '#D98E5B',
    personality: 'playful',
    rarity: 'rare',
    favoriteSnack: '닭가슴살',
    ageGuess: '약 1살',
    weather: 'any',
    diary: [
      '주차장 차 밑에서 형제들과 뛰놀던 막내.',
      '장난기 때문에 늘 사고를 쳤지만 미워할 수 없었다.',
      '이제 그 장난기는 온 집안의 활력소가 되었다.',
    ],
  },
  {
    id: 'gray',
    baseName: '먼지',
    emoji: '🐱',
    color: '#9AA0A6',
    personality: 'brave',
    rarity: 'common',
    favoriteSnack: '북어트릿',
    ageGuess: '약 5살',
    weather: 'any',
    diary: [
      '골목의 대장. 어린 고양이들의 밥을 지켜주던 큰형.',
      '상처투성이 귀는 수많은 싸움의 훈장이었다.',
      '이제는 푹신한 방석 위에서 부하 없이 쉰다.',
    ],
  },
  {
    id: 'snow',
    baseName: '눈송이',
    emoji: '🐈',
    color: '#FFFDFA',
    personality: 'shy',
    rarity: 'epic',
    favoriteSnack: '북어트릿',
    ageGuess: '약 2살',
    weather: 'snow',
    diary: [
      '눈 오는 날, 자동차 보닛 아래 숨어 떨던 새하얀 아이.',
      '핫팩 하나에 처음으로 골골송을 들려주었다.',
      '겨울이 더는 무섭지 않은 건, 따뜻한 집이 생겨서야.',
    ],
  },
  {
    id: 'rainboss',
    baseName: '빗방울',
    emoji: '🐈‍⬛',
    color: '#6B7A8F',
    personality: 'lazy',
    rarity: 'epic',
    favoriteSnack: '참치캔',
    ageGuess: '약 6살',
    weather: 'rain',
    diary: [
      '비 오는 날에만 나타나는 전설의 뚱냥이.',
      '박스 밑에서 우산을 씌워준 집사를 처음 따라왔다.',
      '빗소리를 들으며 식빵 굽는 게 세상에서 제일 행복해.',
    ],
  },
  {
    id: 'golden',
    baseName: '햇살이',
    emoji: '🐯',
    color: '#F2B441',
    personality: 'friendly',
    rarity: 'legendary',
    favoriteSnack: '연어슬라이스',
    ageGuess: '나이를 알 수 없음',
    weather: 'any',
    diary: [
      '골목을 환하게 밝히던 황금빛 털의 고양이.',
      '모두가 행운을 빌며 쓰다듬던 마을의 마스코트.',
      '이 아이를 입양한 집사에게는 늘 행운이 따른다는 전설이.',
    ],
  },
  {
    id: 'kitten',
    baseName: '콩이',
    emoji: '🐾',
    color: '#FBE3D6',
    personality: 'playful',
    rarity: 'rare',
    favoriteSnack: '닭가슴살',
    ageGuess: '약 4개월',
    weather: 'any',
    diary: [
      '비 오는 날 박스에 버려진 채 울고 있던 아기.',
      '너무 작아서 사료도 잘 못 먹던 콩알만한 아이.',
      '이제 무럭무럭 자라 온 집을 헤집고 다닌다.',
    ],
  },
  {
    id: 'siamese',
    baseName: '샴이',
    emoji: '🐈',
    color: '#C9A88B',
    personality: 'proud',
    rarity: 'epic',
    favoriteSnack: '치즈볼',
    ageGuess: '약 3살',
    weather: 'any',
    diary: [
      '파란 눈으로 늘 먼 곳을 응시하던 우아한 아이.',
      '누군가의 집에서 버려졌는지, 사람 손을 알았다.',
      '다시 믿기까지 오래 걸렸지만, 이제는 무릎냥이.',
    ],
  },
  {
    id: 'orange',
    baseName: '치즈케익',
    emoji: '🐈',
    color: '#E89B3B',
    personality: 'lazy',
    rarity: 'common',
    favoriteSnack: '참치캔',
    ageGuess: '약 7살',
    weather: 'any',
    diary: [
      '동네 어르신들이 다 아는 터줏대감 치즈냥.',
      '느긋하게 햇볕을 쬐며 평생 골목을 지켜왔다.',
      '말년만큼은 따뜻한 온돌 위에서 보내게 해주고 싶어.',
    ],
  },
]

// 길거리 스폰 시 사용할 실사 스프라이트 (public/cat/<key>/idle.png) — 외형이 가까운 것으로 매핑
export const CAT_SPRITE_BY_ID = {
  sikppang: 'brown',
  cheese: 'cheese',
  turkish: 'americanshothair',
  tuxedo: 'tuxido',
  calico: 'samsaek',
  gray: 'americanshothair',
  snow: 'americanshothair',
  rainboss: 'americanshothair',
  golden: 'cheese',
  kitten: 'brown',
  siamese: 'brown',
  orange: 'cheese',
}

// 스프라이트 키 → 이미지 경로 (길거리·우리집 공용)
export const CAT_SPRITE_PATHS = {
  americanshothair: '/cat/americanshothair/idle.png',
  brown: '/cat/brown/idle.png',
  cheese: '/cat/cheese/idle.png',
  samsaek: '/cat/samsaek/idle.png',
  tuxido: '/cat/tuxido/idle.png',
}
export const DEFAULT_CAT_SPRITE = 'americanshothair'

export const RARITY_META = {
  common: { label: '일반', color: '#9AA0A6', adoptReward: 30 },
  rare: { label: '레어', color: '#5BA8E8', adoptReward: 80 },
  epic: { label: '에픽', color: '#A872E8', adoptReward: 200 },
  legendary: { label: '전설', color: '#F2B441', adoptReward: 500 },
}

export function rosterById(id) {
  return CAT_ROSTER.find((c) => c.id === id)
}
