// src/services/api.js
import axios from 'axios';
import { navigateTo } from './navigation.service';

// Definir la URL base como constante para usarla en todo el archivo
const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,  // Usar la constante definida
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // Actualizar a 'authToken' si ese es el nombre correcto
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
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Manejo seguro de error - comprobamos si existe error.response antes de acceder a status
    if (error.response && error.response.status === 401 && !originalRequest._retry &&
        !originalRequest.url.includes('/token/')) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          localStorage.clear();
          // Usar el servicio de navegación en lugar de window.location
          navigateTo('/login', { replace: true });
          return Promise.reject(error);
        }
        
        // Usar la constante API_URL definida anteriormente
        const response = await axios.post(`${API_URL}/token/refresh/`, {
          refresh: refreshToken,
        });
        
        const { access } = response.data;
        // Corregir el nombre del token para que sea consistente
        localStorage.setItem('authToken', access);
        
        originalRequest.headers['Authorization'] = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        // Usar el servicio de navegación en lugar de window.location
        navigateTo('/login', { replace: true });
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;