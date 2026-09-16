import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { ProtectedRoute } from './components/common/ProtectedRoute';

import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { DoctorPortalPage } from './pages/DoctorPortalPage';
import { PatientDashboardPage } from './pages/PatientDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { DoctorReviewPage } from './pages/DoctorReviewPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { MeetingRoomPage } from './pages/MeetingRoomPage';

import './App.css';

function AppContent() {
  const location = useLocation();

  // Dashboard & meeting rooms provide their own dedicated layout shell (sidebar/topbar/full-screen)
  const isDashboardOrMeeting =
    location.pathname.startsWith('/patient') ||
    location.pathname.startsWith('/doctor') ||
    location.pathname.startsWith('/admin/dashboard') ||
    location.pathname.startsWith('/admin/doctors') ||
    location.pathname.startsWith('/meetings');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isDashboardOrMeeting && <Navbar />}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected Patient Routes */}
          <Route path="/patient/dashboard" element={<Navigate to="/patient/dashboard/book" replace />} />
          <Route
            path="/patient/dashboard/:section"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Doctor Onboarding / Verification Routes */}
          <Route path="/doctor/portal" element={<Navigate to="/doctor/portal/consultations" replace />} />
          <Route
            path="/doctor/portal/:section"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorPortalPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Telemedicine 1-to-1 Video Consultation Room */}
          <Route
            path="/meetings/:meetingId"
            element={
              <ProtectedRoute allowedRoles={['doctor', 'patient', 'saas_admin']}>
                <MeetingRoomPage />
              </ProtectedRoute>
            }
          />

          {/* Protected SaaS Admin Routes */}
          <Route path="/admin/dashboard" element={<Navigate to="/admin/dashboard/pending" replace />} />
          <Route
            path="/admin/dashboard/:section"
            element={
              <ProtectedRoute allowedRoles={['saas_admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/doctors/:doctorUserId"
            element={
              <ProtectedRoute allowedRoles={['saas_admin']}>
                <DoctorReviewPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Simple footer for non-dashboard, non-homepage pages (login, signup, etc.) */}
      {!isDashboardOrMeeting && location.pathname !== '/' && (
        <footer style={{ background: '#ffffff', borderTop: '1px solid var(--border-color)', padding: '1.5rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <div className="container">
            © {new Date().getFullYear()} MediAI. All rights reserved.
          </div>
        </footer>
      )}
    </div>
  );
}

export function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
