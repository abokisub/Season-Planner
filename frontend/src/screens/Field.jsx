import MapPicker from '../components/MapPicker'
import { AppBar, Button, Steps } from '../ui'
import { Pin } from '../components/Icons'

export default function Field({ point, setPoint, demo, onBack, onNext }) {
  const isDemo = point.name === demo.name
  return (
    <div className="relative flex h-full flex-col bg-mist">
      <div className="relative z-[500] bg-paper">
        <AppBar onBack={onBack} title="Your farm" right={<Steps at={1} />} />
      </div>

      <div className="relative min-h-0 flex-1">
        <MapPicker point={point} onPick={(p) => setPoint({ ...p, name: 'Your farm' })} fill />
        {!isDemo && (
          <button
            type="button"
            onClick={() => setPoint(demo)}
            className="absolute left-1/2 top-4 z-[500] -translate-x-1/2 rounded-full bg-paper px-4 py-2 text-sm font-bold text-brand shadow-card"
          >
            Use demo farm
          </button>
        )}
      </div>

      <div className="relative z-[500] -mt-6 animate-rise rounded-t-[2rem] bg-paper px-5 pb-6 pt-6 shadow-float">
        <h2 className="t-title">Where is your farm?</h2>
        <p className="mt-1 text-ink-65">Tap your field on the map.</p>

        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-brand-50 p-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-paper text-brand">
            <Pin size={22} />
          </span>
          <div className="min-w-0">
            <p className="font-bold">{point.name}</p>
            <p className="text-sm text-ink-65">
              {point.lat.toFixed(3)}° N, {point.lon.toFixed(3)}° E
            </p>
          </div>
        </div>

        <Button className="mt-5 w-full" onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  )
}
