import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true,
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('pg_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Silent refresh state
let isRefreshing = false
let pendingRetries = []

client.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err.response?.status
    const config = err.config

    if (status === 401 && !config._isRetry) {
      // Queue concurrent 401s while refresh is in flight
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRetries.push({ resolve, reject, config })
        })
      }

      isRefreshing = true

      try {
        const { data } = await client.post('/auth/refresh', {}, { _isRetry: true })
        const newToken = data.accessToken
        localStorage.setItem('pg_token', newToken)
        if (data.data) {
          localStorage.setItem('pg_user', JSON.stringify(data.data))
        }
        window.dispatchEvent(new CustomEvent('auth:updated', {
          detail: { token: newToken, user: data.data || null },
        }))
        isRefreshing = false

        // Drain the queue
        pendingRetries.forEach(({ resolve, config: retryConfig }) => {
          retryConfig.headers.Authorization = `Bearer ${newToken}`
          retryConfig._isRetry = true
          resolve(client(retryConfig))
        })
        pendingRetries = []

        // Retry original request
        config.headers.Authorization = `Bearer ${newToken}`
        config._isRetry = true
        return client(config)
      } catch {
        isRefreshing = false
        pendingRetries.forEach(({ reject }) => reject(new Error('Session expired')))
        pendingRetries = []
        localStorage.removeItem('pg_token')
        localStorage.removeItem('pg_user')
        window.location.href = '/login'
        return Promise.reject(err)
      }
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
