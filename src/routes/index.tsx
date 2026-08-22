import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

import { LandingPage } from '../features/public/pages/LandingPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { VerifyEmailPage } from '../features/auth/pages/VerifyEmailPage';

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
      <Route
        path="/verify-email"
        element={<VerifyEmailPage />}
      />
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

      {/* Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
