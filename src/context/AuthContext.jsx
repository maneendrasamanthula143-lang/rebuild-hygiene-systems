import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(getAuthToken());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore authenticated session on page refresh or browser restart
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getAuthToken();
      if (storedToken) {
        try {
          const res = await api.getMe();
          if (res.user) {
            setUser(res.user);
            setTokenState(storedToken);
          } else {
            setAuthToken(null);
            setTokenState(null);
          }
        } catch (err) {
          console.error('Failed to restore session:', err);
          setAuthToken(null);
          setTokenState(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const loginWithPassword = async (identifier, password) => {
    setError(null);
    try {
      const res = await api.login(identifier, password);
      if (res.success && res.token) {
        setAuthToken(res.token);
        setTokenState(res.token);
        setUser(res.user);
        return res.user;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const requestSuperAdminOtp = async (mobile) => {
    setError(null);
    try {
      return await api.requestOtp(mobile);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const verifySuperAdminOtp = async (mobile, otp) => {
    setError(null);
    try {
      const res = await api.verifyOtp(mobile, otp);
      if (res.success && res.token) {
        setAuthToken(res.token);
        setTokenState(res.token);
        setUser(res.user);
        return res.user;
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    setAuthToken(null);
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user ? user.role : null,
        loading,
        error,
        setError,
        loginWithPassword,
        requestSuperAdminOtp,
        verifySuperAdminOtp,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
