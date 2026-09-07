import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

import { LandingPage } from '../features/public/pages/LandingPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { AuthCallbackPage } from '../features/auth/pages/AuthCallbackPage';
import { AccountSettingsPage } from '../features/settings/pages/AccountSettingsPage';
import { SecurityPrivacyPage } from '../features/settings/pages/SecurityPrivacyPage';
import { EmergencyProtocolPage } from '../features/public/pages/EmergencyProtocolPage';
import { TermsOfServicePage } from '../features/public/pages/TermsOfServicePage';
import { PrivacyPolicyPage } from '../features/public/pages/PrivacyPolicyPage';

import { AmbulanceDashboard } from '../features/ambulance/pages/AmbulanceDashboard';
import { PoliceDashboard } from '../features/police/pages/PoliceDashboard';
import { ActiveEmergencyDetails } from '../features/police/pages/ActiveEmergencyDetails';
import { HospitalDashboard } from '../features/hospital/pages/HospitalDashboard';
import { AdminDashboard } from '../features/admin/pages/AdminDashboard';
import { AdminAnalytics } from '../features/admin/pages/AdminAnalytics';
import { ComponentShowcase } from '../pages/ComponentShowcase';
import { NotFoundPage } from '../pages/NotFoundPage';
import { AIAssistant } from '../features/ai/components/AIAssistant';

export function AppRoutes() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (userRole: string) => {
    switch (userRole.toLowerCase()) {
      case 'ambulance_operator':
      case 'ambulance':
        navigate('/ambulance');
        break;
      case 'traffic_operator':
      case 'police':
        navigate('/police');
        break;
      case 'hospital_operator':
      case 'hospital':
        navigate('/hospital');
        break;
      case 'admin':
        navigate('/admin');
        break;
      default:
        navigate('/ambulance');
    }
  };

  const ProtectedRoute = ({ allowedRoles, children }: { allowedRoles?: string[]; children: React.ReactNode }) => {
    // DEMO MODE: Bypass all authentication and role checks
    return (
      <>
        {children}
        <AIAssistant />
      </>
    );
  };

  return (
    <Routes>
      {/* Legal & Protocol */}
      <Route path="/emergency-response-protocol" element={<EmergencyProtocolPage />} />
      <Route path="/terms-of-service" element={<TermsOfServicePage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />

      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
      <Route path="/register" element={<RegisterPage onRegister={handleLogin} />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/showcase" element={<ComponentShowcase />} />

      {/* Ambulance Routes */}
      <Route
        path="/ambulance"
        element={
          <ProtectedRoute allowedRoles={['AMBULANCE_OPERATOR', 'AMBULANCE']}>
            <AmbulanceDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ambulance/emergency"
        element={
          <ProtectedRoute allowedRoles={['AMBULANCE_OPERATOR', 'AMBULANCE']}>
            <AmbulanceDashboard />
          </ProtectedRoute>
        }
      />

      {/* Police Routes */}
      <Route
        path="/police"
        element={
          <ProtectedRoute allowedRoles={['TRAFFIC_OPERATOR', 'POLICE']}>
            <PoliceDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/police/emergency/:id"
        element={
          <ProtectedRoute allowedRoles={['TRAFFIC_OPERATOR', 'POLICE']}>
            <ActiveEmergencyDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/police/alerts"
        element={
          <ProtectedRoute allowedRoles={['TRAFFIC_OPERATOR', 'POLICE']}>
            <PoliceDashboard />
          </ProtectedRoute>
        }
      />

      {/* Hospital ER Routes */}
      <Route
        path="/hospital"
        element={
          <ProtectedRoute allowedRoles={['HOSPITAL_OPERATOR', 'HOSPITAL']}>
            <HospitalDashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/emergencies"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Settings Routes */}
      <Route
        path="/settings/account"
        element={
          <ProtectedRoute>
            <AccountSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/security"
        element={
          <ProtectedRoute>
            <SecurityPrivacyPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
