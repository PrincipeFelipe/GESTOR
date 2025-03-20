// src/components/Auth/Register.js
import React, { useState, useContext } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
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
  Snackbar,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { PersonAddOutlined } from '@mui/icons-material';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../assets/services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido1: '',
    apellido2: '',
    email: '',
    telefono: '',
    tip: '',
    password: '',
    confirmPassword: '',
    unidad: '',
    empleo: '',
  });
  
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [unidades, setUnidades] = useState([]);
  const [empleos, setEmpleos] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  // Cargar unidades y empleos al montar el componente
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [unidadesRes, empleosRes] = await Promise.all([
          api.get('/unidades/'),
          api.get('/empleos/')
        ]);
        
        setUnidades(unidadesRes.data.results || unidadesRes.data);
        setEmpleos(empleosRes.data.results || empleosRes.data);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setErrorMsg("Error al cargar unidades y empleos");
        setOpenSnackbar(true);
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    // Validación de contraseñas
    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden');
      setIsLoading(false);
      setOpenSnackbar(true);
      return;
    }

    // Preparar datos para enviar
    const userData = {
      nombre: formData.nombre,
      apellido1: formData.apellido1,
      apellido2: formData.apellido2,
      email: formData.email,
      telefono: formData.telefono,
      tip: formData.tip,
      password: formData.password,
      unidad: formData.unidad,
      empleo: formData.empleo,
      estado: true,
      tipo_usuario: 'User' // Valor por defecto
    };

    try {
      await register(userData);
      navigate('/login');
      // Mostrar mensaje de éxito antes de redirigir
      setErrorMsg('');
      setOpenSnackbar(true);
    } catch (error) {
      console.error('Error en el registro:', error);
      setErrorMsg(error.message || 'Error al registrar usuario. Intente nuevamente.');
      setOpenSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Paper 
        elevation={3} 
        sx={{ 
          mt: 4, 
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
          <PersonAddOutlined />
        </Box>
        <Typography component="h1" variant="h5" color="primary.dark" fontWeight="bold">
          Registro de Usuario - SIGA
        </Typography>
        <Box component="form" onSubmit={handleRegister} sx={{ mt: 3, width: '100%' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                autoComplete="nombre"
                name="nombre"
                required
                fullWidth
                id="nombre"
                label="Nombre"
                autoFocus
                value={formData.nombre}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                required
                fullWidth
                id="apellido1"
                label="Primer Apellido"
                name="apellido1"
                autoComplete="apellido1"
                value={formData.apellido1}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                id="apellido2"
                label="Segundo Apellido"
                name="apellido2"
                autoComplete="apellido2"
                value={formData.apellido2}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="email"
                label="Correo Electrónico"
                name="email"
                autoComplete="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="telefono"
                label="Teléfono"
                name="telefono"
                autoComplete="tel"
                value={formData.telefono}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                id="tip"
                label="TIP (Identificador único)"
                name="tip"
                value={formData.tip}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={loadingData}>
                <InputLabel id="unidad-label">Unidad</InputLabel>
                <Select
                  labelId="unidad-label"
                  id="unidad"
                  name="unidad"
                  value={formData.unidad}
                  label="Unidad"
                  onChange={handleChange}
                >
                  {unidades.map((unidad) => (
                    <MenuItem key={unidad.id} value={unidad.id}>
                      {unidad.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={loadingData}>
                <InputLabel id="empleo-label">Empleo</InputLabel>
                <Select
                  labelId="empleo-label"
                  id="empleo"
                  name="empleo"
                  value={formData.empleo}
                  label="Empleo"
                  onChange={handleChange}
                >
                  {empleos.map((empleo) => (
                    <MenuItem key={empleo.id} value={empleo.id}>
                      {empleo.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="password"
                label="Contraseña"
                type="password"
                id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="confirmPassword"
                label="Confirmar Contraseña"
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={isLoading || loadingData}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Registrarse'}
          </Button>
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link component={RouterLink} to="/login" variant="body2" color="primary.dark">
                ¿Ya tienes una cuenta? Inicia sesión
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={6000} 
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setOpenSnackbar(false)} 
          severity={errorMsg ? "error" : "success"} 
          sx={{ width: '100%' }}
        >
          {errorMsg || "Registro exitoso. Ahora puedes iniciar sesión."}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Register;