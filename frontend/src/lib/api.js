import { reactive } from 'vue'

const read = (k) => { try { return localStorage.getItem(k) } catch { return null } }
const write = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v) } catch { /* ignore */ } }

export const auth = reactive({ name: read('ttrpg.name') || '', token: read('ttrpg.gm') || '', member: null })
export const setName = (n) => { auth.name = n; write('ttrpg.name', n) }
export const setToken = (t) => { auth.token = t || ''; write('ttrpg.gm', t) }

async function request(method, url, body, headers = {}) {
  const h = { ...headers }
  if (auth.token) h.Authorization = `Bearer ${auth.token}`
  const isBin = body instanceof Blob
  if (body !== undefined && !isBin) h['Content-Type'] = 'application/json'
  const init = { method, headers: h }
  if (body !== undefined) init.body = isBin ? body : JSON.stringify(body)
  const res = await fetch(`/api${url}`, init)
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && !url.startsWith('/auth/')) auth.member = false
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

export const api = {
  get: (u) => request('GET', u),
  post: (u, b = {}) => request('POST', u, b),
  patch: (u, b) => request('PATCH', u, b),
  del: (u) => request('DELETE', u),
  upload: (u, blob) => request('POST', u, blob, { 'Content-Type': blob.type }),
}

export async function checkSession() {
  try {
    const me = await request('GET', '/auth/me')
    auth.member = me.member
    if (auth.token && !me.gm) setToken('')
  } catch { auth.member = false }
}
export async function joinGroup(name, password) {
  await request('POST', '/auth/join', { password })
  setName(name)
  auth.member = true
}
export async function leaveGroup() {
  await request('POST', '/auth/leave', {})
  setToken('')
  auth.member = false
}

export async function loginGm(pin) {
  const { token } = await api.post('/auth/gm', { pin })
  setToken(token)
}

// Live updates (SSE). Handlers receive {type, id}. EventSource auto-reconnects.
const listeners = new Set()
let es
export function onEvent(fn) {
  listeners.add(fn)
  if (!es) {
    es = new EventSource('/api/events')
    es.onmessage = (e) => { const d = JSON.parse(e.data); listeners.forEach((l) => l(d)) }
  }
  return () => listeners.delete(fn)
}
