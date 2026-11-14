// In development /api is proxied to the local backend (see vite.config.js).
// When deployed, VITE_API_URL is the API's address (Render passes a bare host name).
function apiBase() {
  const url = import.meta.env.VITE_API_URL
  if (!url) return '/api'
  return url.startsWith('http') ? url.replace(/\/$/, '') : `https://${url}`
}

const BASE = apiBase()

export async function getPlan({ lat, lon, current, priority }) {
  const params = new URLSearchParams({ lat, lon, current: current.join(','), priority })
  const res = await fetch(`${BASE}/plan?${params}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail || `Request failed (${res.status})`)
  }
  return res.json()
}
