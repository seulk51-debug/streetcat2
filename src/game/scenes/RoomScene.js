import Phaser from 'phaser'
import { useGame } from '../../state/store'
import { COSTUMES, itemById, SPACES } from '../../data/shop'
import { makeCat } from '../catFactory'
import { sfx, startPurr, stopPurr } from '../../audio/sound'

const COSTUME_EMOJI = Object.fromEntries(COSTUMES.map((c) => [c.id, c.emoji]))

const WALL_COLORS = { wall_cream: 0xfbe3d6, wall_mint: 0xd6f0e3 }
const FLOOR_COLORS = { floor_wood: 0xd9b382, floor_rug: 0xe9cbb6 }

// 방 안 살아있는 고양이 관찰 + 쓰다듬기 클리커 씬
export default class RoomScene extends Phaser.Scene {
  static KEY = 'RoomScene'
  constructor() {
    super('RoomScene')
  }

  create() {
    const { width, height } = this.scale.gameSize
    this.W = width
    this.H = height

    this.cats = new Map() // uid -> { api, target, restUntil }
    this.furn = new Map() // uid -> gameObject
    this.petting = null
    this.lastPetAt = 0

    // 배경 그래픽
    this.bg = this.add.graphics().setDepth(-100)
    this.windowG = this.add.graphics().setDepth(-90)
    this.weatherEmitter = null

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
  }

  onResize(gameSize) {
    this.W = gameSize.width
    this.H = gameSize.height
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

  floorTop() {
    return this.H * 0.46
  }

  layout() {
    const st = useGame.getState()
    const wall = WALL_COLORS[st.activeWall] || 0xfbe3d6
    const floor = FLOOR_COLORS[st.activeFloor] || 0xd9b382
    const spaceBg = SPACES.find((s) => s.id === st.space)
    const ft = this.floorTop()

    this.bg.clear()
    // 벽
    this.bg.fillStyle(wall, 1)
    this.bg.fillRect(0, 0, this.W, ft)
    // 벽 그라데이션 느낌(상단 약간 밝게)
    this.bg.fillStyle(0xffffff, 0.12)
    this.bg.fillRect(0, 0, this.W, ft * 0.45)
    // 바닥
    this.bg.fillStyle(floor, 1)
    this.bg.fillRect(0, ft, this.W, this.H - ft)
    // 걸레받이
    this.bg.fillStyle(0x000000, 0.06)
    this.bg.fillRect(0, ft - 6, this.W, 6)
    // 바닥 결
    this.bg.lineStyle(1, 0x000000, 0.05)
    for (let i = 1; i < 6; i++) {
      const y = ft + ((this.H - ft) / 6) * i
      this.bg.lineBetween(0, y, this.W, y)
    }

    // 창문(바깥 날씨가 보임)
    this.drawWindow(spaceBg)
  }

  drawWindow(spaceBg) {
    const g = this.windowG
    g.clear()
    const wx = this.W * 0.62
    const wy = this.H * 0.1
    const ww = this.W * 0.3
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
    this.foodBowl.setPosition(this.W * 0.14, ft + 24)
    this.waterBowl.setPosition(this.W * 0.26, ft + 24)
    this.litter.setPosition(this.W * 0.86, this.H - 30)
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

    // 가구
    const liveFurn = new Set()
    for (const f of st.placedFurniture) {
      liveFurn.add(f.uid)
      const item = f.granted || itemById(f.itemId)
      if (!item) continue
      let obj = this.furn.get(f.uid)
      const px = f.x * this.W
      const py = this.floorTop() + f.y * (this.H - this.floorTop()) * 0.92
      if (!obj) {
        obj = this.add.text(px, py, item.emoji || '🪑', { fontSize: '34px' }).setOrigin(0.5, 1)
        obj.setInteractive({ draggable: true, useHandCursor: true })
        obj.on('drag', (p, dx, dy) => {
          obj.x = Phaser.Math.Clamp(dx, 20, this.W - 20)
          obj.y = Phaser.Math.Clamp(dy, this.floorTop(), this.H - 8)
        })
        obj.on('dragend', () => {
          const nx = obj.x / this.W
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
    }
    for (const [uid, obj] of this.furn) {
      if (!liveFurn.has(uid)) {
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
          color: c.color,
          scale: 1,
          name: c.name,
          costume: COSTUME_EMOJI[c.costume] || '',
        })
        const startX = c.hidden ? this.W * 0.85 : Phaser.Math.Between(40, this.W - 40)
        const startY = this.floorTop() + (this.H - this.floorTop()) * 0.5
        api.container.setPosition(startX, startY)
        api.container.setDepth(startY)
        // 입력 영역
        api.container.setSize(70, 90)
        api.container.setInteractive(
          new Phaser.Geom.Rectangle(-35, -70, 70, 90),
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
        api.setMoodIcon('🎒')
        continue
      }
      // 기분 아이콘
      if (c.hidden) {
        api.setMoodIcon('❓')
        api.container.setAlpha(0.6)
        api.setMood('sad')
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
          x: { min: 0, max: this.W },
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
          x: { min: 0, max: this.W },
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
    // idle 수익 가구 중 하나에서 하트
    const idleFurn = st.placedFurniture.filter((f) => (f.granted || itemById(f.itemId))?.idle)
    if (!idleFurn.length) return
    const pick = idleFurn[Phaser.Math.Between(0, idleFurn.length - 1)]
    const obj = this.furn.get(pick.uid)
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
        api.setPose('loaf')
        continue
      }
      if (uid === this.petting) {
        // 쓰다듬는 중엔 가만히 골골
        api.setPose('loaf')
        // 홀드 펫 반복
        if (now - this.lastPetAt > 200 && this.input.activePointer.isDown) {
          this.lastPetAt = now
          this.doPet(uid)
        }
        continue
      }
      if (entry.moving) continue
      if (now < entry.restUntil) continue

      const roll = Math.random()
      if (roll < 0.45) {
        // 걷기
        const tx = Phaser.Math.Between(40, this.W - 40)
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

  update() {
    if (this._dirty) {
      this._dirty = false
      this.syncFromStore()
    }
  }
}
