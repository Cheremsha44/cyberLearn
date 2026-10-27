import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import LandingPage from './pages/LandingPage/LandingPage';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import AdminPage from './pages/AdminPage/AdminPage';
import AssignmentPage from './pages/AssignmentPage/AssignmentPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage/PrivacyPolicy';
import TermsOfUsePage from './pages/TermsOfUsePage/TermsOfUsePage';

import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

import VulnerabilitiesPage from './pages/Vulnerabilities/VulnerabilitiesPage';
import VulnerabilityDetailsPage from './pages/Vulnerabilities/VulnerabilityDetailsPage';
import ExercisesPage from './pages/Exercises/ExercisesPage';
import ExerciseTaskPage from './pages/Exercises/ExerciseTaskPage';

import './App.css';

function App() {
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token && !localStorage.getItem('session_start')) {
      localStorage.setItem('session_start', Date.now());
    }
  }, []);

  useEffect(() => {
    const saveStudyTime = () => {
      const token = localStorage.getItem('token');
      const start = localStorage.getItem('session_start');

      if (!token || !start) return;

      const diffMs = Date.now() - Number(start);
      const minutes = Math.floor(diffMs / 60000);

      if (minutes > 0) {
        fetch('/api/users/add-study-time', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ minutes }),
          keepalive: true
        });
      }

      localStorage.removeItem('session_start');
    };

    window.addEventListener('beforeunload', saveStudyTime);

    return () => {
      window.removeEventListener('beforeunload', saveStudyTime);
    };
  }, []);

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <div className="app">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-use" element={<TermsOfUsePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/assignment/:id"
            element={
              <PrivateRoute>
                <AssignmentPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/vulnerabilities"
            element={
              <PrivateRoute>
                <VulnerabilitiesPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/vulnerabilities/:code"
            element={
              <PrivateRoute>
                <VulnerabilityDetailsPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/exercises/:code"
            element={
              <PrivateRoute>
                <ExercisesPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/exercises/:code/:order"
            element={
              <PrivateRoute>
                <ExerciseTaskPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
