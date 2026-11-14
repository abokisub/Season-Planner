import { useEffect, useRef, useState } from 'react'
import { getPlan } from './api'
import Start from './screens/Start'
import Field from './screens/Field'
import Crop from './screens/Crop'
import Loading from './screens/Loading'
import PlanTab from './screens/PlanTab'
import SeasonTab from './screens/SeasonTab'
import SoilTab from './screens/SoilTab'
import FertilizerTab from './screens/FertilizerTab'
import FieldViewer from './components/FieldViewer'
import { Bag, Calendar, Close, Layers, Pin, Sprout } from './components/Icons'
import { IconButton } from './ui'
import { stopSpeaking } from './speak'

const DEMO_FARM = { lat: 12.15, lon: 8.35, name: 'Demo farm, Kano' }

const TABS = [
  { id: 'plan', label: 'Plan', icon: Sprout },
  { id: 'season', label: 'Season', icon: Calendar },
  { id: 'soil', label: 'Soil', icon: Layers },
  { id: 'fertilizer', label: 'Fertilizer', icon: Bag },
]

export default function App() {
  const [screen, setScreen] = useState('start') // start | field | crop | loading | result
  const [point, setPoint] = useState(DEMO_FARM)
  const [current, setCurrent] = useState(['maize'])
  const [plan, setPlan] = useState(null)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('plan')
  const [sel, setSel] = useState(1)
  const [show3D, setShow3D] = useState(false)
  const scroller = useRef(null)

  // Each new screen or tab starts at the top, and stops any reading
  useEffect(() => {
    scroller.current?.scrollTo(0, 0)
    stopSpeaking()
  }, [screen, tab])

  async function makePlan() {
    setScreen('loading')
    setError(null)
    try {
      const result = await getPlan({ ...point, current, priority: 'auto' })
      setPlan(result)
      setSel(1)
      setTab('plan')
      setScreen('result')
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="min-h-dvh bg-brand-50 sm:flex sm:items-center sm:py-6">
      {/* Phone-sized frame; full screen on a real phone */}
      <div className="relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-mist sm:h-[880px] sm:max-h-[calc(100dvh-3rem)] sm:rounded-[2.5rem] sm:shadow-float">
        {screen === 'result' && (
          <header className="flex h-16 shrink-0 items-center gap-3 bg-paper px-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-paper">
              <Sprout size={20} strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-ink-45">Your plan for</p>
              <p className="truncate font-bold">{point.name}</p>
            </div>
            <IconButton label="Change farm or crops" onClick={() => setScreen('field')}>
              <Pin size={20} />
            </IconButton>
          </header>
        )}

        <div ref={scroller} className={`relative min-h-0 flex-1 ${screen === 'result' ? 'overflow-y-auto' : ''}`}>
          {screen === 'start' && <Start onNext={() => setScreen('field')} />}
          {screen === 'field' && (
            <Field point={point} setPoint={setPoint} demo={DEMO_FARM} onBack={() => setScreen('start')} onNext={() => setScreen('crop')} />
          )}
          {screen === 'crop' && (
            <Crop current={current} setCurrent={setCurrent} onBack={() => setScreen('field')} onNext={makePlan} />
          )}
          {screen === 'loading' && <Loading error={error} onBack={() => setScreen('field')} />}
          {screen === 'result' && plan && (
            <>
              {tab === 'plan' && <PlanTab plan={plan} sel={sel} setSel={setSel} open3D={() => setShow3D(true)} />}
              {tab === 'season' && <SeasonTab plan={plan} sel={sel} />}
              {tab === 'soil' && <SoilTab plan={plan} />}
              {tab === 'fertilizer' && <FertilizerTab plan={plan} sel={sel} />}
              <p className="px-5 pb-8 text-center text-xs leading-relaxed text-ink-45">
                A guide, not a rule. Check with your extension officer.
                <br />
                Data: NASA POWER, NASA SRTM, ISRIC SoilGrids. Photos: Wikimedia Commons.
              </p>
            </>
          )}
        </div>

        {screen === 'result' && (
          <nav className="grid shrink-0 grid-cols-4 bg-paper px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 shadow-[0_-1px_0_var(--color-ink-6)]">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-current={tab === id ? 'page' : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-bold transition ${tab === id ? 'text-brand' : 'text-ink-45'}`}
              >
                <span className={`flex h-8 w-16 items-center justify-center rounded-full transition ${tab === id ? 'bg-brand-100' : ''}`}>
                  <Icon size={22} />
                </span>
                {label}
              </button>
            ))}
          </nav>
        )}

        {show3D && plan && (
          <div className="absolute inset-0 z-[1000] flex animate-rise flex-col bg-paper">
            <div className="flex h-16 shrink-0 items-center justify-between px-4">
              <p className="text-lg font-bold">Your field in 3D</p>
              <IconButton label="Close" onClick={() => setShow3D(false)}>
                <Close />
              </IconButton>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
              <FieldViewer plan={plan} optionIndex={sel} onOptionChange={setSel} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
