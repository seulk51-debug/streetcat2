// 사운드 힐링(ASMR) — 오디오 파일 없이 WebAudio로 합성합니다.
// 골골송(purr), 하트 팝, 클릭, 코인, 캔 따는 소리, 모래 사각거림 등.
// useGame.soundOn 과 연동되며, 사용자의 첫 제스처 후 AudioContext 가 활성화됩니다.

let ctx = null
let master = null
let enabled = true
let purrNode = null // { source, gain, lfo } 활성 골골송

function ac() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.5
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function setSoundEnabled(on) {
  enabled = on
  if (!on) stopPurr()
  if (master) master.gain.value = on ? 0.5 : 0
}

// 첫 사용자 제스처에서 호출 → 오디오 컨텍스트 깨우기
export function unlockAudio() {
  ac()
}

function noiseBuffer(seconds = 1) {
  const c = ac()
  if (!c) return null
  const len = Math.floor(c.sampleRate * seconds)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  return buf
}

function blip({ freq = 440, type = 'sine', dur = 0.12, gain = 0.25, slideTo = null, delay = 0 }) {
  if (!enabled) return
  const c = ac()
  if (!c) return
  const t = c.currentTime + delay
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g).connect(master)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

// ── UI 효과음 ────────────────────────────────────────
export const sfx = {
  click() {
    blip({ freq: 520, type: 'triangle', dur: 0.07, gain: 0.18 })
  },
  pop() {
    blip({ freq: 660, type: 'sine', dur: 0.1, gain: 0.22, slideTo: 1180 })
  },
  heart() {
    blip({ freq: 880, type: 'sine', dur: 0.12, gain: 0.2, slideTo: 1320 })
    blip({ freq: 1320, type: 'sine', dur: 0.12, gain: 0.14, delay: 0.06 })
  },
  coin() {
    blip({ freq: 988, type: 'square', dur: 0.08, gain: 0.14 })
    blip({ freq: 1319, type: 'square', dur: 0.1, gain: 0.12, delay: 0.07 })
  },
  success() {
    ;[523, 659, 784, 1047].forEach((f, i) =>
      blip({ freq: f, type: 'triangle', dur: 0.14, gain: 0.16, delay: i * 0.08 }),
    )
  },
  fail() {
    blip({ freq: 240, type: 'sawtooth', dur: 0.2, gain: 0.16, slideTo: 120 })
  },
  // 캔 사료 따는 소리 — 짧은 노이즈 버스트 + 금속성 클릭
  can() {
    if (!enabled) return
    const c = ac()
    if (!c) return
    const t = c.currentTime
    const src = c.createBufferSource()
    src.buffer = noiseBuffer(0.18)
    const bp = c.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 2600
    bp.Q.value = 1.2
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18)
    src.connect(bp).connect(g).connect(master)
    src.start(t)
    blip({ freq: 1800, type: 'square', dur: 0.04, gain: 0.1, delay: 0.02 })
  },
  // 모래 사각거리는 소리 — 필터링된 노이즈
  sand() {
    if (!enabled) return
    const c = ac()
    if (!c) return
    const t = c.currentTime
    const src = c.createBufferSource()
    src.buffer = noiseBuffer(0.4)
    const hp = c.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 4000
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.16, t + 0.05)
    g.gain.linearRampToValueAtTime(0.0001, t + 0.4)
    src.connect(hp).connect(g).connect(master)
    src.start(t)
  },
  // 물 떨어지는 소리
  water() {
    blip({ freq: 1400, type: 'sine', dur: 0.18, gain: 0.12, slideTo: 600 })
  },
  camera() {
    blip({ freq: 1600, type: 'square', dur: 0.03, gain: 0.12 })
    blip({ freq: 800, type: 'square', dur: 0.05, gain: 0.1, delay: 0.04 })
  },
  meow() {
    blip({ freq: 700, type: 'sawtooth', dur: 0.18, gain: 0.12, slideTo: 480 })
    blip({ freq: 520, type: 'sawtooth', dur: 0.16, gain: 0.1, slideTo: 700, delay: 0.12 })
  },
}

// ── 골골송(Purring) — 저주파 럼블을 LFO로 진폭 변조 ──────
export function startPurr() {
  if (!enabled) return
  if (purrNode) return
  const c = ac()
  if (!c) return
  const t = c.currentTime

  const src = c.createBufferSource()
  src.buffer = noiseBuffer(2)
  src.loop = true

  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 180
  lp.Q.value = 6

  const amp = c.createGain()
  amp.gain.value = 0.0001

  // 25Hz 근처 골골 진동
  const lfo = c.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.value = 26
  const lfoGain = c.createGain()
  lfoGain.gain.value = 0.18
  lfo.connect(lfoGain).connect(amp.gain)

  amp.gain.setValueAtTime(0.0001, t)
  amp.gain.linearRampToValueAtTime(0.22, t + 0.25)

  src.connect(lp).connect(amp).connect(master)
  src.start(t)
  lfo.start(t)

  purrNode = { src, amp, lfo }
}

export function stopPurr() {
  if (!purrNode) return
  const c = ctx
  const { src, amp, lfo } = purrNode
  purrNode = null
  if (!c) return
  const t = c.currentTime
  try {
    amp.gain.cancelScheduledValues(t)
    amp.gain.setValueAtTime(amp.gain.value, t)
    amp.gain.linearRampToValueAtTime(0.0001, t + 0.2)
    src.stop(t + 0.25)
    lfo.stop(t + 0.25)
  } catch (e) {
    /* already stopped */
  }
}
