import { useGame } from '../../state/store'
import { FRIENDS, COMMUNITY_FEEDER } from '../../data/world'
import { Bar, play } from '../ui'

export default function CommunityScreen() {
  const helpFriend = useGame((s) => s.helpFriend)
  const contributeFeeder = useGame((s) => s.contributeFeeder)
  const progress = useGame((s) => s.communityFeederProgress)
  const level = useGame((s) => s.communityFeederLevel)
  const setScreen = useGame((s) => s.setScreen)

  const cur = COMMUNITY_FEEDER.levels[level - 1] || COMMUNITY_FEEDER.levels[COMMUNITY_FEEDER.levels.length - 1]
  const maxed = level >= COMMUNITY_FEEDER.levels.length && progress >= cur.goal

  return (
    <div className="absolute inset-0 overflow-y-auto no-scrollbar bg-gradient-to-b from-mint/40 to-cream">
      <div className="pt-16 pb-24 px-3">
        <h1 className="text-cocoa font-bold text-lg mb-1">🤝 동네 집사 연대</h1>
        <p className="text-cocoa/55 text-xs mb-3">경쟁이 아닌, 서로 돕는 따뜻한 교류예요</p>

        {/* 공동 급식소 협동 퀘스트 */}
        <div className="panel p-3 mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-cocoa text-sm">🍚 마을 공동 급식소</span>
            <span className="chip bg-ecogreen/20 text-ecogreen text-[11px]">Lv.{level}</span>
          </div>
          <p className="text-[11px] text-cocoa/50 mb-2">동네 집사들과 힘을 모아 길고양이 대형 급식소를 키워요</p>
          <div className="flex justify-between text-xs text-cocoa/60 mb-0.5">
            <span>진행도</span>
            <span className="tabular-nums">{maxed ? 'MAX' : `${progress} / ${cur.goal}`}</span>
          </div>
          <Bar value={maxed ? 100 : progress} max={maxed ? 100 : cur.goal} color="#7BC47F" />
          {!maxed && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button className="btn-eco text-sm" onClick={() => { play('coin'); contributeFeeder(10) }}>❤️10 기부</button>
              <button className="btn-eco text-sm" onClick={() => { play('coin'); contributeFeeder(50) }}>❤️50 기부</button>
            </div>
          )}
          {!maxed && <p className="text-[10px] text-cocoa/40 mt-1.5 text-center">목표 달성 시 보상 ❤️{cur.reward} 지급!</p>}
        </div>

        {/* 품앗이 */}
        <div className="font-bold text-cocoa text-sm mb-2">🏘️ 이웃 방문 품앗이</div>
        <p className="text-[11px] text-cocoa/50 mb-2">친구 방의 화장실을 치워주거나 물을 갈아주면 서로 하트를 받아요</p>
        <div className="space-y-2 mb-4">
          {FRIENDS.map((f) => (
            <div key={f.id} className="panel p-3 flex items-center gap-3">
              <div className="text-3xl">{f.emoji}</div>
              <div className="flex-1">
                <div className="font-bold text-cocoa text-sm">{f.name}</div>
                <div className="text-[11px] text-cocoa/50">
                  {f.cats.join(' ')} · {f.needs === 'litter' ? '🪣 화장실 청소 필요' : '💧 물 갈아주기 필요'}
                </div>
              </div>
              <button className="btn-primary text-xs px-3 py-1.5" onClick={() => { play('pop'); helpFriend(f.id) }}>
                {f.needs === 'litter' ? '🧹 치워주기' : '💧 갈아주기'}
              </button>
            </div>
          ))}
        </div>

        {/* 자랑하기 */}
        <button className="panel w-full p-3 flex items-center gap-3 active:scale-95 transition" onClick={() => { play(); setScreen('sns') }}>
          <span className="text-3xl">🌟</span>
          <div className="text-left flex-1">
            <div className="font-bold text-cocoa text-sm">광장에 자랑하기</div>
            <div className="text-[11px] text-cocoa/50">내가 코디한 고양이 사진을 올리고 하트 스티커를 받아요</div>
          </div>
          <span className="text-cocoa/30">→</span>
        </button>
      </div>
    </div>
  )
}
