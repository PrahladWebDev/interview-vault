import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { setUnauthorizedHandler } from '../api/client.js';
import {
  loginRequest,
  registerRequest,
  logoutRequest,
  refreshRequest,
} from '../api/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authenticated | unauthenticated

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setStatus('unauthenticated');
    });
  }, []);

  useEffect(() => {
    // Try to silently restore a session using the httpOnly refresh cookie.
    refreshRequest()
      .then((u) => {
        setUser(u);
        setStatus('authenticated');
      })
      .catch(() => setStatus('unauthenticated'));
  }, []);

  const login = useCallback(async (credentials) => {
    const u = await loginRequest(credentials);
    setUser(u);
    setStatus('authenticated');
    return u;
  }, []);

  const register = useCallback(async (payload) => {
    const u = await registerRequest(payload);
    setUser(u);
    setStatus('authenticated');
    return u;
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, status, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
