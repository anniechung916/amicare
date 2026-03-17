import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('amicare_user');
    const token = localStorage.getItem('amicare_token');
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('amicare_user');
        localStorage.removeItem('amicare_token');
      }
    }
    setLoading(false);
  }, []);

  const signup = async (name, email, password) => {
    if (!name || !email || !password) {
      return { success: false, error: 'All fields are required.' };
    }
    try {
      const { data } = await registerUser(name, email, password);
      localStorage.setItem('amicare_token', data.access_token);
      localStorage.setItem('amicare_user', JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed.';
      return { success: false, error: msg };
    }
  };

  const login = async (email, password) => {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required.' };
    }
    try {
      const { data } = await loginUser(email, password);
      localStorage.setItem('amicare_token', data.access_token);
      localStorage.setItem('amicare_user', JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid email or password.';
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('amicare_token');
    localStorage.removeItem('amicare_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
