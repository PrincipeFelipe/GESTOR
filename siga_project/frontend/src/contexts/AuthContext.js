// src/contexts/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../assets/services/api';
import { registerNavigate } from '../assets/services/navigation.service';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    registerNavigate(navigate);

    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setLoading(false);
          return;
        }
        
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        try {
          const decoded = jwtDecode(token);
          
          if (decoded && decoded.user_id) {
            const response = await api.get(`/users/${decoded.user_id}/`);
            
            if (response && response.data) {
              setUser(response.data);
              console.log("Usuario cargado correctamente:", response.data);
            }
          }
        } catch (decodeError) {
          console.error("Error al decodificar token:", decodeError);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
      } catch (err) {
        console.error("Error al inicializar autenticación:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [navigate]);

  const login = async (tip, password) => {
    try {
      setLoading(true);
      const response = await api.post('/token/', { tip, password });
      
      if (response.data && response.data.access) {
        localStorage.setItem('token', response.data.access);
        localStorage.setItem('refreshToken', response.data.refresh);
        
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
        
        const decoded = jwtDecode(response.data.access);
        
        if (decoded && decoded.user_id) {
          const userResponse = await api.get(`/users/${decoded.user_id}/`);
          
          if (userResponse && userResponse.data) {
            setUser(userResponse.data);
            console.log("Usuario iniciado sesión:", userResponse.data);
            
            return {
              success: true,
              user: userResponse.data
            };
          }
        }
      }
      
      throw new Error('No se pudo obtener la información del usuario');
    } catch (error) {
      console.error('Error en login:', error);
      setError(error.message || 'Error de autenticación');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log("Cerrando sesión...");
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
    navigate('/login', { replace: true });
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;