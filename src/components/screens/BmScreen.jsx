import { useGame } from '../../state/store'
import { PASSES, DONATION_PACKAGE } from '../../data/shop'
import { play } from '../ui'

export default function BmScreen() {
  const passActive = useGame((s) => s.passActive)
  const subscribePass = useGame((s) => s.subscribePass)
  const cancelPass = useGame((s) => s.cancelPass)
  const claimDailyPass = useGame((s) => s.claimDailyPass)
  const buyDonation = useGame((s) => s.buyDonationPackage)
  const donationOwned = useGame((s) => s.donationOwned)
  const donationCount = useGame((s) => s.donationCount)
  const setScreen = useGame((s) => s.setScreen)

  return (
    <div className="absolute inset-0 overflow-y-auto no-scrollbar bg-gradient-to-b from-dusk/10 to-cream">
      <div className="pt-16 pb-24 px-3">
        <h1 className="text-cocoa font-bold text-lg mb-1">💎 프리미엄 · 후원</h1>
        <p className="text-cocoa/55 text-xs mb-3">강요하지 않는, 따뜻하고 합리적인 과금이에요</p>

        <div className="rounded-2xl bg-amber-100/60 border border-gold/30 p-2.5 mb-3 text-[11px] text-cocoa/70">
          ⚠️ 데모 버전입니다. 실제 결제 시스템이 없어, 누르면 바로 적용돼요.
        </div>

        {/* 일류 집사 패스 */}
        <div className="font-bold text-cocoa text-sm mb-2">🎫 일류 집사 패스 (정기 구독)</div>
        {passActive && (
          <button className="btn-gold w-full mb-2" onClick={() => { play('coin'); claimDailyPass() }}>
            📅 오늘의 출석 보상 받기 (황금 츄르)
          </button>
        )}
        <div className="grid gap-2 mb-4">
          {PASSES.map((p) => {
            const active = passActive === p.tier
            return (
              <div key={p.id} className={`panel p-3 ${active ? 'ring-2 ring-gold' : ''} ${p.tier === 'premium' ? 'bg-gradient-to-br from-gold/15 to-white' : ''}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <div className="font-bold text-cocoa">{p.name} {active && <span className="chip bg-gold text-white text-[10px] ml-1">구독중</span>}</div>
                    <div className="text-xs text-crust font-bold">{p.price}</div>
                  </div>
                  <span className="text-2xl">{p.tier === 'premium' ? '👑' : '🎫'}</span>
                </div>
                <ul className="text-[11px] text-cocoa/65 space-y-0.5 mb-2">
                  {p.perks.map((perk, i) => <li key={i}>✓ {perk}</li>)}
                </ul>
                {active ? (
                  <button className="btn-ghost w-full text-sm" onClick={() => { play(); cancelPass() }}>구독 해지</button>
                ) : (
                  <button className="btn-primary w-full text-sm" onClick={() => { play('success'); subscribePass(p.tier) }}>구독하기</button>
                )}
              </div>
            )
          })}
        </div>

        {/* ESG 후원 패키지 */}
        <div className="font-bold text-cocoa text-sm mb-2">😇 윤리적 후원 (ESG)</div>
        <div className="panel p-4 mb-3 bg-gradient-to-br from-heartpink/10 to-mint/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-3xl">😇</span>
            <div>
              <div className="font-bold text-cocoa">{DONATION_PACKAGE.name}</div>
              <div className="text-xs text-crust font-bold">{DONATION_PACKAGE.price}</div>
            </div>
          </div>
          <ul className="text-[11px] text-cocoa/65 space-y-0.5 mb-2">
            {DONATION_PACKAGE.perks.map((perk, i) => <li key={i}>💝 {perk}</li>)}
          </ul>
          <div className="rounded-xl bg-white/60 p-2 text-[10px] text-cocoa/55 mb-2 leading-relaxed">
            판매 수익의 30%를 실제 유기묘 보호소에 사료·치료비로 기부하고, 매월 영수증과 후원 고양이들의 사진을 투명하게 공개해요.
          </div>
          <button className="btn-primary w-full" onClick={() => { play('success'); buyDonation() }}>
            {donationOwned ? `한번 더 후원하기 (지금까지 ${donationCount}회 💛)` : '후원하고 천사 훈장 받기'}
          </button>
        </div>

        {/* 가챠 바로가기 */}
        <button className="panel w-full p-3 flex items-center gap-3 active:scale-95 transition" onClick={() => { play(); setScreen('gacha') }}>
          <span className="text-3xl">🎁</span>
          <div className="text-left flex-1">
            <div className="font-bold text-cocoa text-sm">스페셜 코스튬 가챠</div>
            <div className="text-[11px] text-cocoa/50">시즌 한정 코스튬 · 착한 가챠(천장) 적용</div>
          </div>
          <span className="text-cocoa/30">→</span>
        </button>
      </div>
    </div>
  )
}
