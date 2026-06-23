import { useEffect, useState } from 'react'
import { useGame } from '../../state/store'
import { OUTING_DURATIONS, TREASURES, POSTCARDS } from '../../data/world'
import { Modal, RarityTag, play, EmptyHint } from '../ui'

const TRE = Object.fromEntries(TREASURES.map((t) => [t.id, t]))

export default function OutingScreen() {
  const ownedCats = useGame((s) => s.ownedCats)
  const treasures = useGame((s) => s.treasures)
  const postcards = useGame((s) => s.postcards)
  const sendOuting = useGame((s) => s.sendOuting)
  const collectOuting = useGame((s) => s.collectOuting)
  const toast = useGame((s) => s.toast)

  const [now, setNow] = useState(Date.now())
  const [sendFor, setSendFor] = useState(null)
  const [reward, setReward] = useState(null)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const fmt = (ms) => {
    const s = Math.max(0, Math.ceil(ms / 1000))
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  const treasureList = Object.entries(treasures).filter(([, n]) => n > 0)

  return (
    <div className="absolute inset-0 overflow-y-auto no-scrollbar"
      style={{ background: 'linear-gradient(180deg,#BFE3D0 0%,#CDE7F0 60%,#FBE3D6 100%)' }}>
      <div className="pt-16 pb-24 px-3">
        <h1 className="text-cocoa font-bold text-lg mb-1">🎒 냥이의 외출</h1>
        <p className="text-cocoa/55 text-xs mb-3">고양이에게 가방을 쥐어주면 바깥세상으로 모험을 떠나 보물과 엽서를 물어와요</p>

        {ownedCats.length === 0 ? (
          <div className="panel"><EmptyHint emoji="🐾">먼저 고양이를 입양해 주세요</EmptyHint></div>
        ) : (
          <div className="space-y-2.5 mb-4">
            {ownedCats.map((c) => {
              const out = c.outingUntil && now < c.outingUntil
              const done = c.outingUntil && now >= c.outingUntil
              return (
                <div key={c.uid} className="panel p-3 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl grid place-items-center text-2xl shrink-0" style={{ background: c.color + '55' }}>
                    {out ? '🎒' : c.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-cocoa truncate">{c.name}</div>
                    <div className="text-[11px] text-cocoa/50">
                      {out ? `🗺️ 모험 중… 돌아오기까지 ${fmt(c.outingUntil - now)}` : done ? '🎁 선물을 물고 돌아왔어요!' : c.hidden ? '아직 집에 적응 중이에요' : '집에서 쉬는 중'}
                    </div>
                  </div>
                  {done ? (
                    <button className="btn-primary text-xs px-3 py-1.5 animate-pulse" onClick={() => { const r = collectOuting(c.uid); if (r) { play('coin'); setReward(r) } }}>
                      마중가기
                    </button>
                  ) : out ? (
                    <span className="chip bg-mint/50 text-cocoa text-[11px]">외출중</span>
                  ) : (
                    <button className="btn-eco text-xs px-3 py-1.5 disabled:opacity-40" disabled={c.hidden} onClick={() => { play(); setSendFor(c.uid) }}>
                      보내기
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* 보물 창고 */}
        <div className="panel p-3 mb-3">
          <div className="font-bold text-cocoa text-sm mb-2">💎 보물 창고</div>
          {treasureList.length === 0 ? (
            <p className="text-xs text-cocoa/45 text-center py-3">아직 모은 보물이 없어요</p>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {treasureList.map(([id, n]) => (
                <div key={id} className="rounded-xl bg-cozy/40 p-2 flex flex-col items-center relative">
                  <span className="text-2xl">{TRE[id]?.emoji}</span>
                  <span className="text-[8px] text-cocoa/55 truncate w-full text-center">{TRE[id]?.name}</span>
                  <span className="absolute -top-1 -right-1 chip bg-crust text-white text-[9px] px-1.5 py-0">{n}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 엽서 도감 */}
        <div className="panel p-3">
          <div className="font-bold text-cocoa text-sm mb-2">📮 엽서 도감 ({postcards.length}/{POSTCARDS.length})</div>
          <div className="grid grid-cols-2 gap-2">
            {POSTCARDS.map((p) => {
              const has = postcards.includes(p.id)
              return (
                <div key={p.id} className={`rounded-2xl p-3 border ${has ? 'bg-white border-crust/15' : 'bg-black/5 border-transparent'}`}>
                  <div className={`text-2xl text-center mb-1 ${has ? '' : 'grayscale opacity-30'}`}>{has ? p.scene : '❔❔❔'}</div>
                  <div className={`text-[11px] font-bold text-center ${has ? 'text-cocoa' : 'text-cocoa/30'}`}>{has ? p.name : '미발견'}</div>
                  {has && <div className="text-[9px] text-cocoa/45 text-center">{p.desc}</div>}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 보낼 시간 선택 */}
      <Modal open={!!sendFor} onClose={() => setSendFor(null)} title="🎒 어디까지 다녀올까요?">
        <div className="grid gap-2">
          {OUTING_DURATIONS.map((d) => (
            <button key={d.id} onClick={() => { play('meow'); sendOuting(sendFor, d.id); setSendFor(null) }}
              className="panel p-3 flex items-center justify-between active:scale-95 transition">
              <div className="text-left">
                <div className="font-bold text-cocoa">{d.label}</div>
                <div className="text-[11px] text-cocoa/50">{d.minutes}분 · 보상 ×{d.rewardMul}</div>
              </div>
              <span className="text-2xl">{d.id === 'short' ? '🏘️' : d.id === 'mid' ? '🌳' : '🏔️'}</span>
            </button>
          ))}
        </div>
      </Modal>

      {/* 외출 결과 */}
      <Modal open={!!reward} onClose={() => setReward(null)} title="🎁 다녀왔어요!">
        {reward && (
          <div className="text-center">
            <div className="text-5xl mb-2 animate-floaty">😺</div>
            <p className="text-sm text-cocoa/60 mb-3">바깥에서 선물을 물어왔어요!</p>
            <div className="flex justify-center gap-2 flex-wrap mb-3">
              {reward.treasures.map((t, i) => (
                <div key={i} className="rounded-xl bg-cozy/40 p-2.5 flex flex-col items-center gap-0.5 animate-pop">
                  <span className="text-3xl">{t.emoji}</span>
                  <span className="text-[10px] font-bold text-cocoa">{t.name}</span>
                  <RarityTag rarity={t.rarity} />
                </div>
              ))}
            </div>
            {reward.postcard && (
              <div className="rounded-2xl bg-white border border-crust/15 p-3 mb-3">
                <div className="text-3xl mb-1">{reward.postcard.scene}</div>
                <div className="text-xs font-bold text-cocoa">📮 새 엽서: {reward.postcard.name}</div>
                <div className="text-[10px] text-cocoa/45">{reward.postcard.desc}</div>
              </div>
            )}
            <button className="btn-primary w-full" onClick={() => { play('coin'); setReward(null) }}>고마워! 🐾</button>
          </div>
        )}
      </Modal>
    </div>
  )
}
