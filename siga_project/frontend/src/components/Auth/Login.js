// src/components/Auth/Login.js
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Link, 
  Grid, 
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { AuthContext } from '../../contexts/AuthContext';
import { ERROR_MESSAGES } from '../../utils/constants';

const Login = () => {
  const [tip, setTip] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Comprobar si venimos de una redirección después de un error
  useEffect(() => {
    // Si tenemos un estado en la ubicación con un mensaje de error, lo mostramos
    if (location.state?.error) {
      setErrorMsg(location.state.error);
      // Limpiar el estado de la ubicación para evitar que el mensaje aparezca después de recargar
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleLogin = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Validación
    if (!tip || !password) {
      setErrorMsg('TIP y contraseña son requeridos');
      setOpenSnackbar(true);
      setIsLoading(false);
      return false;
    }
    
    try {
      setIsLoading(true);
      setErrorMsg('');
      
      // Llamar a la función login del contexto
      const result = await login(tip, password);
      
      if (result && result.success) {
        console.log('Login exitoso, usuario:', result.user);
        
        // Usar setTimeout para asegurar que el estado se actualiza antes de navegar
        setTimeout(() => {
          console.log("Redirigiendo a dashboard...");
          navigate('/dashboard', { replace: true });
        }, 100);
        
        return true;
      } else {
        throw new Error('No se pudo iniciar sesión correctamente');
      }
    } catch (error) {
      console.error("Error en el inicio de sesión:", error);
      
      // Extraer mensaje de error amigable
      if (error.response && error.response.data) {
        if (typeof error.response.data === 'object') {
          // Formatear errores del objeto
          const errorMessages = Object.keys(error.response.data)
            .map(key => {
              const msgs = error.response.data[key];
              if (Array.isArray(msgs)) {
                return `${key}: ${msgs.join(', ')}`;
              }
              return `${key}: ${msgs}`;
            })
            .join('; ');
          setErrorMsg(errorMessages);
        } else if (error.response.data.detail) {
          setErrorMsg(error.response.data.detail);
        } else {
          setErrorMsg('Credenciales inválidas');
        }
      } else {
        setErrorMsg('Error al conectar con el servidor');
      }
      
      setOpenSnackbar(true);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  // Añade estos manejadores de eventos para los campos
  const handleTipChange = (e) => {
    setTip(e.target.value);
    if (errorMsg) {
      setErrorMsg('');
      setOpenSnackbar(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errorMsg) {
      setErrorMsg('');
      setOpenSnackbar(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper 
        elevation={3} 
        sx={{ 
          mt: 8, 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          borderRadius: 2
        }}
      >
        <Box 
          sx={{
            backgroundColor: 'primary.main',
            borderRadius: '50%',
            p: 2,
            mb: 2,
            color: 'white'
          }}
        >
          <LockOutlined />
        </Box>
        <Typography component="h1" variant="h5" color="primary.dark" fontWeight="bold">
          Iniciar Sesión - SIGA
        </Typography>
        
        {errorMsg && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {errorMsg}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="tip"
            label="TIP"
            name="tip"
            autoComplete="tip"
            autoFocus
            value={tip}
            onChange={handleTipChange}
            error={!!errorMsg}
            disabled={isLoading}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label="Contraseña"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={handlePasswordChange}
            error={!!errorMsg}
            disabled={isLoading}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Iniciar Sesión'}
          </Button>
          <Grid container>
            <Grid item xs>
              <Link component={RouterLink} to="/forgot-password" variant="body2" color="primary.dark">
                ¿Olvidaste tu contraseña?
              </Link>
            </Grid>
            <Grid item>
              <Link component={RouterLink} to="/register" variant="body2" color="primary.dark">
                {"¿No tienes cuenta? Regístrate"}
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {errorMsg}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Login;