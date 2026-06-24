import Phaser from 'phaser'
import { useGame } from '../state/store'

// 씬 카메라에 좌우(상하) 드래그 슬라이드 + 휠/핀치 확대·축소를 붙인다.
// 씬은 this.W(뷰포트 너비), this.H(높이), this.worldW(월드 너비)를 가지고 있어야 함.
// 설치 후 scene.refreshCameraBounds() / scene.centerCamera() 를 리사이즈·공간전환에서 호출.
export function installPanZoom(scene, { minZoom = 0.35, maxZoom = 2.6, marginColor = null } = {}) {
  const cam = scene.cameras.main
  const state = { panning: false, sx: 0, sy: 0, scrollX: 0, scrollY: 0, pinchPrev: 0, lastTapAt: 0, lastTapX: 0, lastTapY: 0 }
  scene._zoomCfg = { minZoom, maxZoom }
  // 축소로 콘텐츠가 화면보다 작아질 때 바깥 여백을 채울 색 (없으면 투명)
  scene._marginColor = marginColor

  scene.input.addPointer(1) // 핀치용 두 번째 포인터 확보

  scene.refreshCameraBounds = () => {
    clampScroll(scene)
    updateMargin(scene)
  }
  scene.centerCamera = (resetZoom = false) => {
    if (resetZoom) cam.setZoom(1)
    cam.scrollX = (scene.worldW - scene.W) / 2
    cam.scrollY = 0
    clampScroll(scene)
    updateMargin(scene)
  }
  scene.centerCamera()

  scene.input.on('pointerdown', (p) => {
    if (bothDown(scene)) return // 핀치 시작이면 패닝 안 함
    const empty = scene.input.hitTestPointer(p).length === 0 // 고양이/가구 위가 아님
    // 빈 곳 더블탭 → 확대/축소 토글
    const now = scene.time.now
    if (
      empty &&
      now - state.lastTapAt < 300 &&
      Math.abs(p.x - state.lastTapX) < 30 &&
      Math.abs(p.y - state.lastTapY) < 30
    ) {
      state.lastTapAt = 0
      state.panning = false
      zoomTo(scene, cam.zoom > 1.05 ? 1 : 2, p.x, p.y)
      return
    }
    state.lastTapAt = now
    state.lastTapX = p.x
    state.lastTapY = p.y
    state.panning = empty // 빈 배경에서만 패닝
    state.sx = p.x
    state.sy = p.y
    state.scrollX = cam.scrollX
    state.scrollY = cam.scrollY
  })

  scene.input.on('pointermove', (p) => {
    if (bothDown(scene)) {
      handlePinch(scene, state)
      return
    }
    if (!state.panning || !p.isDown) return
    cam.scrollX = state.scrollX - (p.x - state.sx) / cam.zoom
    cam.scrollY = state.scrollY - (p.y - state.sy) / cam.zoom
    clampScroll(scene)
  })

  const end = () => {
    state.panning = false
    state.pinchPrev = 0
  }
  scene.input.on('pointerup', end)
  scene.input.on('pointerupoutside', end)

  // 마우스 휠 줌(데스크톱)
  scene.input.on('wheel', (p, over, dx, dy) => {
    zoomAt(scene, dy > 0 ? -0.2 : 0.2, p.x, p.y)
  })

  // 화면 +/- 줌 버튼(스토어 명령) 구독
  let lastNonce = useGame.getState().zoomNonce
  scene._zoomUnsub = useGame.subscribe((s) => {
    if (s.zoomNonce === lastNonce) return
    lastNonce = s.zoomNonce
    const cx = scene.W / 2
    const cy = scene.H * 0.42
    if (s.zoomAction === 'in') zoomAt(scene, 0.45, cx, cy)
    else if (s.zoomAction === 'out') zoomAt(scene, -0.45, cx, cy)
    else if (s.zoomAction === 'reset') scene.centerCamera(true)
  })
  scene.events.once('shutdown', () => scene._zoomUnsub && scene._zoomUnsub())
  scene.events.once('destroy', () => scene._zoomUnsub && scene._zoomUnsub())
}

// 절대 배율로 줌 (포커스 지점 고정)
function zoomTo(scene, targetZoom, fx, fy) {
  const cam = scene.cameras.main
  const { minZoom, maxZoom } = scene._zoomCfg
  const before = cam.getWorldPoint(fx, fy)
  cam.setZoom(Phaser.Math.Clamp(targetZoom, minZoom, maxZoom))
  const after = cam.getWorldPoint(fx, fy)
  cam.scrollX += before.x - after.x
  cam.scrollY += before.y - after.y
  clampScroll(scene)
  updateMargin(scene)
}

function bothDown(scene) {
  const p1 = scene.input.pointer1
  const p2 = scene.input.pointer2
  return !!(p1 && p2 && p1.isDown && p2.isDown)
}

function handlePinch(scene, state) {
  const p1 = scene.input.pointer1
  const p2 = scene.input.pointer2
  const dist = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y)
  const mx = (p1.x + p2.x) / 2
  const my = (p1.y + p2.y) / 2
  if (state.pinchPrev > 0 && dist > 0) {
    const cam = scene.cameras.main
    zoomAt(scene, cam.zoom * (dist / state.pinchPrev - 1), mx, my)
  }
  state.pinchPrev = dist
  state.panning = false
}

// 화면상 (fx,fy) 지점을 기준으로 줌 (그 지점이 화면에 고정되도록 스크롤 보정)
function zoomAt(scene, delta, fx, fy) {
  const cam = scene.cameras.main
  const { minZoom, maxZoom } = scene._zoomCfg
  const before = cam.getWorldPoint(fx, fy)
  cam.setZoom(Phaser.Math.Clamp(cam.zoom + delta, minZoom, maxZoom))
  const after = cam.getWorldPoint(fx, fy)
  cam.scrollX += before.x - after.x
  cam.scrollY += before.y - after.y
  clampScroll(scene)
  updateMargin(scene)
}

// 콘텐츠가 화면보다 작아지면(줌아웃) 바깥 여백을 회색으로, 아니면 투명으로
function updateMargin(scene) {
  if (!scene._marginColor) return
  const cam = scene.cameras.main
  if (cam.zoom < 0.999) cam.setBackgroundColor(scene._marginColor)
  else cam.setBackgroundColor('rgba(0,0,0,0)')
}

// Phaser 카메라는 화면 중앙 기준으로 줌됨 → 화면 중앙의 월드 좌표(cx,cy)로 계산.
// 콘텐츠가 뷰보다 작으면(줌아웃) 가운데 정렬, 크면 경계 안에서 클램프.
function clampScroll(scene) {
  const cam = scene.cameras.main
  const halfW = scene.W / (2 * cam.zoom)
  const halfH = scene.H / (2 * cam.zoom)
  let cx = cam.scrollX + scene.W / 2
  let cy = cam.scrollY + scene.H / 2
  cx = scene.worldW <= halfW * 2 ? scene.worldW / 2 : Phaser.Math.Clamp(cx, halfW, scene.worldW - halfW)
  cy = scene.H <= halfH * 2 ? scene.H / 2 : Phaser.Math.Clamp(cy, halfH, scene.H - halfH)
  cam.scrollX = cx - scene.W / 2
  cam.scrollY = cy - scene.H / 2
}
