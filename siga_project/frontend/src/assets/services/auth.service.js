// src/services/auth.service.js
import api from './api';
import { jwtDecode } from 'jwt-decode'; // Cambiado de jwt_decode a { jwtDecode }

const login = async (tip, password) => {
  try {
    const response = await api.post('/token/', {
      tip,
      password,
    });
    
    const { access, refresh } = response.data;
    
    // Guardar tokens en localStorage
    localStorage.setItem('token', access);
    localStorage.setItem('refreshToken', refresh);
    
    // Decodificar el token para obtener información del usuario
    const user = jwtDecode(access);
    return user;
  } catch (error) {
    // Gestionar errores específicos
    if (error.response && error.response.status === 401) {
      // Credenciales incorrectas - este es un error esperado y no necesitamos spamear la consola
      throw new Error('Credenciales incorrectas');
    }
    
    // Propagar otros errores
    console.error('Error durante la autenticación:', error);
    throw error;
  }
};

const register = async (userData) => {
  try {
    const response = await api.post('/users/', userData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al registrar usuario');
  }
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
};

const getCurrentUser = async () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    // Verificar si el token es válido
    const user = jwtDecode(token); // Cambiado de jwt_decode a jwtDecode
    
    // Verificar si el token ha expirado
    const currentTime = Date.now() / 1000;
    if (user.exp < currentTime) {
      // Token expirado, intentar refrescar
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        logout();
        return null;
      }
      
      try {
        const response = await api.post('/token/refresh/', {
          refresh: refreshToken,
        });
        
        const { access } = response.data;
        localStorage.setItem('token', access);
        
        return jwtDecode(access); // Cambiado de jwt_decode a jwtDecode
      } catch (refreshError) {
        logout();
        return null;
      }
    }
    
    return user;
  } catch (error) {
    logout();
    return null;
  }
};

const authService = {
  login,
  register,
  logout,
  getCurrentUser,
};

export default authService;