// src/services/api.js
import axios from 'axios';
import { navigateTo } from './navigation.service';

// Base URL para todas las peticiones
const API_URL = 'http://localhost:8000/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir token a las peticiones
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

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Si es error 401 (no autorizado) y no es un retry
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Intentar refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          // No hay refresh token, forzar logout
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          navigateTo('/login', { state: { error: 'Sesión expirada' } });
          return Promise.reject(error);
        }
        
        // Hacer petición de refresh
        const response = await axios.post(`${API_URL}/token/refresh/`, {
          refresh: refreshToken
        });
        
        if (response.data && response.data.access) {
          // Guardar nuevo token
          localStorage.setItem('token', response.data.access);
          
          // Actualizar el header de autorización
          api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
          originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
          
          // Reintentar la petición original
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Error al refrescar token:', refreshError);
        // Limpiar storage y redirigir a login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        navigateTo('/login', { state: { error: 'Sesión expirada. Por favor, inicie sesión nuevamente.' } });
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;