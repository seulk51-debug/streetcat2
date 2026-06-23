// 상점/가구/코스튬/공간/패스 등 모든 상품 데이터.
// currency: 'heart' | 'eco' | 'churu'

// ── 기본 생필품 (소모성) ─────────────────────────────
export const CONSUMABLES = [
  { id: 'food', name: '고급 사료', emoji: '🥫', currency: 'heart', price: 40, amount: 5, desc: '안 갈아주면 고양이가 슬픈 표정을…', stat: 'hunger' },
  { id: 'sand', name: '응고형 모래', emoji: '🏖️', currency: 'heart', price: 30, amount: 5, desc: '화장실을 보송보송하게', stat: 'litter' },
  { id: 'water', name: '깨끗한 물', emoji: '💧', currency: 'heart', price: 20, amount: 5, desc: '시원한 물 한 그릇', stat: 'water' },
]

// ── 일반 가구 및 장난감 ───────────────────────────────
// idle: 시간당 자동 하트 수익 / interactive: 특수 모션 해금 / fixesTrouble: 사고행동 감소
export const FURNITURE = [
  { id: 'cattower', name: '캣타워', emoji: '🗼', currency: 'heart', price: 250, idle: 6, fixesTrouble: true, category: 'toy', desc: '오르내릴 때마다 하트가 쌓여요' },
  { id: 'scratcher', name: '스크래처', emoji: '🪵', currency: 'heart', price: 120, idle: 3, fixesTrouble: true, category: 'toy', desc: '벽지 긁기 사고를 줄여줘요' },
  { id: 'hideout', name: '숨숨집', emoji: '🏠', currency: 'heart', price: 180, idle: 4, category: 'toy', desc: '경계심 많은 아이가 안심하는 공간' },
  { id: 'feather', name: '깃털 장난감', emoji: '🪶', currency: 'heart', price: 90, idle: 2, interactive: true, category: 'toy', desc: '사냥 본능 자극! 특수 모션 해금' },
  { id: 'laser', name: '레이저 포인터', emoji: '🔴', currency: 'heart', price: 110, idle: 2, interactive: true, category: 'toy', desc: '우다다 모션 해금' },
  { id: 'cushion', name: '식빵 방석', emoji: '🟫', currency: 'heart', price: 70, idle: 2, category: 'toy', desc: '식빵 굽기 명당' },
  { id: 'ball', name: '방울 공', emoji: '⚽', currency: 'heart', price: 60, idle: 1, interactive: true, category: 'toy', desc: '데굴데굴 굴리기' },
]

// ── 집사용 인테리어 ──────────────────────────────────
export const INTERIORS = [
  { id: 'wall_cream', name: '크림 벽지', emoji: '🟧', currency: 'heart', price: 150, category: 'wall', desc: '포근한 크림색 벽지' },
  { id: 'wall_mint', name: '민트 벽지', emoji: '🟩', currency: 'heart', price: 150, category: 'wall', desc: '상쾌한 민트 벽지' },
  { id: 'floor_wood', name: '원목 바닥재', emoji: '🟫', currency: 'heart', price: 200, category: 'floor', desc: '따뜻한 우드톤 마룻바닥' },
  { id: 'floor_rug', name: '러그 바닥', emoji: '🧶', currency: 'heart', price: 220, category: 'floor', desc: '폭신한 카페트' },
  { id: 'ownerbed', name: '집사 침대', emoji: '🛏️', currency: 'heart', price: 300, idle: 1, category: 'deco', desc: '같이 자는 큰 침대' },
  { id: 'lamp', name: '스탠드 조명', emoji: '💡', currency: 'heart', price: 130, category: 'deco', desc: '아늑한 무드등' },
  { id: 'plant', name: '캣그라스 화분', emoji: '🪴', currency: 'heart', price: 100, category: 'deco', desc: '고양이가 좋아하는 풀' },
]

// ── 초호화 가구 (유료 재화 전용, 움직이는 가구) ──────────
export const LUXURY = [
  { id: 'spaceship', name: '우주선 숨숨집', emoji: '🛸', currency: 'churu', price: 30, idle: 25, animated: 'float', category: 'lux', desc: '무중력처럼 동동 떠서 자요' },
  { id: 'cactus', name: '선인장 정수기', emoji: '🌵', currency: 'churu', price: 22, idle: 18, animated: 'flow', category: 'lux', desc: '물이 계속 순환해요' },
  { id: 'wheel', name: 'LED 대형 캣휠', emoji: '🎡', currency: 'churu', price: 40, idle: 35, animated: 'spin', category: 'lux', desc: '신나게 달리는 LED 캣휠' },
  { id: 'aquarium', name: '오로라 아쿠아리움', emoji: '🐠', currency: 'churu', price: 35, idle: 30, animated: 'glow', category: 'lux', desc: '물고기가 헤엄치는 대형 수조' },
]

// ── 시즌 코스튬 가챠 풀 ──────────────────────────────
export const COSTUMES = [
  { id: 'rudolph', name: '루돌프 망토', emoji: '🦌', rarity: 'epic', season: 'winter', desc: '크리스마스 한정' },
  { id: 'necktie', name: '직장인 넥타이&안경', emoji: '👔', rarity: 'rare', season: 'any', desc: '오늘도 출근하는 김대리' },
  { id: 'kinder', name: '노란 유치원 모자', emoji: '🎓', rarity: 'rare', season: 'any', desc: '병아리반 등원' },
  { id: 'sakura', name: '벚꽃 화관', emoji: '🌸', rarity: 'epic', season: 'spring', desc: '봄 벚꽃축제 한정' },
  { id: 'watermelon', name: '수박 모자', emoji: '🍉', rarity: 'rare', season: 'summer', desc: '여름 한정' },
  { id: 'pumpkin', name: '호박 망토', emoji: '🎃', rarity: 'rare', season: 'autumn', desc: '핼러윈 한정' },
  { id: 'crown', name: '황금 왕관', emoji: '👑', rarity: 'legendary', season: 'any', desc: '천장 확정 보상급' },
  { id: 'wizard', name: '마법사 모자', emoji: '🧙', rarity: 'epic', season: 'any', desc: '식빵계의 마법사' },
  { id: 'scarf', name: '뜨개 목도리', emoji: '🧣', rarity: 'common', season: 'winter', desc: '할머니표 목도리' },
  { id: 'ribbon', name: '핑크 리본', emoji: '🎀', rarity: 'common', season: 'any', desc: '깜찍한 리본' },
]

export const GACHA = {
  cost: 5, // 황금 츄르 / 1회
  cost10: 45,
  pity: 10, // 천장: 10회 누적 시 원하는 코스튬 확정 선택
  rates: { common: 0.5, rare: 0.32, epic: 0.15, legendary: 0.03 },
}

// ── 공간 확장 ────────────────────────────────────────
export const SPACES = [
  { id: 'studio', name: '나의 자취방', emoji: '🛖', capacity: 3, cost: 0, currency: 'heart', desc: '소박한 시작', bg: '#FBE3D6' },
  { id: 'yard', name: '따뜻한 마당', emoji: '🌷', capacity: 6, cost: 1500, currency: 'heart', desc: '화단과 연못, 길고양이 급식소', bg: '#BFE3D0' },
  { id: 'rooftop', name: '옥상 정원', emoji: '🌇', capacity: 10, cost: 4000, currency: 'heart', desc: '하늘 아래 낮잠 힐링 공간', bg: '#CDE7F0' },
  { id: 'cafe', name: '동네 유기묘 쉼터 카페', emoji: '☕', capacity: 20, cost: 10000, currency: 'heart', desc: '이웃과 교감하는 고양이 카페', bg: '#F4D9A0' },
]

// ── 정기 구독권 / ESG 패키지 ─────────────────────────
export const PASSES = [
  {
    id: 'pass_basic',
    name: '일류 집사 패스',
    price: '월 5,900원',
    tier: 'basic',
    perks: ['모래/물 자동 갈아주기', '구독자 한정 가구 1종', '매일 황금 츄르 3개 지급'],
    grantChuru: 3,
  },
  {
    id: 'pass_premium',
    name: '일류 집사 패스 PRIME',
    price: '월 9,900원',
    tier: 'premium',
    perks: ['화장실/물/사료 전체 자동화', '한정판 가구+코스튬 1종', '매일 황금 츄르 7개 지급'],
    grantChuru: 7,
  },
]

export const DONATION_PACKAGE = {
  id: 'esg_shelter',
  name: '실제 유기묘 후원 패키지',
  price: '11,000원',
  perks: ['기부 천사 훈장 (프로필 표시)', '특별 가구 따뜻한 온돌 침대', '수익금 30% 유기묘 보호소 기부'],
  grantFurniture: { id: 'ondol', name: '따뜻한 온돌 침대', emoji: '♨️', idle: 12, animated: 'glow', category: 'lux' },
}

export function allShopItems() {
  return [...CONSUMABLES, ...FURNITURE, ...INTERIORS, ...LUXURY]
}
export function itemById(id) {
  return allShopItems().find((i) => i.id === id) || COSTUMES.find((c) => c.id === id)
}
