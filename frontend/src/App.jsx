import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AssessmentNew from './pages/AssessmentNew';
import AssessmentHistory from './pages/AssessmentHistory';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Alerts from './pages/Alerts';
import Profile from './pages/Profile';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Hipaa from './pages/Hipaa';
import ForgotPassword from './pages/ForgotPassword';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Login isAdminRoute={true} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/hipaa" element={<Hipaa />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Routes (Authenticated Users) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Patient-Only Routes */}
          <Route
            path="/assessment/new"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <Layout>
                  <AssessmentNew />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessment/history"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <Layout>
                  <AssessmentHistory />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Health Worker & Admin Routes */}
          <Route
            path="/patients"
            element={
              <ProtectedRoute allowedRoles={['health_worker', 'admin']}>
                <Layout>
                  <Patients />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/:id"
            element={
              <ProtectedRoute allowedRoles={['health_worker', 'admin']}>
                <Layout>
                  <PatientDetail />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute allowedRoles={['health_worker']}>
                <Layout>
                  <Alerts />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
