import { useEffect, useRef } from 'react'
import Phaser from 'phaser'

// 범용 Phaser 마운트 래퍼.
// scenes: Phaser.Scene 클래스 배열 / active: 시작 씬 key / data: 씬 init 데이터
export default function PhaserGame({ scenes, active, data, className = '', onReady }) {
  const hostRef = useRef(null)
  const gameRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let destroyed = false

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host,
      backgroundColor: '#00000000',
      transparent: true,
      scale: {
        mode: Phaser.Scale.RESIZE,
        parent: host,
        width: host.clientWidth || 400,
        height: host.clientHeight || 560,
      },
      physics: { default: 'arcade', arcade: { debug: false } },
      // 씬은 ready 이후 수동 등록 → data 와 함께 정확히 한 번만 시작
      // mipmapFilter: 2^n 텍스처를 축소할 때 trilinear 보간 → 부드럽게(깨짐 방지)
      render: { antialias: true, roundPixels: false, mipmapFilter: 'LINEAR_MIPMAP_LINEAR' },
    })
    gameRef.current = game

    game.events.once('ready', () => {
      if (destroyed) return
      scenes.forEach((S) => {
        const key = S.KEY || S.name
        if (!game.scene.getScene(key)) game.scene.add(key, S, false)
      })
      game.scene.start(active, data || {})
      onReady && onReady(game)
    })

    return () => {
      destroyed = true
      gameRef.current = null
      game.destroy(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={hostRef} className={`w-full h-full ${className}`} />
}
