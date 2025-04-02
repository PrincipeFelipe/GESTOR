// src/services/auth.service.js
import api from './api';
import { jwtDecode } from 'jwt-decode';

// Función de login
const login = async (tip, password) => {
  try {
    console.log("Intentando login con:", { tip, password: "***" });
    
    const data = { tip, password };
    const response = await api.post('/token/', data);
    
    // Guardar tokens con nombres consistentes
    if (response.data && response.data.access) {
      localStorage.setItem('token', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);
      
      // Configurar el token para futuras peticiones
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
    }
    
    return response;
  } catch (error) {
    console.error("Error durante la autenticación:", error);
    throw error;
  }
};

// Función para cerrar sesión
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  delete api.defaults.headers.common['Authorization'];
};

// Función para obtener detalles del usuario por su ID
const getUserDetails = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}/`);
    return response;
  } catch (error) {
    console.error(`Error al obtener detalles del usuario ${userId}:`, error);
    throw error;
  }
};

// Función para obtener el usuario actual
const getCurrentUser = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return null;
  }
  
  try {
    // Decodificar el token para obtener información básica
    const decoded = jwtDecode(token);
    return decoded;
  } catch (error) {
    console.error("Error al decodificar token:", error);
    return null;
  }
};

export default {
  login,
  logout,
  getUserDetails,
  getCurrentUser
};