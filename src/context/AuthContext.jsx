import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/auth';
import { clearStoredTokens, getStoredTokens, setStoredTokens, TOKEN_KEYS } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync user profile on mount if token exists
  useEffect(() => {
    async function initAuth() {
      const { accessToken } = getStoredTokens();
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await authApi.getMe();
        setUser(userData);
      } catch (err) {
        clearStoredTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();

    // Listen for unauthorized events from api client
    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    setStoredTokens(res.access_token, res.refresh_token);
    const userData = await authApi.getMe();
    setUser(userData);
    return userData;
  };

  const adminLogin = async (email, password) => {
    const res = await authApi.adminLogin({ email, password });
    setStoredTokens(res.access_token, res.refresh_token);
    const userData = await authApi.getMe();
    setUser(userData);
    return userData;
  };

  const signup = async (email, password, role) => {
    const res = await authApi.signup({ email, password, role });
    return res;
  };

  const logout = async () => {
    const { refreshToken } = getStoredTokens();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch (err) {
        // Silently ignore logout errors on client
      }
    }
    clearStoredTokens();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const userData = await authApi.getMe();
      setUser(userData);
      return userData;
    } catch (err) {
      return null;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    adminLogin,
    signup,
    logout,
    refreshUser,
    isDoctor: user?.role === 'doctor',
    isPatient: user?.role === 'patient',
    isAdmin: user?.role === 'saas_admin',
    isApproved: user?.status === 'active',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
