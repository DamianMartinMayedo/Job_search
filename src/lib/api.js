const BASE_URL = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })

  const contentType = res.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text()
    throw new Error(
      `Respuesta inesperada del servidor (${res.status}): ${text.slice(0, 100)}`
    )
  }

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Error del servidor')
  }

  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) =>
    request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) =>
    request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
}

export const authApi = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
}
