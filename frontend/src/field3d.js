// Builds a small 3D "diorama" of the farmer's field for a given rotation, year and month.
// The same group is shown on screen (three.js) and exported as GLB for AR (model-viewer).
// Sizes are in metres so the field appears about 2 m wide when placed in AR.

import * as THREE from 'three'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { dayOfYear } from './crops'

const DAYS_BEFORE = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
export const midMonthDoy = (m) => DAYS_BEFORE[m - 1] + 15

const PLOT = 1.6
const ROWS = 7
const PER_ROW = 7

// ---------- shared materials & geometry (re-used across rebuilds) ----------
// Two colours only: every material is a mix of ink green and paper.
const INK = new THREE.Color('#0f3320')
const PAPER = new THREE.Color('#ffffff')
const BRAND = new THREE.Color('#1e7a44')
// 0 = white, 0.6 = leaf green, 1 = deep green
export const tone = (t) => {
  const x = Math.min(1, Math.max(0, t))
  return x <= 0.6 ? PAPER.clone().lerp(BRAND, x / 0.6) : BRAND.clone().lerp(INK, (x - 0.6) / 0.4)
}

const mat = (t, extra = {}) => new THREE.MeshStandardMaterial({ color: tone(t), roughness: 0.9, metalness: 0, ...extra })
const M = {
  grass: mat(0.62),
  grassDark: mat(0.65),
  post: mat(0.9),
  leafYoung: mat(0.55),
  leaf: mat(0.82),
  leafDark: mat(0.9),
  straw: mat(0.28),
  strawDark: mat(0.42),
  cob: mat(0.08),
  sorghumHead: mat(0.95),
  milletSpike: mat(0.6),
  pod: mat(0.3),
  flower: mat(0.0),
  rain: mat(0.7, { transparent: true, opacity: 0.6, roughness: 0.3 }),
  cloud: mat(0.02, { roughness: 1 }),
  cloudGrey: mat(0.22, { roughness: 1 }),
  sun: mat(0.0, { emissive: tone(0), emissiveIntensity: 0.6 }),
  mulch: mat(0.4),
}
const G = {
  stem: new THREE.CylinderGeometry(0.006, 0.009, 1, 6),
  leaf: new THREE.BoxGeometry(0.11, 0.004, 0.022),
  cob: new THREE.CylinderGeometry(0.014, 0.012, 0.06, 8),
  head: new THREE.IcosahedronGeometry(0.026, 0),
  spike: new THREE.CylinderGeometry(0.011, 0.009, 0.1, 8),
  bush: new THREE.IcosahedronGeometry(0.035, 0),
  pod: new THREE.CapsuleGeometry(0.006, 0.03, 2, 6),
  flower: new THREE.IcosahedronGeometry(0.008, 0),
  drop: new THREE.CylinderGeometry(0.003, 0.003, 0.07, 4),
  cloud: new THREE.IcosahedronGeometry(0.14, 1),
  sun: new THREE.IcosahedronGeometry(0.11, 2),
  post: new THREE.BoxGeometry(0.035, 0.22, 0.035),
  rail: new THREE.BoxGeometry(1, 0.02, 0.015),
  stubble: new THREE.CylinderGeometry(0.006, 0.007, 0.05, 5),
  mulch: new THREE.BoxGeometry(0.05, 0.006, 0.012),
}

// Deterministic pseudo-random so the field doesn't "shuffle" between months
function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}


function add(parent, geo, material, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1] } = {}) {
  const m = new THREE.Mesh(geo, material)
  m.position.set(...p)
  m.rotation.set(...r)
  m.scale.set(...s)
  m.castShadow = true
  m.receiveShadow = true
  parent.add(m)
  return m
}

// ---------- crops ----------
function cereal(g, ready, rand, { height, head }) {
  const plant = new THREE.Group()
  const h = height * Math.max(0.15, g)
  const leafMat = ready ? M.straw : g < 0.35 ? M.leafYoung : M.leaf
  add(plant, G.stem, ready ? M.strawDark : M.leaf, { p: [0, h / 2, 0], s: [1, h, 1] })
  const leaves = g < 0.3 ? 2 : 4
  for (let i = 0; i < leaves; i++) {
    const y = h * (0.25 + 0.17 * i)
    const a = i * 2.2 + rand() * 0.6
    const leaf = new THREE.Group()
    leaf.position.set(0, y, 0)
    leaf.rotation.y = a
    add(leaf, G.leaf, leafMat, { p: [0.05 * Math.max(0.5, g), 0, 0], r: [0, 0, -0.45], s: [Math.max(0.5, g), 1, 1] })
    plant.add(leaf)
  }
  if (g > 0.65) head(plant, h, ready)
  return plant
}

const CROP_BUILDERS = {
  maize: (g, ready, rand) =>
    cereal(g, ready, rand, {
      height: 0.42,
      head: (plant, h, rdy) => {
        add(plant, G.cob, rdy ? M.straw : M.cob, { p: [0.018, h * 0.55, 0], r: [0, 0, -0.35] })
        add(plant, G.spike, M.strawDark, { p: [0, h + 0.03, 0], s: [0.4, 0.6, 0.4] })
      },
    }),
  sorghum: (g, ready, rand) =>
    cereal(g, ready, rand, {
      height: 0.46,
      head: (plant, h) => add(plant, G.head, M.sorghumHead, { p: [0, h + 0.02, 0], s: [1, 1.5, 1] }),
    }),
  millet: (g, ready, rand) =>
    cereal(g, ready, rand, {
      height: 0.44,
      head: (plant, h) => add(plant, G.spike, M.milletSpike, { p: [0, h + 0.05, 0] }),
    }),
  cowpea: (g, ready, rand) => legume(g, ready, rand, { spread: 1.15, pods: true }),
  groundnut: (g, ready, rand) => legume(g, ready, rand, { spread: 0.95, pods: false }),
}

function legume(g, ready, rand, { spread, pods }) {
  const plant = new THREE.Group()
  const k = Math.max(0.25, g) * spread
  const blobs = 5
  for (let i = 0; i < blobs; i++) {
    const a = (i / blobs) * Math.PI * 2 + rand()
    const d = i === 0 ? 0 : 0.03 * k
    add(plant, G.bush, ready ? M.straw : i % 2 ? M.leaf : M.leafDark, {
      p: [Math.cos(a) * d, 0.025 * k + (i === 0 ? 0.015 * k : 0), Math.sin(a) * d],
      s: [k, 0.75 * k, k],
    })
  }
  if (g > 0.45 && g < 0.8 && !ready) {
    for (let i = 0; i < 3; i++) add(plant, G.flower, M.flower, { p: [(rand() - 0.5) * 0.06, 0.06 * k, (rand() - 0.5) * 0.06] })
  }
  if (pods && g >= 0.75) {
    for (let i = 0; i < 4; i++)
      add(plant, G.pod, M.pod, { p: [(rand() - 0.5) * 0.07, 0.05 * k, (rand() - 0.5) * 0.07], r: [Math.PI / 2, rand() * 3, 0] })
  }
  return plant
}

// ---------- crop state for a month ----------
export function cropState(cal, month) {
  if (!cal) return { phase: 'bare', g: 0 }
  const doy = midMonthDoy(month)
  const plant = dayOfYear(cal.plant_from)
  const mature = dayOfYear(cal.harvest_from)
  const done = dayOfYear(cal.harvest_to)
  if (doy < plant - 10) return { phase: 'bare', g: 0 }
  if (doy < plant) return { phase: 'prepare', g: 0 }
  if (doy < mature) return { phase: 'growing', g: Math.max(0.12, (doy - plant) / (mature - plant)) }
  if (doy <= done) return { phase: 'harvest', g: 1 }
  return { phase: 'after', g: 0 }
}

// ---------- the whole field ----------
export function buildField({ crop, cal, month, monthly, residue }) {
  const root = new THREE.Group()
  root.name = 'SeasonPlannerField'
  const rand = rng(42)
  const m = monthly[month - 1]
  const state = cropState(cal, month)

  // Grass surround and soil bed. Soil darkens with NASA root-zone soil wetness.
  add(root, new THREE.BoxGeometry(PLOT + 0.5, 0.06, PLOT + 0.5), M.grass, { p: [0, -0.03, 0] })
  const wet = (m.root_soil_wetness - 0.2) / 0.35
  // Soil darkens with NASA root-zone wetness: dry = light, wet = darker
  const soilMat = mat(0.2 + 0.15 * Math.min(1, Math.max(0, wet)))
  const ridgeMat = mat(0.27 + 0.15 * Math.min(1, Math.max(0, wet)))
  add(root, new THREE.BoxGeometry(PLOT, 0.08, PLOT), soilMat, { p: [0, 0.04, 0] })

  const rowGap = PLOT / ROWS
  const ridged = state.phase !== 'bare'
  for (let r = 0; r < ROWS; r++) {
    const z = -PLOT / 2 + rowGap * (r + 0.5)
    if (ridged) add(root, new THREE.BoxGeometry(PLOT - 0.06, 0.035, rowGap * 0.45), ridgeMat, { p: [0, 0.095, z] })

    for (let i = 0; i < PER_ROW; i++) {
      const x = -PLOT / 2 + (PLOT / PER_ROW) * (i + 0.5) + (rand() - 0.5) * 0.04
      const jitterZ = (rand() - 0.5) * 0.03
      const base = [x, 0.11, z + jitterZ]
      if (state.phase === 'growing' || state.phase === 'harvest') {
        const plant = CROP_BUILDERS[crop](state.g, state.phase === 'harvest', rand)
        plant.position.set(...base)
        plant.rotation.y = rand() * Math.PI * 2
        plant.scale.setScalar(0.9 + rand() * 0.2)
        root.add(plant)
      } else if ((state.phase === 'after' || state.phase === 'bare') && residue) {
        // Crop residue left as mulch protects the soil in the dry season.
        add(root, G.mulch, M.mulch, { p: [x, 0.085, z + jitterZ], r: [0, rand() * 3, 0] })
        if (rand() > 0.5) add(root, G.stubble, M.strawDark, { p: [x + 0.02, 0.1, z], r: [0, 0, 0.2] })
      }
    }
  }

  // Fence
  const half = PLOT / 2 + 0.17
  for (const [x, z] of [[-half, -half], [half, -half], [half, half], [-half, half]]) {
    add(root, G.post, M.post, { p: [x, 0.11, z] })
  }
  for (const [p, ry] of [[[0, 0.16, -half], 0], [[0, 0.16, half], 0], [[-half, 0.16, 0], Math.PI / 2], [[half, 0.16, 0], Math.PI / 2]]) {
    add(root, G.rail, M.post, { p, r: [0, ry, 0], s: [half * 2, 1, 1] })
  }

  // Weather: clouds and rain from NASA monthly rainfall, sun on hot months.
  const sky = new THREE.Group()
  sky.name = 'Weather'
  if (m.rain_mm > 25) {
    const grey = m.rain_mm > 120
    for (const [x, z, s] of [[-0.4, -0.2, 1.2], [0.1, 0.15, 1.5], [0.55, -0.1, 1.1], [-0.05, -0.35, 1]]) {
      add(sky, G.cloud, grey ? M.cloudGrey : M.cloud, { p: [x, 1.25, z], s: [s * 1.4, s * 0.6, s] })
    }
    const drops = Math.min(140, Math.round(m.rain_mm / 2))
    for (let i = 0; i < drops; i++) {
      add(sky, G.drop, M.rain, { p: [(rand() - 0.5) * PLOT, 0.3 + rand() * 0.85, (rand() - 0.5) * PLOT] })
    }
  } else if (m.tmax_c >= 33) {
    add(sky, G.sun, M.sun, { p: [0.7, 1.15, -0.6], s: [1 + (m.tmax_c - 33) / 10, 1 + (m.tmax_c - 33) / 10, 1 + (m.tmax_c - 33) / 10] })
  }
  root.add(sky)

  return { group: root, state }
}

// Free the per-build geometry/materials (shared ones are kept).
const SHARED = new Set([...Object.values(G), ...Object.values(M)])
export function disposeField(group) {
  group.traverse((o) => {
    if (!o.isMesh) return
    if (!SHARED.has(o.geometry)) o.geometry.dispose()
    if (!SHARED.has(o.material)) o.material.dispose()
  })
}

export function exportGLB(object) {
  return new Promise((resolve, reject) => {
    new GLTFExporter().parse(
      object,
      (glb) => resolve(new Blob([glb], { type: 'model/gltf-binary' })),
      reject,
      { binary: true },
    )
  })
}
