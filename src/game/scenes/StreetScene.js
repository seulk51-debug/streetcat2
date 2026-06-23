import Phaser from 'phaser'
import { useGame } from '../../state/store'
import { sfx } from '../../audio/sound'

// public/ 아래 정적 에셋 — 임시로 모든 길고양이에 동일 이미지 사용
const CAT_IMG = '/cat/americanshothair/idle.png'

const RARITY_COLOR = {
  common: 0xb8b2a6,
  rare: 0x5ba8e8,
  epic: 0xa872e8,
  legendary: 0xf2b441,
}

// 길거리(골목) 씬 — 출몰한 길고양이가 직접 걸어 들어와 배회하고,
// 탭하면 React 상호작용 시트(간식/눈인사/입양)가 열립니다.
export default class StreetScene extends Phaser.Scene {
  static KEY = 'StreetScene'
  constructor() {
    super('StreetScene')
  }

  init(data) {
    // React → 고양이 탭 시 호출되는 콜백 (uid)
    this.onSelect = (data && data.onSelect) || (() => {})
  }

  preload() {
    if (!this.textures.exists('streetCat')) this.load.image('streetCat', CAT_IMG)
  }

  create() {
    const { width, height } = this.scale.gameSize
    this.W = width
    this.H = height

    this.cats = new Map() // uid -> entry

    this.bg = this.add.graphics().setDepth(-100)
    this.glow = this.add.graphics().setDepth(-90)
    this.weatherEmitter = null
    this._weather = null

    this.makeTextures()
    this.layout()

    // 골목 소품
    this.lantern = this.add.text(0, 0, '🏮', { fontSize: '30px' }).setOrigin(0.5, 0).setDepth(1)
    this.box = this.add.text(0, 0, '📦', { fontSize: '34px' }).setOrigin(0.5, 1)
    this.bin = this.add.text(0, 0, '🗑️', { fontSize: '30px' }).setOrigin(0.5, 1)
    // 급식소(미끼) — 켜진 미끼만 표시
    this.foodBowl = this.add.text(0, 0, '🍚', { fontSize: '24px' }).setOrigin(0.5, 1)
    this.waterBowl = this.add.text(0, 0, '💧', { fontSize: '20px' }).setOrigin(0.5, 1)
    this.snackBowl = this.add.text(0, 0, '🍤', { fontSize: '20px' }).setOrigin(0.5, 1)
    this.positionProps()

    this._dirty = true
    this.unsub = useGame.subscribe(() => {
      this._dirty = true
    })
    this.syncFromStore()

    this.behaviorEvt = this.time.addEvent({
      delay: 850,
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
  }

  onResize(gameSize) {
    this.W = gameSize.width
    this.H = gameSize.height
    this.layout()
    this.positionProps()
    // 화면 밖으로 나간 고양이 되돌리기
    for (const [, e] of this.cats) {
      e.container.x = Phaser.Math.Clamp(e.container.x, 36, this.W - 36)
      e.container.y = Phaser.Math.Clamp(e.container.y, this.floorTop() + 10, this.H - 16)
    }
    this.applyWeather(useGame.getState().weather, true)
  }

  makeTextures() {
    if (this.textures.exists('rainTexS')) return
    const g = this.add.graphics()
    g.fillStyle(0xbcd6e6, 0.9)
    g.fillRect(0, 0, 2, 11)
    g.generateTexture('rainTexS', 2, 11)
    g.clear()
    g.fillStyle(0xffffff, 1)
    g.fillCircle(4, 4, 3)
    g.generateTexture('snowTexS', 8, 8)
    g.destroy()
  }

  floorTop() {
    return this.H * 0.56
  }

  layout() {
    const ft = this.floorTop()
    const g = this.bg
    g.clear()
    // 젖은 골목 길바닥 (React 야경 그라데이션 위에 반투명으로 얹음)
    g.fillStyle(0x241f3a, 0.55)
    g.fillRect(0, ft, this.W, this.H - ft)
    // 인도 경계
    g.fillStyle(0xffffff, 0.06)
    g.fillRect(0, ft, this.W, 3)
    // 바닥 타일 결
    g.lineStyle(1, 0xffffff, 0.04)
    for (let i = 1; i < 5; i++) {
      const y = ft + ((this.H - ft) / 5) * i
      g.lineBetween(0, y, this.W, y)
    }

    // 가로등 불빛 (따뜻한 원뿔)
    const lg = this.glow
    lg.clear()
    lg.fillStyle(0xffe6a6, 0.1)
    lg.fillEllipse(this.W * 0.5, ft + (this.H - ft) * 0.55, this.W * 1.15, (this.H - ft) * 1.5)
    lg.fillStyle(0xffe6a6, 0.07)
    lg.fillEllipse(this.W * 0.5, ft + (this.H - ft) * 0.4, this.W * 0.7, (this.H - ft) * 1.1)
  }

  positionProps() {
    const ft = this.floorTop()
    if (this.lantern) this.lantern.setPosition(this.W * 0.5, ft - 34).setDepth(1)
    if (this.box) this.box.setPosition(this.W * 0.13, ft + 30).setDepth(ft + 30)
    if (this.bin) this.bin.setPosition(this.W * 0.88, ft + 36).setDepth(ft + 36)
    if (this.foodBowl) this.foodBowl.setPosition(this.W * 0.36, ft + 26).setDepth(ft + 26)
    if (this.waterBowl) this.waterBowl.setPosition(this.W * 0.5, ft + 24).setDepth(ft + 24)
    if (this.snackBowl) this.snackBowl.setPosition(this.W * 0.64, ft + 24).setDepth(ft + 24)
  }

  refreshBowls() {
    const bait = useGame.getState().streetBait
    this.foodBowl.setVisible(!!bait.food)
    this.waterBowl.setVisible(!!bait.water)
    this.snackBowl.setVisible(!!bait.snack)
  }

  // ── 스토어 → 씬 ─────────────────────────────────
  syncFromStore() {
    const st = useGame.getState()
    const live = new Set()
    for (const cat of st.streetCats) {
      live.add(cat.uid)
      let entry = this.cats.get(cat.uid)
      if (!entry) {
        entry = this.spawnCatView(cat)
        this.cats.set(cat.uid, entry)
      }
      entry.update(cat)
    }
    for (const [uid, entry] of this.cats) {
      if (!live.has(uid)) {
        entry.leave()
        this.cats.delete(uid)
      }
    }
    this.refreshBowls()
    this.applyWeather(st.weather)
  }

  // 고양이 한 마리의 시각 표현 컨테이너 생성 + 등장 연출
  spawnCatView(cat) {
    const ft = this.floorTop()
    const c = this.add.container(0, 0)

    const shadow = this.add.ellipse(0, 0, 66, 16, 0x000000, 0.28)

    const spr = this.add.image(0, 0, 'streetCat').setOrigin(0.5, 1)
    const H_DISP = 112
    const tex = this.textures.get('streetCat')
    const natH = tex && tex.getSourceImage() ? tex.getSourceImage().height : H_DISP
    const scaleVal = H_DISP / natH
    spr.setScale(scaleVal)
    const top = -H_DISP

    // 희귀도 테두리(발밑 링) — 채움 없이 외곽선만
    const ring = this.add.ellipse(0, 2, 70, 18, 0x000000, 0)
    ring.setStrokeStyle(2.5, RARITY_COLOR[cat.rarity] || RARITY_COLOR.common, 0.9)

    // 이름표
    const nameTag = this.add
      .text(0, top - 8, '???', {
        fontFamily: 'Jua, sans-serif',
        fontSize: '12px',
        color: '#fff',
        backgroundColor: '#00000088',
        padding: { x: 6, y: 2 },
      })
      .setOrigin(0.5, 1)

    // 호감도 바
    const barW = 58
    const barBg = this.add.rectangle(0, top - 26, barW, 7, 0x000000, 0.4).setOrigin(0.5)
    const barFill = this.add
      .rectangle(-barW / 2 + 1, top - 26, 1, 5, 0xf5849b)
      .setOrigin(0, 0.5)

    // 날씨 전용 배지
    const wbadge = this.add
      .text(26, top + 6, cat.weatherOnly === 'rain' ? '☔' : cat.weatherOnly === 'snow' ? '❄️' : '', {
        fontSize: '16px',
      })
      .setOrigin(0.5)

    // 입양 가능 배지
    const readyBadge = this.add
      .text(0, top - 40, '🏠 입양가능', {
        fontFamily: 'Jua, sans-serif',
        fontSize: '12px',
        color: '#fff',
        backgroundColor: '#F5849B',
        padding: { x: 6, y: 2 },
      })
      .setOrigin(0.5)
      .setVisible(false)

    c.add([shadow, ring, spr, wbadge, nameTag, barBg, barFill, readyBadge])

    // 탭 영역 — 스프라이트. 연타해도 항상 기준 스케일로 복원되도록
    // 진행 중인 스쿼시 트윈을 제거하고 리셋 후 다시 재생한다.
    spr.setInteractive({ useHandCursor: true })
    spr.on('pointerdown', () => {
      sfx.pop && sfx.pop()
      this.tweens.killTweensOf(spr)
      spr.setScale(scaleVal)
      this.tweens.add({
        targets: spr,
        scaleX: scaleVal * 1.08,
        scaleY: scaleVal * 0.92,
        duration: 100,
        yoyo: true,
        onComplete: () => spr.setScale(scaleVal),
      })
      this.popHeart(c.x, c.y + top - 16)
      this.onSelect(cat.uid)
    })

    // 등장 연출 — 골목 한쪽에서 걸어 들어옴
    const side = Math.random() < 0.5 ? -50 : this.W + 50
    const targetX = Phaser.Math.Between(60, this.W - 60)
    const y = Phaser.Math.Between(ft + 24, this.H - 28)
    c.setPosition(side, y)
    c.setDepth(y)
    spr.setFlipX(side < 0)
    sfx.meow && sfx.meow()
    this.tweens.add({
      targets: c,
      x: targetX,
      duration: Math.abs(side - targetX) * 7,
      ease: 'Sine.inOut',
      onUpdate: () => c.setDepth(c.y),
    })
    this.tweens.add({ targets: c, alpha: { from: 0, to: 1 }, duration: 320 })

    const entry = {
      container: c,
      spr,
      barFill,
      nameTag,
      readyBadge,
      ring,
      moving: true,
      restUntil: this.time.now + 900,
      ready: false,
      _readyTween: null,
      update(catData) {
        nameTag.setText(catData.affinity > 0 ? catData.baseName : '???')
        barFill.width = Math.max(1, (barW - 2) * (catData.affinity / 100))
        const isReady = catData.affinity >= 100
        readyBadge.setVisible(isReady)
        if (isReady && !this.ready) {
          this.ready = true
          this._readyTween = c.scene.tweens.add({
            targets: readyBadge,
            scale: { from: 0.85, to: 1.1 },
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut',
          })
          ring.setStrokeStyle(3, 0xf5849b, 1)
        } else if (!isReady && this.ready) {
          this.ready = false
          this._readyTween && this._readyTween.remove()
        }
      },
      leave() {
        this._readyTween && this._readyTween.remove()
        c.scene.tweens.add({
          targets: c,
          y: c.y - 14,
          alpha: 0,
          duration: 360,
          ease: 'Sine.in',
          onComplete: () => c.destroy(),
        })
      },
    }
    return entry
  }

  popHeart(x, y) {
    const t = this.add
      .text(x + Phaser.Math.Between(-10, 10), y, '💗', { fontSize: '18px' })
      .setOrigin(0.5)
      .setDepth(1000)
    this.tweens.add({
      targets: t,
      y: y - 50,
      alpha: { from: 1, to: 0 },
      scale: { from: 0.7, to: 1.2 },
      duration: 800,
      onComplete: () => t.destroy(),
    })
  }

  // ── 행동 패턴: 골목 배회 ─────────────────────────
  tickBehavior() {
    const now = this.time.now
    const ft = this.floorTop()
    for (const [, e] of this.cats) {
      if (e.moving) continue
      if (now < e.restUntil) continue
      const roll = Math.random()
      if (roll < 0.55) {
        const tx = Phaser.Math.Between(46, this.W - 46)
        const ty = Phaser.Math.Between(ft + 24, this.H - 28)
        const c = e.container
        const dist = Phaser.Math.Distance.Between(c.x, c.y, tx, ty)
        e.spr.setFlipX(tx < c.x)
        e.moving = true
        this.tweens.add({
          targets: c,
          x: tx,
          y: ty,
          duration: Math.max(800, dist * 8),
          ease: 'Sine.inOut',
          onUpdate: () => c.setDepth(c.y),
          onComplete: () => {
            e.moving = false
            e.restUntil = now + Phaser.Math.Between(1400, 3800)
          },
        })
      } else if (roll < 0.78) {
        // 잠깐 멈춰 둘러보기
        e.restUntil = now + Phaser.Math.Between(2000, 4200)
      } else {
        // 깡총
        const c = e.container
        this.tweens.add({ targets: c, y: c.y - 18, duration: 200, yoyo: true, repeat: 1, ease: 'Quad.out' })
        e.restUntil = now + Phaser.Math.Between(1600, 3200)
      }
    }
  }

  // ── 날씨 ────────────────────────────────────────
  applyWeather(weather, force = false) {
    if (!force && this._weather === weather) return
    this._weather = weather
    if (this.weatherEmitter) {
      this.weatherEmitter.destroy()
      this.weatherEmitter = null
    }
    if (weather === 'rain') {
      this.weatherEmitter = this.add
        .particles(0, -10, 'rainTexS', {
          x: { min: 0, max: this.W },
          y: -10,
          quantity: 2,
          frequency: 55,
          lifespan: 1500,
          speedY: { min: 440, max: 580 },
          speedX: { min: -40, max: -15 },
          alpha: { start: 0.6, end: 0.15 },
          scaleY: { min: 0.8, max: 1.4 },
        })
        .setDepth(900)
    } else if (weather === 'snow') {
      this.weatherEmitter = this.add
        .particles(0, -10, 'snowTexS', {
          x: { min: 0, max: this.W },
          y: -10,
          quantity: 1,
          frequency: 130,
          lifespan: 5400,
          speedY: { min: 40, max: 95 },
          speedX: { min: -25, max: 25 },
          alpha: { start: 0.95, end: 0.45 },
          scale: { min: 0.5, max: 1.1 },
        })
        .setDepth(900)
    }
  }

  update() {
    if (this._dirty) {
      this._dirty = false
      this.syncFromStore()
    }
  }
}
