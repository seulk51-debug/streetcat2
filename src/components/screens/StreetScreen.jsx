import { useState, useCallback } from 'react'
import { useGame, PERSONALITIES } from '../../state/store'
import { SNACKS } from '../../data/cats'
import { STREET_ZONES, FEEDER_UPGRADES, WEATHERS } from '../../data/world'
import { Bar, Modal, RarityTag, play, ZoomControls } from '../ui'
import PhaserGame from '../../game/PhaserGame'
import StreetScene from '../../game/scenes/StreetScene'
import TimingBar from '../TimingBar'
import AdoptModal from '../modals/AdoptModal'

export default function StreetScreen() {
  const streetCats = useGame((s) => s.streetCats)
  const bait = useGame((s) => s.streetBait)
  const toggleBait = useGame((s) => s.toggleBait)
  const currentZone = useGame((s) => s.currentZone)
  const unlockedZones = useGame((s) => s.unlockedZones)
  const setZone = useGame((s) => s.setZone)
  const unlockZone = useGame((s) => s.unlockZone)
  const feederLevel = useGame((s) => s.feederLevel)
  const upgradeFeeder = useGame((s) => s.upgradeFeeder)
  const trySpawn = useGame((s) => s.trySpawnStreetCat)
  const weather = useGame((s) => s.weather)

  const [selected, setSelected] = useState(null) // 탭한 길고양이 uid
  const [snackFor, setSnackFor] = useState(null)
  const [eyeFor, setEyeFor] = useState(null)
  const [adopt, setAdopt] = useState(null)

  const feeder = FEEDER_UPGRADES[feederLevel - 1] || FEEDER_UPGRADES[0]
  const nextFeeder = FEEDER_UPGRADES[feederLevel]
  const baitOn = Object.values(bait).some(Boolean)
  const w = WEATHERS[weather]

  // Phaser 씬이 고양이 탭 시 호출 (마운트 시점 1회 캡처 — setSelected 는 안정적)
  const onSelectCat = useCallback((uid) => setSelected(uid), [])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* 야경 배경 (Phaser 캔버스는 투명 → 이 그라데이션이 비침) */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg,#2b2540 0%,#3a3354 45%,#4a4566 100%)' }} />
      <div className="absolute inset-0 opacity-40 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(2px 2px at 20% 18%,#fff,transparent),radial-gradient(1px 1px at 70% 12%,#fff,transparent),radial-gradient(1.5px 1.5px at 45% 8%,#fff,transparent),radial-gradient(1px 1px at 85% 22%,#fff,transparent)' }} />

      {/* 살아있는 골목 — 고양이가 걸어 들어와 배회 */}
      <PhaserGame scenes={[StreetScene]} active="StreetScene" data={{ onSelect: onSelectCat }} className="absolute inset-0" />

      {/* 확대/축소 버튼 */}
      <ZoomControls className="absolute right-2 top-[46%] z-20 pointer-events-auto" />

      {/* ── 상단 오버레이: 구역 + 급식소 ── */}
      <div className="absolute top-14 inset-x-0 px-3 z-20 pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-white font-bold text-base drop-shadow mb-0.5">🌃 길거리 탐색</h1>
          <p className="text-white/60 text-[11px] mb-2">{w?.emoji} {w?.desc}</p>
        </div>

        {/* 구역 선택 */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-2 pointer-events-auto">
          {STREET_ZONES.map((z) => {
            const unlocked = unlockedZones.includes(z.id)
            const active = currentZone === z.id
            return (
              <button
                key={z.id}
                onClick={() => { play(); unlocked ? setZone(z.id) : unlockZone(z.id) }}
                className={`shrink-0 chip text-xs ${active ? 'bg-toast text-cocoa' : unlocked ? 'bg-white/25 text-white' : 'bg-white/10 text-white/50'}`}
              >
                {z.emoji} {z.name} {!unlocked && `🔒${z.ecoCost}🍃`}
              </button>
            )
          })}
        </div>

        {/* 급식소 + 미끼 */}
        <div className="panel p-2.5 pointer-events-auto">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[13px] font-bold text-cocoa">🍚 {feeder.name} (Lv.{feederLevel})</span>
            {nextFeeder ? (
              <button className="btn-eco text-[11px] px-2.5 py-1" onClick={() => { play('coin'); upgradeFeeder() }}>
                업글 🍃{nextFeeder.ecoCost}
              </button>
            ) : (
              <span className="chip bg-mint/50 text-cocoa text-[11px]">MAX</span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <BaitToggle emoji="🥫" label="사료" on={bait.food} onClick={() => { play(); toggleBait('food') }} />
            <BaitToggle emoji="💧" label="물" on={bait.water} onClick={() => { play(); toggleBait('water') }} />
            <BaitToggle emoji="🍤" label="간식" on={bait.snack} onClick={() => { play(); toggleBait('snack') }} />
          </div>
          <button
            className="btn-primary w-full mt-2 text-sm"
            onClick={() => { play('meow'); trySpawn(true) }}
          >
            👀 주변 살펴보기
          </button>
        </div>
      </div>

      {/* ── 빈 골목 안내 ── */}
      {streetCats.length === 0 && (
        <div className="absolute inset-x-0 bottom-[120px] grid place-items-center z-10 pointer-events-none px-8">
          <div className="panel px-4 py-3 text-center animate-floaty">
            <div className="text-3xl mb-1">{baitOn ? '🐾' : '🍽️'}</div>
            <p className="text-cocoa/70 text-xs whitespace-pre-line">
              {baitOn
                ? '냐옹~ 고양이가 골목에 나타나길 기다려요\n(잠시 후 또는 "주변 살펴보기")'
                : '먼저 밥이나 간식을 놓아두세요'}
            </p>
          </div>
        </div>
      )}

      {/* ── 선택한 고양이 액션 시트 ── */}
      {selected && (
        <StreetCatSheet
          catUid={selected}
          onClose={() => setSelected(null)}
          onSnack={() => { play(); setSnackFor(selected) }}
          onEye={() => { play(); setEyeFor(selected) }}
          onAdopt={(snap) => { play(); setAdopt(snap); setSelected(null) }}
        />
      )}

      {/* 간식 / 눈인사 / 입양 모달 */}
      <SnackModal catUid={snackFor} onClose={() => setSnackFor(null)} />
      <EyeModal catUid={eyeFor} onClose={() => setEyeFor(null)} />
      {/* 입양 성공 시 길거리 목록에서 제거되므로 클릭 시점 스냅샷을 그대로 전달 */}
      {adopt && <AdoptModal cat={adopt} onClose={() => setAdopt(null)} />}
    </div>
  )
}

// 탭한 고양이의 하단 액션 시트 (호감도 라이브 반영)
function StreetCatSheet({ catUid, onClose, onSnack, onEye, onAdopt }) {
  const cat = useGame((s) => s.streetCats.find((c) => c.uid === catUid))
  if (!cat) return null
  const per = PERSONALITIES[cat.personality]
  const revealFav = cat.affinity >= 30
  const ready = cat.affinity >= 100

  return (
    <div className="absolute bottom-[78px] inset-x-0 px-3 z-30">
      <div className="panel p-3 shadow-2xl animate-slideUp">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl grid place-items-center text-3xl shrink-0 relative" style={{ background: cat.color + '55' }}>
            {cat.emoji}
            {cat.weatherOnly && <span className="absolute -top-1 -right-1 text-sm">{cat.weatherOnly === 'rain' ? '☔' : '❄️'}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-cocoa truncate">{cat.affinity > 0 ? cat.baseName : '???'}</span>
              <RarityTag rarity={cat.rarity} />
            </div>
            <div className="text-[11px] text-cocoa/50">{per?.label} · {per?.desc}</div>
            <div className="text-[11px] text-cocoa/50">
              최애 간식: {revealFav ? <b className="text-crust">{cat.favoriteSnack}</b> : '??? (더 친해지면)'}
            </div>
          </div>
          <button onClick={onClose} className="shrink-0 w-7 h-7 rounded-full bg-black/10 text-cocoa/60 grid place-items-center active:scale-90">✕</button>
        </div>

        <div className="mt-2">
          <div className="flex justify-between text-[11px] text-cocoa/55 mb-0.5">
            <span>💗 호감도</span>
            <span className="tabular-nums">{Math.round(cat.affinity)}%</span>
          </div>
          <Bar value={cat.affinity} color="#F5849B" />
        </div>

        <div className="grid grid-cols-3 gap-2 mt-2.5">
          <button className="btn-ghost text-xs py-2" onClick={onSnack} disabled={ready}>🍤 간식</button>
          <button className="btn-ghost text-xs py-2" onClick={onEye} disabled={ready}>👀 눈인사</button>
          <button
            className={`text-xs py-2 btn ${ready ? 'bg-heartpink text-white animate-pulse' : 'bg-black/10 text-cocoa/40'}`}
            onClick={ready ? () => onAdopt(cat) : undefined}
            disabled={!ready}
          >
            🏠 입양
          </button>
        </div>
      </div>
    </div>
  )
}

function BaitToggle({ emoji, label, on, onClick }) {
  return (
    <button onClick={onClick} className={`rounded-xl py-1.5 flex flex-col items-center gap-0.5 border transition active:scale-95 ${on ? 'bg-toast border-crust' : 'bg-white/60 border-crust/15'}`}>
      <span className="text-lg">{emoji}</span>
      <span className="text-[10px] font-bold text-cocoa/70">{label} {on ? '✓' : ''}</span>
    </button>
  )
}

function SnackModal({ catUid, onClose }) {
  const feedSnack = useGame((s) => s.feedSnack)
  const toast = useGame((s) => s.toast)
  const cat = useGame((s) => s.streetCats.find((c) => c.uid === catUid))
  if (!catUid || !cat) return null
  const give = (snack) => {
    const gain = feedSnack(catUid, snack)
    const fav = snack === cat.favoriteSnack
    play(fav ? 'success' : 'pop')
    toast(fav ? `최애 간식! 호감도 +${gain} 😻` : `호감도 +${gain}`, fav ? '💖' : '🍤')
  }
  return (
    <Modal open={!!catUid} onClose={onClose} title="🍤 간식 주기">
      <p className="text-xs text-cocoa/55 mb-3">최애 간식을 주면 호감도가 쑥쑥 올라요!</p>
      <div className="grid grid-cols-3 gap-2">
        {SNACKS.map((s) => (
          <button key={s} onClick={() => give(s)} className="rounded-xl bg-cozy/50 hover:bg-cozy py-3 flex flex-col items-center gap-1 active:scale-95 transition">
            <span className="text-2xl">🍖</span>
            <span className="text-[11px] font-bold text-cocoa/70">{s}</span>
          </button>
        ))}
      </div>
    </Modal>
  )
}

function EyeModal({ catUid, onClose }) {
  const eyeContact = useGame((s) => s.eyeContact)
  const toast = useGame((s) => s.toast)
  if (!catUid) return null
  return (
    <Modal open={!!catUid} onClose={onClose} title="👀 눈인사">
      <p className="text-xs text-cocoa/55 mb-1">고양이와 눈이 마주치는 순간! 한가운데에서 멈춰보세요.</p>
      <p className="text-[11px] text-cocoa/40 mb-3">천천히 깜빡이면 “난 너를 해치지 않아”라는 뜻이래요 🐈</p>
      <TimingBar
        target={0.2}
        speed={1.0}
        label="👁️ 지금 눈맞춤!"
        onResult={(ok) => {
          const gain = eyeContact(catUid, ok)
          toast(ok ? `눈맞춤 성공! 호감도 +${gain}` : `살짝 경계하네요… +${gain}`, ok ? '😻' : '🙀')
          onClose()
        }}
      />
    </Modal>
  )
}
