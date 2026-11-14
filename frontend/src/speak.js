// Read text aloud with the browser's built-in text-to-speech.
// English for the demo; a Hausa voice (recorded or MMS TTS) is the next step.

let current = null

export function speak(text, onEnd) {
  if (!('speechSynthesis' in window)) return false
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-GB'
  u.rate = 0.92
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith('en'))
  if (voice) u.voice = voice
  u.onend = u.onerror = () => {
    if (current === u) current = null
    onEnd?.()
  }
  current = u
  window.speechSynthesis.speak(u)
  return true
}

export function stopSpeaking() {
  current = null
  window.speechSynthesis?.cancel()
}
