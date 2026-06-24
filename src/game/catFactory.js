// Phaser 고양이 — public/cat 실사 스프라이트 기반 (길거리와 동일 이미지).
// 이름표 / 코스튬 / 기분 아이콘 / 자세(서기·식빵) / 컨디션(꼬질 틴트)을 표현합니다.
// makeCat 의 반환 API 는 기존(그래픽) 버전과 호환됩니다.
import { CAT_SPRITE_BY_ID, DEFAULT_CAT_SPRITE } from '../data/cats'

const H_DISP = 88 // 표시 높이(px)

export function catTexKey(rosterId) {
  return 'cat_' + (CAT_SPRITE_BY_ID[rosterId] || DEFAULT_CAT_SPRITE)
}

// scene 에 고양이 컨테이너를 만들어 반환. 텍스처는 scene.preload 에서 'cat_<key>' 로 로드돼 있어야 함.
export function makeCat(scene, { rosterId, scale = 1, name = '', costume = null }) {
  const c = scene.add.container(0, 0)
  c.setSize(70 * scale, 90 * scale)

  const shadow = scene.add.ellipse(0, 4 * scale, 52 * scale, 14 * scale, 0x000000, 0.16)

  const key = catTexKey(rosterId)
  const spr = scene.add.image(0, 0, key).setOrigin(0.5, 1)
  const tex = scene.textures.get(key)
  const natH = tex && tex.getSourceImage() ? tex.getSourceImage().height : H_DISP
  const baseScale = (H_DISP * scale) / natH
  spr.setScale(baseScale)
  const top = -H_DISP * scale

  const costumeText = scene.add
    .text(0, top + 6 * scale, costume || '', { fontSize: `${22 * scale}px` })
    .setOrigin(0.5)
  const moodText = scene.add
    .text(18 * scale, top - 4 * scale, '', { fontSize: `${20 * scale}px` })
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

  c.add([shadow, spr, costumeText, moodText, nameTag])

  const state = { pose: 'stand', condition: 100, mood: 'ok' }

  function applyPose() {
    // 단일 idle 이미지라 프레임 교체는 불가 → 식빵/잠 자세는 살짝 눌러 앉은 느낌으로
    const sit = state.pose === 'loaf' || state.pose === 'sleep'
    spr.setScale(baseScale * (sit ? 1.05 : 1), baseScale * (sit ? 0.82 : 1))
    spr.setAngle(state.pose === 'sleep' ? -6 : 0)
  }
  function applyCondition() {
    // 꼬질꼬질하면 칙칙한 틴트
    if (state.condition < 30) spr.setTint(0xb6a684)
    else if (state.condition < 55) spr.setTint(0xd8cdb6)
    else spr.clearTint()
  }
  applyPose()
  applyCondition()

  const api = {
    container: c,
    spr,
    setPose(p) {
      if (state.pose === p) return
      state.pose = p
      applyPose()
    },
    setCondition(v) {
      const nv = Math.round(v)
      if (Math.abs(nv - state.condition) < 4) return
      state.condition = nv
      applyCondition()
    },
    // 이미지에선 표정 변경 불가 — 기분은 mood 아이콘(😿/💗 등)으로 표현
    setMood() {},
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
      c.destroy()
    },
  }
  return api
}
