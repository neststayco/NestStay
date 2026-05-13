import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@shared/context/AuthContext'

export function RequireRole({ role, roles }) {
  const { token, user } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  const allowed = roles ?? [role]
  if (!allowed.includes(user?.role)) return <Navigate to="/login" replace />
  return <Outlet />
}

export function RequireAdmin() {
  return <RequireRole role="admin" />
}
