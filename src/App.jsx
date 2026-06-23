import { useState } from 'react'
import { useGame, WEATHERS, SEASONS } from './state/store'
import { useGameLoop } from './hooks/useGameLoop'
import { Modal, play } from './components/ui'
import TopBar from './components/TopBar'
import BottomNav from './components/BottomNav'
import ToastLayer from './components/ToastLayer'

import RoomScreen from './components/screens/RoomScreen'
import StreetScreen from './components/screens/StreetScreen'
import ShopScreen from './components/screens/ShopScreen'
import GachaScreen from './components/screens/GachaScreen'
import OutingScreen from './components/screens/OutingScreen'
import DexScreen from './components/screens/DexScreen'
import SnsScreen from './components/screens/SnsScreen'
import CommunityScreen from './components/screens/CommunityScreen'
import MinigameScreen from './components/screens/MinigameScreen'
import BmScreen from './components/screens/BmScreen'
import SettingsScreen from './components/screens/SettingsScreen'

const SCREENS = {
  room: RoomScreen,
  street: StreetScreen,
  shop: ShopScreen,
  gacha: GachaScreen,
  outing: OutingScreen,
  dex: DexScreen,
  sns: SnsScreen,
  community: CommunityScreen,
  minigames: MinigameScreen,
  bm: BmScreen,
  settings: SettingsScreen,
}

const MORE_ITEMS = [
  { id: 'dex', emoji: '📖', label: '냥이 도감' },
  { id: 'sns', emoji: '📸', label: '냥스타그램' },
  { id: 'minigames', emoji: '🎮', label: '미니게임' },
  { id: 'community', emoji: '🤝', label: '동네 집사' },
  { id: 'gacha', emoji: '🎁', label: '코스튬 가챠' },
  { id: 'bm', emoji: '💎', label: '프리미엄·후원' },
]

export default function App() {
  const { offline, clearOffline } = useGameLoop()
  const screen = useGame((s) => s.screen)
  const setScreen = useGame((s) => s.setScreen)
  const [moreOpen, setMoreOpen] = useState(false)
  const [weatherOpen, setWeatherOpen] = useState(false)

  const Screen = SCREENS[screen] || RoomScreen

  return (
    <div className="w-full h-full grid place-items-center bg-dusk">
      <div className="app-frame bg-cream shadow-2xl">
        {/* 화면 본문 */}
        <div className="absolute inset-0">
          <Screen />
        </div>

        <TopBar onWeather={() => setWeatherOpen(true)} />
        <ToastLayer />
        <BottomNav onMore={() => { play(); setMoreOpen(true) }} />

        {/* 더보기 메뉴 */}
        <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="✨ 더보기">
          <div className="grid grid-cols-3 gap-3">
            {MORE_ITEMS.map((m) => (
              <button
                key={m.id}
                onClick={() => { play(); setScreen(m.id); setMoreOpen(false) }}
                className="rounded-2xl bg-cozy/50 hover:bg-cozy p-4 flex flex-col items-center gap-1 active:scale-95 transition"
              >
                <span className="text-3xl">{m.emoji}</span>
                <span className="text-xs font-bold text-cocoa">{m.label}</span>
              </button>
            ))}
          </div>
        </Modal>

        {/* 날씨 정보 */}
        <WeatherModal open={weatherOpen} onClose={() => setWeatherOpen(false)} />

        {/* 오프라인 정산 */}
        <Modal open={!!offline} onClose={clearOffline} title="🌙 다녀오셨어요?">
          {offline && (
            <div className="text-center py-2">
              <div className="text-5xl mb-3 animate-floaty">😻</div>
              <p className="text-cocoa/70 mb-1">집을 비운 사이 고양이들이</p>
              <p className="text-cocoa/70 mb-4">방치형 수익을 모아뒀어요!</p>
              <div className="text-3xl font-bold text-heartpink mb-1">❤️ +{offline.earned.toLocaleString()}</div>
              <div className="text-xs text-cocoa/40 mb-4">약 {offline.hours.toFixed(1)}시간 동안</div>
              <button className="btn-primary w-full" onClick={() => { play('coin'); clearOffline() }}>
                받기
              </button>
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}

function WeatherModal({ open, onClose }) {
  const weather = useGame((s) => s.weather)
  const season = useGame((s) => s.season)
  const locked = useGame((s) => s.weatherLocked)
  const toggleLock = useGame((s) => s.toggleWeatherLock)
  const w = WEATHERS[weather] || WEATHERS.sunny
  const se = SEASONS[season] || SEASONS.spring
  return (
    <Modal open={open} onClose={onClose} title="오늘의 골목길">
      <div className="text-center py-2">
        <div className="text-6xl mb-2">{w.emoji}</div>
        <div className="text-xl font-bold text-cocoa mb-1">{w.label}</div>
        <p className="text-sm text-cocoa/60 mb-4">{w.desc}</p>
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="chip bg-cozy text-cocoa">{se.emoji} {se.label}</span>
          <span className="chip bg-mint/60 text-cocoa">🎀 {se.theme} 시즌</span>
        </div>
        <button
          className={`btn w-full ${locked ? 'bg-crust text-white' : 'btn-ghost'}`}
          onClick={() => { play(); toggleLock() }}
        >
          {locked ? '🔒 날씨 고정됨 (실시간 동기화 끔)' : '🔓 실시간 날씨 동기화 중'}
        </button>
        <p className="text-[11px] text-cocoa/40 mt-2">실제 계절·시간에 맞춰 날씨가 바뀌어요</p>
      </div>
    </Modal>
  )
}
