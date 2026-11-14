import { useEffect, useState } from 'react'
import { speak, stopSpeaking } from '../speak'
import { Speaker, Stop } from './Icons'

/*
  Read-aloud button.
  variant: 'pill' (default), 'primary', 'onDark', 'icon'
*/
export default function SpeakButton({ text, label = 'Listen', variant = 'pill', className = '' }) {
  const [playing, setPlaying] = useState(false)

  // Stop reading if this button disappears.
  useEffect(() => () => stopSpeaking(), [])

  function toggle() {
    if (playing) {
      stopSpeaking()
      setPlaying(false)
    } else if (speak(text, () => setPlaying(false))) {
      setPlaying(true)
    }
  }

  const icon = playing ? <Stop size={20} /> : <Speaker size={20} />
  const name = playing ? 'Stop' : label

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Stop reading' : label}
        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-95 ${playing ? 'bg-brand text-paper' : 'bg-brand-50 text-brand'} ${className}`}
      >
        {icon}
      </button>
    )
  }

  const styles = {
    pill: playing ? 'bg-brand text-paper' : 'bg-brand-50 text-brand',
    primary: 'bg-brand text-paper shadow-[0_6px_16px_-6px_rgb(30_122_68/0.6)]',
    onDark: playing ? 'bg-paper text-brand' : 'bg-paper/15 text-paper backdrop-blur',
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={playing ? 'Stop reading' : label}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-bold transition active:scale-[0.98] ${styles[variant]} ${className}`}
    >
      {icon}
      {name}
    </button>
  )
}
