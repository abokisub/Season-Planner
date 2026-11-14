import { CROPS } from '../crops'
import { PHOTOS } from '../photos'
import { Card, Photo } from '../ui'
import SpeakButton from '../components/SpeakButton'
import { Bag } from '../components/Icons'
import { bagsPerYear } from '../planText'

// One bag icon per bag; a half bag is drawn faded.
function Bags({ n }) {
  const full = Math.floor(n)
  const half = n - full >= 0.5
  return (
    <span className="flex flex-wrap gap-1 text-brand">
      {Array.from({ length: full }, (_, i) => <Bag key={i} size={22} />)}
      {half && <Bag size={22} className="opacity-35" />}
    </span>
  )
}

export default function FertilizerTab({ plan, sel }) {
  const o = plan.options[sel]
  const now = plan.options[0]
  const saved = bagsPerYear(now) - bagsPerYear(o)
  const nowName =
    now.sequence[0] === now.sequence[1]
      ? `growing ${CROPS[now.sequence[0]].name.toLowerCase()} every year`
      : `${CROPS[now.sequence[0]].name.toLowerCase()} then ${CROPS[now.sequence[1]].name.toLowerCase()}`

  return (
    <div className="space-y-5 px-4 pb-8 pt-4">
      <div className="flex animate-rise items-start justify-between gap-3 px-1">
        <div>
          <h2 className="t-title">Fertilizer</h2>
          <p className="mt-1 text-ink-65">Per hectare. One bag is 50 kg.</p>
        </div>
        <SpeakButton
          variant="icon"
          text={o.fertilizer.map((f) => `Year ${f.year}, ${f.crop}: ${f.products.map((p) => `${p.bags_per_ha} bags of ${p.name.split(' (')[0]}, ${p.when.toLowerCase()}`).join(', and ')}.`).join(' ')}
        />
      </div>

      {sel !== 0 && saved > 0 && (
        <div className="relative overflow-hidden rounded-3xl bg-brand p-5 text-paper shadow-card">
          <Bag size={120} strokeWidth={1} className="absolute -bottom-4 -right-4 opacity-15" />
          <p className="text-sm font-semibold text-paper/80">You save</p>
          <p className="mt-1 text-5xl font-extrabold tracking-tight">{saved} bags</p>
          <p className="mt-1 text-paper/85">a year, compared with {nowName}.</p>
        </div>
      )}

      {o.fertilizer.map((f) => {
        const id = o.sequence[f.year - 1]
        return (
          <Card key={f.year} className="overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <span className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl"><Photo src={PHOTOS[id].src} /></span>
              <div className="flex-1">
                <p className="text-xs font-bold text-brand">Year {f.year}</p>
                <p className="text-lg font-bold">{CROPS[id].name}</p>
              </div>
              <p className="text-right">
                <span className="block text-2xl font-extrabold">{f.total_bags_per_ha}</span>
                <span className="block text-xs text-ink-65">bags</span>
              </p>
            </div>
            <ul className="border-t border-ink-6">
              {f.products.map((p) => (
                <li key={p.name} className="border-b border-ink-6 px-4 py-3 last:border-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold">{p.name.replace(' (single super phosphate)', '').replace(' (46% N)', '')}</span>
                    <span className="font-bold">{p.bags_per_ha} bags</span>
                  </div>
                  <div className="mt-2"><Bags n={p.bags_per_ha} /></div>
                  <p className="mt-2 text-sm text-ink-65">{p.when}</p>
                </li>
              ))}
            </ul>
            {f.notes[0] && <p className="bg-brand-50 px-4 py-3 text-sm text-ink-80">{f.notes[0]}</p>}
          </Card>
        )
      })}
    </div>
  )
}
