// 외출(보물/엽서), 날씨/시즌, 커뮤니티 친구, 미니게임 설정 등 월드 데이터.

// ── 냥이의 외출: 보물 ────────────────────────────────
export const TREASURES = [
  { id: 'clover', name: '네잎클로버', emoji: '🍀', rarity: 'rare' },
  { id: 'shell', name: '조개껍데기', emoji: '🐚', rarity: 'common' },
  { id: 'cap', name: '반짝이는 병뚜껑', emoji: '🔘', rarity: 'common' },
  { id: 'acorn', name: '도토리', emoji: '🌰', rarity: 'common' },
  { id: 'feather', name: '예쁜 깃털', emoji: '🪶', rarity: 'common' },
  { id: 'gem', name: '반짝이는 유리조각', emoji: '💎', rarity: 'epic' },
  { id: 'star', name: '떨어진 별조각', emoji: '⭐', rarity: 'legendary' },
  { id: 'button', name: '낡은 단추', emoji: '🔵', rarity: 'common' },
  { id: 'ribbon', name: '잃어버린 리본', emoji: '🎀', rarity: 'rare' },
  { id: 'coin', name: '오래된 동전', emoji: '🪙', rarity: 'rare' },
]

// ── 외출 엽서 (현장 사진 도감) ───────────────────────
export const POSTCARDS = [
  { id: 'forest', name: '숲속 산책', emoji: '🌲', scene: '🌲🐈🍃', desc: '햇살 드는 숲에서 한 컷' },
  { id: 'beach', name: '바닷가', emoji: '🏖️', scene: '🌊🐈☀️', desc: '파도 소리를 들으며' },
  { id: 'garden', name: '다른 집 마당', emoji: '🏡', scene: '🌷🐈🏡', desc: '이웃집 마당에 몰래' },
  { id: 'rooftop', name: '노을 지붕', emoji: '🌆', scene: '🌇🐈✨', desc: '노을 지는 지붕 위' },
  { id: 'market', name: '시장 골목', emoji: '🏮', scene: '🏮🐈🐟', desc: '생선가게 앞에서' },
  { id: 'river', name: '강변 산책로', emoji: '🌉', scene: '🌉🐈🌙', desc: '달빛 강변에서' },
  { id: 'snowy', name: '눈 내린 공원', emoji: '⛄', scene: '❄️🐈⛄', desc: '하얀 눈밭에서' },
  { id: 'flower', name: '꽃밭', emoji: '🌻', scene: '🌻🐈🌼', desc: '해바라기 가득한 곳' },
]

export const OUTING_DURATIONS = [
  { id: 'short', label: '동네 한바퀴', minutes: 1, rewardMul: 1 },
  { id: 'mid', label: '옆동네 모험', minutes: 5, rewardMul: 2 },
  { id: 'long', label: '머나먼 여행', minutes: 15, rewardMul: 4 },
]

// ── 날씨 / 시즌 ──────────────────────────────────────
export const WEATHERS = {
  sunny: { label: '맑음', emoji: '☀️', desc: '고양이들이 햇볕에 식빵을 굽습니다' },
  cloudy: { label: '흐림', emoji: '☁️', desc: '선선한 바람이 붑니다' },
  rain: { label: '비', emoji: '🌧️', desc: '비 오는 날엔 희귀 뚱냥이가 나타나요. 우산을 씌워주세요!' },
  snow: { label: '눈', emoji: '❄️', desc: '눈 오는 날, 보닛 밑 고양이에게 핫팩을!' },
}

export const SEASONS = {
  spring: { label: '봄', emoji: '🌸', theme: '벚꽃 축제' },
  summer: { label: '여름', emoji: '🍉', theme: '수박 숨숨집' },
  autumn: { label: '가을', emoji: '🍂', theme: '단풍 산책' },
  winter: { label: '겨울', emoji: '☃️', theme: '한겨울 핫팩' },
}

export function seasonOf(month) {
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'autumn'
  return 'winter'
}

// ── 커뮤니티: 동네 집사 친구 (NPC) ───────────────────
export const FRIENDS = [
  { id: 'f1', name: '햇살집사', emoji: '🧑‍🌾', cats: ['🐈', '🐱'], needs: 'litter' },
  { id: 'f2', name: '구름집사', emoji: '👩‍🦰', cats: ['🐈‍⬛'], needs: 'water' },
  { id: 'f3', name: '달빛집사', emoji: '🧑‍🎤', cats: ['🐯', '🐈', '🐱'], needs: 'litter' },
  { id: 'f4', name: '바다집사', emoji: '🧓', cats: ['🐈'], needs: 'water' },
]

// 공동 급식소 협동 퀘스트 (마을 전체 누적 목표)
export const COMMUNITY_FEEDER = {
  levels: [
    { level: 1, goal: 100, reward: 50 },
    { level: 2, goal: 300, reward: 150 },
    { level: 3, goal: 800, reward: 400 },
    { level: 4, goal: 2000, reward: 1000 },
  ],
}

// ── 미니게임 설정 ────────────────────────────────────
export const MINIGAMES = {
  trash: {
    id: 'trash',
    name: '골목길 쓰레기 줍기',
    emoji: '🗑️',
    reward: 'eco',
    desc: '떨어지는 쓰레기를 탭해서 마을을 정화하고 에코 포인트를 모으세요!',
    duration: 30,
  },
  teeth: { id: 'teeth', name: '양치질하기', emoji: '🪥', reward: 'heart', timing: true, desc: '타이밍에 맞춰 칫솔을 움직여요' },
  nails: { id: 'nails', name: '발톱 깎기', emoji: '✂️', reward: 'heart', timing: true, desc: '발톱 끝만 살짝! 타이밍 주의' },
  ears: { id: 'ears', name: '귀 청소하기', emoji: '👂', reward: 'heart', timing: true, desc: '면봉으로 살살 닦아줘요' },
}

// 길거리 탐색 구역
export const STREET_ZONES = [
  { id: 'alley', name: '뒷골목', emoji: '🌃', unlocked: true, ecoCost: 0, spawnRate: 1 },
  { id: 'park', name: '공원', emoji: '🌳', unlocked: false, ecoCost: 50, spawnRate: 1.3 },
  { id: 'store', name: '편의점 뒤편', emoji: '🏪', unlocked: false, ecoCost: 120, spawnRate: 1.6 },
  { id: 'river', name: '하천 산책로', emoji: '🌉', unlocked: false, ecoCost: 250, spawnRate: 2 },
]

// 급식소 업그레이드 (에코 포인트)
export const FEEDER_UPGRADES = [
  { level: 1, name: '낡은 밥그릇', ecoCost: 0, spawnBonus: 1 },
  { level: 2, name: '지붕 있는 급식소', ecoCost: 80, spawnBonus: 1.3 },
  { level: 3, name: '자동 급식기', ecoCost: 200, spawnBonus: 1.7 },
  { level: 4, name: '따뜻한 겨울 급식소', ecoCost: 500, spawnBonus: 2.2 },
]
