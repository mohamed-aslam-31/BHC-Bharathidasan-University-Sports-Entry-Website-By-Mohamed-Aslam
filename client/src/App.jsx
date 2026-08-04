import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentFormPage from './pages/StudentFormPage';
import StudentViewPage from './pages/StudentViewPage';
import AdminPage from './pages/AdminPage';
import DraftPage from './pages/DraftPage';
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
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {user && <Navbar />}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
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
