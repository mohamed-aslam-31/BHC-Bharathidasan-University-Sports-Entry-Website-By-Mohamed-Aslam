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
import AccountPage from './pages/AccountPage';
import LoadingSpinner from './components/LoadingSpinner';

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

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {user && <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />}
      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${user ? 'lg:pt-0 pt-16' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

const router = createBrowserRouter([
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
      { path: 'account',             element: <ProtectedRoute><AccountPage /></ProtectedRoute> },
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
