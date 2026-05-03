const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

let _getToken = null

export function setTokenGetter(fn) {
  _getToken = fn
}

async function authHeaders() {
  if (!_getToken) return {}
  try {
    const token = await _getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

async function request(path, { method = 'GET', body, headers = {}, isForm = false } = {}) {
  const auth = await authHeaders()
  const finalHeaders = { ...auth, ...headers }
  if (!isForm && body !== undefined) finalHeaders['Content-Type'] = 'application/json'

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return null
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { detail: text }
  }
  if (!res.ok) {
    const msg = (data && data.detail) || res.statusText || 'Request failed'
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
  }
  return data
}

export const api = {
  scoreBurrito: (file) => {
    const fd = new FormData()
    fd.append('image', file)
    return request('/score', { method: 'POST', body: fd, isForm: true })
  },
  getFeed: (cursor) =>
    request(`/burritos/feed${cursor ? `?cursor=${cursor}` : ''}`),
  getLeaderboard: (period = 'all') =>
    request(`/burritos/leaderboard?period=${period}`),
  getMyBurritos: () => request('/burritos/me'),
  getBurrito: (id) => request(`/burritos/${id}`),
  deleteBurrito: (id) => request(`/burritos/${id}`, { method: 'DELETE' }),
  vote: (id, value) =>
    request(`/burritos/${id}/vote`, { method: 'POST', body: { value } }),
}
