import { useState } from 'react'
import { CROPS } from '../crops'
import { PHOTOS } from '../photos'
import { Card, Chip, IconButton, Photo, SectionTitle } from '../ui'
import SpeakButton from '../components/SpeakButton'
import { Arrow, Back, Check, Cube } from '../components/Icons'
import { bagsPerYear, plainReason } from '../planText'

const LABEL = { current: 'What you grow now', recommended: 'Recommended', soil_builder: 'Builds soil most' }
const RISK = { low: 'Low', medium: 'Medium', high: 'High' }
const soilWord = (o) => (o.parts.soil >= 0.7 ? 'Better' : o.parts.soil >= 0.4 ? 'Some help' : 'Worse')
const headlineOf = (o) =>
  o.sequence[0] === o.sequence[1]
    ? `${CROPS[o.sequence[0]].name} every year`
    : `${CROPS[o.sequence[0]].name}, then ${CROPS[o.sequence[1]].name.toLowerCase()}`

function PhotoPair({ seq }) {
  return (
    <div className="relative grid h-52 grid-cols-2 grid-rows-1 gap-0.5 overflow-hidden">
      {seq.map((c, i) => (
        <div key={i} className="relative min-h-0 overflow-hidden">
          <Photo src={PHOTOS[c].src} alt={CROPS[c].name} />
          <Chip tone="dark" className="absolute bottom-3 left-3">
            Year {i + 1} · {CROPS[c].name}
          </Chip>
        </div>
      ))}
      <span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-paper text-brand shadow-card">
        <Arrow size={18} />
      </span>
    </div>
  )
}

function Thumbs({ seq }) {
  return (
    <span className="relative flex h-12 w-[4.25rem] shrink-0">
      {seq.map((c, i) => (
        <span key={i} className={`absolute top-0 h-12 w-12 overflow-hidden rounded-2xl ring-2 ring-paper ${i ? 'left-5' : 'left-0'}`}>
          <Photo src={PHOTOS[c].src} />
        </span>
      ))}
    </span>
  )
}

function Metric({ value, label }) {
  return (
    <div className="flex-1 px-2 text-center">
      <p className="text-xl font-extrabold">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-ink-65">{label}</p>
    </div>
  )
}

function Accordion({ title, items }) {
  const [open, setOpen] = useState(false)
  if (!items?.length) return null
  return (
    <div className="border-b border-ink-6 last:border-0">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex min-h-14 w-full items-center justify-between px-5 text-left font-bold" aria-expanded={open}>
        {title}
        <Back size={18} className={`text-ink-45 transition ${open ? 'rotate-90' : '-rotate-90'}`} />
      </button>
      {open && (
        <ul className="space-y-2 px-5 pb-5 text-[15px] leading-relaxed text-ink-80">
          {items.map((t) => (
            <li key={t} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
              {t}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function PlanTab({ plan, sel, setSel, open3D }) {
  const o = plan.options[sel]
  const headline = headlineOf(o)
  const reason = o.label === 'recommended' ? plainReason(plan) : o.why[0]

  return (
    <div className="space-y-7 px-4 pb-8 pt-4">
      <Card className="animate-rise overflow-hidden">
        <div className="relative">
          <PhotoPair seq={o.sequence} />
          <Chip tone="white" className="absolute left-3 top-3">
            {o.label === 'recommended' && <Check size={14} strokeWidth={3} />}
            {LABEL[o.label]}
          </Chip>
        </div>
        <div className="p-5">
          <h2 className="t-title">{headline}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-65">{reason}</p>

          <div className="mt-5 flex divide-x divide-ink-6 rounded-2xl bg-mist py-3">
            <Metric value={RISK[o.risk]} label="Risk" />
            <Metric value={bagsPerYear(o)} label="Bags a year" />
            <Metric value={soilWord(o)} label="Soil" />
          </div>

          <div className="mt-5 flex gap-2">
            <SpeakButton
              variant="primary"
              className="flex-1"
              label="Listen to plan"
              text={`${headline}. ${reason} ${RISK[o.risk]} risk. About ${bagsPerYear(o)} bags of fertilizer a year per hectare. ${o.benefits[0] || ''} Check with your extension officer.`}
            />
            <IconButton label="See your field in 3D" onClick={open3D} className="h-12 w-12">
              <Cube />
            </IconButton>
          </div>
        </div>
      </Card>

      <section>
        <SectionTitle>Compare options</SectionTitle>
        <Card className="overflow-hidden">
          {plan.options.map((opt, i) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setSel(i)}
              className={`flex w-full items-center gap-3 border-b border-ink-6 px-4 py-3 text-left last:border-0 ${i === sel ? 'bg-brand-50' : 'active:bg-mist'}`}
            >
              <Thumbs seq={opt.sequence} />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-brand">{LABEL[opt.label]}</span>
                <span className="block truncate font-bold">{headlineOf(opt)}</span>
                <span className="block text-sm text-ink-65">
                  {RISK[opt.risk]} risk · {bagsPerYear(opt)} bags a year
                </span>
              </span>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${i === sel ? 'bg-brand text-paper' : 'border-2 border-ink-12'}`}>
                {i === sel && <Check size={14} strokeWidth={3} />}
              </span>
            </button>
          ))}
        </Card>
      </section>

      <section>
        <SectionTitle>Why this plan</SectionTitle>
        <Card className="overflow-hidden">
          <Accordion title="Reasons" items={o.why} />
          <Accordion title="Good for your field" items={o.benefits} />
          <Accordion title="Watch out for" items={o.risks} />
          <Accordion title="Data we used" items={o.evidence} />
          <Accordion title="What we don’t know yet" items={o.info_gaps} />
          <Accordion title="Ask your extension officer" items={o.check_with_expert} />
        </Card>
      </section>
    </div>
  )
}
