import { useEffect } from 'react'
import { useGame } from '../state/store'

function Toast({ t, onDone }) {
  useEffect(() => {
    const id = setTimeout(onDone, 1300)
    return () => clearTimeout(id)
  }, [onDone])
  return (
    <div className="panel px-4 py-2 mb-2 flex items-center gap-2 shadow-lg animate-pop pointer-events-none">
      <span className="text-xl">{t.emoji}</span>
      <span className="text-sm font-bold text-cocoa">{t.text}</span>
    </div>
  )
}

export default function ToastLayer() {
  const toasts = useGame((s) => s.toasts)
  const consume = useGame((s) => s.consumeToast)
  return (
    <div className="absolute z-50 left-1/2 -translate-x-1/2 bottom-24 flex flex-col items-center w-full px-4">
      {toasts.slice(-6).map((t) => (
        <Toast key={t.id} t={t} onDone={() => consume(t.id)} />
      ))}
    </div>
  )
}
