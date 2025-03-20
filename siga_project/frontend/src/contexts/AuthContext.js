// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../assets/services/auth.service';
import { registerNavigate } from '../assets/services/navigation.service';
import api from '../assets/services/api'; // Ensure this is the correct path to your API service

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Registrar la función navigate en el servicio de navegación
    registerNavigate(navigate);

    const initAuth = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        console.error("Error al inicializar la autenticación:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [navigate]);

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          // Verifica que el token sea válido
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Obtén el user_id del token
          const tokenData = JSON.parse(atob(token.split('.')[1]));
          const userId = tokenData.user_id;
          
          // Obtén los datos completos del usuario
          const userResponse = await authService.getUserDetails(userId);
          const userDetails = userResponse.data;
          
          // Establece el usuario en el estado
          setCurrentUser({
            ...tokenData,
            ...userDetails
          });
        } catch (error) {
          console.error('Error al verificar sesión:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          setCurrentUser(null);
        }
      }
    };
    
    checkLoggedIn();
  }, []);

  // Versión mockeada para probar
  const login = async (tip, password) => {
    try {
      // Intenta el login normal
      const response = await authService.login(tip, password);
      
      // SOLUCIÓN TEMPORAL: Usuario mockeado independientemente de la respuesta
      const mockUser = {
        id: 1,
        nombre: "admin",
        apellido1: "admin",
        apellido2: "",
        ref: "AA",
        telefono: "",
        email: "admin@siga.gc",
        unidad: 1,
        empleo: 1,
        tip: "admin",
        tipo_usuario: "SuperAdmin",
        estado: true
      };
      
      setCurrentUser(mockUser);
      
      return response;
    } catch (error) {
      console.error('Error en login:', error);
      
      // PARA PRUEBAS: Simular login exitoso incluso con error
      const mockUser = {
        id: 1,
        nombre: "admin",
        apellido1: "admin",
        apellido2: "",
        ref: "AA",
        telefono: "",
        email: "admin@siga.gc",
        unidad: 1,
        empleo: 1,
        tip: "admin",
        tipo_usuario: "SuperAdmin",
        estado: true
      };
      
      // Comentar esta línea en producción y descomentar el throw error
      setCurrentUser(mockUser);
      navigate('/dashboard');
      
      // throw error; // Descomenta esta línea en producción
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const user = await authService.register(userData);
      setError(null);
      return user;
    } catch (err) {
      setError(err.message || 'Error al registrarse');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    if (!currentUser) return; // Evitar logout innecesario
    
    console.log("Cerrando sesión...");
    authService.logout();
    setCurrentUser(null);
    navigate('/login', { replace: true });
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;