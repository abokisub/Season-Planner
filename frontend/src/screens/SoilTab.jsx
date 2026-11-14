import { Card, Chip, Meter, SectionTitle } from '../ui'
import SpeakButton from '../components/SpeakButton'
import { Calendar, Layers, Rain, Sprout, Sun } from '../components/Icons'

const LEVEL = { low: 1, medium: 2, high: 3 }
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

function SoilCard({ label, value, unit, level, status }) {
  return (
    <Card className="p-4">
      <p className="text-sm font-semibold text-ink-65">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">
        {value}
        {unit && <span className="ml-1 text-sm font-semibold text-ink-45">{unit}</span>}
      </p>
      <div className="mt-3">
        <Meter level={level} />
      </div>
      <Chip className="mt-3">{status}</Chip>
    </Card>
  )
}

function Row({ icon: Icon, label, value, sub }) {
  return (
    <div className="flex items-center gap-3 border-b border-ink-6 px-4 py-3.5 last:border-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand">
        <Icon size={20} />
      </span>
      <span className="flex-1">
        <span className="block font-semibold">{label}</span>
        <span className="block text-sm text-ink-65">{sub}</span>
      </span>
      <span className="text-lg font-extrabold">{value}</span>
    </div>
  )
}

export default function SoilTab({ plan }) {
  const s = plan.soil
  const t = plan.terrain
  const c = plan.climate

  return (
    <div className="space-y-7 px-4 pb-8 pt-4">
      <div className="flex animate-rise items-start justify-between gap-3 px-1">
        <div>
          <h2 className="t-title">Your field</h2>
          <p className="mt-1 text-ink-65">What the soil map and NASA data say about it.</p>
        </div>
        <SpeakButton
          variant="icon"
          text={`Your soil. Nitrogen is ${s.nitrogen_level}. Organic matter is ${s.organic_matter_level}. pH is ${s.ph}, which is ${s.ph_level}. The slope is ${t.slope_pct} percent. Rains usually start around ${c.onset.median_date}, and the rainy season lasts about ${c.season_length_days.median} days.`}
        />
      </div>

      <section>
        <SectionTitle>Soil</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <SoilCard label="Nitrogen" value={s.nitrogen_g_kg} unit="g/kg" level={LEVEL[s.nitrogen_level]} status={cap(s.nitrogen_level)} />
          <SoilCard label="Organic matter" value={s.organic_carbon_g_kg} unit="g/kg" level={LEVEL[s.organic_matter_level]} status={cap(s.organic_matter_level)} />
          <SoilCard label="pH" value={s.ph} level={s.ph_level === 'good' ? 3 : 1} status={s.ph_level === 'good' ? 'Good' : cap(s.ph_level)} />
          <SoilCard
            label="Slope"
            value={t.slope_pct ?? '–'}
            unit="%"
            level={{ low: 3, medium: 2, high: 1 }[t.erosion_risk]}
            status={`${cap(t.erosion_risk)} erosion`}
          />
        </div>
        <p className="mt-3 px-1 text-xs text-ink-45">
          {cap(s.texture)} soil, {s.sand_pct}% sand. From the ISRIC soil map (250 m). A soil test would confirm.
        </p>
      </section>

      <section>
        <SectionTitle>Weather</SectionTitle>
        <Card className="overflow-hidden">
          <Row icon={Rain} label="Rains start" sub={`Late year: ${c.onset.late_year_date}`} value={c.onset.median_date} />
          <Row icon={Calendar} label="Rainy season" sub={`Short year: ${c.season_length_days.p20} days`} value={`${c.season_length_days.median} days`} />
          <Row icon={Layers} label="Season rain" sub={`Dry year: ${c.season_rain_mm.p20} mm`} value={`${c.season_rain_mm.median} mm`} />
          <Row
            icon={Sun}
            label="Days above 35°C"
            sub="Compared with 10 years ago"
            value={`${c.trend.hot_days_change > 0 ? '+' : ''}${Math.round(c.trend.hot_days_change)}`}
          />
          <Row
            icon={Sprout}
            label="This season"
            sub={plan.season_status.rain_vs_normal ? `${Math.round(plan.season_status.rain_vs_normal * 100)}% of normal rain` : ''}
            value={{ on_track: 'On track', behind: 'Behind', at_risk: 'At risk' }[plan.season_status.status] || '–'}
          />
        </Card>
        <p className="mt-3 px-1 text-xs text-ink-45">NASA POWER daily records, {c.years}.</p>
      </section>
    </div>
  )
}
