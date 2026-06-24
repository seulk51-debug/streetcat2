import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  CAT_ROSTER,
  RARITY_META,
  rosterById,
  PERSONALITIES,
} from '../data/cats'
import {
  FURNITURE,
  INTERIORS,
  LUXURY,
  COSTUMES,
  GACHA,
  SPACES,
  CONSUMABLES,
  PASSES,
  DONATION_PACKAGE,
  itemById,
} from '../data/shop'
import {
  TREASURES,
  POSTCARDS,
  WEATHERS,
  SEASONS,
  seasonOf,
  COMMUNITY_FEEDER,
  STREET_ZONES,
  FEEDER_UPGRADES,
  OUTING_DURATIONS,
} from '../data/world'

let _uidCounter = 0
export const uid = () => `${Date.now().toString(36)}${(_uidCounter++).toString(36)}`

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v))

// 희귀도 기반 가중 추첨
function weightedRoster(weatherPref) {
  const pool = []
  for (const c of CAT_ROSTER) {
    if (c.weather !== 'any' && c.weather !== weatherPref) continue
    const w = { common: 50, rare: 25, epic: 8, legendary: 2 }[c.rarity]
    for (let i = 0; i < w; i++) pool.push(c)
  }
  // 날씨 전용 고양이는 해당 날씨에 가중치 부여
  if (weatherPref === 'rain' || weatherPref === 'snow') {
    for (const c of CAT_ROSTER) if (c.weather === weatherPref) for (let i = 0; i < 30; i++) pool.push(c)
  }
  return pick(pool.length ? pool : CAT_ROSTER)
}

function makeStreetCat(weatherPref) {
  const t = weightedRoster(weatherPref)
  return {
    uid: uid(),
    rosterId: t.id,
    emoji: t.emoji,
    color: t.color,
    baseName: t.baseName,
    personality: t.personality,
    rarity: t.rarity,
    favoriteSnack: t.favoriteSnack,
    ageGuess: t.ageGuess,
    affinity: 0,
    state: 'street',
    spawnedAt: Date.now(),
    weatherOnly: t.weather !== 'any' ? t.weather : null,
  }
}

const INITIAL = {
  // ── 재화 ──
  hearts: 200,
  ecoPoints: 30,
  goldenChuru: 10,

  // ── 화면/공간 ──
  screen: 'room', // room | street | shop | gacha | outing | dex | sns | community | minigames | bm | settings
  space: 'studio',
  unlockedSpaces: ['studio'],

  // ── 고양이 ──
  streetCats: [], // 길거리 현재 출몰 고양이
  ownedCats: [], // 입양한 고양이
  adoptedRosterIds: [], // 도감 해금용(한번이라도 입양)
  seenRosterIds: [], // 길에서 한번이라도 본 고양이

  // ── 길거리 탐색 상태 ──
  streetBait: { food: false, water: false, snack: false },
  currentZone: 'alley',
  unlockedZones: ['alley'],
  feederLevel: 1,

  // ── 방 / 가구 ──
  placedFurniture: [], // { uid, itemId, x, y }
  ownedConsumables: { food: 3, sand: 3, water: 3 },
  roomStats: { litter: 80, water: 80 }, // 공용 환경 청결도
  activeWall: 'wall_cream',
  activeFloor: 'floor_wood',
  furnitureUsage: {}, // { [furnUid]: catUid } 현재 그 가구를 사용 중인 고양이 (휘발성, 저장 제외)

  // ── 가챠/코스튬 ──
  ownedCostumes: [],
  gachaPity: 0,
  gachaHistory: [],

  // ── 외출 ──
  treasures: {}, // id -> count
  postcards: [], // 해금된 엽서 id

  // ── 도감 일기 ──
  // ownedCats[].diaryUnlocked 로 관리

  // ── SNS (냥스타그램) ──
  snsPhotos: [], // { id, catUid, caption, likes, costume }
  followers: 0,

  // ── 커뮤니티 ──
  friendHelps: {}, // friendId -> lastHelpedAt
  communityFeederProgress: 0,
  communityFeederLevel: 1,

  // ── 날씨/시즌 ──
  weather: 'sunny',
  season: 'spring',
  weatherLocked: false, // 사용자가 수동 고정했는지

  // ── BM ──
  passActive: null, // null | 'basic' | 'premium'
  passClaimedDate: null,
  donationOwned: false,
  donationCount: 0, // 후원 횟수(기부 천사)

  // ── 시스템 ──
  lastSeen: Date.now(),
  tutorialDone: false,
  soundOn: true,
  toasts: [], // 임시 알림 (UI consume)
  // 카메라 줌 명령 (UI 버튼 → Phaser 씬). 휘발성.
  zoomNonce: 0,
  zoomAction: null, // 'in' | 'out' | 'reset'
}

export const useGame = create(
  persist(
    (set, get) => ({
      ...INITIAL,

      // ─────────────────────────────────────────────
      // 공통 유틸
      // ─────────────────────────────────────────────
      setScreen: (screen) => set({ screen }),
      // 줌 버튼 → 씬이 구독하는 명령. nonce 증가로 매번 트리거.
      cameraZoom: (action) => set((s) => ({ zoomAction: action, zoomNonce: (s.zoomNonce || 0) + 1 })),
      // 토스트는 최대 6개까지만 보관(초과 시 가장 오래된 것부터 폐기) → 무한 누적 방지
      toast: (text, emoji = '✨') =>
        set((s) => ({ toasts: [...s.toasts, { id: uid(), text, emoji }].slice(-6) })),
      consumeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),

      // ─────────────────────────────────────────────
      // 재화
      // ─────────────────────────────────────────────
      addHearts: (n) => set((s) => ({ hearts: Math.max(0, Math.round(s.hearts + n)) })),
      addEco: (n) => set((s) => ({ ecoPoints: Math.max(0, Math.round(s.ecoPoints + n)) })),
      addChuru: (n) => set((s) => ({ goldenChuru: Math.max(0, Math.round(s.goldenChuru + n)) })),
      canAfford: (currency, price) => {
        const s = get()
        const bal = currency === 'eco' ? s.ecoPoints : currency === 'churu' ? s.goldenChuru : s.hearts
        return bal >= price
      },
      spend: (currency, price) => {
        const s = get()
        const key = currency === 'eco' ? 'ecoPoints' : currency === 'churu' ? 'goldenChuru' : 'hearts'
        if (s[key] < price) return false
        set({ [key]: s[key] - price })
        return true
      },

      // ─────────────────────────────────────────────
      // 길거리 탐색
      // ─────────────────────────────────────────────
      toggleBait: (kind) =>
        set((s) => ({ streetBait: { ...s.streetBait, [kind]: !s.streetBait[kind] } })),
      setZone: (zoneId) => set({ currentZone: zoneId }),
      unlockZone: (zoneId) => {
        const z = STREET_ZONES.find((x) => x.id === zoneId)
        if (!z) return false
        if (get().unlockedZones.includes(zoneId)) return true
        if (!get().spend('eco', z.ecoCost)) {
          get().toast('에코 포인트가 부족해요', '🍃')
          return false
        }
        set((s) => ({ unlockedZones: [...s.unlockedZones, zoneId], currentZone: zoneId }))
        get().toast(`${z.name} 구역을 열었어요!`, z.emoji)
        return true
      },
      upgradeFeeder: () => {
        const s = get()
        const next = FEEDER_UPGRADES[s.feederLevel] // levels are 1-indexed; arr index = level
        if (!next) return false
        if (!s.spend('eco', next.ecoCost)) {
          s.toast('에코 포인트가 부족해요', '🍃')
          return false
        }
        set({ feederLevel: s.feederLevel + 1 })
        s.toast(`급식소 업그레이드! ${next.name}`, '🍚')
        return true
      },
      // 시간 경과/탭으로 길고양이 스폰
      trySpawnStreetCat: (force = false) => {
        const s = get()
        const baitCount = Object.values(s.streetBait).filter(Boolean).length
        if (!force && baitCount === 0) return
        if (s.streetCats.length >= 4) return
        const zone = STREET_ZONES.find((z) => z.id === s.currentZone) || STREET_ZONES[0]
        const feeder = FEEDER_UPGRADES[s.feederLevel - 1] || FEEDER_UPGRADES[0]
        const chance = force ? 1 : 0.25 * baitCount * (zone.spawnRate || 1) * (feeder.spawnBonus || 1)
        if (Math.random() > chance) return
        const cat = makeStreetCat(s.weather)
        set((st) => ({
          streetCats: [...st.streetCats, cat],
          seenRosterIds: st.seenRosterIds.includes(cat.rosterId)
            ? st.seenRosterIds
            : [...st.seenRosterIds, cat.rosterId],
        }))
      },
      removeStreetCat: (catUid) =>
        set((s) => ({ streetCats: s.streetCats.filter((c) => c.uid !== catUid) })),

      // 친밀도: 최애 간식 / 눈인사
      feedSnack: (catUid, snack) => {
        const s = get()
        const cat = s.streetCats.find((c) => c.uid === catUid)
        if (!cat) return 0
        const speed = PERSONALITIES[cat.personality]?.affinitySpeed || 1
        const fav = snack === cat.favoriteSnack
        const gain = (fav ? 18 : 7) * speed
        const next = clamp(cat.affinity + gain)
        set((st) => ({
          streetCats: st.streetCats.map((c) => (c.uid === catUid ? { ...c, affinity: next } : c)),
        }))
        return Math.round(gain)
      },
      // 눈인사 타이밍 성공/실패에 따른 호감도
      eyeContact: (catUid, success) => {
        const s = get()
        const cat = s.streetCats.find((c) => c.uid === catUid)
        if (!cat) return 0
        const speed = PERSONALITIES[cat.personality]?.affinitySpeed || 1
        const gain = (success ? 14 : 3) * speed
        const next = clamp(cat.affinity + gain)
        set((st) => ({
          streetCats: st.streetCats.map((c) => (c.uid === catUid ? { ...c, affinity: next } : c)),
        }))
        return Math.round(gain)
      },

      // ─────────────────────────────────────────────
      // 입양
      // ─────────────────────────────────────────────
      adoptCat: (catUid, givenName) => {
        const s = get()
        const cat = s.streetCats.find((c) => c.uid === catUid)
        if (!cat || cat.affinity < 100) return null
        const cap = SPACES.find((sp) => sp.id === s.space)?.capacity || 3
        if (s.ownedCats.length >= cap) {
          s.toast('공간이 가득 찼어요. 더 큰 공간을 열어보세요!', '🏠')
          return null
        }
        const roster = rosterById(cat.rosterId)
        const owned = {
          uid: uid(),
          rosterId: cat.rosterId,
          emoji: cat.emoji,
          color: cat.color,
          name: givenName?.trim() || cat.baseName,
          personality: cat.personality,
          rarity: cat.rarity,
          favoriteSnack: cat.favoriteSnack,
          ageGuess: cat.ageGuess,
          state: 'adopted',
          condition: 28, // 꼬질꼬질 시작
          mood: 65,
          hunger: 75,
          hidden: true, // 입양 직후 숨음
          trust: 0,
          costume: null,
          diaryUnlocked: [0],
          outingUntil: null,
          outingDuration: null,
          x: 0.5,
          y: 0.55,
          adoptedAt: Date.now(),
          certificate: {
            name: givenName?.trim() || cat.baseName,
            ageGuess: cat.ageGuess,
            personality: PERSONALITIES[cat.personality]?.label || cat.personality,
            rarity: cat.rarity,
            date: new Date().toLocaleDateString('ko-KR'),
          },
        }
        const reward = RARITY_META[cat.rarity]?.adoptReward || 30
        set((st) => ({
          streetCats: st.streetCats.filter((c) => c.uid !== catUid),
          ownedCats: [...st.ownedCats, owned],
          adoptedRosterIds: st.adoptedRosterIds.includes(cat.rosterId)
            ? st.adoptedRosterIds
            : [...st.adoptedRosterIds, cat.rosterId],
          hearts: st.hearts + reward,
        }))
        return owned
      },

      // ─────────────────────────────────────────────
      // 방 안 고양이 상호작용
      // ─────────────────────────────────────────────
      petCat: (catUid) => {
        const s = get()
        const cat = s.ownedCats.find((c) => c.uid === catUid)
        if (!cat) return 0
        const gain = 1 + (s.passActive ? 1 : 0)
        set((st) => ({
          hearts: st.hearts + gain,
          ownedCats: st.ownedCats.map((c) =>
            c.uid === catUid
              ? { ...c, mood: clamp(c.mood + 0.5), condition: clamp(c.condition + 0.15), trust: clamp(c.trust + 0.3) }
              : c
          ),
        }))
        return gain
      },
      brushCat: (catUid) => {
        const s = get()
        const cat = s.ownedCats.find((c) => c.uid === catUid)
        if (!cat) return 0
        const gain = 2 + (s.passActive ? 1 : 0)
        set((st) => ({
          hearts: st.hearts + gain,
          ownedCats: st.ownedCats.map((c) =>
            c.uid === catUid ? { ...c, condition: clamp(c.condition + 1.2), mood: clamp(c.mood + 0.8) } : c
          ),
        }))
        return gain
      },
      // 사료/물/모래 케어
      feedCat: (catUid) => {
        const s = get()
        if (s.ownedConsumables.food <= 0) {
          s.toast('사료가 없어요. 상점에서 구매하세요!', '🥫')
          return false
        }
        set((st) => ({
          ownedConsumables: { ...st.ownedConsumables, food: st.ownedConsumables.food - 1 },
          ownedCats: st.ownedCats.map((c) =>
            c.uid === catUid ? { ...c, hunger: clamp(c.hunger + 40), mood: clamp(c.mood + 8) } : c
          ),
        }))
        return true
      },
      refillWater: () => {
        const s = get()
        if (s.ownedConsumables.water <= 0) {
          s.toast('깨끗한 물이 없어요!', '💧')
          return false
        }
        set((st) => ({
          ownedConsumables: { ...st.ownedConsumables, water: st.ownedConsumables.water - 1 },
          roomStats: { ...st.roomStats, water: 100 },
        }))
        return true
      },
      cleanLitter: () => {
        const s = get()
        if (s.ownedConsumables.sand <= 0) {
          s.toast('모래가 없어요!', '🏖️')
          return false
        }
        set((st) => ({
          ownedConsumables: { ...st.ownedConsumables, sand: st.ownedConsumables.sand - 1 },
          roomStats: { ...st.roomStats, litter: 100 },
          ownedCats: st.ownedCats.map((c) => ({ ...c, mood: clamp(c.mood + 4) })),
        }))
        return true
      },
      // 경계 해제: 간식/낚싯대로 안심 → 거실로
      comfortCat: (catUid) => {
        set((s) => ({
          ownedCats: s.ownedCats.map((c) =>
            c.uid === catUid
              ? { ...c, trust: clamp(c.trust + 25), hidden: clamp(c.trust + 25) < 60, mood: clamp(c.mood + 5) }
              : c
          ),
        }))
      },
      setCatPosition: (catUid, x, y) =>
        set((s) => ({ ownedCats: s.ownedCats.map((c) => (c.uid === catUid ? { ...c, x, y } : c)) })),
      equipCostume: (catUid, costumeId) =>
        set((s) => ({ ownedCats: s.ownedCats.map((c) => (c.uid === catUid ? { ...c, costume: costumeId } : c)) })),

      // 도감 일기 해금 (호감도/신뢰 상승 시)
      unlockNextDiary: (catUid) => {
        const s = get()
        const cat = s.ownedCats.find((c) => c.uid === catUid)
        if (!cat) return false
        const roster = rosterById(cat.rosterId)
        const nextIdx = cat.diaryUnlocked.length
        if (!roster || nextIdx >= roster.diary.length) return false
        set((st) => ({
          ownedCats: st.ownedCats.map((c) =>
            c.uid === catUid ? { ...c, diaryUnlocked: [...c.diaryUnlocked, nextIdx] } : c
          ),
        }))
        s.toast(`${cat.name}의 새로운 이야기가 해금됐어요`, '📖')
        return true
      },

      // ─────────────────────────────────────────────
      // 방치형 수익 / 시간 경과 처리
      // ─────────────────────────────────────────────
      idleRatePerHour: () => {
        const s = get()
        let rate = 0
        for (const f of s.placedFurniture) {
          const item = itemById(f.itemId)
          if (item?.idle) rate += item.idle
        }
        // 고양이 수 보너스 + 컨디션 보너스
        rate += s.ownedCats.reduce((a, c) => a + 1 + c.condition / 100, 0) * 3
        if (s.passActive === 'premium') rate *= 1.3
        else if (s.passActive === 'basic') rate *= 1.15
        return Math.round(rate)
      },
      // 앱 진입 시 오프라인 누적 수익 + 상태 감쇠 정산
      reconcileOffline: () => {
        const s = get()
        const now = Date.now()
        const elapsedMs = now - (s.lastSeen || now)
        const hours = Math.min(elapsedMs / 3600000, 12) // 최대 12시간
        const earned = Math.round(get().idleRatePerHour() * hours)
        // 상태 감쇠
        const decay = Math.min(hours * 6, 60)
        const autoCare = !!s.passActive // 패스 구독 시 자동 케어
        const cats = s.ownedCats.map((c) => ({
          ...c,
          hunger: autoCare ? clamp(c.hunger) : clamp(c.hunger - decay),
          mood: autoCare ? c.mood : clamp(c.mood - decay * 0.5),
        }))
        const roomStats = autoCare
          ? { litter: 100, water: 100 }
          : { litter: clamp(s.roomStats.litter - decay), water: clamp(s.roomStats.water - decay) }
        set({ hearts: s.hearts + earned, ownedCats: cats, roomStats, lastSeen: now })
        return { earned, hours }
      },
      touchLastSeen: () => set({ lastSeen: Date.now() }),
      // 주기적 틱(방 화면): 가구 idle 수익 + 자연 상태변화
      idleTick: (seconds = 1) => {
        const s = get()
        const perHour = get().idleRatePerHour()
        const gain = (perHour / 3600) * seconds
        set((st) => ({
          hearts: st.hearts + gain,
          ownedCats: st.ownedCats.map((c) => ({
            ...c,
            hunger: st.passActive ? c.hunger : clamp(c.hunger - 0.02 * seconds),
            mood: clamp(c.mood + (c.hunger > 30 ? 0.01 : -0.03) * seconds),
            trust: clamp(c.trust + 0.02 * seconds),
            hidden: c.trust + 0.02 * seconds < 60 ? c.hidden : false,
          })),
        }))
      },

      // ─────────────────────────────────────────────
      // 상점: 소모품 / 가구 / 인테리어 / 초호화
      // ─────────────────────────────────────────────
      buyConsumable: (id) => {
        const s = get()
        const item = CONSUMABLES.find((c) => c.id === id)
        if (!item) return false
        if (!s.spend(item.currency, item.price)) {
          s.toast('재화가 부족해요', '💸')
          return false
        }
        set((st) => ({
          ownedConsumables: {
            ...st.ownedConsumables,
            [item.stat === 'hunger' ? 'food' : item.stat === 'litter' ? 'sand' : 'water']:
              (st.ownedConsumables[item.stat === 'hunger' ? 'food' : item.stat === 'litter' ? 'sand' : 'water'] || 0) +
              item.amount,
          },
        }))
        s.toast(`${item.name} x${item.amount} 구매!`, item.emoji)
        return true
      },
      buyFurniture: (id) => {
        const s = get()
        const item = [...FURNITURE, ...INTERIORS, ...LUXURY].find((f) => f.id === id)
        if (!item) return false
        if (!s.spend(item.currency, item.price)) {
          s.toast(item.currency === 'churu' ? '황금 츄르가 부족해요' : '하트가 부족해요', '💸')
          return false
        }
        // 벽지/바닥은 즉시 적용, 그 외는 배치 대기열
        if (item.category === 'wall') set({ activeWall: id })
        else if (item.category === 'floor') set({ activeFloor: id })
        else {
          set((st) => ({
            placedFurniture: [
              ...st.placedFurniture,
              { uid: uid(), itemId: id, x: 0.2 + Math.random() * 0.6, y: 0.3 + Math.random() * 0.5 },
            ],
          }))
        }
        s.toast(`${item.name} 구매!`, item.emoji)
        return true
      },
      moveFurniture: (furnUid, x, y) =>
        set((s) => ({ placedFurniture: s.placedFurniture.map((f) => (f.uid === furnUid ? { ...f, x, y } : f)) })),
      removeFurniture: (furnUid) =>
        set((s) => ({ placedFurniture: s.placedFurniture.filter((f) => f.uid !== furnUid) })),
      // 가구 사용 점유 표시(씬에서 호출). catUid=null 이면 사용 종료.
      setFurnitureUse: (furnUid, catUid) =>
        set((s) => {
          const cur = s.furnitureUsage || {}
          if (catUid) {
            if (cur[furnUid] === catUid) return {}
            return { furnitureUsage: { ...cur, [furnUid]: catUid } }
          }
          if (!(furnUid in cur)) return {}
          const next = { ...cur }
          delete next[furnUid]
          return { furnitureUsage: next }
        }),
      clearFurnitureUse: () => set({ furnitureUsage: {} }),
      // 고양이가 가구를 사용할 때의 소소한 기분 보상
      enjoyFurniture: (catUid) =>
        set((st) => ({
          ownedCats: st.ownedCats.map((c) =>
            c.uid === catUid ? { ...c, mood: clamp(c.mood + 1.5), condition: clamp(c.condition + 0.2) } : c
          ),
        })),
      grantFurniture: (item) =>
        set((s) => ({
          placedFurniture: [...s.placedFurniture, { uid: uid(), itemId: item.id, x: 0.5, y: 0.4, granted: item }],
        })),

      // ─────────────────────────────────────────────
      // 공간 확장
      // ─────────────────────────────────────────────
      unlockSpace: (spaceId) => {
        const s = get()
        const sp = SPACES.find((x) => x.id === spaceId)
        if (!sp || s.unlockedSpaces.includes(spaceId)) {
          set({ space: spaceId })
          return true
        }
        if (!s.spend(sp.currency, sp.cost)) {
          s.toast('하트가 부족해요', '💸')
          return false
        }
        set((st) => ({ unlockedSpaces: [...st.unlockedSpaces, spaceId], space: spaceId }))
        s.toast(`${sp.name} 공간을 열었어요!`, sp.emoji)
        return true
      },
      setSpace: (spaceId) => {
        if (get().unlockedSpaces.includes(spaceId)) set({ space: spaceId })
      },

      // ─────────────────────────────────────────────
      // 가챠 (코스튬) + 천장
      // ─────────────────────────────────────────────
      pullGacha: (count = 1) => {
        const s = get()
        const cost = count === 10 ? GACHA.cost10 : GACHA.cost * count
        if (!s.spend('churu', cost)) {
          s.toast('황금 츄르가 부족해요', '🍗')
          return null
        }
        const results = []
        for (let i = 0; i < count; i++) {
          const r = Math.random()
          let rarity = 'common'
          let acc = 0
          for (const [rk, rv] of Object.entries(GACHA.rates)) {
            acc += rv
            if (r <= acc) {
              rarity = rk
              break
            }
          }
          const pool = COSTUMES.filter((c) => c.rarity === rarity)
          const c = pick(pool.length ? pool : COSTUMES)
          results.push(c)
        }
        set((st) => {
          const owned = new Set(st.ownedCostumes)
          results.forEach((c) => owned.add(c.id))
          const newPity = st.gachaPity + count
          return {
            ownedCostumes: [...owned],
            gachaPity: newPity,
            gachaHistory: [...st.gachaHistory, ...results.map((c) => c.id)].slice(-50),
          }
        })
        return results
      },
      // 천장 도달 시 원하는 코스튬 확정 획득
      claimPity: (costumeId) => {
        const s = get()
        if (s.gachaPity < GACHA.pity) return false
        set((st) => ({
          ownedCostumes: st.ownedCostumes.includes(costumeId) ? st.ownedCostumes : [...st.ownedCostumes, costumeId],
          gachaPity: st.gachaPity - GACHA.pity,
        }))
        s.toast('천장 확정 코스튬 획득!', '🎁')
        return true
      },

      // ─────────────────────────────────────────────
      // 냥이의 외출
      // ─────────────────────────────────────────────
      sendOuting: (catUid, durationId) => {
        const s = get()
        const dur = OUTING_DURATIONS.find((d) => d.id === durationId) || OUTING_DURATIONS[0]
        const until = Date.now() + dur.minutes * 60000
        set((st) => ({
          ownedCats: st.ownedCats.map((c) =>
            c.uid === catUid ? { ...c, outingUntil: until, outingDuration: durationId } : c
          ),
        }))
        s.toast('바깥세상으로 외출을 떠났어요!', '🎒')
        return until
      },
      collectOuting: (catUid) => {
        const s = get()
        const cat = s.ownedCats.find((c) => c.uid === catUid)
        if (!cat || !cat.outingUntil || Date.now() < cat.outingUntil) return null
        const dur = OUTING_DURATIONS.find((d) => d.id === cat.outingDuration) || OUTING_DURATIONS[0]
        const mul = dur.rewardMul
        // 보물 1~2개
        const gotTreasures = []
        const tcount = 1 + (Math.random() < 0.4 ? 1 : 0)
        for (let i = 0; i < tcount; i++) {
          const tpool = []
          for (const t of TREASURES) {
            const w = { common: 50, rare: 20, epic: 6 * mul, legendary: 1 * mul }[t.rarity]
            for (let k = 0; k < w; k++) tpool.push(t)
          }
          gotTreasures.push(pick(tpool))
        }
        // 엽서 (확률)
        let gotPostcard = null
        if (Math.random() < 0.5 * mul) {
          const undisc = POSTCARDS.filter((p) => !s.postcards.includes(p.id))
          gotPostcard = undisc.length ? pick(undisc) : pick(POSTCARDS)
        }
        set((st) => {
          const treasures = { ...st.treasures }
          gotTreasures.forEach((t) => {
            treasures[t.id] = (treasures[t.id] || 0) + 1
          })
          const postcards = gotPostcard && !st.postcards.includes(gotPostcard.id)
            ? [...st.postcards, gotPostcard.id]
            : st.postcards
          return {
            treasures,
            postcards,
            ownedCats: st.ownedCats.map((c) =>
              c.uid === catUid ? { ...c, outingUntil: null, outingDuration: null, mood: clamp(c.mood + 15) } : c
            ),
          }
        })
        return { treasures: gotTreasures, postcard: gotPostcard }
      },

      // ─────────────────────────────────────────────
      // SNS (냥스타그램)
      // ─────────────────────────────────────────────
      postPhoto: (catUid, caption) => {
        const s = get()
        const cat = s.ownedCats.find((c) => c.uid === catUid)
        if (!cat) return null
        const baseLikes = 5 + Math.floor(Math.random() * 30)
        const rarityBonus = { common: 0, rare: 10, epic: 25, legendary: 60 }[cat.rarity] || 0
        const costumeBonus = cat.costume ? 15 : 0
        const conditionBonus = Math.floor(cat.condition / 5)
        const likes = baseLikes + rarityBonus + costumeBonus + conditionBonus
        const photo = {
          id: uid(),
          catUid,
          emoji: cat.emoji,
          color: cat.color,
          name: cat.name,
          costume: cat.costume,
          caption: caption || '오늘도 식빵 굽는 중 🍞',
          likes,
          collected: false,
          postedAt: Date.now(),
        }
        set((st) => ({ snsPhotos: [photo, ...st.snsPhotos].slice(0, 30), followers: st.followers + Math.floor(likes / 3) }))
        return photo
      },
      collectLikes: (photoId) => {
        const s = get()
        const photo = s.snsPhotos.find((p) => p.id === photoId)
        if (!photo || photo.collected) return 0
        set((st) => ({
          hearts: st.hearts + photo.likes,
          snsPhotos: st.snsPhotos.map((p) => (p.id === photoId ? { ...p, collected: true } : p)),
        }))
        return photo.likes
      },

      // ─────────────────────────────────────────────
      // 커뮤니티 (느슨한 연대)
      // ─────────────────────────────────────────────
      helpFriend: (friendId) => {
        const s = get()
        const last = s.friendHelps[friendId] || 0
        if (Date.now() - last < 60000) {
          s.toast('아직 쉬는 중이에요. 잠시 후 다시!', '⏳')
          return 0
        }
        const reward = 15 + Math.floor(Math.random() * 15)
        set((st) => ({ hearts: st.hearts + reward, friendHelps: { ...st.friendHelps, [friendId]: Date.now() } }))
        s.toast(`이웃을 도와주고 하트 +${reward}`, '🤝')
        return reward
      },
      contributeFeeder: (amount = 10) => {
        const s = get()
        if (!s.spend('heart', amount)) {
          s.toast('하트가 부족해요', '💸')
          return false
        }
        let progress = s.communityFeederProgress + amount
        let level = s.communityFeederLevel
        const cur = COMMUNITY_FEEDER.levels[level - 1]
        if (cur && progress >= cur.goal) {
          progress -= cur.goal
          level = Math.min(level + 1, COMMUNITY_FEEDER.levels.length)
          set((st) => ({ hearts: st.hearts + cur.reward }))
          s.toast(`공동 급식소 LV.${level} 달성! 보상 +${cur.reward}`, '🍚')
        }
        set({ communityFeederProgress: progress, communityFeederLevel: level })
        return true
      },

      // ─────────────────────────────────────────────
      // 날씨 / 시즌
      // ─────────────────────────────────────────────
      setWeather: (w) => set({ weather: w }),
      setSeason: (s) => set({ season: s }),
      toggleWeatherLock: () => set((s) => ({ weatherLocked: !s.weatherLocked })),
      // 실제 시간 기반 시즌 + 랜덤 날씨 동기화
      syncRealWorld: () => {
        const s = get()
        if (s.weatherLocked) return
        const now = new Date()
        const season = seasonOf(now.getMonth())
        // 의사난수 날씨(분 단위로 천천히 변화)
        const weathers =
          season === 'winter'
            ? ['sunny', 'cloudy', 'snow', 'snow', 'cloudy']
            : season === 'summer'
            ? ['sunny', 'sunny', 'cloudy', 'rain']
            : ['sunny', 'cloudy', 'rain', 'cloudy']
        const idx = Math.floor((now.getHours() + now.getMinutes() / 30)) % weathers.length
        set({ season, weather: weathers[idx] })
      },

      // ─────────────────────────────────────────────
      // BM: 패스 / ESG 후원
      // ─────────────────────────────────────────────
      subscribePass: (tier) => {
        const pass = PASSES.find((p) => p.tier === tier)
        if (!pass) return false
        set({ passActive: tier })
        get().toast(`${pass.name} 구독 완료! 매일 보상을 받아보세요`, '🎫')
        return true
      },
      cancelPass: () => set({ passActive: null }),
      claimDailyPass: () => {
        const s = get()
        if (!s.passActive) return false
        const today = new Date().toDateString()
        if (s.passClaimedDate === today) {
          s.toast('오늘은 이미 받았어요', '📅')
          return false
        }
        const pass = PASSES.find((p) => p.tier === s.passActive)
        set((st) => ({ goldenChuru: st.goldenChuru + (pass?.grantChuru || 3), passClaimedDate: today }))
        s.toast(`출석 보상! 황금 츄르 +${pass?.grantChuru || 3}`, '🍗')
        return true
      },
      buyDonationPackage: () => {
        const s = get()
        if (s.donationOwned) {
          s.toast('이미 후원 천사세요! 다시 한번 후원하시겠어요?', '😇')
        }
        const fur = DONATION_PACKAGE.grantFurniture
        set((st) => ({
          donationOwned: true,
          donationCount: st.donationCount + 1,
          placedFurniture: st.placedFurniture.some((f) => f.itemId === fur.id)
            ? st.placedFurniture
            : [...st.placedFurniture, { uid: uid(), itemId: fur.id, x: 0.5, y: 0.45, granted: fur }],
        }))
        s.toast('후원해주셔서 감사해요. 따뜻한 온돌 침대가 도착했어요!', '😇')
        return true
      },

      // ─────────────────────────────────────────────
      // 미니게임 보상
      // ─────────────────────────────────────────────
      awardMinigame: (reward, amount) => {
        if (reward === 'eco') get().addEco(amount)
        else if (reward === 'churu') get().addChuru(amount)
        else get().addHearts(amount)
      },

      // ─────────────────────────────────────────────
      // 디버그/초기화
      // ─────────────────────────────────────────────
      resetGame: () => set({ ...INITIAL, lastSeen: Date.now() }),
      cheat: () => set((s) => ({ hearts: s.hearts + 5000, ecoPoints: s.ecoPoints + 1000, goldenChuru: s.goldenChuru + 100 })),
    }),
    {
      name: 'breadcat-save',
      partialize: (s) => {
        // toasts, furnitureUsage 등 휘발성 제외
        const { toasts, furnitureUsage, zoomNonce, zoomAction, ...rest } = s
        return rest
      },
    }
  )
)

// 셀렉터 헬퍼 (컴포넌트에서 재사용)
export const selectActiveSpace = (s) => SPACES.find((sp) => sp.id === s.space) || SPACES[0]
export const selectCapacity = (s) => (SPACES.find((sp) => sp.id === s.space) || SPACES[0]).capacity
export { WEATHERS, SEASONS, PERSONALITIES, RARITY_META }
