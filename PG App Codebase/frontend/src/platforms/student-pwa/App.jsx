import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@shared/context/AuthContext'
import { ToastProvider } from '@shared/components/Toast'
import ErrorBoundary from '@shared/components/ErrorBoundary'
import { RequireAuth } from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PGListPage from './pages/PGListPage'
import PGDetailPage from './pages/PGDetailPage'
import ComplaintFormPage from './pages/ComplaintFormPage'
import AdmissionFormPage from './pages/AdmissionFormPage'
import MyPGPage from './pages/MyPGPage'

function SmartHome() {
  const { isAdmitted, admissionLoaded } = useAuth()
  if (!admissionLoaded) return null
  return isAdmitted ? <Navigate to="/my-pg" replace /> : <PGListPage />
}

function RequireNotAdmitted({ children }) {
  const { isAdmitted, admissionLoaded } = useAuth()
  if (!admissionLoaded) return null
  return isAdmitted ? <Navigate to="/my-pg" replace /> : children
}

function RequireAdmitted() {
  const { isAdmitted, token, admissionLoaded } = useAuth()
  if (!admissionLoaded) return null
  if (!token) return <Navigate to="/login" replace />
  return isAdmitted ? <MyPGPage /> : <Navigate to="/" replace />
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route path="/" element={<SmartHome />} />
              <Route path="/my-pg" element={<RequireAdmitted />} />
              <Route path="/pgs/:id" element={<PGDetailPage />} />

              <Route element={<RequireAuth />}>
                <Route path="/pgs/:id/complaint" element={<ComplaintFormPage />} />
                <Route path="/pgs/:id/apply" element={<AdmissionFormPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
