import { createContext, useContext, useState, useEffect } from 'react'
import { getMyAdmission } from '../api/admissions'
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

  useEffect(() => {
    if (!token || !user || user.role !== 'user') {
      setCurrentAdmission(null)
      setAdmissionLoaded(true)
      return
    }
    getMyAdmission()
      .then(res => setCurrentAdmission(normalizeAdmission(res.data)))
      .catch(() => setCurrentAdmission(null))
      .finally(() => setAdmissionLoaded(true))
  }, [token, user?.role])

  function login(tokenValue, userData) {
    localStorage.setItem('pg_token', tokenValue)
    localStorage.setItem('pg_user', JSON.stringify(userData))
    setToken(tokenValue)
    setUser(userData)
  }

  function logout() {
    localStorage.removeItem('pg_token')
    localStorage.removeItem('pg_user')
    setToken(null)
    setUser(null)
    setCurrentAdmission(null)
    setAdmissionLoaded(false)
  }

  const isAdmitted = currentAdmission?.status === 'admitted'

  return (
    <AuthContext.Provider value={{ user, token, login, logout, currentAdmission, setCurrentAdmission, isAdmitted, admissionLoaded }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
