import { useState } from 'react'
import { useGame } from '../../state/store'
import { Modal, RarityTag, RARITY_LABEL, play } from '../ui'

export default function AdoptModal({ cat, onClose }) {
  const adoptCat = useGame((s) => s.adoptCat)
  const setScreen = useGame((s) => s.setScreen)
  const [name, setName] = useState(cat?.baseName || '')
  const [cert, setCert] = useState(null)

  if (!cat) return null

  const confirm = () => {
    const owned = adoptCat(cat.uid, name)
    if (owned) {
      play('success')
      setCert(owned.certificate)
    }
  }

  return (
    <Modal open={!!cat} onClose={onClose} title={cert ? null : '🏠 입양하기'}>
      {!cert ? (
        <div className="text-center">
          <div className="w-24 h-24 mx-auto rounded-3xl grid place-items-center text-6xl mb-3 animate-floaty" style={{ background: cat.color + '55' }}>
            {cat.emoji}
          </div>
          <RarityTag rarity={cat.rarity} />
          <p className="text-sm text-cocoa/70 mt-3 mb-1">이 아이를 따뜻한 집으로 데려갈까요?</p>
          <p className="text-xs text-cocoa/45 mb-3">입양 후엔 사랑을 듬뿍 주면 점점 뽀송해져요</p>
          <label className="block text-left text-xs font-bold text-cocoa/60 mb-1">이름 지어주기</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={8}
            placeholder={cat.baseName}
            className="w-full rounded-xl border border-crust/30 px-3 py-2 mb-3 text-cocoa font-bold focus:outline-none focus:border-crust"
          />
          <button className="btn-primary w-full" onClick={confirm}>
            💛 입양 증서 발급
          </button>
        </div>
      ) : (
        <Certificate cert={cert} emoji={cat.emoji} color={cat.color} onClose={() => { onClose(); setScreen('room') }} />
      )}
    </Modal>
  )
}

function Certificate({ cert, emoji, color, onClose }) {
  return (
    <div className="text-center animate-pop">
      <div className="rounded-3xl border-2 border-dashed border-crust/40 bg-gradient-to-b from-cream to-cozy/40 p-4 mb-3">
        <div className="text-xs font-bold tracking-widest text-crust mb-2">🐾 입 양 증 서 🐾</div>
        <div className="w-20 h-20 mx-auto rounded-2xl grid place-items-center text-5xl mb-2" style={{ background: color + '55' }}>
          {emoji}
        </div>
        <div className="text-2xl font-bold text-cocoa mb-3">{cert.name}</div>
        <div className="text-sm text-cocoa/70 space-y-1">
          <Row k="추정 나이" v={cert.ageGuess} />
          <Row k="성격" v={cert.personality} />
          <Row k="희귀도" v={RARITY_LABEL[cert.rarity]?.label} />
          <Row k="입양일" v={cert.date} />
        </div>
        <div className="text-[11px] text-cocoa/45 mt-3 leading-relaxed">
          이 아이가 행복하게 살 수 있도록<br />사랑으로 보살필 것을 약속합니다.
        </div>
      </div>
      <button className="btn-primary w-full" onClick={() => { play('coin'); onClose() }}>
        우리집으로 데려가기 🏠
      </button>
    </div>
  )
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between px-4">
      <span className="text-cocoa/45">{k}</span>
      <span className="font-bold">{v}</span>
    </div>
  )
}
