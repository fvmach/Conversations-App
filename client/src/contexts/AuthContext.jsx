import { createContext, useContext, useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/session`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.authenticated) {
        setUser(data.member);
        setOrganization(data.organization);
        setAuthenticated(true);
      } else {
        setUser(null);
        setOrganization(null);
        setAuthenticated(false);
      }
    } catch (error) {
      console.error('Session check error:', error);
      setUser(null);
      setOrganization(null);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      
      setUser(null);
      setOrganization(null);
      setAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleAuthCallback = async (token, tokenType) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/authenticate?token=${token}&stytch_token_type=${tokenType}`,
        {
          credentials: 'include'
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      
      setUser(data.member);
      setOrganization(data.organization);
      setAuthenticated(true);
      
      return data;
    } catch (error) {
      console.error('Auth callback error:', error);
      throw error;
    }
  };

  const adminBypass = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/admin-bypass`, {
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Admin bypass failed');
      }
      
      setUser(data.member);
      setOrganization(data.organization);
      setAuthenticated(true);
      
      return data;
    } catch (error) {
      console.error('Admin bypass error:', error);
      throw error;
    }
  };

  const value = {
    user,
    organization,
    authenticated,
    loading,
    login,
    logout,
    checkSession,
    handleAuthCallback,
    adminBypass
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
