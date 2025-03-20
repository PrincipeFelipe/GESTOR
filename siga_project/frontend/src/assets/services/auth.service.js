// src/services/auth.service.js
import api from './api';
import { jwtDecode } from 'jwt-decode'; // Cambiado de jwt_decode a { jwtDecode }

// Modifica la función login para enviar los parámetros correctamente

const login = async (tip, password) => {
  try {
    console.log("Intentando login con:", { tip, password });
    
    // Los datos deben enviarse en este formato según el error
    const data = {
      tip: tip,
      password: password
    };
    
    const response = await api.post('/token/', data);
    
    // Guardar tokens
    if (response.data.access) {
      localStorage.setItem('authToken', response.data.access);
    }
    if (response.data.refresh) {
      localStorage.setItem('refreshToken', response.data.refresh);
    }
    
    return response;
  } catch (error) {
    console.error("Error durante la autenticación:", error);
    
    // Muestra más detalles del error para depuración
    if (error.response && error.response.data) {
      console.error("Detalles del error:", error.response.data);
    }
    
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

// Modifica la función getUserDetails para usar la ruta correcta

const getUserDetails = (userId) => {
  // Cambia la ruta según la estructura de tu API backend
  return api.get(`/users/${userId}/`);  // Parece que la ruta correcta es users, no usuarios
};

// Implementa getCurrentUser para verificar la sesión actual
const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    
    // Decodificar el token para obtener el user_id
    const tokenData = JSON.parse(atob(token.split('.')[1]));
    const userId = tokenData.user_id;
    
    // Obtener los detalles del usuario
    const response = await getUserDetails(userId);
    
    // Combinar los datos del token con los detalles del usuario
    return {
      ...tokenData,
      ...response.data
    };
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
    // Si hay un error, limpiar el token y devolver null
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    return null;
  }
};

// Asegúrate de incluir todas las funciones en el objeto exportado
const authService = {
  login,
  register,
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  },
  getCurrentUser,
  getUserDetails
};

export default authService;