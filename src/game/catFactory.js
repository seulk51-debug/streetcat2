// Phaser 고양이 스프라이트 — 이미지 에셋 없이 Graphics 로 직접 그립니다.
// 컨디션(꼬질꼬질→뽀송), 자세(서기/식빵/잠/놀이), 코스튬, 표정을 표현합니다.

function shade(hex, amt) {
  const n = parseInt(hex.replace('#', ''), 16)
  let r = (n >> 16) & 0xff
  let g = (n >> 8) & 0xff
  let b = n & 0xff
  r = Math.max(0, Math.min(255, r + amt))
  g = Math.max(0, Math.min(255, g + amt))
  b = Math.max(0, Math.min(255, b + amt))
  return (r << 16) | (g << 8) | b
}
function hexToInt(hex) {
  return parseInt(hex.replace('#', ''), 16)
}

// 부드러운 고양이 실루엣을 g(Graphics)에 그림. pose/condition 변화 시 재호출.
function drawCat(g, opts) {
  const { color = '#F4D9A0', pose = 'stand', condition = 100, scale = 1 } = opts
  const base = hexToInt(color)
  const dark = shade(color, -38)
  const light = shade(color, 30)
  const dirty = condition < 55
  const veryDirty = condition < 30
  g.clear()

  const loaf = pose === 'loaf' || pose === 'sleep'
  const s = scale

  // 꼬리
  g.lineStyle(8 * s, base, 1)
  if (!loaf) {
    g.beginPath()
    g.moveTo(20 * s, -8 * s)
    g.lineTo(34 * s, -2 * s)
    g.lineTo(40 * s, -22 * s)
    g.strokePath()
  } else {
    // 식빵 자세: 꼬리를 몸에 감음
    g.beginPath()
    g.moveTo(22 * s, -6 * s)
    g.lineTo(34 * s, -8 * s)
    g.lineTo(30 * s, -20 * s)
    g.strokePath()
  }

  // 몸통
  g.fillStyle(base, 1)
  if (loaf) {
    g.fillEllipse(0, -12 * s, 56 * s, 30 * s) // 납작한 식빵
  } else {
    g.fillEllipse(0, -16 * s, 46 * s, 36 * s)
    // 앞다리
    g.fillRoundedRect(-14 * s, -8 * s, 9 * s, 14 * s, 4 * s)
    g.fillRoundedRect(5 * s, -8 * s, 9 * s, 14 * s, 4 * s)
  }
  // 배 하이라이트
  g.fillStyle(light, 0.5)
  g.fillEllipse(-2 * s, loaf ? -8 * s : -12 * s, 26 * s, 16 * s)

  // 머리
  const hy = loaf ? -30 * s : -40 * s
  g.fillStyle(base, 1)
  g.fillCircle(0, hy, 19 * s)

  // 귀
  g.fillStyle(base, 1)
  g.fillTriangle(-17 * s, hy - 10 * s, -5 * s, hy - 22 * s, -2 * s, hy - 8 * s)
  g.fillTriangle(17 * s, hy - 10 * s, 5 * s, hy - 22 * s, 2 * s, hy - 8 * s)
  g.fillStyle(0xf7b9c4, 1) // 분홍 귀 안쪽
  g.fillTriangle(-13 * s, hy - 10 * s, -7 * s, hy - 17 * s, -5 * s, hy - 9 * s)
  g.fillTriangle(13 * s, hy - 10 * s, 7 * s, hy - 17 * s, 5 * s, hy - 9 * s)

  // 볼터치
  g.fillStyle(0xf7a9b8, dirty ? 0.25 : 0.5)
  g.fillCircle(-11 * s, hy + 4 * s, 4 * s)
  g.fillCircle(11 * s, hy + 4 * s, 4 * s)

  // 코
  g.fillStyle(0xe8889a, 1)
  g.fillTriangle(-2.5 * s, hy + 2 * s, 2.5 * s, hy + 2 * s, 0, hy + 5 * s)

  // 꼬질꼬질 표현: 회색 얼룩 + 눈꼽 + 반창고
  if (dirty) {
    g.fillStyle(0x9b8d7a, veryDirty ? 0.45 : 0.28)
    g.fillCircle(-9 * s, -16 * s, 5 * s)
    g.fillCircle(8 * s, -10 * s, 4 * s)
    g.fillCircle(6 * s, hy + 8 * s, 3 * s)
    if (veryDirty) {
      g.fillStyle(0x6b5a45, 0.3)
      g.fillCircle(-6 * s, -6 * s, 4 * s)
      // 상처 반창고
      g.fillStyle(0xf3d9a0, 1)
      g.fillRoundedRect(6 * s, hy - 6 * s, 9 * s, 5 * s, 2 * s)
      g.lineStyle(1 * s, 0xc99a5b, 1)
      g.strokeRoundedRect(6 * s, hy - 6 * s, 9 * s, 5 * s, 2 * s)
    }
  }
}

// 눈/입 (깜빡임/감김/표정) 오버레이
function drawFace(g, opts) {
  const { pose = 'stand', condition = 100, blink = false, scale = 1, mood = 'ok' } = opts
  const s = scale
  const hy = pose === 'loaf' || pose === 'sleep' ? -30 * s : -40 * s
  g.clear()
  const closed = pose === 'sleep' || blink
  g.lineStyle(2.4 * s, 0x3a2e2a, 1)
  g.fillStyle(0x3a2e2a, 1)
  if (closed) {
    // 감은 눈 ( ‿ )
    g.beginPath()
    g.arc(-7 * s, hy - 1 * s, 4 * s, 0.15 * Math.PI, 0.85 * Math.PI)
    g.strokePath()
    g.beginPath()
    g.arc(7 * s, hy - 1 * s, 4 * s, 0.15 * Math.PI, 0.85 * Math.PI)
    g.strokePath()
  } else {
    g.fillCircle(-7 * s, hy - 1 * s, 3.2 * s)
    g.fillCircle(7 * s, hy - 1 * s, 3.2 * s)
    // 반짝이
    g.fillStyle(0xffffff, 1)
    g.fillCircle(-6 * s, hy - 2.4 * s, 1.1 * s)
    g.fillCircle(8 * s, hy - 2.4 * s, 1.1 * s)
  }
  // 눈꼽 (꼬질꼬질)
  if (condition < 45 && !closed) {
    g.fillStyle(0xb6a06a, 0.8)
    g.fillCircle(-9.5 * s, hy + 1 * s, 1.6 * s)
  }
  // 입 — 기분에 따라
  g.lineStyle(2 * s, 0x3a2e2a, 1)
  if (mood === 'sad') {
    g.beginPath()
    g.arc(0, hy + 11 * s, 4 * s, 1.15 * Math.PI, 1.85 * Math.PI)
    g.strokePath()
  } else {
    g.beginPath()
    g.arc(-2.5 * s, hy + 7 * s, 3 * s, 0, 0.6 * Math.PI)
    g.strokePath()
    g.beginPath()
    g.arc(2.5 * s, hy + 7 * s, 3 * s, 0.4 * Math.PI, Math.PI)
    g.strokePath()
  }
}

// 고양이 컨테이너 생성. scene 에 add 됨.
export function makeCat(scene, { color, scale = 1, name = '', costume = null }) {
  const c = scene.add.container(0, 0)
  c.setSize(70 * scale, 90 * scale)

  const shadow = scene.add.ellipse(0, 4 * scale, 50 * scale, 14 * scale, 0x000000, 0.16)
  const bodyG = scene.add.graphics()
  const faceG = scene.add.graphics()
  const costumeText = scene.add
    .text(0, -62 * scale, costume || '', { fontSize: `${22 * scale}px` })
    .setOrigin(0.5)
  const moodText = scene.add
    .text(20 * scale, -66 * scale, '', { fontSize: `${20 * scale}px` })
    .setOrigin(0.5)
  const nameTag = scene.add
    .text(0, 14 * scale, name, {
      fontFamily: 'Jua, sans-serif',
      fontSize: `${12 * scale}px`,
      color: '#6B4F3A',
      backgroundColor: '#FFFDFAcc',
      padding: { x: 5, y: 1 },
    })
    .setOrigin(0.5)

  c.add([shadow, bodyG, faceG, costumeText, moodText, nameTag])

  const state = { pose: 'stand', condition: 100, blink: false, mood: 'ok', scale }

  function render() {
    drawCat(bodyG, { color, pose: state.pose, condition: state.condition, scale })
    drawFace(faceG, {
      pose: state.pose,
      condition: state.condition,
      blink: state.blink,
      scale,
      mood: state.mood,
    })
  }
  render()

  // 숨쉬기
  scene.tweens.add({
    targets: bodyG,
    scaleY: 1.04,
    duration: 1600,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.inOut',
  })

  // 깜빡임 루프
  const blinkEvt = scene.time.addEvent({
    delay: 2600,
    loop: true,
    callback: () => {
      if (state.pose === 'sleep') return
      state.blink = true
      drawFace(faceG, { ...state, scale })
      scene.time.delayedCall(120, () => {
        state.blink = false
        drawFace(faceG, { ...state, scale })
      })
    },
  })

  const api = {
    container: c,
    bodyG,
    setPose(p) {
      if (state.pose === p) return
      state.pose = p
      render()
    },
    setCondition(v) {
      const nv = Math.round(v)
      if (Math.abs(nv - state.condition) < 4) return
      state.condition = nv
      render()
    },
    setMood(m) {
      if (state.mood === m) return
      state.mood = m
      drawFace(faceG, { ...state, scale })
    },
    setMoodIcon(emoji) {
      moodText.setText(emoji || '')
    },
    setCostume(emoji) {
      costumeText.setText(emoji || '')
    },
    setName(n) {
      nameTag.setText(n)
    },
    showName(v) {
      nameTag.setVisible(v)
    },
    pose: () => state.pose,
    destroy() {
      blinkEvt.remove()
      c.destroy()
    },
  }
  return api
}
