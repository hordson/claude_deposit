import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Replace with your server's IP/domain when deploying
const BASE_URL = 'http://localhost:4000/api';

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async cfg => {
  const token = await SecureStore.getItemAsync('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default api;
