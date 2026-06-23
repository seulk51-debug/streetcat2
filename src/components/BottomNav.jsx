import { useGame } from '../state/store'
import { play } from './ui'

const TABS = [
  { id: 'room', label: '우리집', emoji: '🏠' },
  { id: 'street', label: '길거리', emoji: '🌃' },
  { id: 'outing', label: '외출', emoji: '🎒' },
  { id: 'shop', label: '상점', emoji: '🛒' },
  { id: 'more', label: '더보기', emoji: '✨' },
]

export default function BottomNav({ onMore }) {
  const screen = useGame((s) => s.screen)
  const setScreen = useGame((s) => s.setScreen)
  const streetCount = useGame((s) => s.streetCats.length)

  return (
    <div className="absolute bottom-0 inset-x-0 z-30 px-2 pb-2 pt-1">
      <div className="panel flex items-stretch justify-around px-1 py-1.5 shadow-2xl">
        {TABS.map((t) => {
          const active = t.id === 'more' ? false : screen === t.id
          return (
            <button
              key={t.id}
              onClick={() => {
                play()
                if (t.id === 'more') onMore()
                else setScreen(t.id)
              }}
              className={`relative flex-1 flex flex-col items-center gap-0.5 py-1 rounded-xl transition ${
                active ? 'bg-toast/70' : 'active:bg-cozy/40'
              }`}
            >
              <span className={`text-xl transition-transform ${active ? 'scale-110' : ''}`}>{t.emoji}</span>
              <span className={`text-[10px] font-bold ${active ? 'text-cocoa' : 'text-cocoa/55'}`}>{t.label}</span>
              {t.id === 'street' && streetCount > 0 && (
                <span className="absolute top-0 right-2 w-4 h-4 grid place-items-center rounded-full bg-heartpink text-white text-[9px] font-bold">
                  {streetCount}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
