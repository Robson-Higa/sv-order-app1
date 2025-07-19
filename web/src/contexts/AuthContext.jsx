import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiService } from '../services/api';
import { app } from '../services/firebase';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Usuário está autenticado no Firebase
        const token = await firebaseUser.getIdToken();
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          // Adicione outros campos conforme necessário
        };

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(token);
        setUser(userData);
      } else {
        // Usuário não está autenticado
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Autenticação com Firebase
      const { user: firebaseUser } = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      // 2. Obter token do Firebase
      const firebaseToken = await firebaseUser.getIdToken();

      // 3. Autenticação com sua API personalizada (opcional)
      const apiResponse = await apiService.auth.login({
        token: firebaseToken,
        ...credentials,
      });

      // 4. Armazenar dados
      const userData = {
        ...apiResponse.user,
        uid: firebaseUser.uid,
        email: firebaseUser.email,
      };

      localStorage.setItem('token', firebaseToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(firebaseToken);
      setUser(userData);

      return userData;
    } catch (error) {
      console.error('Login error:', error);

      let errorMessage = 'Erro ao fazer login';
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Senha incorreta';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'Usuário não encontrado';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.auth.register(userData);

      if (response.success && response.user) {
        // Após registro bem-sucedido na API, faça login automático
        await login({
          email: userData.email,
          password: userData.password,
        });

        return response;
      }

      throw new Error(response.message || 'Registration failed');
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setError('Erro ao fazer logout');
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    updateUser,
    loading,
    error,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
