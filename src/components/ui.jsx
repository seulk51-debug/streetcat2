// 공용 UI 프리미티브 — 화면 전반에서 재사용.
import { useEffect } from 'react'
import { sfx, unlockAudio } from '../audio/sound'
import { useGame } from '../state/store'

// 화면 우측 확대/축소 버튼 (Phaser 카메라 줌 명령)
export function ZoomControls({ className = '' }) {
  const cameraZoom = useGame((s) => s.cameraZoom)
  const tap = (action) => () => { play(); cameraZoom(action) }
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <button onClick={tap('in')} className="w-9 h-9 rounded-full bg-white/85 shadow-md text-cocoa text-xl font-bold grid place-items-center active:scale-90 transition">＋</button>
      <button onClick={tap('out')} className="w-9 h-9 rounded-full bg-white/85 shadow-md text-cocoa text-xl font-bold grid place-items-center active:scale-90 transition">－</button>
      <button onClick={tap('reset')} className="w-9 h-9 rounded-full bg-white/70 shadow-md text-cocoa/55 text-[10px] font-bold grid place-items-center active:scale-90 transition">1:1</button>
    </div>
  )
}

export function play(name = 'click') {
  unlockAudio()
  if (sfx[name]) sfx[name]()
}

export function Bar({ value, max = 100, color = '#F5849B', track = '#00000014', height = 8, className = '' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className={`w-full rounded-full overflow-hidden ${className}`} style={{ background: track, height }}>
      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export function Chip({ children, className = '', ...rest }) {
  return (
    <span className={`chip ${className}`} {...rest}>
      {children}
    </span>
  )
}

// 모달/시트
export function Modal({ open, onClose, children, title, maxW = 'max-w-[400px]' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-black/40 backdrop-blur-sm animate-[pop_0.2s_ease-out]"
      onClick={() => onClose && onClose()}
    >
      <div
        className={`panel w-full ${maxW} max-h-[86vh] overflow-y-auto no-scrollbar p-4 animate-pop`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-cocoa">{title}</h2>
            {onClose && (
              <button className="text-cocoa/60 text-2xl leading-none px-2" onClick={() => { play(); onClose() }}>
                ×
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export function SectionTitle({ emoji, children, hint }) {
  return (
    <div className="flex items-baseline gap-2 mb-2 mt-1">
      <h3 className="text-base font-bold text-cocoa">
        {emoji} {children}
      </h3>
      {hint && <span className="text-xs text-cocoa/50">{hint}</span>}
    </div>
  )
}

const CUR = {
  heart: { emoji: '❤️', color: 'text-heartpink' },
  eco: { emoji: '🍃', color: 'text-ecogreen' },
  churu: { emoji: '🍗', color: 'text-gold' },
}

export function Price({ currency, price }) {
  const c = CUR[currency] || CUR.heart
  return (
    <span className={`inline-flex items-center gap-1 font-bold ${c.color}`}>
      {c.emoji} {price}
    </span>
  )
}

// 상점/아이템 카드
export function ItemCard({ emoji, name, desc, right, onClick, disabled, badge, accent = '#F4D9A0' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative text-left rounded-2xl bg-white/80 border border-crust/15 p-3 flex gap-3 items-center shadow-sm active:scale-[0.98] transition disabled:opacity-50 disabled:active:scale-100`}
    >
      <div
        className="shrink-0 w-12 h-12 rounded-xl grid place-items-center text-2xl"
        style={{ background: accent + '55' }}
      >
        {emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-cocoa truncate">{name}</div>
        {desc && <div className="text-xs text-cocoa/55 leading-tight line-clamp-2">{desc}</div>}
      </div>
      {right && <div className="shrink-0 text-right">{right}</div>}
      {badge && (
        <span className="absolute -top-1.5 -right-1.5 chip bg-heartpink text-white text-[10px] px-2 py-0.5">{badge}</span>
      )}
    </button>
  )
}

export const RARITY_LABEL = {
  common: { label: '일반', color: '#9AA0A6' },
  rare: { label: '레어', color: '#5BA8E8' },
  epic: { label: '에픽', color: '#A872E8' },
  legendary: { label: '전설', color: '#F2B441' },
}

export function RarityTag({ rarity }) {
  const r = RARITY_LABEL[rarity] || RARITY_LABEL.common
  return (
    <span className="chip text-white text-[11px] px-2 py-0.5" style={{ background: r.color }}>
      {r.label}
    </span>
  )
}

export function EmptyHint({ emoji = '🐾', children }) {
  return (
    <div className="py-10 text-center text-cocoa/45">
      <div className="text-4xl mb-2">{emoji}</div>
      <div className="text-sm">{children}</div>
    </div>
  )
}
