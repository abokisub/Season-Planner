import { useEffect, useState } from 'react'
import { Button } from '../ui'
import { Check, Layers, Rain, Sprout } from '../components/Icons'

const STEPS = [
  { icon: Rain, text: 'Reading 20 years of NASA rain' },
  { icon: Layers, text: 'Checking your soil' },
  { icon: Sprout, text: 'Matching crops to your field' },
]

export default function Loading({ error, onBack }) {
  const [done, setDone] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setDone((d) => Math.min(d + 1, STEPS.length - 1)), 1400)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex h-full flex-col items-center justify-center bg-brand px-8 text-center text-paper">
      {error ? (
        <div className="animate-rise">
          <h2 className="t-title">That didn’t work</h2>
          <p className="mt-3 text-paper/85">{error}</p>
          <Button variant="white" className="mt-8 w-full" onClick={onBack}>
            Pick another spot
          </Button>
        </div>
      ) : (
        <>
          <div className="relative flex h-28 w-28 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-paper/20" />
            <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-paper text-brand">
              <Sprout size={36} strokeWidth={1.75} />
            </span>
          </div>
          <h2 className="t-title mt-8">Making your plan</h2>
          <ul className="mt-8 w-full max-w-xs space-y-4 text-left">
            {STEPS.map(({ icon: Icon, text }, i) => (
              <li key={text} className={`flex items-center gap-3 transition-opacity duration-500 ${i <= done ? 'opacity-100' : 'opacity-40'}`}>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${i < done ? 'bg-paper text-brand' : 'bg-paper/15'}`}>
                  {i < done ? <Check size={18} strokeWidth={3} /> : <Icon size={18} />}
                </span>
                <span className="font-semibold">{text}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
