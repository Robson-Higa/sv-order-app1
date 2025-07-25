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

  // ✅ Mantém usuário logado se token válido
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          const savedUser = localStorage.getItem('user');
          const savedToken = localStorage.getItem('token');

          if (!savedUser || !savedToken) {
            const apiResponse = await apiService.login({ idToken });
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

  // ✅ Login
  const login = useCallback(async ({ email, password }) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const idToken = await firebaseUser.getIdToken();

      const apiResponse = await apiService.login({ idToken });
      localStorage.setItem('token', apiResponse.token);
      localStorage.setItem('user', JSON.stringify(apiResponse.user));
      setToken(apiResponse.token);
      setUser(apiResponse.user);

      return apiResponse.user;
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

  // ✅ Logout
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
