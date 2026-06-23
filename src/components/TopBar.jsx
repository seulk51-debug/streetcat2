import { useGame, WEATHERS, SEASONS } from '../state/store'
import { play } from './ui'

export default function TopBar({ onWeather }) {
  const hearts = useGame((s) => Math.floor(s.hearts))
  const eco = useGame((s) => s.ecoPoints)
  const churu = useGame((s) => s.goldenChuru)
  const weather = useGame((s) => s.weather)
  const season = useGame((s) => s.season)
  const setScreen = useGame((s) => s.setScreen)
  const donationOwned = useGame((s) => s.donationOwned)

  const w = WEATHERS[weather] || WEATHERS.sunny
  const se = SEASONS[season] || SEASONS.spring

  const Cur = ({ emoji, value, color }) => (
    <div className="flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 shadow-sm">
      <span className="text-sm">{emoji}</span>
      <span className="font-bold text-sm tabular-nums" style={{ color }}>
        {value.toLocaleString()}
      </span>
    </div>
  )

  return (
    <div className="absolute top-0 inset-x-0 z-30 px-3 pt-3 pb-2 pointer-events-none">
      <div className="flex items-center gap-1.5 pointer-events-auto">
        <Cur emoji="❤️" value={hearts} color="#E5566F" />
        <Cur emoji="🍃" value={eco} color="#4FA85C" />
        <Cur emoji="🍗" value={churu} color="#D99A1F" />
        <div className="flex-1" />
        {donationOwned && <span title="기부 천사" className="text-lg drop-shadow">😇</span>}
        <button
          onClick={() => { play(); onWeather() }}
          className="flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 shadow-sm pointer-events-auto active:scale-95 transition"
        >
          <span>{w.emoji}</span>
          <span className="text-xs font-bold text-cocoa/70">{se.emoji}</span>
        </button>
        <button
          onClick={() => { play(); setScreen('settings') }}
          className="rounded-full bg-white/85 w-8 h-8 grid place-items-center shadow-sm pointer-events-auto active:scale-95 transition"
        >
          ⚙️
        </button>
      </div>
    </div>
  )
}
