import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import app from '../services/firebase';
import { apiService } from '../services/api';

const auth = getAuth(app);
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const safeParseJSON = (json) => {
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  };

  /** LOGIN EMAIL/SENHA */
  const login = useCallback(async ({ email, password }) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const idToken = await firebaseUser.getIdToken();

      const { user: apiUser, token: apiToken } = await apiService.login({ idToken });
      if (!apiUser || !apiToken) throw new Error('Resposta inválida do servidor');

      localStorage.setItem('user', JSON.stringify(apiUser));
      localStorage.setItem('token', apiToken);
      setUser(apiUser);
      setToken(apiToken);
      return apiUser;
    } catch (err) {
      console.error('Erro no login:', err);
      let message = 'Erro ao fazer login';
      if (err.code === 'auth/wrong-password') message = 'Senha incorreta';
      else if (err.code === 'auth/user-not-found') message = 'Usuário não encontrado';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  /** LOGIN GOOGLE */
  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUser = userCredential.user;
      const idToken = await firebaseUser.getIdToken();

      const { user: apiUser, token: apiToken } = await apiService.login({ idToken });
      if (!apiUser || !apiToken) throw new Error('Resposta inválida do servidor');

      localStorage.setItem('user', JSON.stringify(apiUser));
      localStorage.setItem('token', apiToken);
      setUser(apiUser);
      setToken(apiToken);
      return apiUser;
    } catch (err) {
      console.error('Erro no login Google:', err);
      setError('Erro ao fazer login com Google');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /** LOGOUT */
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      setUser(null);
      setToken(null);
    } catch (err) {
      console.error('Erro ao sair:', err);
      setError('Erro ao fazer logout');
    }
  }, []);

  /** OBSERVAÇÃO DO ESTADO DO FIREBASE */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          const savedUser = safeParseJSON(localStorage.getItem('user'));
          const savedToken = localStorage.getItem('token');

          if (!savedUser || !savedToken) {
            const { user: apiUser, token: apiToken } = await apiService.login({ idToken });
            localStorage.setItem('user', JSON.stringify(apiUser));
            localStorage.setItem('token', apiToken);
            setUser(apiUser);
            setToken(apiToken);
          } else {
            setUser(savedUser);
            setToken(savedToken);
          }
        } catch (error) {
          console.error('Erro ao autenticar no backend:', error);
          localStorage.clear();
          setUser(null);
          setToken(null);
        }
      } else {
        localStorage.clear();
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      loginWithGoogle,
      logout,
      loading,
      error,
      isAuthenticated: !!token && !!user,
    }),
    [user, token, login, loginWithGoogle, logout, loading, error]
  );

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
