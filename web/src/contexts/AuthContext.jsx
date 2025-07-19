import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiService } from '../services/api';
import { app } from '../services/firebase'; // Importa a instância do Firebase
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Exportação nomeada do contexto
export const AuthContext = createContext();
const auth = getAuth(app);
// Exportação nomeada do provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        console.log('AuthContext: Usuário e token carregados do localStorage.', parsedUser);
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const auth = getAuth();

  const login = async ({ email, password }) => {
    try {
      setLoading(true);

      // Login no Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Pega o idToken JWT do Firebase
      const idToken = await userCredential.user.getIdToken();

      // Envia idToken para o backend validar e receber dados do usuário
      console.log('Enviando para backend:', { idToken });
      const response = await apiService.login({ idToken });

      console.log('Resposta do backend:', response);

      if (response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        return response;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await apiService.register(userData);
      if (response.success && response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        return response;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        updateUser,
        loading,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado
export const useAuth = () => useContext(AuthContext);
