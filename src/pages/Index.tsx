import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import LandingPortal from '@/components/landing/LandingPortal';
import AdminLogin from '@/components/auth/AdminLogin';
import AdminRegister from '@/components/auth/AdminRegister';
import MemberLogin from '@/components/auth/MemberLogin';
import MemberSignup from '@/components/auth/MemberSignup';

import AdminDashboard from '@/components/dashboard/AdminDashboard';
import MemberDashboard from '@/components/dashboard/MemberDashboard';
import AdminTontineDetail from '@/components/tontine/AdminTontineDetail';
import TontineCreation from '@/components/tontine/TontineCreation';
import TontineDetails from '@/components/tontine/TontineDetails';
import TontineDrawPage from '../components/tontine/TontineDrawPage';
import ProfilePage from '@/components/profile/ProfilePage';
import NotificationsPage from '@/components/notifications/NotificationsPage';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';
import OnboardingModal from '@/components/onboarding/OnboardingModal';
import TontineOnboarding from '@/components/onboarding/TontineOnboarding';
import HelpPage from '@/components/help/HelpPage';
import PricingPage from '@/components/pricing/PricingPage';
import SettingsPage from '@/components/settings/SettingsPage';
import TransactionHistory from '@/components/history/TransactionHistory';
import { useSocket } from '../hooks/useSocket';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: ('admin' | 'user' | 'member' | 'super_admin')[] }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
    </div>
  );

  if (!user) {
    if (window.location.pathname.startsWith('/admin')) return <Navigate to="/admin/login" />;
    return <Navigate to="/member/login" />;
  }

  const userRole = user.role as any;
  const targetPath = (userRole === 'admin' || userRole === 'super_admin') ? '/admin/dashboard' : '/member/dashboard';
  
  if (allowedRoles && !allowedRoles.includes(userRole)) {
     if (window.location.pathname !== targetPath) {
       return <Navigate to={targetPath} replace />;
     }
  }

  return <>{children}</>;
};

const AppRouter = () => {
  const { user } = useAuth();
  useSocket();

  return (
    <div className="min-h-screen">
      {user && <OnboardingModal />}
      {user && <TontineOnboarding />}

      <Routes>
        {/* Public Portal */}
        <Route path="/" element={<LandingPortal />} />
        
        {/* Admin Auth */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/register" element={<AdminRegister />} />
        
        {/* Member Auth */}
        <Route path="/member/login" element={<MemberLogin />} />
        <Route path="/member/signup" element={<MemberSignup />} />

        {/* Dashboards */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/member/dashboard" element={<ProtectedRoute allowedRoles={['user', 'member']}><MemberDashboard /></ProtectedRoute>} />
        
        {/* Backward Compatibility & Generic Dashboard */}
        <Route path="/dashboard" element={<ProtectedRoute>{(user?.role === 'admin' || user?.role === 'super_admin') ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/member/dashboard" replace />}</ProtectedRoute>} />
        <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/member-dashboard" element={<Navigate to="/member/dashboard" replace />} />

        {/* Shared / Tontine Routes */}
        <Route path="/create-tontine" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><TontineCreation /></ProtectedRoute>} />
        <Route path="/tontine/:id" element={<ProtectedRoute><TontineDetails /></ProtectedRoute>} />
        <Route path="/admin-tontine/:id" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><AdminTontineDetail /></ProtectedRoute>} />
        <Route path="/tontine/:id/draw" element={<ProtectedRoute><TontineDrawPage /></ProtectedRoute>} />

        {/* Profile & Settings */}
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/pricing" element={<ProtectedRoute><PricingPage /></ProtectedRoute>} />
        <Route path="/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><SettingsPage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><TransactionHistory /></ProtectedRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingFlow /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

const Index = () => {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
};

export default Index;
