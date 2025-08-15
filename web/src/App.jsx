import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ServiceOrdersPage from './pages/orders/ServiceOrdersPage';
import ServiceOrderDetailsPage from './pages/ServiceOrderDetailsPage';
import ServiceOrderCreatePage from './pages/ServiceOrderCreatePage';
import UsersAdminPage from './pages/UsersAdminPage';
import EstablishmentsPage from './pages/EstablishmentsPage';
import ReportsPage from './pages/ReportsPage';
import ProfilePage from './pages/profilePage';
import DetailedReportPage from '@/pages/DetailedReportPage';
import OauthSuccess from './pages/OauthSuccess';

import './App.css';
import { Toaster } from 'react-hot-toast';
import PublicRegisterPage from './pages/PublicRegisterPage';

const AppRoutes = () => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<PublicRegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
        <Route path="/oauth-success" element={<OauthSuccess />} />
      </Routes>
    );
  }

  // Usuário está autenticado, renderiza layout e rotas internas
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/service-orders" element={<ServiceOrdersPage />} />
        <Route path="/service-orders/new" element={<ServiceOrderCreatePage />} />
        <Route path="/service-orders/:id" element={<ServiceOrderDetailsPage />} />
        <Route path="/users" element={<UsersAdminPage />} />
        <Route path="/establishments" element={<EstablishmentsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/relatorios/detalhado" element={<DetailedReportPage />} />

        {/* Redireciona qualquer rota desconhecida para dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </AuthProvider>
  );
}
export default App;
