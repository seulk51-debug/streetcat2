import { useState } from 'react'
import { useGame } from '../../state/store'
import { CONSUMABLES, FURNITURE, INTERIORS, LUXURY, SPACES } from '../../data/shop'
import { ItemCard, Price, SectionTitle, play } from '../ui'

const TABS = [
  { id: 'consum', label: '생필품', emoji: '🥫' },
  { id: 'furn', label: '가구·장난감', emoji: '🗼' },
  { id: 'interior', label: '인테리어', emoji: '🖼️' },
  { id: 'lux', label: '초호화', emoji: '🛸' },
  { id: 'space', label: '공간확장', emoji: '🏡' },
]

export default function ShopScreen() {
  const [tab, setTab] = useState('consum')
  const hearts = useGame((s) => s.hearts)
  const eco = useGame((s) => s.ecoPoints)
  const churu = useGame((s) => s.goldenChuru)
  const afford = (cur, price) => (cur === 'eco' ? eco : cur === 'churu' ? churu : hearts) >= price

  const buyConsumable = useGame((s) => s.buyConsumable)
  const buyFurniture = useGame((s) => s.buyFurniture)
  const placed = useGame((s) => s.placedFurniture)

  return (
    <div className="absolute inset-0 overflow-y-auto no-scrollbar bg-cream">
      <div className="pt-16 pb-24 px-3">
        <h1 className="text-cocoa font-bold text-lg mb-2">🛒 포인트 상점</h1>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-3 sticky top-0 z-10 -mx-3 px-3 py-1 bg-cream/90 backdrop-blur">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => { play(); setTab(t.id) }}
              className={`shrink-0 chip text-xs ${tab === t.id ? 'bg-toast text-cocoa' : 'bg-white/70 text-cocoa/55'}`}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {tab === 'consum' && (
          <div className="grid gap-2">
            <p className="text-xs text-cocoa/50 mb-1">정기적으로 갈아주지 않으면 고양이가 슬퍼해요</p>
            {CONSUMABLES.map((it) => (
              <ItemCard key={it.id} emoji={it.emoji} name={`${it.name} ×${it.amount}`} desc={it.desc}
                accent="#F4D9A0" disabled={!afford(it.currency, it.price)}
                right={<Price currency={it.currency} price={it.price} />}
                onClick={() => { play('coin'); buyConsumable(it.id) }} />
            ))}
          </div>
        )}

        {tab === 'furn' && (
          <div className="grid gap-2">
            <p className="text-xs text-cocoa/50 mb-1">설치하면 고양이가 특수 모션으로 놀고, 방치 수익이 쌓여요</p>
            {FURNITURE.map((it) => (
              <ItemCard key={it.id} emoji={it.emoji} name={it.name} desc={it.desc} accent="#BFE3D0"
                disabled={!afford(it.currency, it.price)}
                badge={placed.some((p) => p.itemId === it.id) ? '보유' : null}
                right={<div className="text-right"><Price currency={it.currency} price={it.price} /><div className="text-[10px] text-heartpink font-bold">❤️ +{it.idle}/h</div></div>}
                onClick={() => { play('coin'); buyFurniture(it.id) }} />
            ))}
          </div>
        )}

        {tab === 'interior' && (
          <div className="grid gap-2">
            <p className="text-xs text-cocoa/50 mb-1">벽지·바닥은 구매 즉시 방에 적용돼요</p>
            {INTERIORS.map((it) => (
              <ItemCard key={it.id} emoji={it.emoji} name={it.name} desc={it.desc} accent="#CDE7F0"
                disabled={!afford(it.currency, it.price)}
                right={<Price currency={it.currency} price={it.price} />}
                onClick={() => { play('coin'); buyFurniture(it.id) }} />
            ))}
          </div>
        )}

        {tab === 'lux' && (
          <div className="grid gap-2">
            <div className="rounded-2xl bg-gold/15 border border-gold/30 p-2.5 mb-1 text-xs text-cocoa/70">
              ✨ 황금 츄르 전용 · 움직이는 초호화 가구. 방치 수익이 어마어마해요!
            </div>
            {LUXURY.map((it) => (
              <ItemCard key={it.id} emoji={it.emoji} name={it.name} desc={it.desc} accent="#F2B441"
                disabled={!afford(it.currency, it.price)}
                right={<div className="text-right"><Price currency={it.currency} price={it.price} /><div className="text-[10px] text-heartpink font-bold">❤️ +{it.idle}/h</div></div>}
                onClick={() => { play('coin'); buyFurniture(it.id) }} />
            ))}
          </div>
        )}

        {tab === 'space' && <SpaceTab />}
      </div>
    </div>
  )
}

function SpaceTab() {
  const space = useGame((s) => s.space)
  const unlocked = useGame((s) => s.unlockedSpaces)
  const hearts = useGame((s) => s.hearts)
  const unlockSpace = useGame((s) => s.unlockSpace)
  const ownedCount = useGame((s) => s.ownedCats.length)

  return (
    <div className="grid gap-2.5">
      <SectionTitle emoji="🏡" hint="마을 전체를 고양이 천국으로">공간 확장</SectionTitle>
      {SPACES.map((s, i) => {
        const isUnlocked = unlocked.includes(s.id)
        const isActive = space === s.id
        const prevUnlocked = i === 0 || unlocked.includes(SPACES[i - 1].id)
        const canBuy = !isUnlocked && prevUnlocked && hearts >= s.cost
        return (
          <div key={s.id} className={`panel p-3 ${isActive ? 'ring-2 ring-toast' : ''}`} style={{ background: s.bg + '40' }}>
            <div className="flex items-center gap-3">
              <div className="text-4xl">{s.emoji}</div>
              <div className="flex-1">
                <div className="font-bold text-cocoa">{s.name} {isActive && <span className="chip bg-toast text-cocoa text-[10px] ml-1">현재</span>}</div>
                <div className="text-xs text-cocoa/55">{s.desc}</div>
                <div className="text-[11px] text-cocoa/45">🐈 최대 {s.capacity}마리 {isActive && `· 현재 ${ownedCount}마리`}</div>
              </div>
              <div>
                {isUnlocked ? (
                  <button className={`btn text-xs px-3 py-1.5 ${isActive ? 'bg-black/10 text-cocoa/40' : 'btn-ghost'}`}
                    onClick={() => { play(); useGame.getState().setSpace(s.id) }} disabled={isActive}>
                    {isActive ? '선택됨' : '이동'}
                  </button>
                ) : (
                  <button className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50" disabled={!canBuy}
                    onClick={() => { play('coin'); unlockSpace(s.id) }}>
                    {prevUnlocked ? <>❤️{s.cost.toLocaleString()}</> : '🔒'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
