import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('pg_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err.response?.status
    const config = err.config

    if (status === 401) {
      localStorage.removeItem('pg_token')
      localStorage.removeItem('pg_user')
      window.location.href = '/login'
      return Promise.reject(err)
    }

    // Auto-retry 429 only when Retry-After is short enough to be tolerable
    if (status === 429 && !config._retried429) {
      const retryAfter = parseInt(err.response?.headers?.['retry-after'] || '0', 10)
      if (retryAfter > 0 && retryAfter <= 30) {
        config._retried429 = true
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
        return client(config)
      }
    }

    // 5xx: retry once after 1 second
    if (status >= 500 && !config._retried5xx) {
      config._retried5xx = true
      await new Promise(resolve => setTimeout(resolve, 1000))
      return client(config)
    }

    return Promise.reject(err)
  }
)

export function normalizeError(err) {
  if (!err.response) {
    return {
      status: 0,
      code: 'NETWORK_ERROR',
      message: 'Network error. Check your connection and try again.',
    }
  }
  const { status, data, headers } = err.response
  if (status === 429) {
    const retryAfter = parseInt(headers?.['retry-after'] || '900', 10)
    const minutes = Math.ceil(retryAfter / 60)
    return {
      status,
      code: 'RATE_LIMITED',
      message: `Too many attempts. Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
      retryAfter,
    }
  }
  return {
    status,
    code: data?.code || String(status),
    message: data?.message || 'Something went wrong. Please try again.',
  }
}

export default client
