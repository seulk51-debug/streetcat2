import { useState } from 'react'
import { useGame } from '../../state/store'
import { COSTUMES } from '../../data/shop'
import { Modal, play, EmptyHint } from '../ui'

const COS = Object.fromEntries(COSTUMES.map((c) => [c.id, c.emoji]))

export default function SnsScreen() {
  const photos = useGame((s) => s.snsPhotos)
  const followers = useGame((s) => s.followers)
  const ownedCats = useGame((s) => s.ownedCats)
  const postPhoto = useGame((s) => s.postPhoto)
  const collectLikes = useGame((s) => s.collectLikes)
  const toast = useGame((s) => s.toast)
  const [shoot, setShoot] = useState(false)

  return (
    <div className="absolute inset-0 overflow-y-auto no-scrollbar bg-gradient-to-b from-cozy/40 to-cream">
      <div className="pt-16 pb-24 px-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-cocoa font-bold text-lg">📸 냥스타그램</h1>
            <p className="text-cocoa/55 text-xs">팔로워 <b className="text-heartpink">{followers.toLocaleString()}</b>명 · 좋아요를 하트로 환전!</p>
          </div>
          <button className="btn-primary text-sm" onClick={() => { play('camera'); ownedCats.length ? setShoot(true) : toast('먼저 고양이를 입양해 주세요', '🐾') }}>
            📷 사진 올리기
          </button>
        </div>

        {photos.length === 0 ? (
          <div className="panel"><EmptyHint emoji="📷">아직 올린 사진이 없어요\n우리 애 사진을 자랑해보세요!</EmptyHint></div>
        ) : (
          <div className="space-y-3">
            {photos.map((p) => (
              <div key={p.id} className="panel p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full grid place-items-center text-lg" style={{ background: p.color + '55' }}>{p.emoji}</div>
                  <div className="font-bold text-cocoa text-sm">{p.name}_집사</div>
                </div>
                <div className="rounded-2xl aspect-square grid place-items-center mb-2 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${p.color}55, #FBE3D6)` }}>
                  <span className="text-7xl">{p.emoji}</span>
                  {p.costume && <span className="absolute top-6 text-4xl">{COS[p.costume]}</span>}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-cocoa/70"><b className="text-heartpink">❤️ {p.likes}</b> 좋아요</div>
                  {p.collected ? (
                    <span className="chip bg-black/5 text-cocoa/40 text-[11px]">환전 완료</span>
                  ) : (
                    <button className="btn-primary text-xs px-3 py-1" onClick={() => { play('coin'); collectLikes(p.id) }}>
                      하트로 받기
                    </button>
                  )}
                </div>
                <p className="text-xs text-cocoa/60 mt-1">{p.caption}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <ShootModal open={shoot} onClose={() => setShoot(false)} cats={ownedCats} onPost={(uid, cap) => { postPhoto(uid, cap); toast('업로드 완료! 좋아요가 달리고 있어요', '📸'); setShoot(false) }} />
    </div>
  )
}

function ShootModal({ open, onClose, cats, onPost }) {
  const [sel, setSel] = useState(null)
  const [caption, setCaption] = useState('')
  const cat = cats.find((c) => c.uid === sel) || cats[0]
  return (
    <Modal open={open} onClose={onClose} title="📷 사진 찍기">
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 pb-1">
        {cats.map((c) => (
          <button key={c.uid} onClick={() => { play(); setSel(c.uid) }}
            className={`shrink-0 w-14 rounded-xl p-1 border ${cat?.uid === c.uid ? 'border-crust bg-toast/40' : 'border-crust/15 bg-white/70'}`}>
            <div className="text-2xl">{c.emoji}</div>
            <div className="text-[9px] font-bold text-cocoa/70 truncate">{c.name}</div>
          </button>
        ))}
      </div>
      {cat && (
        <>
          <div className="rounded-2xl aspect-video grid place-items-center mb-3" style={{ background: `linear-gradient(135deg, ${cat.color}55, #FBE3D6)` }}>
            <span className="text-6xl">{cat.emoji}</span>
          </div>
          <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={40} placeholder="오늘도 식빵 굽는 중 🍞"
            className="w-full rounded-xl border border-crust/30 px-3 py-2 mb-3 text-sm text-cocoa focus:outline-none focus:border-crust" />
          <button className="btn-primary w-full" onClick={() => { play('camera'); onPost(cat.uid, caption) }}>📤 업로드</button>
        </>
      )}
    </Modal>
  )
}
