import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@shared/context/AuthContext'

export function RequireAuth() {
  const { token } = useAuth()
  return token ? <Outlet /> : <Navigate to="/login" replace />
}
