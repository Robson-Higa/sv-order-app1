import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserType } from '../types';
import { Sheet, SheetContent, SheetTrigger } from '../components/ui/sheet';
import { Button } from '../components/ui/button';
import {
  Home,
  ClipboardList,
  Users,
  Building,
  BarChart,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import '../App.css';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <Home className="w-5 h-5" />,
      roles: [UserType.ADMIN, UserType.TECHNICIAN, UserType.END_USER],
    },
    {
      name: 'Ordens de Serviço',
      path: '/service-orders',
      icon: <ClipboardList className="w-5 h-5" />,
      roles: [UserType.ADMIN, UserType.TECHNICIAN, UserType.END_USER],
    },
    {
      name: 'Usuários',
      path: '/users',
      icon: <Users className="w-5 h-5" />,
      roles: [UserType.ADMIN],
    },
    {
      name: 'Estabelecimentos',
      path: '/establishments',
      icon: <Building className="w-5 h-5" />,
      roles: [UserType.ADMIN],
    },
    {
      name: 'Relatórios',
      path: '/reports',
      icon: <BarChart className="w-5 h-5" />,
      roles: [UserType.ADMIN],
    },
    {
      name: 'Meu Perfil',
      path: '/profile',
      icon: <User className="w-5 h-5" />,
      roles: [UserType.ADMIN, UserType.TECHNICIAN, UserType.END_USER],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(user?.userType));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar para Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white shadow-lg p-4 border-r border-gray-200">
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-blue-600">Gestão OS</h1>
        </div>
        <nav className="flex-1 mt-6">
          <ul className="space-y-2">
            {filteredMenuItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                >
                  {item.icon}
                  <span className="ml-3 text-lg font-medium">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto border-t border-gray-200 pt-4">
          <button
            onClick={handleLogout}
            className="flex items-center w-full p-3 text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="ml-3 text-lg font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header para Mobile */}
        <header className="md:hidden flex items-center justify-between h-16 bg-white shadow-md px-4 border-b border-gray-200">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4 flex flex-col">
              <div className="flex items-center justify-between h-16 border-b border-gray-200 mb-4">
                <h1 className="text-2xl font-bold text-blue-600">Gestão OS</h1>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <X className="w-6 h-6" />
                </Button>
              </div>
              <nav className="flex-1">
                <ul className="space-y-2">
                  {filteredMenuItems.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.path}
                        className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                        onClick={() => setSidebarOpen(false)} // Fecha sidebar ao clicar
                      >
                        {item.icon}
                        <span className="ml-3 text-lg font-medium">{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="mt-auto border-t border-gray-200 pt-4">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full p-3 text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="ml-3 text-lg font-medium">Sair</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="text-xl font-bold text-gray-900">Gestão OS</h1>
          <div className="w-10">{/* Placeholder para alinhar */}</div>
        </header>

        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
