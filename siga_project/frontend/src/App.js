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

// Componente de Layout
import Layout from './components/Layout/Layout';

// Componentes de la aplicación
import Home from './components/Dashboard/Home';
import UsersList from './components/Users/UsersList';
import UserProfile from './components/Profile/UserProfile';
import ChangePassword from './components/Profile/ChangePassword';

// Procedimientos
import ProcedimientosList from './components/Procedimientos/ProcedimientosList';
import ProcedimientoForm from './components/Procedimientos/ProcedimientoForm';
import PasosManager from './components/Procedimientos/PasosManager';
import TiposProcedimiento from './components/Procedimientos/TiposProcedimiento';
import DocumentosList from './components/Procedimientos/DocumentosList';
import ProcedimientoView from './components/Procedimientos/ProcedimientoView';
import PasoDocumentosManager from './components/Procedimientos/PasoDocumentosManager';
import UnidadesPage from './pages/UnidadesPage';

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
            
            {/* Rutas protegidas con Layout común */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Home />} />
              <Route path="usuarios" element={<UsersList />} />
              <Route path="unidades" element={<UnidadesPage />} />
              <Route path="empleos" element={<div>Empleos</div>} />
              
              {/* Rutas de Procedimientos - reordenadas para resolver conflictos de rutas */}
              <Route path="procedimientos" element={<ProcedimientosList />} />
              <Route path="procedimientos/nuevo" element={<ProcedimientoForm />} />
              <Route path="procedimientos/tipos" element={<TiposProcedimiento />} />
              <Route path="procedimientos/documentos" element={<DocumentosList />} />
              <Route path="procedimientos/:procedimientoId/editar" element={<ProcedimientoForm />} />
              <Route path="procedimientos/:procedimientoId/pasos" element={<PasosManager />} />
              <Route path="procedimientos/:procedimientoId/pasos/:pasoId/documentos" element={<PasoDocumentosManager />} />
              <Route path="procedimientos/:procedimientoId" element={<ProcedimientoView />} />
              
              {/* Rutas de Perfil */}
              <Route path="perfil" element={<UserProfile />} />
              <Route path="perfil/cambiar-password" element={<ChangePassword />} />
            </Route>
            
            {/* Redirección por defecto */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
