// Hand-drawn line icons. All use currentColor, so they follow the two-colour palette.

function Svg({ size = 24, children, className = '', strokeWidth = 1.75, title }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {children}
    </svg>
  )
}

// ---- crops ----

export const Maize = (p) => (
  <Svg {...p}>
    <path d="M12 3.5c1.9 0 3.2 2.8 3.2 6.5S13.9 17 12 17s-3.2-3.3-3.2-7S10.1 3.5 12 3.5z" />
    <path d="M9.4 7.5h5.2M9 10.5h6M9.4 13.5h5.2M12 3.5V17" />
    <path d="M12 21c-3.6-1-6-4.5-5.4-9.5 1.8 1.2 3 3 3.6 5.2M12 21c3.6-1 6-4.5 5.4-9.5-1.8 1.2-3 3-3.6 5.2" />
  </Svg>
)

export const Sorghum = (p) => (
  <Svg {...p}>
    <path d="M12 21v-9.5" />
    <path d="M12 17c-2.8-.3-4.8-2-5.6-4.6 2.6-.1 4.6 1.4 5.6 4.6z" />
    <circle cx="12" cy="4" r="1.5" />
    <circle cx="10" cy="6.6" r="1.5" />
    <circle cx="14" cy="6.6" r="1.5" />
    <circle cx="12" cy="9.2" r="1.5" />
    <circle cx="9.6" cy="9.8" r="1.2" />
    <circle cx="14.4" cy="9.8" r="1.2" />
  </Svg>
)

export const Millet = (p) => (
  <Svg {...p}>
    <rect x="10.4" y="2.5" width="3.2" height="10" rx="1.6" />
    <path d="M10.4 5.5h3.2M10.4 8h3.2M10.4 10.5h3.2" />
    <path d="M12 12.5V21" />
    <path d="M12 18c2.9-.2 5-1.9 5.8-4.6-2.7 0-4.8 1.5-5.8 4.6z" />
  </Svg>
)

export const Cowpea = (p) => (
  <Svg {...p}>
    <path d="M3.5 12.5c3.5 5 12.5 5 17-3.5-1-.5-2-.4-2.6.4-3.4 4.3-9 4.6-12.6 2.4-.8-.4-1.4.1-1.8.7z" />
    <circle cx="8" cy="14.2" r="1" />
    <circle cx="11.5" cy="14.6" r="1" />
    <circle cx="15" cy="13" r="1" />
    <path d="M20.5 9c.5-2-.2-4-2-5" />
  </Svg>
)

export const Groundnut = (p) => (
  <Svg {...p}>
    <path d="M8.2 3.8c2.8-1 5.4 1 5.3 3.7 0 1.2.6 2 1.6 2.6 2.4 1.4 3.2 4.4 1.7 6.8-1.6 2.6-5.2 3.4-7.5 1.6-1.4-1.1-1.9-2.6-2-4.1 0-1-.5-1.6-1.3-2.3-2.3-2-1.4-7.1 2.2-8.3z" />
    <path d="M8 7.5h.01M10.5 6h.01M9 10h.01M13 13h.01M15.5 14.5h.01M12 16.5h.01" strokeWidth="2.4" />
  </Svg>
)

export const CROP_ICON = { maize: Maize, sorghum: Sorghum, millet: Millet, cowpea: Cowpea, groundnut: Groundnut }

export function CropIcon({ crop, ...p }) {
  const C = CROP_ICON[crop]
  return C ? <C {...p} /> : null
}

// ---- interface ----

export const Speaker = (p) => (
  <Svg {...p}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </Svg>
)

export const Stop = (p) => (
  <Svg {...p}>
    <rect x="6.5" y="6.5" width="11" height="11" rx="1" />
  </Svg>
)

export const Play = (p) => (
  <Svg {...p}>
    <path d="M8 5.5v13l10.5-6.5z" />
  </Svg>
)

export const Pause = (p) => (
  <Svg {...p}>
    <path d="M8.5 5.5v13M15.5 5.5v13" strokeWidth="2.4" />
  </Svg>
)

export const Phone = (p) => (
  <Svg {...p}>
    <rect x="7" y="2.5" width="10" height="19" rx="2" />
    <path d="M10.5 18.5h3" />
  </Svg>
)

export const Arrow = (p) => (
  <Svg {...p}>
    <path d="M4 12h15M14 7l5 5-5 5" />
  </Svg>
)

export const Check = (p) => (
  <Svg {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
)

export const Pin = (p) => (
  <Svg {...p}>
    <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" />
    <circle cx="12" cy="10" r="2.3" />
  </Svg>
)

export const Back = (p) => (
  <Svg {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Svg>
)

export const Close = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
)

export const Sprout = (p) => (
  <Svg {...p}>
    <path d="M12 21v-9" />
    <path d="M12 13c-4.5 0-7-2.7-7-7.5 4.5 0 7 2.7 7 7.5z" />
    <path d="M12 10.5c0-4 2.2-6.5 6.5-6.5 0 4-2.2 6.5-6.5 6.5z" />
  </Svg>
)

export const Calendar = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
  </Svg>
)

export const Layers = (p) => (
  <Svg {...p}>
    <path d="M12 4l8.5 4.5L12 13 3.5 8.5z" />
    <path d="M3.5 12.5L12 17l8.5-4.5M3.5 16.5L12 21l8.5-4.5" />
  </Svg>
)

export const Bag = (p) => (
  <Svg {...p}>
    <path d="M7 6.5h10l1.5 14h-13z" />
    <path d="M7 6.5c0-1.6 1-3 2.5-3h5c1.5 0 2.5 1.4 2.5 3" />
    <path d="M9.5 12.5h5" />
  </Svg>
)

export const Cube = (p) => (
  <Svg {...p}>
    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
    <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
  </Svg>
)

export const Rain = (p) => (
  <Svg {...p}>
    <path d="M7 15a4.5 4.5 0 0 1-.5-9 5.5 5.5 0 0 1 10.5 1.5A3.8 3.8 0 0 1 17 15z" />
    <path d="M8 18l-1 2.5M12 18l-1 2.5M16 18l-1 2.5" />
  </Svg>
)

export const Sun = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
  </Svg>
)

export const Harvest = (p) => (
  <Svg {...p}>
    <path d="M4 12h16l-1.5 8h-13z" />
    <path d="M8 12c0-3 1-6 4-8 3 2 4 5 4 8" />
  </Svg>
)
