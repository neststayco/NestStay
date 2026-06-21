import { createContext, useContext, useState, useEffect } from 'react'
import { getMyAdmission } from '../api/admissions'
import { getUserInteractions, toggleSave as apiToggleSave } from '../api/user'
import { normalizeAdmission } from '../utils/normalizeAdmission'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('pg_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [token, setToken] = useState(() => localStorage.getItem('pg_token'))
  const [currentAdmission, setCurrentAdmission] = useState(null)
  const [admissionLoaded, setAdmissionLoaded] = useState(false)
  const [savedPGIds, setSavedPGIds] = useState(new Set())

  useEffect(() => {
    function handleAuthUpdated(event) {
      const nextToken = event.detail?.token ?? localStorage.getItem('pg_token')
      const nextUser = event.detail?.user ?? (() => {
        try {
          const saved = localStorage.getItem('pg_user')
          return saved ? JSON.parse(saved) : null
        } catch {
          return null
        }
      })()

      setToken(nextToken)
      setUser(nextUser)
    }

    window.addEventListener('auth:updated', handleAuthUpdated)
    return () => window.removeEventListener('auth:updated', handleAuthUpdated)
  }, [])

  useEffect(() => {
    if (!token || !user || user.role !== 'user') {
      setCurrentAdmission(null)
      setAdmissionLoaded(true)
      setSavedPGIds(new Set())
      return
    }
    getMyAdmission()
      .then(res => setCurrentAdmission(normalizeAdmission(res.data)))
      .catch(() => setCurrentAdmission(null))
      .finally(() => setAdmissionLoaded(true))

    getUserInteractions()
      .then(res => {
        setSavedPGIds(new Set(res.data.savedPGs))
      })
      .catch(() => {})
  }, [token, user?.role])

  function login(tokenValue, userData) {
    localStorage.setItem('pg_token', tokenValue)
    localStorage.setItem('pg_user', JSON.stringify(userData))
    setToken(tokenValue)
    setUser(userData)
  }

  function updateUser(updates) {
    setUser(prev => {
      const next = { ...prev, ...updates }
      localStorage.setItem('pg_user', JSON.stringify(next))
      return next
    })
  }

  function logout() {
    localStorage.removeItem('pg_token')
    localStorage.removeItem('pg_user')
    setToken(null)
    setUser(null)
    setCurrentAdmission(null)
    setAdmissionLoaded(false)
    setSavedPGIds(new Set())
  }

  async function toggleSave(pgId) {
    const wasSaved = savedPGIds.has(pgId)
    setSavedPGIds(prev => {
      const next = new Set(prev)
      wasSaved ? next.delete(pgId) : next.add(pgId)
      return next
    })
    try {
      await apiToggleSave(pgId)
    } catch {
      setSavedPGIds(prev => {
        const next = new Set(prev)
        wasSaved ? next.add(pgId) : next.delete(pgId)
        return next
      })
    }
  }

  const isAdmitted = currentAdmission?.residentStatus === 'active'

  return (
    <AuthContext.Provider value={{
      user, token, login, logout, updateUser,
      currentAdmission, setCurrentAdmission, isAdmitted, admissionLoaded,
      savedPGIds, toggleSave,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
