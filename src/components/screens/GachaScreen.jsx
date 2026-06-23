import { useState } from 'react'
import { useGame } from '../../state/store'
import { COSTUMES, GACHA } from '../../data/shop'
import { Bar, Modal, RarityTag, play } from '../ui'

export default function GachaScreen() {
  const churu = useGame((s) => s.goldenChuru)
  const pity = useGame((s) => s.gachaPity)
  const owned = useGame((s) => s.ownedCostumes)
  const pull = useGame((s) => s.pullGacha)
  const claimPity = useGame((s) => s.claimPity)

  const [results, setResults] = useState(null)
  const [pityOpen, setPityOpen] = useState(false)

  const doPull = (n) => {
    const r = pull(n)
    if (r) { play('success'); setResults(r) }
  }

  return (
    <div className="absolute inset-0 overflow-y-auto no-scrollbar"
      style={{ background: 'linear-gradient(180deg,#4a3a6a 0%,#6b4f8a 50%,#8a6fa8 100%)' }}>
      <div className="pt-16 pb-24 px-3">
        <h1 className="text-white font-bold text-lg mb-1">🎁 스페셜 코스튬 가챠</h1>
        <p className="text-white/55 text-xs mb-3">시즌 한정 코스튬을 모아보세요 · 🐾 착한 가챠(천장) 적용</p>

        {/* 천장 게이지 */}
        <div className="panel p-3 mb-3">
          <div className="flex justify-between text-xs text-cocoa/60 mb-1">
            <span>🏯 천장까지</span>
            <span className="tabular-nums">{pity} / {GACHA.pity}</span>
          </div>
          <Bar value={pity} max={GACHA.pity} color="#F2B441" />
          <p className="text-[11px] text-cocoa/45 mt-1">{GACHA.pity}회 누적 시 원하는 코스튬을 확정으로 가져가요</p>
          {pity >= GACHA.pity && (
            <button className="btn-gold w-full mt-2 text-sm animate-pulse" onClick={() => { play(); setPityOpen(true) }}>
              🎉 천장 확정 코스튬 선택하기!
            </button>
          )}
        </div>

        {/* 뽑기 버튼 */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button className="panel p-3 active:scale-95 transition disabled:opacity-50" disabled={churu < GACHA.cost} onClick={() => doPull(1)}>
            <div className="text-3xl mb-1">🎰</div>
            <div className="font-bold text-cocoa">1회 뽑기</div>
            <div className="text-sm text-gold font-bold">🍗 {GACHA.cost}</div>
          </button>
          <button className="panel p-3 active:scale-95 transition disabled:opacity-50 ring-2 ring-gold/40" disabled={churu < GACHA.cost10} onClick={() => doPull(10)}>
            <div className="text-3xl mb-1">🎊</div>
            <div className="font-bold text-cocoa">10회 뽑기</div>
            <div className="text-sm text-gold font-bold">🍗 {GACHA.cost10} <span className="text-[10px] text-ecogreen">할인!</span></div>
          </button>
        </div>

        {/* 컬렉션 */}
        <div className="text-white font-bold text-sm mb-2">🎀 코스튬 도감 ({owned.length}/{COSTUMES.length})</div>
        <div className="grid grid-cols-4 gap-2">
          {COSTUMES.map((c) => {
            const has = owned.includes(c.id)
            return (
              <div key={c.id} className={`rounded-2xl p-2 flex flex-col items-center gap-0.5 ${has ? 'bg-white/90' : 'bg-white/10'}`}>
                <span className={`text-2xl ${has ? '' : 'grayscale opacity-40'}`}>{has ? c.emoji : '❔'}</span>
                <span className={`text-[9px] font-bold text-center leading-tight ${has ? 'text-cocoa' : 'text-white/40'}`}>
                  {has ? c.name : '???'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 결과 */}
      <Modal open={!!results} onClose={() => setResults(null)} title="✨ 뽑기 결과">
        {results && (
          <>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {results.map((c, i) => (
                <div key={i} className="rounded-2xl bg-cozy/40 p-2 flex flex-col items-center gap-1 animate-pop" style={{ animationDelay: `${i * 60}ms` }}>
                  <span className="text-3xl">{c.emoji}</span>
                  <span className="text-[10px] font-bold text-cocoa text-center leading-tight">{c.name}</span>
                  <RarityTag rarity={c.rarity} />
                </div>
              ))}
            </div>
            <button className="btn-primary w-full" onClick={() => { play('coin'); setResults(null) }}>확인</button>
          </>
        )}
      </Modal>

      {/* 천장 선택 */}
      <Modal open={pityOpen} onClose={() => setPityOpen(false)} title="🏯 천장 확정 — 원하는 코스튬 선택">
        <div className="grid grid-cols-3 gap-2">
          {COSTUMES.map((c) => (
            <button key={c.id} onClick={() => { if (claimPity(c.id)) { play('success'); setPityOpen(false) } }}
              className="rounded-2xl bg-cozy/40 hover:bg-cozy p-2 flex flex-col items-center gap-1 active:scale-95 transition">
              <span className="text-2xl">{c.emoji}</span>
              <span className="text-[9px] font-bold text-cocoa text-center leading-tight">{c.name}</span>
              <RarityTag rarity={c.rarity} />
            </button>
          ))}
        </div>
      </Modal>
    </div>
  )
}
