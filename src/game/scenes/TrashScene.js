import Phaser from 'phaser'
import { sfx } from '../../audio/sound'

const TRASH = ['🥤', '🗞️', '🧴', '🥫', '🍂', '📦', '🍙']
const GOLD = '✨'
const HAZARD = '🐱' // 고양이는 탭하면 안돼요!

// 골목길 쓰레기 줍기 — 떨어지는 쓰레기를 탭해 에코 포인트 획득 + 마을 정화
export default class TrashScene extends Phaser.Scene {
  static KEY = 'TrashScene'
  constructor() {
    super('TrashScene')
  }

  init(data) {
    this.duration = data.duration || 30
    this.onEnd = data.onEnd || (() => {})
    this.onTick = data.onTick || (() => {})
  }

  create() {
    const { width, height } = this.scale.gameSize
    this.W = width
    this.H = height
    this.score = 0
    this.cleanliness = 0
    this.timeLeft = this.duration
    this.over = false

    // 배경: 골목길
    const bg = this.add.graphics().setDepth(-10)
    bg.fillStyle(0x6b6470, 1)
    bg.fillRect(0, 0, this.W, this.H * 0.62)
    bg.fillStyle(0x8a8392, 1)
    bg.fillRect(0, this.H * 0.62, this.W, this.H * 0.38)
    bg.fillStyle(0x000000, 0.08)
    for (let i = 1; i < 5; i++) bg.lineBetween(0, this.H * 0.62 + i * 18, this.W, this.H * 0.62 + i * 18)
    // 벽돌 느낌
    bg.lineStyle(1, 0x000000, 0.06)
    for (let y = 0; y < this.H * 0.62; y += 26)
      for (let x = (y / 26) % 2 ? 26 : 0; x < this.W; x += 52) bg.strokeRect(x, y, 52, 26)

    // 정화 안개(점점 걷힘)
    this.smog = this.add.rectangle(0, 0, this.W, this.H, 0x3a2e4a, 0.28).setOrigin(0).setDepth(50)

    // 바닥 쓰레기 더미(시작 시 지저분)
    this.pile = this.add.text(this.W / 2, this.H - 30, '🗑️♻️🍂🥫', { fontSize: '22px' }).setOrigin(0.5).setDepth(2)

    this.timeText = this.add
      .text(12, 12, '', { fontFamily: 'Jua', fontSize: '20px', color: '#ffffff' })
      .setDepth(100)
    this.scoreText = this.add
      .text(this.W - 12, 12, '', { fontFamily: 'Jua', fontSize: '20px', color: '#BFE9C2' })
      .setOrigin(1, 0)
      .setDepth(100)
    this.updateHud()

    this.spawnEvt = this.time.addEvent({ delay: 620, loop: true, callback: () => this.spawn() })
    this.countdown = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.timeLeft--
        this.updateHud()
        if (this.timeLeft <= 0) this.finish()
      },
    })
  }

  updateHud() {
    this.timeText.setText(`⏱ ${this.timeLeft}s`)
    this.scoreText.setText(`🍃 ${this.score}`)
    this.smog.setAlpha(Math.max(0, 0.28 - this.cleanliness * 0.012))
  }

  spawn() {
    if (this.over) return
    const r = Math.random()
    const kind = r < 0.1 ? 'gold' : r < 0.2 ? 'hazard' : 'trash'
    const emoji = kind === 'gold' ? GOLD : kind === 'hazard' ? HAZARD : Phaser.Utils.Array.GetRandom(TRASH)
    const x = Phaser.Math.Between(28, this.W - 28)
    const obj = this.add.text(x, -20, emoji, { fontSize: '30px' }).setOrigin(0.5).setDepth(20)
    obj.setInteractive({ useHandCursor: true })
    const speed = Phaser.Math.Between(2600, 4200) - this.duration * 10
    const fall = this.tweens.add({
      targets: obj,
      y: this.H + 30,
      angle: Phaser.Math.Between(-40, 40),
      duration: Math.max(1600, speed),
      onComplete: () => obj.destroy(),
    })
    obj.on('pointerdown', () => {
      if (this.over || !obj.active) return
      fall.stop()
      if (kind === 'hazard') {
        sfx.fail()
        this.score = Math.max(0, this.score - 3)
        this.floatText(obj.x, obj.y, '앗! 고양이 -3', '#F5849B')
      } else {
        const gain = kind === 'gold' ? 5 : 1
        this.score += gain
        this.cleanliness++
        sfx.coin()
        this.floatText(obj.x, obj.y, `+${gain}`, kind === 'gold' ? '#F2B441' : '#7BC47F')
      }
      this.updateHud()
      this.tweens.add({ targets: obj, scale: 0, duration: 160, onComplete: () => obj.destroy() })
    })
  }

  floatText(x, y, text, color) {
    const t = this.add.text(x, y, text, { fontFamily: 'Jua', fontSize: '18px', color }).setOrigin(0.5).setDepth(120)
    this.tweens.add({ targets: t, y: y - 44, alpha: 0, duration: 700, onComplete: () => t.destroy() })
  }

  finish() {
    if (this.over) return
    this.over = true
    this.spawnEvt.remove()
    this.countdown.remove()
    this.pile.setText(this.cleanliness > 12 ? '🌸✨' : '🥫🍂')
    this.onEnd(this.score)
  }
}
