import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    authApi
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { token } = await authApi.login({ email, password });
    localStorage.setItem('token', token);
    const { user: fresh } = await authApi.me();
    setUser(fresh);
    return fresh;
  };

  const signup = async (name, email, password) => {
    const { token } = await authApi.signup({ name, email, password });
    localStorage.setItem('token', token);
    const { user: fresh } = await authApi.me();
    setUser(fresh);
    return fresh;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
