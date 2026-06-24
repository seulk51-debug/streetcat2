import Phaser from 'phaser'
import { useGame } from '../../state/store'
import { COSTUMES, itemById, SPACES } from '../../data/shop'
import { CAT_SPRITE_PATHS } from '../../data/cats'
import { makeCat } from '../catFactory'
import { sfx, startPurr, stopPurr } from '../../audio/sound'
import { installPanZoom } from '../cameraControl'

const COSTUME_EMOJI = Object.fromEntries(COSTUMES.map((c) => [c.id, c.emoji]))

const WALL_COLORS = { wall_cream: 0xfbe3d6, wall_mint: 0xd6f0e3 }
const FLOOR_COLORS = { floor_wood: 0xd9b382, floor_rug: 0xe9cbb6 }
const ROOM_WORLD = 1.5 // 화면 대비 방 월드 가로 배율 (좌우 슬라이드로 둘러보기)
// 자취방(studio) 전용 배경 이미지 (와이드 방 그림)
const STUDIO_BG = '/map/jachihouse/jachihouse.png'
const STUDIO_BG_KEY = 'studioBg'
const STUDIO_BG_ASPECT = 2048 / 2048 // 그림 가로:세로 비율 (정사각)
const STUDIO_FLOOR = 0.52 // 그림에서 벽/바닥 경계 위치(높이 비율) — 고양이가 바닥에 서도록

// 가구별 고양이 사용 연출: pose=자세, icon=기분아이콘, dur=머무는시간(ms),
// hide=가구 뒤로 숨음, motion=특수모션('play'|'run'|'scratch')
const FURNI_USE = {
  cushion: { pose: 'loaf', icon: '🍞', dur: [4000, 7000] },
  ownerbed: { pose: 'sleep', icon: '💤', dur: [5000, 9000] },
  ondol: { pose: 'sleep', icon: '♨️', dur: [5000, 9000] },
  hideout: { pose: 'loaf', icon: '🫣', dur: [4000, 7000], hide: true },
  spaceship: { pose: 'sleep', icon: '🛸', dur: [5000, 9000], hide: true },
  cattower: { pose: 'stand', icon: '⬆️', dur: [3000, 5000], hide: true },
  wheel: { pose: 'stand', icon: '🏃', dur: [3000, 5000], motion: 'run' },
  scratcher: { pose: 'stand', icon: '🐾', dur: [2500, 4000], motion: 'scratch' },
  feather: { pose: 'stand', icon: '🪶', dur: [2500, 4000], motion: 'play' },
  laser: { pose: 'stand', icon: '💨', dur: [2500, 4000], motion: 'play' },
  ball: { pose: 'stand', icon: '⚽', dur: [2500, 4000], motion: 'play' },
  plant: { pose: 'loaf', icon: '🌿', dur: [3000, 5000] },
  lamp: { pose: 'loaf', icon: '✨', dur: [3000, 5000] },
  cactus: { pose: 'stand', icon: '💧', dur: [3000, 5000] },
  aquarium: { pose: 'loaf', icon: '🐠', dur: [3500, 6000] },
}
const USE_BY_CATEGORY = {
  toy: { pose: 'stand', icon: '💕', dur: [2500, 4500], motion: 'play' },
  lux: { pose: 'loaf', icon: '💕', dur: [4000, 7000] },
  deco: { pose: 'loaf', icon: '💕', dur: [3000, 5000] },
}
const DEFAULT_USE = { pose: 'loaf', icon: '💕', dur: [3000, 5000] }
function useConfigFor(item) {
  return (item && (FURNI_USE[item.id] || USE_BY_CATEGORY[item.category])) || DEFAULT_USE
}

// 방 안 살아있는 고양이 관찰 + 쓰다듬기 클리커 씬
export default class RoomScene extends Phaser.Scene {
  static KEY = 'RoomScene'
  constructor() {
    super('RoomScene')
  }

  preload() {
    if (!this.textures.exists(STUDIO_BG_KEY)) this.load.image(STUDIO_BG_KEY, STUDIO_BG)
    for (const [key, path] of Object.entries(CAT_SPRITE_PATHS)) {
      const k = 'cat_' + key
      if (!this.textures.exists(k)) this.load.image(k, path)
    }
  }

  create() {
    const { width, height } = this.scale.gameSize
    this.W = width
    this.H = height
    this._lastSpace = useGame.getState().space
    this.worldW = this.worldWidthFor() // 좌우로 슬라이드할 전체 월드 너비

    this.cats = new Map() // uid -> { api, target, restUntil, usingFurnUid, ... }
    this.furn = new Map() // uid -> gameObject
    this.useTags = new Map() // furnUid -> Text ('이용중' 태그)
    this.furnGlows = new Map() // furnUid -> Ellipse (사용중 글로우)
    this.reserved = new Set() // 이동 중 예약된 furnUid (중복 점유 방지)
    this.petting = null
    this.lastPetAt = 0

    // 배경 그래픽
    this.bg = this.add.graphics().setDepth(-100)
    this.windowG = this.add.graphics().setDepth(-90)
    this.weatherEmitter = null
    // 자취방 배경 이미지 (studio 공간에서만 표시)
    this.roomImg = this.textures.exists(STUDIO_BG_KEY)
      ? this.add.image(0, 0, STUDIO_BG_KEY).setOrigin(0, 0).setDepth(-101).setVisible(false)
      : null

    this.makeTextures()
    this.layout()

    // 밥/물/화장실 정물
    this.bowls = this.add.container(0, 0).setDepth(5)
    this.foodBowl = this.add.text(0, 0, '🥣', { fontSize: '26px' }).setOrigin(0.5)
    this.waterBowl = this.add.text(0, 0, '💧', { fontSize: '24px' }).setOrigin(0.5)
    this.litter = this.add.text(0, 0, '🪣', { fontSize: '26px' }).setOrigin(0.5)
    this.bowls.add([this.foodBowl, this.waterBowl, this.litter])
    this.positionProps()

    // 입력: 빈 곳 클릭 시 펫 종료
    this.input.on('pointerup', () => this.stopPet())
    this.input.on('pointerupoutside', () => this.stopPet())

    // 좌우 슬라이드 + 확대/축소 (축소 시 바깥 여백은 회색)
    installPanZoom(this, { marginColor: 0x9a9a9a })

    // 스토어 동기화
    this._dirty = true
    this.unsub = useGame.subscribe(() => {
      this._dirty = true
    })
    this.syncFromStore()

    // 방치형 수익 시각화 — 가구에서 하트가 솟음
    this.idleHeartEvt = this.time.addEvent({
      delay: 3200,
      loop: true,
      callback: () => this.spawnIdleHeart(),
    })

    // 고양이 행동 갱신
    this.behaviorEvt = this.time.addEvent({
      delay: 700,
      loop: true,
      callback: () => this.tickBehavior(),
    })

    this.scale.on('resize', this.onResize, this)
    this.events.once('shutdown', () => this.cleanup())
    this.events.once('destroy', () => this.cleanup())
  }

  cleanup() {
    this.unsub && this.unsub()
    this.scale.off('resize', this.onResize, this)
    stopPurr()
    useGame.getState().clearFurnitureUse()
  }

  onResize(gameSize) {
    this.W = gameSize.width
    this.H = gameSize.height
    this.worldW = this.worldWidthFor()
    this.refreshCameraBounds && this.refreshCameraBounds()
    this.layout()
    this.positionProps()
    this.applyWeather(useGame.getState().weather, true)
  }

  makeTextures() {
    if (this.textures.exists('rainTex')) return
    let g = this.add.graphics()
    g.fillStyle(0xa9cde0, 0.9)
    g.fillRect(0, 0, 2, 10)
    g.generateTexture('rainTex', 2, 10)
    g.clear()
    g.fillStyle(0xffffff, 1)
    g.fillCircle(4, 4, 3)
    g.generateTexture('snowTex', 8, 8)
    g.clear()
    g.fillStyle(0xfff2b0, 1)
    g.fillCircle(3, 3, 3)
    g.generateTexture('dustTex', 6, 6)
    g.destroy()
  }

  // studio 공간이고 배경 이미지가 로드됐는지
  isStudioImg() {
    return useGame.getState().space === 'studio' && this.textures.exists(STUDIO_BG_KEY)
  }

  // 현재 공간에 맞는 월드 너비 (studio 이미지면 그림 비율, 그 외엔 화면×배율)
  worldWidthFor() {
    return this.isStudioImg()
      ? Math.max(this.W, Math.round(this.H * STUDIO_BG_ASPECT))
      : Math.round(this.W * ROOM_WORLD)
  }

  floorTop() {
    return this.H * (this.isStudioImg() ? STUDIO_FLOOR : 0.46)
  }

  layout() {
    const st = useGame.getState()
    const wall = WALL_COLORS[st.activeWall] || 0xfbe3d6
    const floor = FLOOR_COLORS[st.activeFloor] || 0xd9b382
    const spaceBg = SPACES.find((s) => s.id === st.space)
    const ft = this.floorTop()

    // studio: 절차적 벽/바닥 대신 배경 이미지로 채움
    if (this.isStudioImg()) {
      this.bg.clear()
      this.windowG.clear()
      if (this.roomImg) this.roomImg.setVisible(true).setPosition(0, 0).setDisplaySize(this.worldW, this.H)
      return
    }
    if (this.roomImg) this.roomImg.setVisible(false)

    this.bg.clear()
    // 벽
    this.bg.fillStyle(wall, 1)
    this.bg.fillRect(0, 0, this.worldW, ft)
    // 벽 그라데이션 느낌(상단 약간 밝게)
    this.bg.fillStyle(0xffffff, 0.12)
    this.bg.fillRect(0, 0, this.worldW, ft * 0.45)
    // 바닥
    this.bg.fillStyle(floor, 1)
    this.bg.fillRect(0, ft, this.worldW, this.H - ft)
    // 걸레받이
    this.bg.fillStyle(0x000000, 0.06)
    this.bg.fillRect(0, ft - 6, this.worldW, 6)
    // 바닥 결
    this.bg.lineStyle(1, 0x000000, 0.05)
    for (let i = 1; i < 6; i++) {
      const y = ft + ((this.H - ft) / 6) * i
      this.bg.lineBetween(0, y, this.worldW, y)
    }

    // 창문(바깥 날씨가 보임)
    this.drawWindow(spaceBg)
  }

  drawWindow(spaceBg) {
    const g = this.windowG
    g.clear()
    const wx = this.worldW * 0.62
    const wy = this.H * 0.1
    const ww = this.worldW * 0.3
    const wh = this.H * 0.24
    // 창밖 하늘 (날씨별)
    const w = useGame.getState().weather
    const sky =
      w === 'rain' ? 0x8fa6b8 : w === 'snow' ? 0xcdd8e2 : w === 'cloudy' ? 0xb9c6d0 : 0xbfe3f0
    g.fillStyle(0xffffff, 1)
    g.fillRoundedRect(wx - 6, wy - 6, ww + 12, wh + 12, 8) // 창틀
    g.fillStyle(sky, 1)
    g.fillRoundedRect(wx, wy, ww, wh, 4)
    if (w === 'sunny') {
      g.fillStyle(0xfff0a8, 0.9)
      g.fillCircle(wx + ww * 0.75, wy + wh * 0.28, 12)
    }
    // 창틀 십자
    g.lineStyle(4, 0xffffff, 1)
    g.lineBetween(wx + ww / 2, wy, wx + ww / 2, wy + wh)
    g.lineBetween(wx, wy + wh / 2, wx + ww, wy + wh / 2)
  }

  positionProps() {
    const ft = this.floorTop()
    this.foodBowl.setPosition(this.worldW * 0.14, ft + 24)
    this.waterBowl.setPosition(this.worldW * 0.26, ft + 24)
    this.litter.setPosition(this.worldW * 0.86, this.H - 30)
    this.refreshProps()
  }

  refreshProps() {
    const st = useGame.getState()
    this.foodBowl.setText(st.ownedConsumables.food > 0 ? '🥣' : '🍽️')
    this.foodBowl.setAlpha(st.ownedConsumables.food > 0 ? 1 : 0.4)
    this.waterBowl.setAlpha(st.roomStats.water > 30 ? 1 : 0.4)
    this.litter.setAlpha(st.roomStats.litter > 30 ? 1 : 0.45)
  }

  // ── 스토어 → 씬 반영 ────────────────────────────────
  syncFromStore() {
    const st = useGame.getState()
    const now = Date.now()

    // 공간 전환 시 월드 폭/카메라 갱신 (studio 이미지 ↔ 다른 공간의 절차적 배경)
    if (st.space !== this._lastSpace) {
      this._lastSpace = st.space
      this.worldW = this.worldWidthFor()
      this.centerCamera && this.centerCamera(true)
      this.positionProps()
    }

    // 가구
    const liveFurn = new Set()
    for (const f of st.placedFurniture) {
      liveFurn.add(f.uid)
      const item = f.granted || itemById(f.itemId)
      if (!item) continue
      let obj = this.furn.get(f.uid)
      const px = f.x * this.worldW
      const py = this.floorTop() + f.y * (this.H - this.floorTop()) * 0.92
      if (!obj) {
        obj = this.add.text(px, py, item.emoji || '🪑', { fontSize: '34px' }).setOrigin(0.5, 1)
        obj.setInteractive({ draggable: true, useHandCursor: true })
        obj.on('drag', (p, dx, dy) => {
          obj.x = Phaser.Math.Clamp(dx, 20, this.worldW - 20)
          obj.y = Phaser.Math.Clamp(dy, this.floorTop(), this.H - 8)
        })
        obj.on('dragend', () => {
          const nx = obj.x / this.worldW
          const ny = (obj.y - this.floorTop()) / ((this.H - this.floorTop()) * 0.92)
          useGame.getState().moveFurniture(f.uid, nx, Phaser.Math.Clamp(ny, 0, 1))
        })
        this.furn.set(f.uid, obj)
        this.animateLux(obj, item.animated)
        obj.setDepth(py)
        this.tweens.add({ targets: obj, scale: { from: 0, to: 1 }, duration: 320, ease: 'Back.out' })
      } else {
        obj.setPosition(px, py)
        obj.setDepth(py)
      }
      obj._item = item
      obj._uid = f.uid
    }
    for (const [uid, obj] of this.furn) {
      if (!liveFurn.has(uid)) {
        this.releaseFurniture(uid)
        obj.destroy()
        this.furn.delete(uid)
      }
    }

    // 고양이
    const liveCats = new Set()
    for (const c of st.ownedCats) {
      liveCats.add(c.uid)
      const onOuting = c.outingUntil && now < c.outingUntil
      let entry = this.cats.get(c.uid)
      if (!entry) {
        const api = makeCat(this, {
          rosterId: c.rosterId,
          scale: 1,
          name: c.name,
          costume: COSTUME_EMOJI[c.costume] || '',
        })
        const startX = c.hidden ? this.worldW * 0.85 : Phaser.Math.Between(40, this.worldW - 40)
        const startY = this.floorTop() + (this.H - this.floorTop()) * 0.5
        api.container.setPosition(startX, startY)
        api.container.setDepth(startY)
        // 입력 영역
        api.container.setSize(68, 104)
        api.container.setInteractive(
          new Phaser.Geom.Rectangle(-34, -90, 68, 104),
          Phaser.Geom.Rectangle.Contains,
        )
        api.container.on('pointerdown', () => this.startPet(c.uid))
        api.container.on('pointerover', () => this.startPet(c.uid, true))
        entry = { api, target: null, restUntil: 0, hidden: c.hidden }
        this.cats.set(c.uid, entry)
        if (!c.hidden) this.tweens.add({ targets: api.container, scale: { from: 0, to: 1 }, duration: 380, ease: 'Back.out' })
      }
      const { api } = entry
      api.setCondition(c.condition)
      api.setCostume(COSTUME_EMOJI[c.costume] || '')
      api.setName(c.name)
      entry.hidden = c.hidden

      // 외출 중이면 숨김
      api.container.setVisible(!onOuting)
      if (onOuting) {
        if (entry.usingFurnUid) this.endUseSession(c.uid, entry)
        api.setMoodIcon('🎒')
        continue
      }
      // 기분 아이콘
      if (c.hidden) {
        if (entry.usingFurnUid) this.endUseSession(c.uid, entry)
        api.setMoodIcon('❓')
        api.container.setAlpha(0.6)
        api.setMood('sad')
      } else if (entry.usingFurnUid) {
        // 가구 사용 중에는 사용 연출(아이콘/투명도)을 유지
        api.container.setAlpha(entry.useHide ? 0.92 : 1)
        api.setMood('ok')
      } else {
        api.container.setAlpha(1)
        if (c.hunger < 30) {
          api.setMoodIcon('🍽️')
          api.setMood('sad')
        } else if (c.mood < 35) {
          api.setMoodIcon('😿')
          api.setMood('sad')
        } else if (c.mood > 80) {
          api.setMoodIcon('💗')
          api.setMood('ok')
        } else {
          api.setMoodIcon('')
          api.setMood('ok')
        }
      }
    }
    for (const [uid, entry] of this.cats) {
      if (!liveCats.has(uid)) {
        if (entry.usingFurnUid) this.endUseSession(uid, entry)
        entry.api.destroy()
        this.cats.delete(uid)
      }
    }

    this.layout()
    this.refreshProps()
    this.applyWeather(st.weather)
  }

  animateLux(obj, kind) {
    if (kind === 'float')
      this.tweens.add({ targets: obj, y: '-=10', duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.inOut' })
    else if (kind === 'spin')
      this.tweens.add({ targets: obj, angle: 360, duration: 2200, repeat: -1 })
    else if (kind === 'glow')
      this.tweens.add({ targets: obj, alpha: 0.55, duration: 1100, yoyo: true, repeat: -1 })
    else if (kind === 'flow')
      this.tweens.add({ targets: obj, scaleX: 1.12, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' })
  }

  // ── 날씨 ────────────────────────────────────────────
  applyWeather(weather, force = false) {
    if (!force && this._weather === weather) return
    this._weather = weather
    if (this.weatherEmitter) {
      this.weatherEmitter.destroy()
      this.weatherEmitter = null
    }
    this.drawWindow()
    if (weather === 'rain') {
      this.weatherEmitter = this.add
        .particles(0, -10, 'rainTex', {
          x: { min: 0, max: this.worldW },
          y: -10,
          quantity: 2,
          frequency: 60,
          lifespan: 1400,
          speedY: { min: 420, max: 560 },
          speedX: { min: -30, max: -10 },
          alpha: { start: 0.6, end: 0.2 },
          scaleX: 1,
          scaleY: { min: 0.8, max: 1.4 },
        })
        .setDepth(900)
    } else if (weather === 'snow') {
      this.weatherEmitter = this.add
        .particles(0, -10, 'snowTex', {
          x: { min: 0, max: this.worldW },
          y: -10,
          quantity: 1,
          frequency: 120,
          lifespan: 5200,
          speedY: { min: 40, max: 90 },
          speedX: { min: -25, max: 25 },
          alpha: { start: 0.95, end: 0.5 },
          scale: { min: 0.5, max: 1.1 },
        })
        .setDepth(900)
    }
  }

  // ── 쓰다듬기 ────────────────────────────────────────
  startPet(uid, hoverOnly = false) {
    const p = this.input.activePointer
    if (hoverOnly && !p.isDown) return
    this.petting = uid
    const entry = this.cats.get(uid)
    if (entry && entry.hidden) {
      // 숨은 고양이는 쓰다듬을 수 없음 — 살짝 놀람
      useGame.getState().toast('아직 경계 중이에요. 간식으로 안심시켜 주세요', '🫣')
      return
    }
    startPurr()
    this.doPet(uid)
  }

  stopPet() {
    this.petting = null
    stopPurr()
  }

  doPet(uid) {
    const store = useGame.getState()
    const gain = store.petCat(uid)
    const entry = this.cats.get(uid)
    if (entry) {
      const c = entry.api.container
      entry.api.setMood('ok')
      this.tweens.add({ targets: c, scaleX: 1.08, scaleY: 0.95, duration: 110, yoyo: true })
      this.popHeart(c.x, c.y - 60, gain)
    }
    sfx.pop()
  }

  popHeart(x, y, n = 1) {
    const t = this.add
      .text(x + Phaser.Math.Between(-12, 12), y, n > 1 ? `❤️+${n}` : '❤️', { fontSize: '18px' })
      .setOrigin(0.5)
      .setDepth(1000)
    this.tweens.add({
      targets: t,
      y: y - 60,
      alpha: { from: 1, to: 0 },
      scale: { from: 0.8, to: 1.3 },
      duration: 900,
      ease: 'Sine.out',
      onComplete: () => t.destroy(),
    })
  }

  spawnIdleHeart() {
    const st = useGame.getState()
    if (!st.ownedCats.length) return
    // 사용 중인 가구가 있으면 거기서 하트가 솟음 → "이 가구를 써서 하트가 쌓인다"는 인과를 보여줌
    const inUse = Object.keys(st.furnitureUsage || {})
    let pickUid = null
    if (inUse.length) {
      pickUid = inUse[Phaser.Math.Between(0, inUse.length - 1)]
    } else {
      const idleFurn = st.placedFurniture.filter((f) => (f.granted || itemById(f.itemId))?.idle)
      if (!idleFurn.length) return
      pickUid = idleFurn[Phaser.Math.Between(0, idleFurn.length - 1)].uid
    }
    const obj = this.furn.get(pickUid)
    if (obj) this.popHeart(obj.x, obj.y - 30, 0)
  }

  // ── 행동 패턴 ───────────────────────────────────────
  tickBehavior() {
    const now = this.time.now
    const ft = this.floorTop()
    for (const [uid, entry] of this.cats) {
      const { api } = entry
      if (!api.container.visible) continue
      if (entry.hidden) {
        // 숨은 고양이: 가구 뒤 구석에서 살짝 떨림
        if (entry.usingFurnUid) this.endUseSession(uid, entry)
        api.setPose('loaf')
        continue
      }
      if (uid === this.petting) {
        // 쓰다듬는 중엔 가만히 골골
        if (entry.usingFurnUid) this.endUseSession(uid, entry)
        api.setPose('loaf')
        // 홀드 펫 반복
        if (now - this.lastPetAt > 200 && this.input.activePointer.isDown) {
          this.lastPetAt = now
          this.doPet(uid)
        }
        continue
      }
      if (entry.moving) continue

      // 가구 사용 세션 진행 중 — 시간이 끝나면 종료
      if (entry.usingFurnUid) {
        if (now < entry.restUntil) continue
        this.endUseSession(uid, entry)
        continue
      }

      if (now < entry.restUntil) continue

      // 40% 확률로 빈 가구를 찾아가 사용
      if (Math.random() < 0.4) {
        const obj = this.pickFreeFurniture()
        if (obj) {
          this.startUseFurniture(uid, entry, obj)
          continue
        }
      }

      const roll = Math.random()
      if (roll < 0.45) {
        // 걷기
        const tx = Phaser.Math.Between(40, this.worldW - 40)
        const ty = Phaser.Math.Between(ft + 20, this.H - 30)
        const dist = Phaser.Math.Distance.Between(api.container.x, api.container.y, tx, ty)
        api.setPose('stand')
        entry.moving = true
        this.tweens.add({
          targets: api.container,
          x: tx,
          y: ty,
          duration: Math.max(900, dist * 9),
          ease: 'Sine.inOut',
          onUpdate: () => api.container.setDepth(api.container.y),
          onComplete: () => {
            entry.moving = false
            entry.restUntil = now + Phaser.Math.Between(1200, 3600)
          },
        })
      } else if (roll < 0.7) {
        api.setPose('loaf') // 식빵 굽기
        entry.restUntil = now + Phaser.Math.Between(2500, 5000)
      } else if (roll < 0.85) {
        api.setPose('sleep')
        api.setMoodIcon('💤')
        entry.restUntil = now + Phaser.Math.Between(3000, 6000)
      } else {
        // 놀기 — 깡총
        api.setPose('stand')
        const c = api.container
        this.tweens.add({
          targets: c,
          y: c.y - 24,
          duration: 220,
          yoyo: true,
          repeat: 2,
          ease: 'Quad.out',
        })
        entry.restUntil = now + Phaser.Math.Between(1500, 3000)
      }
    }
  }

  // ── 가구 사용 ───────────────────────────────────────
  // 아직 아무도 안 쓰고, 이동 예약도 없는 가구 하나를 무작위로 고름
  pickFreeFurniture() {
    const usage = useGame.getState().furnitureUsage || {}
    const free = []
    for (const [uid, obj] of this.furn) {
      if (!obj._item) continue
      if (usage[uid] || this.reserved.has(uid)) continue
      free.push(obj)
    }
    if (!free.length) return null
    return free[Phaser.Math.Between(0, free.length - 1)]
  }

  // 고양이가 가구 앞으로 걸어감 (도착하면 beginUseSession)
  startUseFurniture(catUid, entry, obj) {
    const furnUid = obj._uid
    this.reserved.add(furnUid)
    entry.moving = true
    entry.api.setPose('stand')
    const tx = Phaser.Math.Clamp(obj.x + Phaser.Math.Between(-6, 6), 20, this.worldW - 20)
    const ty = Phaser.Math.Clamp(obj.y - 4, this.floorTop(), this.H - 8)
    const c = entry.api.container
    const dist = Phaser.Math.Distance.Between(c.x, c.y, tx, ty)
    this.tweens.add({
      targets: c,
      x: tx,
      y: ty,
      duration: Math.max(700, dist * 9),
      ease: 'Sine.inOut',
      onUpdate: () => c.setDepth(c.y),
      onComplete: () => {
        entry.moving = false
        this.reserved.delete(furnUid)
        this.beginUseSession(catUid, entry, furnUid)
      },
    })
  }

  // 도착 시점에 사용 세션 시작 (유효성 검사 포함)
  beginUseSession(catUid, entry, furnUid) {
    const obj = this.furn.get(furnUid)
    const st = useGame.getState()
    const cat = st.ownedCats.find((c) => c.uid === catUid)
    const onOuting = cat && cat.outingUntil && Date.now() < cat.outingUntil
    const taken = (st.furnitureUsage || {})[furnUid]
    if (!obj || !obj._item || !cat || cat.hidden || onOuting || catUid === this.petting || (taken && taken !== catUid)) {
      entry.restUntil = this.time.now + Phaser.Math.Between(500, 1200)
      return
    }
    const conf = useConfigFor(obj._item)
    entry.usingFurnUid = furnUid
    entry.useHide = !!conf.hide
    useGame.getState().setFurnitureUse(furnUid, catUid)
    useGame.getState().enjoyFurniture(catUid) // 가구 사용 → 기분 +

    const c = entry.api.container
    entry.api.setPose(conf.pose)
    entry.api.setMood('ok')
    entry.api.setMoodIcon(conf.icon || '💕')
    c.setDepth(conf.hide ? obj.depth - 1 : obj.depth + 1)
    c.setAlpha(conf.hide ? 0.92 : 1)

    // 특수 모션
    if (conf.motion === 'play' || conf.motion === 'run') {
      entry.useTween = this.tweens.add({
        targets: c,
        y: '-=10',
        duration: 220,
        yoyo: true,
        repeat: -1,
        ease: 'Quad.out',
      })
    } else if (conf.motion === 'scratch') {
      entry.useTween = this.tweens.add({ targets: c, x: '+=5', duration: 130, yoyo: true, repeat: -1 })
    }

    this.showUseTag(furnUid, cat.emoji)
    this.setFurnGlow(obj, true)
    this.popHeart(obj.x, obj.y - 28, 0)
    sfx.pop()

    const [a, b] = conf.dur
    entry.restUntil = this.time.now + Phaser.Math.Between(a, b)
  }

  // 사용 세션 종료 → 점유/연출 정리
  endUseSession(catUid, entry) {
    const furnUid = entry.usingFurnUid
    if (entry.useTween) {
      entry.useTween.stop()
      entry.useTween = null
    }
    if (furnUid) {
      this.hideUseTag(furnUid)
      this.removeGlow(furnUid)
      useGame.getState().setFurnitureUse(furnUid, null)
    }
    entry.usingFurnUid = null
    entry.useHide = false
    if (entry.api) {
      const c = entry.api.container
      c.setAlpha(entry.hidden ? 0.6 : 1)
      c.setDepth(c.y)
      entry.api.setMoodIcon('')
    }
    entry.restUntil = this.time.now + Phaser.Math.Between(800, 2000)
  }

  // 가구가 옮겨지거나 사라질 때 그 가구의 사용 상태를 강제 해제
  releaseFurniture(furnUid) {
    this.reserved.delete(furnUid)
    this.hideUseTag(furnUid)
    this.removeGlow(furnUid)
    const catUid = (useGame.getState().furnitureUsage || {})[furnUid]
    if (catUid) {
      const entry = this.cats.get(catUid)
      if (entry) {
        if (entry.useTween) {
          entry.useTween.stop()
          entry.useTween = null
        }
        entry.usingFurnUid = null
        entry.useHide = false
        if (entry.api) {
          entry.api.container.setAlpha(entry.hidden ? 0.6 : 1)
          entry.api.setMoodIcon('')
        }
        entry.restUntil = this.time.now + 500
      }
      useGame.getState().setFurnitureUse(furnUid, null)
    }
  }

  showUseTag(furnUid, emoji) {
    this.hideUseTag(furnUid)
    const obj = this.furn.get(furnUid)
    if (!obj) return
    const t = this.add
      .text(obj.x, obj.y - 46, `${emoji || '😺'} 이용중`, {
        fontFamily: 'Jua, sans-serif',
        fontSize: '11px',
        color: '#6B4F3A',
        backgroundColor: '#FFF6D6dd',
        padding: { x: 5, y: 1 },
      })
      .setOrigin(0.5)
      .setDepth(2000)
    this.useTags.set(furnUid, t)
  }

  hideUseTag(furnUid) {
    const t = this.useTags.get(furnUid)
    if (t) {
      t.destroy()
      this.useTags.delete(furnUid)
    }
  }

  setFurnGlow(obj, on) {
    if (!on) return this.removeGlow(obj._uid)
    if (this.furnGlows.has(obj._uid)) return
    const glow = this.add.ellipse(obj.x, obj.y - 12, 48, 30, 0xfff0a8, 0.5).setDepth(obj.depth - 1)
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.5, to: 0.12 },
      scaleX: { from: 0.9, to: 1.2 },
      scaleY: { from: 0.9, to: 1.2 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    })
    this.furnGlows.set(obj._uid, glow)
  }

  removeGlow(furnUid) {
    const g = this.furnGlows.get(furnUid)
    if (g) {
      g.destroy()
      this.furnGlows.delete(furnUid)
    }
  }

  update() {
    if (this._dirty) {
      this._dirty = false
      this.syncFromStore()
    }
    // 이용중 태그/글로우를 가구 위치에 동기화 (드래그 대응)
    if (this.useTags.size) {
      for (const [uid, t] of this.useTags) {
        const obj = this.furn.get(uid)
        if (obj) t.setPosition(obj.x, obj.y - 46)
      }
    }
    if (this.furnGlows.size) {
      for (const [uid, g] of this.furnGlows) {
        const obj = this.furn.get(uid)
        if (obj) g.setPosition(obj.x, obj.y - 12)
      }
    }
  }
}
