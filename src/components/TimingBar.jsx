import { useEffect, useRef, useState } from 'react'
import { play } from './ui'

// 타이밍 미니게임 바 — 마커가 좌우로 움직이고, 초록 존에서 멈추면 성공.
// onResult(success: boolean) 한 번 호출 후 종료.
export default function TimingBar({ onResult, target = 0.18, speed = 0.9, label = '지금!', color = '#7BC47F' }) {
  const markerRef = useRef(null)
  const pos = useRef(0.5)
  const dir = useRef(1)
  const raf = useRef(0)
  const done = useRef(false)
  const [result, setResult] = useState(null) // null | 'hit' | 'miss'

  useEffect(() => {
    let last = performance.now()
    const loop = (t) => {
      const dt = Math.min(50, t - last) / 1000
      last = t
      if (!done.current) {
        pos.current += dir.current * speed * dt
        if (pos.current >= 1) { pos.current = 1; dir.current = -1 }
        if (pos.current <= 0) { pos.current = 0; dir.current = 1 }
        if (markerRef.current) markerRef.current.style.left = `${pos.current * 100}%`
        raf.current = requestAnimationFrame(loop)
      }
    }
    raf.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf.current)
  }, [speed])

  const tap = () => {
    if (done.current) return
    done.current = true
    cancelAnimationFrame(raf.current)
    const hit = Math.abs(pos.current - 0.5) <= target / 2
    setResult(hit ? 'hit' : 'miss')
    play(hit ? 'success' : 'fail')
    setTimeout(() => onResult(hit), 650)
  }

  return (
    <div className="select-none">
      <div className="relative h-9 rounded-full bg-black/10 overflow-hidden">
        {/* 타겟 존 */}
        <div
          className="absolute top-0 bottom-0 rounded-full"
          style={{ left: `${50 - (target * 100) / 2}%`, width: `${target * 100}%`, background: color + '66' }}
        />
        <div className="absolute top-0 bottom-0 left-1/2 w-[2px] -translate-x-1/2 bg-ecogreen/40" />
        {/* 마커 */}
        <div
          ref={markerRef}
          className="absolute top-1 bottom-1 w-2 -translate-x-1/2 rounded-full bg-cocoa shadow"
          style={{ left: '50%' }}
        />
        {result && (
          <div className="absolute inset-0 grid place-items-center text-lg font-bold"
            style={{ color: result === 'hit' ? '#4FA85C' : '#E5566F' }}>
            {result === 'hit' ? '성공! ✨' : '아쉬워요 💦'}
          </div>
        )}
      </div>
      <button className="btn-primary w-full mt-2" onClick={tap} disabled={!!result}>
        {label}
      </button>
    </div>
  )
}
