import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import app from '../services/firebase';
import { apiService } from '../services/api';

const auth = getAuth(app);
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('onAuthStateChanged firebaseUser:', firebaseUser);

      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          console.log('Obtido idToken do Firebase:', idToken);

          const savedUser = localStorage.getItem('user');
          const savedToken = localStorage.getItem('token');

          if (!savedUser || !savedToken) {
            const apiResponse = await apiService.login({ idToken });
            console.log('Resposta do login da API:', apiResponse);

            localStorage.setItem('user', JSON.stringify(apiResponse.user));
            localStorage.setItem('token', apiResponse.token);

            setUser(apiResponse.user);
            setToken(apiResponse.token);
          } else {
            setUser(JSON.parse(savedUser));
            setToken(savedToken);
          }
        } catch (error) {
          console.error('Erro ao autenticar no backend:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setUser(null);
          setToken(null);
        }
      } else {
        console.log('Nenhum usuário autenticado no Firebase');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const idToken = await firebaseUser.getIdToken();

      const apiResponse = await apiService.login({ idToken });
      const userData = {
        ...apiResponse.user,
        uid: firebaseUser.uid,
        email: firebaseUser.email,
      };

      localStorage.setItem('token', apiResponse.token);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(apiResponse.token);
      setUser(userData);

      return userData;
    } catch (err) {
      console.error('Erro no login:', err);
      let message = 'Erro ao fazer login';
      if (err.code === 'auth/wrong-password') message = 'Senha incorreta';
      else if (err.code === 'auth/user-not-found') message = 'Usuário não encontrado';
      else if (err.response?.error) message = err.response.error;
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // <-- logout deve estar antes do useMemo
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
    } catch (err) {
      console.error('Erro ao sair:', err);
      setError('Erro ao fazer logout');
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      logout,
      loading,
      error,
      isAuthenticated: !!token && !!user,
    }),
    [user, token, login, logout, loading, error]
  );

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
};
