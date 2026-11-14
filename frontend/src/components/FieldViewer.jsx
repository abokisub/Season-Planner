import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import '@google/model-viewer'
import { CROPS, MONTHS } from '../crops'
import { buildField, disposeField, exportGLB } from '../field3d'
import SpeakButton from './SpeakButton'
import { CropIcon, Pause, Phone, Play } from './Icons'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const START_STEP = 7 // August, year 1: crops in the ground
const TABS = { current: 'Now', recommended: 'Recommended', soil_builder: 'Soil builder' }
const MONTH_SHORT = MONTHS

function narrate({ crop, state, month, year, m }) {
  const name = CROPS[crop].name
  const when = `${MONTH_NAMES[month - 1]}, year ${year}.`
  const phase = {
    bare: 'The field is bare and dry. Fields wait for the rains.',
    prepare: `The rains have started. Get ready to plant ${name}.`,
    growing: `${name} is growing, about ${Math.round(state.g * 100)} percent of the way to harvest.`,
    harvest: `${name} is ready. Harvest now.`,
    after: `${name} has been harvested. Leave the stalks on the field to protect the soil.`,
  }[state.phase]
  const weather = m.rain_mm > 25 ? `Usually ${Math.round(m.rain_mm)} millimetres of rain this month.` : `Usually dry, up to ${Math.round(m.tmax_c)} degrees.`
  return { when, phase, weather }
}


export default function FieldViewer({ plan, optionIndex, onOptionChange }) {
  const option = plan.options[optionIndex]
  const monthly = plan.climate.monthly
  const [step, setStep] = useState(START_STEP)
  const [playing, setPlaying] = useState(false)
  const [glbUrl, setGlbUrl] = useState(null)
  const [arReady, setArReady] = useState(false)

  const mountRef = useRef(null)
  const three = useRef(null)
  const mvRef = useRef(null)

  const year = Math.floor(step / 12) + 1
  const month = (step % 12) + 1
  const crop = option.sequence[year - 1]
  const cal = option.calendar[year - 1]
  const m = monthly[month - 1]

  // --- one-time three.js setup ---
  useEffect(() => {
    const el = mountRef.current
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.outputColorSpace = THREE.SRGBColorSpace
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 50)
    camera.position.set(2.3, 1.7, 2.4)

    scene.add(new THREE.HemisphereLight('#ffffff', '#1e7a44', 1.6))
    const sun = new THREE.DirectionalLight('#ffffff', 2.2)
    sun.position.set(2, 4, 1.5)
    sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024)
    Object.assign(sun.shadow.camera, { left: -1.5, right: 1.5, top: 1.5, bottom: -1.5 })
    scene.add(sun)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 0.25, 0)
    controls.enableDamping = true
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.6
    controls.minDistance = 1.4
    controls.maxDistance = 6
    controls.maxPolarAngle = Math.PI * 0.47
    controls.enablePan = false
    // Let the page scroll: wheel scrolls (no zoom), one finger scrolls, two fingers turn the field.
    controls.enableZoom = false
    controls.touches = { ONE: null, TWO: THREE.TOUCH.ROTATE }
    renderer.domElement.style.touchAction = 'pan-y'

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = el
      renderer.setSize(w, h)
      camera.aspect = w / h
      // Pull the camera back on tall, narrow (phone) screens so the whole field fits
      const dir = camera.position.clone().sub(controls.target).normalize()
      const dist = 3.7 * (camera.aspect < 1 ? Math.pow(1 / camera.aspect, 0.75) : 1)
      camera.position.copy(controls.target).addScaledVector(dir, dist)
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    let raf
    const clock = new THREE.Clock()
    const loop = () => {
      const t = clock.getElapsedTime()
      const weather = three.current?.field?.getObjectByName('Weather')
      if (weather) {
        // Make the rain fall
        for (const c of weather.children) {
          if (c.geometry?.type !== 'CylinderGeometry') continue
          const start = (c.userData.start ??= c.position.y - 0.3)
          c.position.y = 0.3 + ((((start - t * 1.2) % 0.85) + 0.85) % 0.85)
        }
      }
      controls.update()
      renderer.render(scene, camera)
      raf = requestAnimationFrame(loop)
    }
    loop()

    three.current = { scene, renderer, controls, field: null }
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.dispose()
      if (three.current.field) disposeField(three.current.field)
      renderer.dispose()
      el.removeChild(renderer.domElement)
    }
  }, [])

  // --- rebuild the field whenever rotation/year/month changes ---
  const built = useMemo(
    () => buildField({ crop, cal, month, monthly, residue: option.label !== 'current' }),
    [crop, cal, month, monthly, option.label],
  )

  useEffect(() => {
    const t = three.current
    if (!t) return
    if (t.field) {
      t.scene.remove(t.field)
      disposeField(t.field)
    }
    t.field = built.group
    t.scene.add(built.group)
  }, [built])

  // --- export a GLB for AR (debounced so playback stays smooth) ---
  useEffect(() => {
    if (playing) return
    let url
    const id = setTimeout(async () => {
      const blob = await exportGLB(built.group)
      url = URL.createObjectURL(blob)
      setGlbUrl(url)
    }, 300)
    return () => {
      clearTimeout(id)
      if (url) setTimeout(() => URL.revokeObjectURL(url), 5000)
    }
  }, [built, playing])

  useEffect(() => {
    const mv = mvRef.current
    if (!mv) return
    const onLoad = () => setArReady(Boolean(mv.canActivateAR))
    mv.addEventListener('load', onLoad)
    return () => mv.removeEventListener('load', onLoad)
  }, [])

  // --- season playback ---
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => setStep((s) => (s + 1) % 24), 1100)
    return () => clearInterval(id)
  }, [playing])

  const story = narrate({ crop, state: built.state, month, year, m })

  return (
    <div className="overflow-hidden rounded-3xl bg-paper shadow-card">
      {/* Rotation tabs */}
      <div className="m-2 grid grid-cols-3 gap-1 rounded-full bg-brand-50 p-1" role="tablist">
        {plan.options.map((o, i) => (
          <button
            key={o.label}
            type="button"
            role="tab"
            aria-selected={i === optionIndex}
            onClick={() => onOptionChange(i)}
            className={`flex h-10 items-center justify-center gap-1.5 rounded-full px-2 text-sm font-bold transition ${i === optionIndex ? 'bg-paper text-ink shadow-card' : 'text-ink-65'}`}
          >
            <span className="hidden items-center sm:flex">
              {o.sequence.map((c, k) => <CropIcon key={k} crop={c} size={20} />)}
            </span>
            {TABS[o.label]}
          </button>
        ))}
      </div>

      {/* What is happening this month */}
      <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-2">
        <div className="min-h-[4.5rem]">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-65">
            Year {year}, {MONTH_NAMES[month - 1]}
          </p>
          <p className="mt-1 text-lg font-bold leading-snug">{story.phase}</p>
          <p className="mt-0.5 text-sm text-ink-80">{story.weather}</p>
        </div>
        <SpeakButton variant="icon" text={`${story.when} ${story.phase} ${story.weather}`} />
      </div>

      {/* 3D stage */}
      <div className="relative h-[340px] bg-brand-50 sm:h-[400px]">
        <div ref={mountRef} className="absolute inset-0 sm:cursor-grab sm:active:cursor-grabbing" />
        <p className="pointer-events-none absolute bottom-2 left-0 right-0 px-3 text-center text-xs text-ink-65">
          <span className="sm:hidden">Turn with two fingers. </span>
          <span className="hidden sm:inline">Drag to turn. </span>
          Rain and soil wetness from NASA POWER, {plan.climate.years}.
        </p>

        {/* Hidden model-viewer: only used to launch AR with the current field */}
        <model-viewer
          ref={mvRef}
          src={glbUrl || undefined}
          ar=""
          ar-modes="webxr quick-look"
          ar-placement="floor"
          ar-scale="auto"
          alt="3D model of the farm field"
          style={{ position: 'absolute', inset: 0, opacity: 0, pointerEvents: 'none', zIndex: -1 }}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 p-4">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? 'Pause' : 'Play the seasons'}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-paper shadow-card active:scale-95"
        >
          {playing ? <Pause /> : <Play />}
        </button>
        <div className="min-w-48 flex-1">
          <input
            type="range"
            min={0}
            max={23}
            value={step}
            onChange={(e) => {
              setPlaying(false)
              setStep(Number(e.target.value))
            }}
            aria-label="Month"
            className="w-full"
          />
          <div className="mt-1 grid grid-cols-2 text-xs font-semibold">
            {[1, 2].map((y) => (
              <div key={y} className="flex items-center justify-between pl-1.5">
                <span className="flex items-center gap-1">
                  Year {y} <CropIcon crop={option.sequence[y - 1]} size={16} />
                </span>
                <span className="hidden pr-2 font-normal text-ink-65 sm:inline">{MONTH_SHORT[0]} to {MONTH_SHORT[11]}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => mvRef.current?.activateAR()}
          disabled={!arReady}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-50 px-4 font-bold text-brand transition active:scale-[0.98] disabled:cursor-not-allowed disabled:text-ink-45"
        >
          <Phone size={20} />
          {arReady ? 'Place it in your field (AR)' : 'AR works on a phone'}
        </button>
      </div>
    </div>
  )
}
