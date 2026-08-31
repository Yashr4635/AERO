import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

import { LandingPage } from '../features/public/pages/LandingPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { AuthCallbackPage } from '../features/auth/pages/AuthCallbackPage';
import { AccountSettingsPage } from '../features/settings/pages/AccountSettingsPage';
import { SecurityPrivacyPage } from '../features/settings/pages/SecurityPrivacyPage';

import { AmbulanceDashboard } from '../features/ambulance/pages/AmbulanceDashboard';
import { PoliceDashboard } from '../features/police/pages/PoliceDashboard';
import { ActiveEmergencyDetails } from '../features/police/pages/ActiveEmergencyDetails';
import { HospitalDashboard } from '../features/hospital/pages/HospitalDashboard';
import { AdminDashboard } from '../features/admin/pages/AdminDashboard';
import { AdminAnalytics } from '../features/admin/pages/AdminAnalytics';
import { ComponentShowcase } from '../pages/ComponentShowcase';
import { NotFoundPage } from '../pages/NotFoundPage';
import { AIAssistant } from '../features/ai/components/AIAssistant';

import { RequestAmbulance } from '../features/patient/pages/RequestAmbulance';
import { TrackAmbulance } from '../features/patient/pages/TrackAmbulance';
import { HospitalDiscovery } from '../features/patient/pages/HospitalDiscovery';

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
        navigate('/command/driver');
        break;
      case 'traffic_operator':
      case 'police':
        navigate('/command/traffic');
        break;
      case 'hospital_operator':
      case 'hospital':
        navigate('/command/hospital');
        break;
      case 'admin':
        navigate('/command/admin');
        break;
      default:
        navigate('/command/driver');
    }
  };

  const ProtectedRoute = ({ allowedRoles, children }: { allowedRoles?: string[]; children: React.ReactNode }) => {
    if (loading) {
      return (
        <div className="min-h-screen bg-navy-950 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emergency-500"></div>
        </div>
      );
    }
    
    if (!session) {
      return <Navigate to="/login" replace />;
    }

    // Role-based access control checking user_metadata.role
    const userRole = session.user.user_metadata?.role?.toUpperCase();
    
    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
      // User doesn't have the right role, redirect to their own dashboard or login
      return <Navigate to="/" replace />;
    }

    return (
      <>
        {children}
        <AIAssistant />
      </>
    );
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
      <Route path="/register" element={<RegisterPage onRegister={handleLogin} />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/showcase" element={<ComponentShowcase />} />
      
      {/* Patient Routes (Minimal Auth/Public) */}
      <Route path="/request" element={<RequestAmbulance />} />
      <Route path="/track/:id" element={<TrackAmbulance />} />
      <Route path="/share/:id" element={<TrackAmbulance />} />
      <Route path="/hospitals" element={<HospitalDiscovery />} />

      {/* Command: Driver Routes */}
      <Route
        path="/command/driver"
        element={
          <ProtectedRoute allowedRoles={['AMBULANCE_OPERATOR', 'AMBULANCE']}>
            <AmbulanceDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/command/driver/emergency"
        element={
          <ProtectedRoute allowedRoles={['AMBULANCE_OPERATOR', 'AMBULANCE']}>
            <AmbulanceDashboard />
          </ProtectedRoute>
        }
      />

      {/* Command: Traffic Routes */}
      <Route
        path="/command/traffic"
        element={
          <ProtectedRoute allowedRoles={['TRAFFIC_OPERATOR', 'POLICE']}>
            <PoliceDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/command/traffic/emergency/:id"
        element={
          <ProtectedRoute allowedRoles={['TRAFFIC_OPERATOR', 'POLICE']}>
            <ActiveEmergencyDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/command/traffic/alerts"
        element={
          <ProtectedRoute allowedRoles={['TRAFFIC_OPERATOR', 'POLICE']}>
            <PoliceDashboard />
          </ProtectedRoute>
        }
      />

      {/* Command: Hospital Routes */}
      <Route
        path="/command/hospital"
        element={
          <ProtectedRoute allowedRoles={['HOSPITAL_OPERATOR', 'HOSPITAL']}>
            <HospitalDashboard />
          </ProtectedRoute>
        }
      />

      {/* Command: Admin Routes */}
      <Route
        path="/command/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/command/admin/analytics"
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
