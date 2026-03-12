import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = response.data.data;
    
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    
    const permissions = {
      'wireguard:create': ['super_admin', 'admin', 'department_head'],
      'wireguard:view': ['super_admin', 'admin', 'department_head', 'user'],
      'wireguard:edit': ['super_admin', 'admin', 'department_head'],
      'wireguard:delete': ['super_admin', 'admin'],
      'firewall:create': ['super_admin', 'admin', 'department_head'],
      'firewall:view': ['super_admin', 'admin', 'department_head', 'user'],
      'firewall:edit': ['super_admin', 'admin', 'department_head'],
      'firewall:delete': ['super_admin', 'admin'],
      'monitoring:view': ['super_admin', 'admin', 'department_head', 'user'],
      'audit:view': ['super_admin', 'admin'],
      'system:execute': ['super_admin', 'admin'],
    };

    const allowedRoles = permissions[permission];
    return allowedRoles?.includes(user.role);
  };

  const hasRole = (roles) => {
    if (!user) return false;
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(user.role);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    hasPermission,
    hasRole,
    isAdmin: hasRole(['super_admin', 'admin']),
    isSuperAdmin: hasRole('super_admin'),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
