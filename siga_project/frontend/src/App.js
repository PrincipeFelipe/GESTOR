import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './assets/styles/theme';

// Contextos
import { AuthContext, AuthProvider } from './contexts/AuthContext';

// Componentes de autenticación
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

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
import ProcedimientoViewer from './components/Procedimientos/ProcedimientoViewer';
import PasoDocumentosManager from './components/Procedimientos/PasoDocumentosManager';
import ProcedimientoCadena from './components/Procedimientos/ProcedimientoCadena';

// Unidades
import UnidadesPage from './pages/UnidadesPage';
import UnidadesList from './components/Unidades/UnidadesList';
import UnidadTree from './components/Unidades/UnidadTree';

// Empleos (importar el componente cuando esté disponible)
// import EmpleosList from './components/Empleos/EmpleosList';

// Modo de desarrollo para hacer pruebas sin autenticación
const DEV_MODE = false; // Cambiar a false en producción

// Componente mejorado de ruta protegida
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  // Depuración para verificar estado de autenticación
  useEffect(() => {
    if (!user && !loading) {
      console.log('Acceso no autorizado a ruta protegida:', location.pathname);
    }
  }, [user, loading, location]);
  
  // En modo desarrollo, permitir acceso sin autenticación
  if (DEV_MODE) {
    return children;
  }

  if (loading) {
    // Mostrar indicador de carga mientras se verifica la autenticación
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Cargando...</div>
      </div>
    );
  }

  // Si no hay usuario autenticado, redirigir al login con la ruta actual como "from"
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si el usuario está autenticado, renderizar los componentes hijos
  return children;
};

// Componente para manejar la redirección de rutas públicas cuando ya está autenticado
const PublicRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();
  
  // En modo desarrollo, no redirigir
  if (DEV_MODE) {
    return children;
  }
  
  // Si todavía está cargando, mostrar indicador
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Cargando...</div>
      </div>
    );
  }
  
  // Si ya está autenticado, redirigir al dashboard o a la ruta "from" guardada
  if (user) {
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }
  
  // Si no está autenticado, mostrar la ruta pública
  return children;
};

// Componente principal de la aplicación
const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Routes>
            {/* Rutas públicas con protección inversa */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />
            
            {/* Rutas protegidas con Layout común */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              {/* Dashboard principal */}
              <Route index element={<Home />} />
              
              {/* Gestión de Usuarios */}
              <Route path="usuarios">
                <Route index element={<UsersList />} />
                {/* Aquí pueden ir otras rutas relacionadas con usuarios como detalles, etc. */}
              </Route>
              
              {/* Gestión de Unidades */}
              <Route path="unidades">
                <Route index element={<UnidadesPage />} />
                <Route path="lista" element={<UnidadesList />} />
                <Route path="arbol" element={<UnidadTree />} />
              </Route>
              
              {/* Gestión de Empleos */}
              <Route path="empleos">
                <Route index element={<div>Lista de Empleos (En desarrollo)</div>} />
                {/* Cuando tengas el componente EmpleosList, reemplaza el div por el componente */}
                {/* <Route index element={<EmpleosList />} /> */}
              </Route>
              
              {/* Rutas de Procedimientos - reordenadas para resolver conflictos de rutas */}
              <Route path="procedimientos">
                <Route index element={<ProcedimientosList />} />
                <Route path="nuevo" element={<ProcedimientoForm />} />
                <Route path="tipos" element={<TiposProcedimiento />} />
                <Route path="documentos" element={<DocumentosList />} />
                <Route path=":procedimientoId" element={<ProcedimientoViewer />} />
                <Route path=":procedimientoId/ver" element={<ProcedimientoViewer />} /> {/* Añadir esta ruta */}
                <Route path=":procedimientoId/editar" element={<ProcedimientoForm />} />
                <Route path=":procedimientoId/pasos" element={<PasosManager />} />
                <Route path=":procedimientoId/pasos/:pasoId/documentos" element={<PasoDocumentosManager />} />
                <Route path=":procedimientoId/cadena" element={<ProcedimientoCadena />} />
              </Route>
              
              {/* Rutas de Perfil */}
              <Route path="perfil">
                <Route index element={<UserProfile />} />
                <Route path="cambiar-password" element={<ChangePassword />} />
              </Route>
            </Route>
            
            {/* Redirección por defecto - con verificación de autenticación */}
            <Route path="/" element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            } />
            <Route path="*" element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            } />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
