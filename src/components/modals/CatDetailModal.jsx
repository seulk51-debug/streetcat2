import { useGame, PERSONALITIES } from '../../state/store'
import { rosterById } from '../../data/cats'
import { COSTUMES } from '../../data/shop'
import { Modal, Bar, RarityTag, play } from '../ui'

const COS = Object.fromEntries(COSTUMES.map((c) => [c.id, c]))
const DIARY_GATE = [0, 35, 70, 90] // 각 일기 해금에 필요한 신뢰도

export default function CatDetailModal({ catUid, onClose }) {
  const cat = useGame((s) => s.ownedCats.find((c) => c.uid === catUid))
  const ownedCostumes = useGame((s) => s.ownedCostumes)
  const brushCat = useGame((s) => s.brushCat)
  const comfortCat = useGame((s) => s.comfortCat)
  const equipCostume = useGame((s) => s.equipCostume)
  const unlockNextDiary = useGame((s) => s.unlockNextDiary)
  const postPhoto = useGame((s) => s.postPhoto)
  const setScreen = useGame((s) => s.setScreen)
  const toast = useGame((s) => s.toast)

  if (!cat) return null
  const roster = rosterById(cat.rosterId)
  const per = PERSONALITIES[cat.personality]
  const nextIdx = cat.diaryUnlocked.length
  const canUnlock = roster && nextIdx < roster.diary.length && cat.trust >= (DIARY_GATE[nextIdx] || 100)

  return (
    <Modal open={!!catUid} onClose={onClose} title={null}>
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-16 h-16 rounded-2xl grid place-items-center text-4xl relative"
          style={{ background: cat.color + '55' }}
        >
          {cat.emoji}
          {cat.costume && <span className="absolute -top-2 text-2xl">{COS[cat.costume]?.emoji}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-cocoa truncate">{cat.name}</h2>
            <RarityTag rarity={cat.rarity} />
          </div>
          <div className="text-xs text-cocoa/55">
            {cat.ageGuess} · {per?.label} ({per?.desc})
          </div>
        </div>
      </div>

      {/* 경계 상태 */}
      {cat.hidden && (
        <div className="rounded-2xl bg-cozy/60 p-3 mb-3 text-center">
          <div className="text-3xl mb-1">🫣</div>
          <p className="text-sm text-cocoa/70 mb-2">아직 낯설어서 숨어있어요. 간식과 장난감으로 안심시켜 주세요.</p>
          <button className="btn-primary w-full" onClick={() => { play('meow'); comfortCat(cat.uid); toast(`${cat.name}가 조금씩 마음을 열어요`, '🧶') }}>
            🎣 낚싯대로 안심시키기 (신뢰 +25)
          </button>
        </div>
      )}

      {/* 상태 바 */}
      <div className="grid gap-2 mb-3">
        <StatRow label="뽀송함" emoji="🧼" value={cat.condition} color="#7BC47F" hint={cat.condition < 50 ? '꼬질꼬질' : '뽀송뽀송'} />
        <StatRow label="기분" emoji="😻" value={cat.mood} color="#F5849B" />
        <StatRow label="포만감" emoji="🍚" value={cat.hunger} color="#F2B441" />
        <StatRow label="신뢰" emoji="🤍" value={cat.trust} color="#5BA8E8" />
      </div>

      {/* 액션 */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button className="btn-ghost" onClick={() => { play('pop'); const g = brushCat(cat.uid); toast(`빗질 완료! 하트 +${g}`, '🧴') }}>
          🪮 빗질하기
        </button>
        <button className="btn-ghost" onClick={() => { play('camera'); postPhoto(cat.uid); toast('냥스타그램에 사진을 올렸어요!', '📸') }}>
          📸 사진 찍기
        </button>
      </div>

      {/* 코스튬 */}
      <div className="mb-3">
        <div className="text-sm font-bold text-cocoa mb-1.5">🎀 코스튬</div>
        {ownedCostumes.length === 0 ? (
          <button onClick={() => { play(); setScreen('gacha'); onClose() }} className="w-full rounded-xl bg-cozy/50 p-2 text-xs text-cocoa/60">
            아직 코스튬이 없어요. 가챠에서 뽑아보세요! →
          </button>
        ) : (
          <div className="flex gap-2 flex-wrap">
            <CostumeChip active={!cat.costume} emoji="🚫" label="없음" onClick={() => { play(); equipCostume(cat.uid, null) }} />
            {ownedCostumes.map((id) => (
              <CostumeChip
                key={id}
                active={cat.costume === id}
                emoji={COS[id]?.emoji}
                label={COS[id]?.name}
                onClick={() => { play('pop'); equipCostume(cat.uid, id) }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 묘생역전 일기 (도감) */}
      <div className="rounded-2xl bg-milk border border-crust/15 p-3">
        <div className="text-sm font-bold text-cocoa mb-2">📖 묘생역전 이야기</div>
        <div className="space-y-2">
          {roster?.diary.map((d, i) => {
            const unlocked = cat.diaryUnlocked.includes(i)
            return (
              <div key={i} className={`text-sm rounded-xl p-2 ${unlocked ? 'bg-cozy/40 text-cocoa/80' : 'bg-black/5 text-transparent select-none blur-[3px]'}`}>
                {unlocked ? `“${d}”` : '잠긴 이야기입니다 ……………'}
              </div>
            )
          })}
        </div>
        {nextIdx < (roster?.diary.length || 0) && (
          <button
            disabled={!canUnlock}
            onClick={() => { play('success'); unlockNextDiary(cat.uid) }}
            className="btn-primary w-full mt-2 text-sm disabled:opacity-50"
          >
            {canUnlock ? '🔓 다음 이야기 해금' : `신뢰 ${DIARY_GATE[nextIdx]} 이상에서 해금돼요`}
          </button>
        )}
      </div>

      <button className="btn-eco w-full mt-3" onClick={() => { play(); setScreen('outing'); onClose() }}>
        🎒 바깥세상 외출 보내기
      </button>
    </Modal>
  )
}

function StatRow({ label, emoji, value, color, hint }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-cocoa/60 mb-0.5">
        <span>{emoji} {label}{hint && <span className="ml-1 text-cocoa/40">· {hint}</span>}</span>
        <span className="tabular-nums">{Math.round(value)}%</span>
      </div>
      <Bar value={value} color={color} />
    </div>
  )
}

function CostumeChip({ active, emoji, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 border transition active:scale-95 ${
        active ? 'bg-toast border-crust text-cocoa' : 'bg-white/70 border-crust/15 text-cocoa/70'
      }`}
    >
      <span className="text-xl">{emoji}</span>
      <span className="text-[9px] font-bold max-w-[52px] truncate">{label}</span>
    </button>
  )
}
