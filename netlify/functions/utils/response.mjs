export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
      ...extraHeaders,
    },
  })
}

export function error(message, status = 400) {
  return json({ error: message }, status)
}

export function unauthorized() {
  return json({ error: 'No autorizado' }, 401)
}

export function notFound() {
  return json({ error: 'No encontrado' }, 404)
}
