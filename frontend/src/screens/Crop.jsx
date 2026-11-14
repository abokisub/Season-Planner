import { CROPS } from '../crops'
import { PHOTOS } from '../photos'
import { AppBar, Button, Photo, Steps } from '../ui'
import { Check } from '../components/Icons'

export default function Crop({ current, setCurrent, onBack, onNext }) {
  function toggle(id) {
    setCurrent((c) => {
      if (c.includes(id)) return c.filter((x) => x !== id)
      return c.length >= 2 ? [c[1], id] : [...c, id]
    })
  }

  return (
    <div className="flex h-full flex-col bg-mist">
      <div className="bg-paper">
        <AppBar onBack={onBack} title="Your crops" right={<Steps at={2} />} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-28 pt-5">
        <h2 className="t-title">What do you plant now?</h2>
        <p className="mt-1 text-ink-65">Pick one, or two if you switch each year.</p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {Object.entries(CROPS).map(([id, crop]) => {
            const on = current.includes(id)
            const order = current.indexOf(id) + 1
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                aria-pressed={on}
                className={`overflow-hidden rounded-3xl bg-paper text-left shadow-card transition active:scale-[0.98] ${on ? 'ring-2 ring-brand' : ''}`}
              >
                <div className="aspect-[4/3]">
                  <Photo src={PHOTOS[id].src} alt={crop.name} />
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="font-bold">{crop.name}</span>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition ${on ? 'bg-brand text-paper' : 'border-2 border-ink-12'}`}
                  >
                    {on && (current.length === 2 ? order : <Check size={14} strokeWidth={3} />)}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
        {current.length === 2 && (
          <p className="mt-4 text-center text-sm text-ink-65">
            Year 1: {CROPS[current[0]].name} · Year 2: {CROPS[current[1]].name}
          </p>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-mist via-mist to-transparent px-5 pb-6 pt-8">
        <Button className="w-full" onClick={onNext} disabled={current.length === 0}>
          Get my plan
        </Button>
      </div>
    </div>
  )
}
