import { useState } from 'react'
import { useGame } from '../../state/store'
import { MINIGAMES } from '../../data/world'
import PhaserGame from '../../game/PhaserGame'
import TrashScene from '../../game/scenes/TrashScene'
import { Modal, play } from '../ui'
import TimingBar from '../TimingBar'

const HEALTH = [MINIGAMES.teeth, MINIGAMES.nails, MINIGAMES.ears]

export default function MinigameScreen() {
  const awardMinigame = useGame((s) => s.awardMinigame)
  const toast = useGame((s) => s.toast)
  const [trash, setTrash] = useState(false)
  const [health, setHealth] = useState(null)
  const [result, setResult] = useState(null)

  return (
    <div className="absolute inset-0 overflow-y-auto no-scrollbar bg-cream">
      <div className="pt-16 pb-24 px-3">
        <h1 className="text-cocoa font-bold text-lg mb-1">🎮 미니게임</h1>
        <p className="text-cocoa/55 text-xs mb-3">미니게임으로 에코 포인트와 보너스 하트를 모아요</p>

        {/* 쓰레기 줍기 */}
        <button className="panel w-full p-4 flex items-center gap-3 mb-3 active:scale-95 transition text-left"
          onClick={() => { play(); setTrash(true) }}>
          <span className="text-4xl">{MINIGAMES.trash.emoji}</span>
          <div className="flex-1">
            <div className="font-bold text-cocoa">{MINIGAMES.trash.name}</div>
            <div className="text-xs text-cocoa/55">{MINIGAMES.trash.desc}</div>
            <div className="text-[11px] text-ecogreen font-bold mt-0.5">🍃 에코 포인트 획득</div>
          </div>
        </button>

        {/* 건강 관리 */}
        <div className="font-bold text-cocoa text-sm mb-2">🩺 건강 관리 (타이밍)</div>
        <div className="grid gap-2">
          {HEALTH.map((g) => (
            <button key={g.id} className="panel p-3 flex items-center gap-3 active:scale-95 transition text-left"
              onClick={() => { play(); setHealth(g) }}>
              <span className="text-3xl">{g.emoji}</span>
              <div className="flex-1">
                <div className="font-bold text-cocoa text-sm">{g.name}</div>
                <div className="text-[11px] text-cocoa/55">{g.desc}</div>
              </div>
              <span className="text-[11px] text-heartpink font-bold">보너스 ❤️</span>
            </button>
          ))}
        </div>
      </div>

      {/* 쓰레기 줍기 (Phaser) */}
      {trash && (
        <div className="absolute inset-0 z-40 bg-black/30 flex flex-col">
          <div className="flex items-center justify-between px-4 pt-3 pb-2 text-white">
            <span className="font-bold">🗑️ 골목길 쓰레기 줍기</span>
            <button className="chip bg-white/80 text-cocoa text-xs" onClick={() => { play(); setTrash(false) }}>그만두기</button>
          </div>
          <div className="flex-1 relative">
            <PhaserGame
              scenes={[TrashScene]}
              active="TrashScene"
              data={{
                duration: MINIGAMES.trash.duration,
                onEnd: (score) => {
                  awardMinigame('eco', score)
                  play('success')
                  setTrash(false)
                  setResult({ emoji: '🍃', amount: score, label: '에코 포인트' })
                },
              }}
            />
          </div>
        </div>
      )}

      {/* 건강 관리 */}
      <Modal open={!!health} onClose={() => setHealth(null)} title={health ? `${health.emoji} ${health.name}` : ''}>
        {health && (
          <>
            <p className="text-xs text-cocoa/55 mb-3">{health.desc}</p>
            <TimingBar target={0.16} speed={1.2} label="✋ 지금!"
              onResult={(ok) => {
                const amount = ok ? 18 : 4
                awardMinigame('heart', amount)
                toast(ok ? `완벽해요! 보너스 하트 +${amount}` : `조금 아쉬웠어요 +${amount}`, ok ? '✨' : '💦')
                setHealth(null)
              }} />
          </>
        )}
      </Modal>

      {/* 결과 */}
      <Modal open={!!result} onClose={() => setResult(null)} title="🎉 미니게임 완료!">
        {result && (
          <div className="text-center py-2">
            <div className="text-5xl mb-2">{result.emoji}</div>
            <p className="text-sm text-cocoa/60 mb-1">{result.label} 획득!</p>
            <div className="text-3xl font-bold text-ecogreen mb-3">+{result.amount}</div>
            <button className="btn-primary w-full" onClick={() => { play('coin'); setResult(null) }}>받기</button>
          </div>
        )}
      </Modal>
    </div>
  )
}
