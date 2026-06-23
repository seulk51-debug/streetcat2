import { useState } from 'react'
import { useGame, WEATHERS, SEASONS } from '../../state/store'
import { Modal, play } from '../ui'

export default function SettingsScreen() {
  const soundOn = useGame((s) => s.soundOn)
  const toggleSound = useGame((s) => s.toggleSound)
  const weather = useGame((s) => s.weather)
  const season = useGame((s) => s.season)
  const locked = useGame((s) => s.weatherLocked)
  const setScreen = useGame((s) => s.setScreen)
  const [confirmReset, setConfirmReset] = useState(false)

  const chooseWeather = (w) => {
    play()
    const g = useGame.getState()
    if (!g.weatherLocked) g.toggleWeatherLock()
    g.setWeather(w)
  }

  return (
    <div className="absolute inset-0 overflow-y-auto no-scrollbar bg-cream">
      <div className="pt-16 pb-24 px-3">
        <h1 className="text-cocoa font-bold text-lg mb-3">⚙️ 설정</h1>

        {/* 사운드 */}
        <div className="panel p-3 mb-3 flex items-center justify-between">
          <div>
            <div className="font-bold text-cocoa text-sm">🔊 사운드 (ASMR)</div>
            <div className="text-[11px] text-cocoa/50">골골송·발소리·캔 따는 소리. 이어폰 착용을 추천해요</div>
          </div>
          <button onClick={() => { play(); toggleSound() }}
            className={`w-14 h-8 rounded-full p-1 transition ${soundOn ? 'bg-ecogreen' : 'bg-black/15'}`}>
            <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${soundOn ? 'translate-x-6' : ''}`} />
          </button>
        </div>

        {/* 날씨/시즌 */}
        <div className="panel p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-cocoa text-sm">🌦️ 날씨</div>
            <button onClick={() => { play(); useGame.getState().toggleWeatherLock() }}
              className={`chip text-[11px] ${locked ? 'bg-crust text-white' : 'bg-mint/40 text-cocoa'}`}>
              {locked ? '🔒 수동 고정' : '🔓 실시간 동기화'}
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(WEATHERS).map(([k, w]) => (
              <button key={k} onClick={() => chooseWeather(k)}
                className={`rounded-xl py-2 flex flex-col items-center gap-0.5 border transition active:scale-95 ${weather === k ? 'bg-toast border-crust' : 'bg-white/70 border-crust/15'}`}>
                <span className="text-xl">{w.emoji}</span>
                <span className="text-[10px] font-bold text-cocoa/70">{w.label}</span>
              </button>
            ))}
          </div>
          <div className="text-[11px] text-cocoa/45 mt-2">
            현재 시즌: {SEASONS[season]?.emoji} {SEASONS[season]?.label} — {SEASONS[season]?.theme} 테마
          </div>
        </div>

        {/* 개발자 도구 */}
        <div className="panel p-3 mb-3">
          <div className="font-bold text-cocoa text-sm mb-2">🛠️ 개발자 도구 (데모)</div>
          <button className="btn-gold w-full mb-2 text-sm" onClick={() => { play('coin'); useGame.getState().cheat() }}>
            💰 재화 충전 (+하트5000 +에코1000 +츄르100)
          </button>
          <button className="btn-ghost w-full text-sm text-heartpink" onClick={() => { play(); setConfirmReset(true) }}>
            ♻️ 게임 데이터 초기화
          </button>
        </div>

        {/* 정보 */}
        <div className="text-center text-[11px] text-cocoa/40 leading-relaxed mt-4">
          🍞 식빵 굽는 골목길<br />
          차가운 길바닥에서 따뜻한 이불 위로<br />
          React + Tailwind + Phaser · 힐링 방치형
        </div>

        <button className="btn-primary w-full mt-4" onClick={() => { play(); setScreen('room') }}>🏠 우리집으로 돌아가기</button>
      </div>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="정말 초기화할까요?">
        <p className="text-sm text-cocoa/65 mb-4">입양한 고양이와 모든 진행 상황이 사라져요. 되돌릴 수 없어요.</p>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-ghost" onClick={() => { play(); setConfirmReset(false) }}>취소</button>
          <button className="btn bg-heartpink text-white" onClick={() => { play('fail'); useGame.getState().resetGame(); setConfirmReset(false); setScreen('room') }}>초기화</button>
        </div>
      </Modal>
    </div>
  )
}
