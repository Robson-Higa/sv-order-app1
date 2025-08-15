import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserType, getUserTypeText } from '../types';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Building2,
  LayoutDashboard,
  ClipboardList,
  Users,
  Building,
  BarChart3,
  Menu,
  X,
} from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = (name) =>
    name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const menuItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      roles: [UserType.ADMIN, UserType.TECHNICIAN, UserType.END_USER],
    },
    {
      label: 'Ordens de Serviço',
      icon: ClipboardList,
      path: '/service-orders',
      roles: [UserType.ADMIN, UserType.TECHNICIAN, UserType.END_USER],
    },
    { label: 'Usuários', icon: Users, path: '/users', roles: [UserType.ADMIN] },
    { label: 'Estabelecimentos', icon: Building, path: '/establishments', roles: [UserType.ADMIN] },
    { label: 'Relatórios', icon: BarChart3, path: '/reports', roles: [UserType.ADMIN] },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.some((role) => role.toLowerCase() === user?.userType?.toLowerCase())
  );

  const isActivePath = (path) => location.pathname === path;

  return (
    <div className="w-full">
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Cabeçalho do menu */}
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <div className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-blue-600" />
            <span className="text-lg font-semibold text-gray-900">Gestão OS</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Menu items */}
        <nav className="mt-6 px-3">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);

            return (
              <Button
                key={item.path}
                variant={isActive ? 'default' : 'ghost'}
                className={`w-full justify-start mb-1 h-10 ${
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
              >
                <Icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </div>

      {/* Conteúdo principal */}
      <div>
        {/* Top bar */}
        <header className="bg-card shadow-md border-b h-16 flex items-center justify-between px-4">
          {/* Botão para abrir menu */}
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>

          {/* Título */}
          <h1 className="text-lg font-semibold">
            {filteredMenuItems.find((item) => isActivePath(item.path))?.label || 'Dashboard'}
          </h1>

          {/* Perfil */}
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white text-sm">
                      {getInitials(user?.name || 'U')}
                    </div>
                  )}
                  <span className="hidden sm:inline text-sm font-medium text-gray-700">
                    {user?.name}
                  </span>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-sm text-gray-500">
                  {user?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>Perfil</DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
