// Design system components for the Season Planner app.
import { Back } from './components/Icons'

// Photo in the green/white treatment (see #duotone in index.html)
export function Photo({ src, alt = '', className = '' }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`h-full w-full object-cover ${className}`}
      style={{ filter: 'url(#duotone)' }}
    />
  )
}

const BUTTON = {
  primary: 'bg-brand text-paper shadow-[0_6px_16px_-6px_rgb(30_122_68/0.6)] active:bg-brand-700',
  secondary: 'bg-brand-50 text-brand active:bg-brand-100',
  white: 'bg-paper text-brand active:bg-brand-50',
  ghost: 'text-brand active:bg-brand-50',
}

export function Button({ children, onClick, disabled, variant = 'primary', size = 'lg', className = '', ...rest }) {
  const sizes = { lg: 'h-14 px-6 text-base', md: 'h-12 px-5 text-[15px]', sm: 'h-10 px-4 text-sm' }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-bold transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 ${sizes[size]} ${BUTTON[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function IconButton({ children, onClick, label, variant = 'secondary', className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-95 ${BUTTON[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

// Top bar used on the setup screens
export function AppBar({ onBack, title, right }) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-1 px-2">
      {onBack ? (
        <IconButton onClick={onBack} label="Back" variant="ghost">
          <Back />
        </IconButton>
      ) : (
        <span className="w-11" />
      )}
      <p className="flex-1 text-center text-[15px] font-bold">{title}</p>
      <span className="flex w-11 justify-end">{right}</span>
    </div>
  )
}

// Progress dots for the 2-step setup
export function Steps({ at, total = 2 }) {
  return (
    <div className="flex gap-1.5" aria-label={`Step ${at} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-1.5 rounded-full transition-all ${i < at ? 'w-6 bg-brand' : 'w-1.5 bg-ink-12'}`} />
      ))}
    </div>
  )
}

export function Card({ children, className = '' }) {
  return <div className={`rounded-3xl bg-paper shadow-card ${className}`}>{children}</div>
}

export function Chip({ children, tone = 'brand', className = '' }) {
  const tones = {
    brand: 'bg-brand-100 text-brand-700',
    white: 'bg-paper/95 text-ink',
    dark: 'bg-ink/70 text-paper backdrop-blur',
  }
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone]} ${className}`}>{children}</span>
}

// 3-step meter: 1 = low, 3 = high
export function Meter({ level }) {
  return (
    <div className="flex gap-1" aria-hidden>
      {[1, 2, 3].map((i) => (
        <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= level ? 'bg-brand' : 'bg-brand-100'}`} />
      ))}
    </div>
  )
}

export function SectionTitle({ children, action }) {
  return (
    <div className="mb-3 flex items-baseline justify-between px-1">
      <h3 className="t-heading">{children}</h3>
      {action}
    </div>
  )
}
