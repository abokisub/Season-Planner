import { useState } from 'react'
import { CROPS, MONTHS, dayOfYear } from '../crops'
import { PHOTOS } from '../photos'
import { Card, Photo, SectionTitle } from '../ui'
import SpeakButton from '../components/SpeakButton'
import { Harvest, Rain, Sprout, Sun } from '../components/Icons'

const WET = { low: 'Usually dry. Good for drying the crop.', medium: 'Some rain is likely. Dry it well before storing.', high: 'Often wet. Plan where to dry and store it.' }
const DAYS_BEFORE = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]

export default function SeasonTab({ plan, sel }) {
  const o = plan.options[sel]
  const [year, setYear] = useState(1)
  const c = plan.climate
  const cal = o.calendar[year - 1]
  const crop = CROPS[o.sequence[year - 1]].name.toLowerCase()
  const maxRain = Math.max(...c.monthly.map((m) => m.rain_mm))
  const onset = c.onset.median
  const cess = c.cessation.median
  const rainy = (m) => DAYS_BEFORE[m - 1] + 15 >= onset - 15 && DAYS_BEFORE[m - 1] + 15 <= cess + 10
  const plantMonth = Math.floor(dayOfYear(cal.plant_from) / 30.5)
  const harvestMonth = Math.floor(dayOfYear(cal.harvest_from) / 30.5)

  const steps = [
    { icon: Rain, when: c.onset.median_date, title: 'Rains start', text: `In a late year, around ${c.onset.late_year_date}.` },
    { icon: Sprout, when: `${cal.plant_from} – ${cal.plant_to}`, title: `Plant ${crop}`, text: 'Wait for a good rain to soak the soil.' },
    { icon: Harvest, when: `${cal.harvest_from} – ${cal.harvest_to}`, title: `Harvest ${crop}`, text: WET[cal.wet_harvest_risk] },
    { icon: Sun, when: `${c.cessation.median_date} – ${c.onset.median_date}`, title: 'Dry season', text: 'Leave the stalks on the field. They protect the soil.' },
  ]

  return (
    <div className="space-y-7 px-4 pb-8 pt-4">
      <div className="animate-rise px-1">
        <h2 className="t-title">Your season</h2>
        <p className="mt-1 text-ink-65">When to plant and harvest, from 20 years of NASA rain records.</p>
      </div>

      <Card className="p-5">
        <div className="flex items-baseline justify-between">
          <p className="font-bold">Rain each month</p>
          <p className="text-sm text-ink-65">{c.season_rain_mm.median} mm a season</p>
        </div>
        <div className="mt-4 flex h-32 items-end gap-1.5">
          {c.monthly.map((m) => (
            <div key={m.month} className="relative flex h-full flex-1 flex-col justify-end">
              {(m.month - 1 === plantMonth || m.month - 1 === harvestMonth) && (
                <span className="absolute -top-1 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full bg-ink text-paper">
                  {m.month - 1 === plantMonth ? <Sprout size={12} strokeWidth={2.5} /> : <Harvest size={12} strokeWidth={2.5} />}
                </span>
              )}
              <div
                className={`rounded-md ${rainy(m.month) ? 'bg-brand' : 'bg-brand-100'}`}
                style={{ height: `${Math.max(4, (m.rain_mm / maxRain) * 82)}%` }}
                title={`${MONTHS[m.month - 1]}: ${m.rain_mm} mm`}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-1.5 text-center text-[11px] font-semibold text-ink-45">
          {MONTHS.map((m) => <span key={m} className="flex-1">{m[0]}</span>)}
        </div>
      </Card>

      <section>
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-brand-50 p-1">
          {[1, 2].map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setYear(y)}
              className={`flex h-11 items-center justify-center gap-2 rounded-full text-sm font-bold transition ${year === y ? 'bg-paper text-ink shadow-card' : 'text-ink-65'}`}
            >
              <span className="h-6 w-6 overflow-hidden rounded-full"><Photo src={PHOTOS[o.sequence[y - 1]].src} /></span>
              Year {y} · {CROPS[o.sequence[y - 1]].name}
            </button>
          ))}
        </div>

        <SectionTitle
          action={<SpeakButton variant="icon" text={`Year ${year}. ${steps.map((s) => `${s.title}, ${s.when.replace('–', 'to')}. ${s.text}`).join(' ')}`} />}
        >
          Your year, step by step
        </SectionTitle>
        <Card className="p-5">
          <ol>
            {steps.map(({ icon: Icon, when, title, text }, i) => (
              <li key={title} className="relative flex gap-4 pb-6 last:pb-0">
                {i < steps.length - 1 && <span className="absolute left-[1.3rem] top-12 h-[calc(100%-3rem)] w-0.5 bg-brand-100" />}
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand">
                  <Icon size={22} />
                </span>
                <div className="pt-0.5">
                  <p className="text-sm font-bold text-brand">{when}</p>
                  <p className="text-[17px] font-bold">{title}</p>
                  <p className="mt-0.5 text-[15px] text-ink-65">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </section>
    </div>
  )
}
