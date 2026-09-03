import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

import './App.css';

export function App() {
  return (
    <Router>
      <AuthProvider>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />

              {/* Protected Patient Route */}
              <Route
                path="/patient/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <PatientDashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Doctor Onboarding / Verification Route */}
              <Route
                path="/doctor/portal"
                element={
                  <ProtectedRoute allowedRoles={['doctor']}>
                    <DoctorPortalPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected SaaS Admin Routes */}
              <Route
                path="/admin/dashboard"
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

          <footer style={{ background: '#ffffff', borderTop: '1px solid var(--border-color)', padding: '1.5rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <div className="container">
              © {new Date().getFullYear()} MedTrust SaaS Platform. All medical credentials encrypted and verified.
            </div>
          </footer>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
