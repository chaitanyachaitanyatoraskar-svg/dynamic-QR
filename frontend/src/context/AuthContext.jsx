import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        try {
          const res = await authService.me();
          setUser(res.data);
          setToken(storedToken);
        } catch (err) {
          console.warn("Stored auth session invalid:", err);
          localStorage.removeItem('auth_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (username, password) => {
    const res = await authService.login(username, password);
    const { token: authToken, user: userData } = res.data;
    localStorage.setItem('auth_token', authToken);
    setToken(authToken);
    setUser(userData);
    return userData;
  };

  const loginWithToken = (authToken, userData) => {
    localStorage.setItem('auth_token', authToken);
    setToken(authToken);
    setUser(userData);
  };

  const logout = () => {
    try {
      authService.logout();
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isBusinessOwner = user?.role === 'BUSINESS_OWNER';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      loginWithToken,
      logout,
      isAuthenticated: !!user,
      isSuperAdmin,
      isBusinessOwner
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
