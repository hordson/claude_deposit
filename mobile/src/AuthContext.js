import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync('user').then(u => {
      if (u) setUser(JSON.parse(u));
      setLoading(false);
    });
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    await SecureStore.setItemAsync('token', data.token);
    await SecureStore.setItemAsync('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (fields) => {
    const { data } = await api.post('/auth/register', fields);
    await SecureStore.setItemAsync('token', data.token);
    await SecureStore.setItemAsync('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
