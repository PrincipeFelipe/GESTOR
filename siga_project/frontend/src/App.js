import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './assets/styles/theme';

// Contextos
import { AuthProvider } from './contexts/AuthContext';

// Componentes de autenticación
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ProtectedRoute from './components/common/ProtectedRoute';

// Componentes del Dashboard
import Dashboard from './components/Dashboard/Dashboard';
import Home from './components/Dashboard/Home';
import UsersList from './components/Users/UsersList';
import UserProfile from './components/Profile/UserProfile';
import ChangePassword from './components/Profile/ChangePassword';

// Componente de Loader
import Loader from './components/common/Loader';

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Rutas protegidas */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }>
              <Route index element={<Home />} />
              <Route path="usuarios" element={<UsersList />} />
              <Route path="unidades" element={<div>Unidades</div>} />
              <Route path="empleos" element={<div>Empleos</div>} />
              <Route path="configuracion" element={<div>Configuración</div>} />
              <Route path="perfil" element={<UserProfile />} />
              <Route path="cambiar-password" element={<ChangePassword />} />
            </Route>
            
            {/* Redirección por defecto */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
