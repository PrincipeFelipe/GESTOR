// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../assets/services/api';
import { registerNavigate } from '../assets/services/navigation.service';

export const AuthContext = createContext();

const getUserData = (userData) => {
  // Si existe unidad_destino, úsala como unidad principal
  if (userData.unidad_destino) {
    userData.unidad_principal = userData.unidad_destino;
    userData.unidad_principal_nombre = userData.unidad_destino_nombre;
  } else {
    userData.unidad_principal = null;
    userData.unidad_principal_nombre = null;
  }
  
  return userData;
};

// Función para cargar el token en Axios
const setAuthToken = (token) => {
  if (token) {
    // Aplicar token a todas las solicitudes
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    // También guardar en localStorage para persistencia
    localStorage.setItem('token', token);
  } else {
    // Eliminar token si no hay
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

// Obtener detalles del usuario
const getUserDetails = async () => {
  try {
    console.log('Obteniendo detalles del usuario...');
    console.log('Headers:', api.defaults.headers.common);
    const response = await api.get('/users/me/');
    console.log('Respuesta obtenida:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error al obtener detalles del usuario:', error);
    // Si hay error, intentar limpiar e iniciar sesión de nuevo
    throw error;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    registerNavigate(navigate);
    
    // Verificar si hay token almacenado
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        // Configurar el token en axios
        setAuthToken(token);
        
        // Verificar si el token es válido decodificándolo
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp < currentTime) {
          // Token expirado
          setAuthToken(null);
          setUser(null);
          setLoading(false);
          navigate('/login');
          return;
        }
        
        // Obtener datos del usuario
        const userData = await getUserDetails();
        setUser(getUserData(userData));
      } catch (err) {
        console.error('Error en autenticación:', err);
        setAuthToken(null);
        setUser(null);
        setError('La sesión ha expirado o no es válida. Por favor, inicie sesión nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  // Función de inicio de sesión
  const login = async (credentials) => {
    setError(null);
    try {
      console.log('Haciendo petición de login a:', '/token/');
      const response = await api.post('/token/', credentials);
      const { access, refresh } = response.data;
      
      // Guardar tokens
      localStorage.setItem('refresh_token', refresh);
      
      // Configurar token en axios
      setAuthToken(access);
      
      // Obtener datos del usuario
      const userData = await getUserDetails();
      
      // Actualizar estado con datos del usuario
      setUser(getUserData(userData));
      
      return userData;
    } catch (err) {
      console.error('Error en login:', err);
      if (err.response && err.response.status === 401) {
        setError('Credenciales incorrectas. Por favor, verifique su TIP y contraseña.');
      } else {
        setError('Error al iniciar sesión. Por favor, inténtelo de nuevo.');
      }
      throw err;
    }
  };
  
  // Función de cierre de sesión
  const logout = () => {
    setAuthToken(null);
    setUser(null);
    navigate('/login');
  };
  
  // Valor del contexto
  const contextValue = {
    user,
    setUser,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;