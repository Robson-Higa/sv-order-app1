import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext'; // <-- Adicione useAuth aqui
import Layout from './components/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ServiceOrdersPage from './pages/ServiceOrdersPage';
import ServiceOrderCreatePage from './pages/ServiceOrderCreatePage';

import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirects to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

// App Routes Component
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/service-orders"
        element={
          <ProtectedRoute>
            <Layout>
              <ServiceOrdersPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/service-orders/new"
        element={
          <ProtectedRoute>
            <Layout>
              <ServiceOrderCreatePage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Placeholder routes for other pages */}
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Layout>
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Página de Usuários</h2>
                <p className="text-gray-600">Esta página está em desenvolvimento.</p>
              </div>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/establishments"
        element={
          <ProtectedRoute>
            <Layout>
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Página de Estabelecimentos
                </h2>
                <p className="text-gray-600">Esta página está em desenvolvimento.</p>
              </div>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Layout>
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Página de Relatórios</h2>
                <p className="text-gray-600">Esta página está em desenvolvimento.</p>
              </div>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Página de Perfil</h2>
                <p className="text-gray-600">Esta página está em desenvolvimento.</p>
              </div>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 Route */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-gray-600 mb-4">Página não encontrada</p>
              <a href="/dashboard" className="text-blue-600 hover:text-blue-500 font-medium">
                Voltar ao Dashboard
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
