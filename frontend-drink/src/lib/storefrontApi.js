const FALLBACK_API_URL = 'http://localhost:4000'
const CUSTOMER_SESSION_STORAGE_KEY = 'frontend-drink-customer-session'

function sanitizeBaseUrl(baseUrl) {
  return (baseUrl || FALLBACK_API_URL).replace(/\/+$/, '')
}

function appendQueryValue(searchParams, key, value) {
  if (Array.isArray(value)) {
    value.forEach((entry) => appendQueryValue(searchParams, key, entry))
    return
  }

  if (value === undefined || value === null || value === '') {
    return
  }

  searchParams.append(key, String(value))
}

function buildQueryString(query = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    appendQueryValue(searchParams, key, value)
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

async function parseResponseBody(response) {
  const rawBody = await response.text()

  if (!rawBody) {
    return null
  }

  try {
    return JSON.parse(rawBody)
  } catch {
    return rawBody
  }
}

function resolveErrorMessage(payload, status) {
  const fallbackMessage = `Request failed (${status})`

  if (!payload) {
    return fallbackMessage
  }

  if (typeof payload === 'string') {
    return payload
  }

  if (Array.isArray(payload.message)) {
    return payload.message.join(', ')
  }

  if (typeof payload.message === 'string') {
    return payload.message
  }

  return fallbackMessage
}

export const storefrontEnvironment = {
  apiUrl: sanitizeBaseUrl(import.meta.env.VITE_API_URL || FALLBACK_API_URL),
  storeSlug: import.meta.env.VITE_STORE_SLUG,
  storeId: import.meta.env.VITE_STORE_ID,
}

export function buildStorefrontHeaders(customHeaders = {}, hasBody = false) {
  const headers = {
    Accept: 'application/json',
    ...customHeaders,
  }

  if (hasBody && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  if (storefrontEnvironment.storeSlug && !headers['x-store-slug']) {
    headers['x-store-slug'] = storefrontEnvironment.storeSlug
  }

  if (storefrontEnvironment.storeId && !headers['x-store-id']) {
    headers['x-store-id'] = storefrontEnvironment.storeId
  }

  const accessToken = getCustomerAccessToken()
  if (accessToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  return headers
}

function getCustomerAccessToken() {
  if (typeof window === 'undefined') return ''

  try {
    const session = JSON.parse(window.localStorage.getItem(CUSTOMER_SESSION_STORAGE_KEY) || '{}')
    return typeof session.accessToken === 'string' ? session.accessToken : ''
  } catch {
    return ''
  }
}

export async function storefrontRequest(path, options = {}) {
  const { method = 'GET', query, body, headers } = options
  const hasBody = body !== undefined
  const requestUrl = `${storefrontEnvironment.apiUrl}${path}${buildQueryString(query)}`

  const response = await fetch(requestUrl, {
    method,
    headers: buildStorefrontHeaders(headers, hasBody),
    ...(hasBody ? { body: JSON.stringify(body) } : {}),
  })

  const payload = await parseResponseBody(response)

  if (!response.ok) {
    throw new Error(resolveErrorMessage(payload, response.status))
  }

  return payload
}
