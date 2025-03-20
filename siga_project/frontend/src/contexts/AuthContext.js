// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../assets/services/auth.service';
import { registerNavigate } from '../assets/services/navigation.service';

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

  const login = async (tip, password) => {
    try {
      setLoading(true);
      console.log("Intentando iniciar sesión...");
      
      const user = await authService.login(tip, password);
      
      console.log("Usuario autenticado:", user);
      setCurrentUser(user);
      setError(null);
      
      return user; // No hacer navigate aquí, dejarlo para el componente Login
    } catch (err) {
      console.error("Error en login:", err);
      setError(err.message || 'Error al iniciar sesión');
      throw err;
    } finally {
      setLoading(false);
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