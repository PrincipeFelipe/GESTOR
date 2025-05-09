// src/services/api.js
import axios from 'axios';
import { navigateTo } from './navigation.service';

// Determinar la URL base de la API según el entorno
const getBaseUrl = () => {
  // En producción, usar rutas relativas al dominio actual
  if (process.env.NODE_ENV === 'production') {
    return '/api';
  } 
  // En desarrollo, usar la URL completa de desarrollo
  return process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a todas las solicitudes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para refrescar token
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
          // No hay token de refresco, forzar inicio de sesión
          localStorage.removeItem('token');
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        // Usar la ruta relativa para el refreshToken también
        const response = await axios.post(`${getBaseUrl()}/token/refresh/`, {
          refresh: refreshToken,
        });
        
        const { access } = response.data;
        localStorage.setItem('token', access);
        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        originalRequest.headers['Authorization'] = `Bearer ${access}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        // Error al refrescar token, forzar inicio de sesión
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;