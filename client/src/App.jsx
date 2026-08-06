import React, { useState } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './components/Toast';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentFormPage from './pages/StudentFormPage';
import StudentViewPage from './pages/StudentViewPage';
import AdminPage from './pages/AdminPage';
import DraftPage from './pages/DraftPage';
import SettingsPage from './pages/SettingsPage';
import LoadingSpinner from './components/LoadingSpinner';
import SelfRegPage from './pages/SelfRegPage';
import SelfRegFormPage from './pages/SelfRegFormPage';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" text="Loading…" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function AppLayout() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('bhc_sidebar') === 'collapsed'
  );

  // Offset for the floating sidebar: left-3 (12px) + sidebar width + gap (12px)
  const sidebarOffset = user
    ? collapsed
      ? 'lg:pl-[84px]'   // 12 + 60 + 12
      : 'lg:pl-[264px]'  // 12 + 240 + 12
    : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-100 to-blue-50 dark:bg-gray-950 dark:bg-none">
      {user && <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />}
      <main className={`transition-[padding] duration-300 ease-in-out ${sidebarOffset} ${user ? 'pt-16 lg:pt-0' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

const router = createBrowserRouter([
  // Public self-registration pages — no sidebar, no auth required
  { path: '/self-register',      element: <SelfRegPage /> },
  { path: '/self-register/form', element: <SelfRegFormPage /> },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { path: 'login',               element: <LoginPage /> },
      { index: true,                 element: <ProtectedRoute><DashboardPage /></ProtectedRoute> },
      { path: 'students/new',        element: <ProtectedRoute><StudentFormPage key="new" /></ProtectedRoute> },
      { path: 'students/:id/edit',   element: <ProtectedRoute><StudentFormPage key="edit" /></ProtectedRoute> },
      { path: 'students/:id/view',   element: <ProtectedRoute><StudentViewPage /></ProtectedRoute> },
      { path: 'admin',               element: <ProtectedRoute adminOnly><AdminPage /></ProtectedRoute> },
      { path: 'drafts',              element: <ProtectedRoute><DraftPage /></ProtectedRoute> },
      { path: 'settings',            element: <ProtectedRoute><SettingsPage /></ProtectedRoute> },
      { path: '*',                   element: <Navigate to="/" replace /> },
    ],
  },
]);

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
