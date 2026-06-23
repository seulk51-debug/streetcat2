import { useEffect, useRef, useState } from 'react'
import { useGame } from '../state/store'
import { setSoundEnabled } from '../audio/sound'

// 전역 게임 루프: 방치 수익 틱, 날씨 동기화, 길고양이 스폰, 오프라인 정산
export function useGameLoop() {
  const [offline, setOffline] = useState(null) // { earned, hours } | null
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const g = useGame.getState()

    setSoundEnabled(g.soundOn)
    g.syncRealWorld()
    const res = g.reconcileOffline()
    if (res.earned > 5 && res.hours > 0.02) setOffline(res)

    const idle = setInterval(() => useGame.getState().idleTick(2), 2000)
    const spawn = setInterval(() => useGame.getState().trySpawnStreetCat(), 3500)
    const weather = setInterval(() => useGame.getState().syncRealWorld(), 60000)
    const save = setInterval(() => useGame.getState().touchLastSeen(), 15000)

    const onHide = () => {
      if (document.visibilityState === 'hidden') useGame.getState().touchLastSeen()
    }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('beforeunload', () => useGame.getState().touchLastSeen())

    return () => {
      clearInterval(idle)
      clearInterval(spawn)
      clearInterval(weather)
      clearInterval(save)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [])

  // 사운드 on/off 동기화
  const soundOn = useGame((s) => s.soundOn)
  useEffect(() => setSoundEnabled(soundOn), [soundOn])

  return { offline, clearOffline: () => setOffline(null) }
}
