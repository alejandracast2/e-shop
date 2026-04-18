export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:4000'

const parsePayload = async (response) => {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  return text ? { message: text } : null
}

const resolveErrorMessage = (payload, fallback) => {
  if (!payload) return fallback
  if (typeof payload === 'string') return payload
  if (Array.isArray(payload.message)) return payload.message.join(', ')
  if (typeof payload.message === 'string') return payload.message
  if (typeof payload.error === 'string') return payload.error
  return fallback
}

export const toErrorMessage = (error, fallback = 'No fue posible completar la operacion.') =>
  error instanceof Error ? error.message : fallback

export const apiRequest = async (path, options = {}) => {
  const { method = 'GET', body, token, headers = {} } = options
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const payload = await parsePayload(response)

  if (!response.ok) {
    throw new Error(resolveErrorMessage(payload, 'El backend respondio con un error.'))
  }

  return payload
}
