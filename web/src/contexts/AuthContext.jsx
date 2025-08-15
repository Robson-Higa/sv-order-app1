import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import app from '../services/firebase';
import { apiService } from '../services/api';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const auth = getAuth(app);
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem('token');
    return storedToken && storedToken !== 'undefined' ? storedToken : null;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function safeParseJSON(json) {
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUser = userCredential.user;
      const idToken = await firebaseUser.getIdToken();

      const apiResponse = await apiService.login({ idToken });
      const { user, token } = apiResponse.data;

      if (user && token) {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        setUser(user);
        setToken(token);
        return user;
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (err) {
      console.error('Erro no login Google:', err);
      setError('Erro ao fazer login com Google');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Firebase User:', firebaseUser);
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          console.log('Firebase ID Token:', idToken);
          const savedUser = localStorage.getItem('user');
          const savedToken = localStorage.getItem('token');
          const validToken = savedToken && savedToken !== 'undefined' ? savedToken : null;

          const parsedUser = safeParseJSON(savedUser);

          console.log('LocalStorage user:', parsedUser);
          console.log('LocalStorage token:', savedToken);

          if (!parsedUser || !savedToken) {
            const apiResponse = await apiService.login({ idToken });
            console.log('API Login Response:', apiResponse);

            const userFromApi = apiResponse.data?.user;
            const tokenFromApi = apiResponse.data?.token;

            if (userFromApi && tokenFromApi) {
              localStorage.setItem('user', JSON.stringify(userFromApi));
              localStorage.setItem('token', tokenFromApi);
              setUser(userFromApi);
              setToken(tokenFromApi);
            } else {
              throw new Error('Resposta inválida do servidor');
            }
          } else {
            setUser(parsedUser);
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

  console.log('Auth State:', {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
  });

  const login = useCallback(async ({ email, password }) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const idToken = await firebaseUser.getIdToken();

      const apiResponse = await apiService.login({ idToken });
      const { user, token } = apiResponse.data; // se corrigir no apiService
      // OU se não corrigir lá, seria: const { user, token } = apiResponse.data;

      if (user && token) {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        setUser(user);
        setToken(token);
        return user;
      } else {
        throw new Error('Resposta inválida do servidor');
      }

      // if (apiResponse.user && apiResponse.token) {
      //   localStorage.setItem('user', JSON.stringify(apiResponse.user));
      //   localStorage.setItem('token', apiResponse.token);
      //   setUser(apiResponse.user);
      //   setToken(apiResponse.token);
      //   return apiResponse.user;
      // } else {
      //   throw new Error('Resposta inválida do servidor');
      // }
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
