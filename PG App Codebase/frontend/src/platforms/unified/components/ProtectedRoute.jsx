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

export function RequireOwnerApproved() {
  const { token, user } = useAuth()

  if (!token) return <Navigate to="/login" replace />
  if (user?.role !== 'pg_owner') return <Navigate to="/login" replace />

  const status = user?.onboardingStatus

  if (status === 'profile_incomplete') {
    return <Navigate to="/pgowner/onboarding" replace />
  }
  if (status === 'pending_review') {
    return <Navigate to="/pgowner/waiting-approval" replace />
  }
  if (status === 'rejected') {
    return <Navigate to="/pgowner/rejected" replace />
  }

  // "approved", "legacy", or undefined → allow dashboard access
  return <Outlet />
}
