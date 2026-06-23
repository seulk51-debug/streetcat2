import { useState } from 'react'
import { useGame, PERSONALITIES } from '../../state/store'
import { CAT_ROSTER } from '../../data/cats'
import { WEATHERS } from '../../data/world'
import { Modal, RarityTag, play } from '../ui'

export default function DexScreen() {
  const seen = useGame((s) => s.seenRosterIds)
  const adopted = useGame((s) => s.adoptedRosterIds)
  const ownedCats = useGame((s) => s.ownedCats)
  const [sel, setSel] = useState(null)

  const total = CAT_ROSTER.length

  return (
    <div className="absolute inset-0 overflow-y-auto no-scrollbar bg-cream">
      <div className="pt-16 pb-24 px-3">
        <h1 className="text-cocoa font-bold text-lg mb-1">📖 냥이 도감</h1>
        <p className="text-cocoa/55 text-xs mb-3">
          발견 {seen.length}/{total} · 입양 {adopted.length}/{total} — 친해질수록 숨겨진 사연이 풀려요
        </p>
        <div className="grid grid-cols-3 gap-2">
          {CAT_ROSTER.map((c) => {
            const isSeen = seen.includes(c.id)
            const isAdopted = adopted.includes(c.id)
            return (
              <button key={c.id} onClick={() => { play(); if (isSeen) setSel(c) }}
                className={`rounded-2xl p-2 flex flex-col items-center gap-1 border transition active:scale-95 ${isAdopted ? 'bg-white border-crust/20' : isSeen ? 'bg-cozy/30 border-crust/10' : 'bg-black/5 border-transparent'}`}>
                <div className="w-12 h-12 rounded-xl grid place-items-center text-3xl" style={{ background: isSeen ? c.color + '55' : '#00000010' }}>
                  {isSeen ? c.emoji : '❔'}
                </div>
                <span className={`text-[10px] font-bold ${isSeen ? 'text-cocoa' : 'text-cocoa/30'}`}>{isSeen ? c.baseName : '???'}</span>
                {isAdopted ? <span className="text-[8px] text-ecogreen font-bold">😻 가족</span> : isSeen ? <span className="text-[8px] text-cocoa/40">발견</span> : <span className="text-[8px] text-cocoa/25">미발견</span>}
              </button>
            )
          })}
        </div>
      </div>

      <Modal open={!!sel} onClose={() => setSel(null)} title={null}>
        {sel && <DexDetail cat={sel} adopted={adopted.includes(sel.id)} count={ownedCats.filter((c) => c.rosterId === sel.id).length} />}
      </Modal>
    </div>
  )
}

function DexDetail({ cat, adopted, count }) {
  const per = PERSONALITIES[cat.personality]
  const w = WEATHERS[cat.weather]
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-16 h-16 rounded-2xl grid place-items-center text-4xl" style={{ background: cat.color + '55' }}>{cat.emoji}</div>
        <div>
          <div className="flex items-center gap-2"><h2 className="text-xl font-bold text-cocoa">{cat.baseName}</h2><RarityTag rarity={cat.rarity} /></div>
          <div className="text-xs text-cocoa/55">{cat.ageGuess} · {per?.label}</div>
          {adopted && <div className="text-[11px] text-ecogreen font-bold">우리집에 {count}마리 함께 살아요 😻</div>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <Info k="성격" v={per?.desc} />
        <Info k="최애 간식" v={cat.favoriteSnack} />
        {cat.weather !== 'any' && <Info k="출몰 날씨" v={`${w?.emoji} ${w?.label}일 때만`} />}
      </div>
      <div className="rounded-2xl bg-milk border border-crust/15 p-3">
        <div className="text-sm font-bold text-cocoa mb-2">💭 묘생역전 이야기</div>
        {adopted ? (
          <div className="space-y-1.5">
            {cat.diary.map((d, i) => (
              <p key={i} className="text-sm text-cocoa/75 leading-snug">“{d}”</p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-cocoa/45 text-center py-2">구조해서 입양하면<br />이 아이의 가슴 아픈 사연이 공개돼요</p>
        )}
      </div>
    </div>
  )
}

function Info({ k, v }) {
  return (
    <div className="rounded-xl bg-cozy/30 px-3 py-2">
      <div className="text-[10px] text-cocoa/45">{k}</div>
      <div className="font-bold text-cocoa">{v}</div>
    </div>
  )
}
