import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { theme } from './theme/theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminCardsPage } from './pages/AdminCardsPage';
import { AdminBusinessesPage } from './pages/AdminBusinessesPage';
import { AdminAnalyticsPage } from './pages/AdminAnalyticsPage';
import { AdminAuditLogsPage } from './pages/AdminAuditLogsPage';
import { BusinessDashboard } from './pages/BusinessDashboard';
import { BusinessCardsPage } from './pages/BusinessCardsPage';
import { BusinessMenuEditor } from './pages/BusinessMenuEditor';
import { PublicBusinessProfile } from './pages/PublicBusinessProfile';
import { PublicDigitalMenu } from './pages/PublicDigitalMenu';
import { PublicReviewLanding } from './pages/PublicReviewLanding';
import { DynamicGoResolver } from './pages/DynamicGoResolver';
import { CardStatusPage } from './pages/CardStatusPage';

// Protected Route Guard
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading, isSuperAdmin } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && !isSuperAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Routes>
          {/* Public Platform Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Dynamic QR & NFC Engine */}
          <Route path="/go/:cardId" element={<DynamicGoResolver />} />
          <Route path="/card-status" element={<CardStatusPage />} />

          {/* Public Business & Customer Experiences */}
          <Route path="/business/:slug" element={<PublicBusinessProfile />} />
          <Route path="/business/:slug/menu" element={<PublicDigitalMenu />} />
          <Route path="/business/:slug/reviews" element={<PublicReviewLanding />} />

          {/* Super Admin Dashboard */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="cards" element={<AdminCardsPage />} />
            <Route path="businesses" element={<AdminBusinessesPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="audit" element={<AdminAuditLogsPage />} />
          </Route>

          {/* Business Owner Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<BusinessDashboard />} />
            <Route path="cards" element={<BusinessCardsPage />} />
            <Route path="menu" element={<BusinessMenuEditor />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
