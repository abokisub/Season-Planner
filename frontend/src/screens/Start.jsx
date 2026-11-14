import { PHOTOS } from '../photos'
import { Button, Photo } from '../ui'
import SpeakButton from '../components/SpeakButton'
import { Arrow, Sprout } from '../components/Icons'

export default function Start({ onNext }) {
  return (
    <div className="relative flex h-full flex-col bg-ink">
      <div className="absolute inset-x-0 top-0 h-[68%]">
        <Photo src={PHOTOS.farmer.src} alt="A farmer weeding a maize field in Nigeria" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/50 via-transparent to-transparent" />
      </div>

      <div className="relative flex items-center gap-2 p-5 text-paper">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand">
          <Sprout size={20} strokeWidth={2} />
        </span>
        <span className="text-[15px] font-bold">Season Planner</span>
      </div>

      <div className="relative mt-auto animate-rise rounded-t-[2rem] bg-paper px-6 pb-8 pt-7">
        <p className="t-eyebrow text-brand">For farmers in northern Nigeria</p>
        <h1 className="t-display mt-3">Know what to plant next season</h1>
        <p className="mt-3 text-[17px] leading-relaxed text-ink-65">
          A crop plan for your field, from NASA weather records and your soil.
        </p>
        <Button className="mt-7 w-full" onClick={onNext}>
          Get started <Arrow size={20} />
        </Button>
        <div className="mt-3 flex justify-center">
          <SpeakButton
            variant="pill"
            className="bg-transparent"
            text="Season Planner. Know what to plant next season. Tap get started, then show us your farm."
          />
        </div>
      </div>
    </div>
  )
}
