import { useState } from 'react'
import { useGame, selectCapacity } from '../../state/store'
import { SPACES, COSTUMES } from '../../data/shop'
import PhaserGame from '../../game/PhaserGame'
import RoomScene from '../../game/scenes/RoomScene'
import { Bar, play } from '../ui'
import CatDetailModal from '../modals/CatDetailModal'

const COS = Object.fromEntries(COSTUMES.map((c) => [c.id, c]))

export default function RoomScreen() {
  const ownedCats = useGame((s) => s.ownedCats)
  const space = useGame((s) => s.space)
  const unlockedSpaces = useGame((s) => s.unlockedSpaces)
  const capacity = useGame(selectCapacity)
  const setSpace = useGame((s) => s.setSpace)
  const setScreen = useGame((s) => s.setScreen)
  const idleRate = useGame((s) => s.idleRatePerHour())

  const consumables = useGame((s) => s.ownedConsumables)
  const roomStats = useGame((s) => s.roomStats)
  const feedCat = useGame((s) => s.feedCat)
  const refillWater = useGame((s) => s.refillWater)
  const cleanLitter = useGame((s) => s.cleanLitter)
  const passActive = useGame((s) => s.passActive)

  const [detail, setDetail] = useState(null)

  const avgHunger = ownedCats.length
    ? Math.round(ownedCats.reduce((a, c) => a + c.hunger, 0) / ownedCats.length)
    : 100

  const feedAll = () => {
    play('can')
    const hungry = useGame.getState().ownedCats.filter((c) => c.hunger < 90)
    for (const c of hungry) {
      const ok = feedCat(c.uid)
      if (!ok) break
    }
  }

  return (
    <div className="absolute inset-0">
      {/* Phaser 살아있는 방 */}
      <PhaserGame scenes={[RoomScene]} active="RoomScene" className="absolute inset-0" />

      {/* ── 상단 오버레이: 공간 + 방치수익 ── */}
      <div className="absolute top-14 inset-x-0 px-3 z-20 pointer-events-none">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto pb-1">
          {SPACES.filter((s) => unlockedSpaces.includes(s.id)).map((s) => (
            <button
              key={s.id}
              onClick={() => { play(); setSpace(s.id) }}
              className={`shrink-0 chip text-xs ${space === s.id ? 'bg-toast text-cocoa' : 'bg-white/80 text-cocoa/60'}`}
            >
              {s.emoji} {s.name}
            </button>
          ))}
          {unlockedSpaces.length < SPACES.length && (
            <button onClick={() => { play(); setScreen('shop') }} className="shrink-0 chip text-xs bg-white/60 text-cocoa/50">
              ➕ 확장
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 pointer-events-auto">
          <span className="chip bg-white/80 text-xs text-cocoa/70">🐈 {ownedCats.length}/{capacity}</span>
          <span className="chip bg-white/80 text-xs text-heartpink">❤️ +{idleRate}/시간</span>
          {passActive && <span className="chip bg-gold/80 text-white text-xs">🎫 자동케어</span>}
        </div>
      </div>

      {/* ── 빈 집 안내 ── */}
      {ownedCats.length === 0 && (
        <div className="absolute inset-0 grid place-items-center z-10 pointer-events-none px-8">
          <div className="panel p-5 text-center pointer-events-auto animate-floaty">
            <div className="text-5xl mb-2">🏠</div>
            <p className="text-cocoa/70 text-sm mb-3">아직 함께하는 고양이가 없어요.<br />길거리에서 길고양이를 구조해보세요!</p>
            <button className="btn-primary w-full" onClick={() => { play(); setScreen('street') }}>
              🌃 길거리 탐색하러 가기
            </button>
          </div>
        </div>
      )}

      {/* ── 하단 케어 독 ── */}
      <div className="absolute bottom-[78px] inset-x-0 px-3 z-20 pointer-events-none">
        {/* 고양이 로스터 */}
        {ownedCats.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1.5 pointer-events-auto">
            {ownedCats.map((c) => (
              <button
                key={c.uid}
                onClick={() => { play(); setDetail(c.uid) }}
                className="shrink-0 w-[52px] rounded-xl bg-white/85 shadow-sm p-1 active:scale-95 transition"
              >
                <div className="text-xl leading-none relative">
                  {c.emoji}
                  {c.costume && <span className="absolute -top-1 -right-1 text-[11px]">{COS[c.costume]?.emoji}</span>}
                  {c.hidden && <span className="absolute -top-1 -left-1 text-[11px]">🫣</span>}
                </div>
                <div className="text-[9px] font-bold text-cocoa/70 truncate">{c.name}</div>
                <Bar value={c.condition} color="#7BC47F" height={3} />
              </button>
            ))}
          </div>
        )}

        {/* 환경 상태 + 케어 버튼 */}
        <div className="panel p-2.5 pointer-events-auto">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <MiniStat emoji="🍚" label="포만감" value={avgHunger} color="#F2B441" />
            <MiniStat emoji="💧" label="물그릇" value={roomStats.water} color="#5BA8E8" />
            <MiniStat emoji="🪣" label="화장실" value={roomStats.litter} color="#A872E8" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <CareBtn emoji="🥫" label="밥 주기" count={consumables.food} onClick={feedAll} />
            <CareBtn emoji="💧" label="물 갈기" count={consumables.water} onClick={() => { play('water'); refillWater() }} />
            <CareBtn emoji="🏖️" label="모래 갈기" count={consumables.sand} onClick={() => { play('sand'); cleanLitter() }} />
          </div>
        </div>
      </div>

      {detail && <CatDetailModal catUid={detail} onClose={() => setDetail(null)} />}
    </div>
  )
}

function MiniStat({ emoji, label, value, color }) {
  const low = value < 30
  return (
    <div>
      <div className="flex justify-between text-[10px] text-cocoa/55 mb-0.5">
        <span>{emoji} {label}</span>
        {low && <span className="text-heartpink font-bold">부족!</span>}
      </div>
      <Bar value={value} color={low ? '#F5849B' : color} height={5} />
    </div>
  )
}

function CareBtn({ emoji, label, count, onClick }) {
  return (
    <button onClick={onClick} className="relative rounded-xl bg-cozy/50 hover:bg-cozy py-2 flex flex-col items-center active:scale-95 transition">
      <span className="text-lg">{emoji}</span>
      <span className="text-[10px] font-bold text-cocoa/70">{label}</span>
      <span className={`absolute top-1 right-1.5 text-[9px] font-bold ${count > 0 ? 'text-cocoa/50' : 'text-heartpink'}`}>×{count}</span>
    </button>
  )
}
