import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@shared/context/AuthContext'
import { ToastProvider } from '@shared/components/Toast'
import ErrorBoundary from '@shared/components/ErrorBoundary'
import { RequireRole } from './components/ProtectedRoute'
import Layout from './components/Layout'
import OwnerLayout from './components/OwnerLayout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ComplaintsPage from './pages/ComplaintsPage'
import PGManagementPage from './pages/PGManagementPage'
import AdmissionsPage from './pages/AdmissionsPage'
import OwnersPage from './pages/OwnersPage'
import UserDashboardPage from './pages/UserDashboardPage'
import UserPGDetailPage from './pages/user/PGDetailPage'
import UserMyPGPage from './pages/user/MyPGPage'
import UserComplaintFormPage from './pages/user/ComplaintFormPage'
import UserAdmissionFormPage from './pages/user/AdmissionFormPage'
import OwnerDashboardPage from './pages/pgowner/DashboardPage'
import OwnerAdmissionsPage from './pages/pgowner/AdmissionsPage'
import OwnerStudentsPage from './pages/pgowner/StudentsPage'
import OwnerComplaintsPage from './pages/pgowner/ComplaintsPage'
import OwnerTestimonialsPage from './pages/pgowner/TestimonialsPage'
import OwnerPhotosPage from './pages/pgowner/PhotosPage'
import OwnerLocationPage from './pages/pgowner/LocationPage'
import OwnerCapacityPage from './pages/pgowner/CapacityPage'
import OwnerDetailsPage from './pages/pgowner/DetailsPage'
import AdminTestimonialsPage from './pages/AdminTestimonialsPage'
import AdminUsersPage from './pages/AdminUsersPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Admin area */}
              <Route element={<RequireRole role="admin" />}>
                <Route element={<Layout />}>
                  <Route path="/admin"            element={<DashboardPage />} />
                  <Route path="/admin/complaints" element={<ComplaintsPage />} />
                  <Route path="/admin/pgs"        element={<PGManagementPage />} />
                  <Route path="/admin/residency"  element={<AdmissionsPage />} />
                  <Route path="/admin/owners"          element={<OwnersPage />} />
                  <Route path="/admin/testimonials"   element={<AdminTestimonialsPage />} />
                  <Route path="/admin/users"          element={<AdminUsersPage />} />
                </Route>
              </Route>

              {/* User area */}
              <Route element={<RequireRole roles={["user"]} />}>
                <Route path="/user"                   element={<UserDashboardPage />} />
                <Route path="/user/my-pg"              element={<UserMyPGPage />} />
                <Route path="/user/pgs/:id"            element={<UserPGDetailPage />} />
                <Route path="/user/pgs/:id/complaint"  element={<UserComplaintFormPage />} />
                <Route path="/user/pgs/:id/apply"      element={<UserAdmissionFormPage />} />
              </Route>

              {/* PG Owner area */}
              <Route element={<RequireRole role="pg_owner" />}>
                <Route element={<OwnerLayout />}>
                  <Route path="/pgowner"             element={<OwnerDashboardPage />} />
                  <Route path="/pgowner/admissions"  element={<OwnerAdmissionsPage />} />
                  <Route path="/pgowner/residents"   element={<OwnerStudentsPage />} />
                  <Route path="/pgowner/complaints"    element={<OwnerComplaintsPage />} />
                  <Route path="/pgowner/testimonials" element={<OwnerTestimonialsPage />} />
                  <Route path="/pgowner/photos"      element={<OwnerPhotosPage />} />
                  <Route path="/pgowner/location"   element={<OwnerLocationPage />} />
                  <Route path="/pgowner/capacity"   element={<OwnerCapacityPage />} />
                  <Route path="/pgowner/details"    element={<OwnerDetailsPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
