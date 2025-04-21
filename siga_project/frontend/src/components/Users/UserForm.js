import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  FormHelperText,
  Switch,
  FormControlLabel,
  Typography,
  Divider,
  Box,
  Alert
} from '@mui/material';
import api from '../../assets/services/api';

const UserForm = ({ open, onClose, user, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido1: '',
    apellido2: '',
    email: '',
    telefono: '',
    tip: '',
    estado: true,
    tipo_usuario: 'User',
    unidad_destino: '',
    unidad_acceso: '',
    empleo: '',
    password: '',
    confirmPassword: ''
  });
  
  // Estado para las listas de opciones
  const [unidades, setUnidades] = useState([]);
  const [empleos, setEmpleos] = useState([]);
  
  // Estado para errores de validación
  const [errors, setErrors] = useState({});
  
  // Estados para indicar carga
  const [loadingUnidades, setLoadingUnidades] = useState(false);
  const [loadingEmpleos, setLoadingEmpleos] = useState(false);
  
  // Cargar datos iniciales
  useEffect(() => {
    // Inicializar formulario cuando cambia el usuario o se abre el diálogo
    if (open) {
      if (user) {
        setFormData({
          nombre: user.nombre || '',
          apellido1: user.apellido1 || '',
          apellido2: user.apellido2 || '',
          email: user.email || '',
          telefono: user.telefono || '',
          tip: user.tip || '',
          estado: user.estado !== undefined ? user.estado : true,
          tipo_usuario: user.tipo_usuario || 'User',
          unidad_destino: user.unidad_destino || '',
          unidad_acceso: user.unidad_acceso || '',
          empleo: user.empleo || '',
          password: '',
          confirmPassword: ''
        });
      } else {
        // Reset para usuario nuevo
        setFormData({
          nombre: '',
          apellido1: '',
          apellido2: '',
          email: '',
          telefono: '',
          tip: '',
          estado: true,
          tipo_usuario: 'User',
          unidad_destino: '',
          unidad_acceso: '',
          empleo: '',
          password: '',
          confirmPassword: ''
        });
      }
      
      // Cargar datos adicionales
      fetchUnidades();
      fetchEmpleos();
    }
  }, [open, user]);
  
  // Función para cargar unidades
  const fetchUnidades = async () => {
    setLoadingUnidades(true);
    try {
      const response = await api.get('/unidades/', {
        params: {
          page_size: 1000,
          pagination: 'false'
        }
      });
      
      const unidadesData = response.data.results || response.data || [];
      setUnidades(unidadesData);
    } catch (error) {
      console.error('Error al cargar unidades:', error);
    } finally {
      setLoadingUnidades(false);
    }
  };
  
  // Función para cargar empleos
  const fetchEmpleos = async () => {
    setLoadingEmpleos(true);
    try {
      const response = await api.get('/empleos/');
      const empleosData = response.data.results || response.data || [];
      setEmpleos(empleosData);
    } catch (error) {
      console.error('Error al cargar empleos:', error);
    } finally {
      setLoadingEmpleos(false);
    }
  };
  
  // Manejar cambios en los campos
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error al editar campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  // Manejar cambio en campos booleanos
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // Validar formulario antes de enviar
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nombre) newErrors.nombre = 'El nombre es requerido';
    if (!formData.apellido1) newErrors.apellido1 = 'El primer apellido es requerido';
    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }
    
    if (!formData.tip) newErrors.tip = 'El TIP es requerido';
    
    if (!user) {
      // Solo validar contraseña para usuarios nuevos o si se está estableciendo una nueva contraseña
      if (formData.password && formData.password.length < 8) {
        newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Manejar envío del formulario
  const handleSubmit = () => {
    if (validateForm()) {
      // Preparar datos para enviar (eliminar confirmPassword)
      const { confirmPassword, ...dataToSubmit } = formData;
      
      // Generar ref si no existe (primera letra del nombre y los apellidos)
      if (!dataToSubmit.ref || dataToSubmit.ref.trim() === '') {
        const nombre = dataToSubmit.nombre.trim() ? dataToSubmit.nombre[0] : '';
        const apellido1 = dataToSubmit.apellido1.trim() ? dataToSubmit.apellido1[0] : '';
        const apellido2 = dataToSubmit.apellido2.trim() ? dataToSubmit.apellido2[0] : '';
        
        dataToSubmit.ref = (nombre + apellido1 + apellido2).toUpperCase();
      }
      
      // Si no hay nueva contraseña en modo edición, eliminarla para no enviarla vacía
      if (user && !dataToSubmit.password) {
        delete dataToSubmit.password;
      }
      
      // Convertir campos numéricos a números
      if (dataToSubmit.unidad_destino) dataToSubmit.unidad_destino = parseInt(dataToSubmit.unidad_destino);
      if (dataToSubmit.unidad_acceso) dataToSubmit.unidad_acceso = parseInt(dataToSubmit.unidad_acceso);
      if (dataToSubmit.empleo) dataToSubmit.empleo = parseInt(dataToSubmit.empleo);
      
      // Llamar a la función de guardado del componente padre
      onSave(user ? user.id : null, dataToSubmit);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {user ? 'Editar Usuario' : 'Nuevo Usuario'}
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* Datos personales */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Datos Personales
            </Typography>
            <Divider />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              label="Nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.nombre}
              helperText={errors.nombre}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              label="Primer Apellido"
              name="apellido1"
              value={formData.apellido1}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.apellido1}
              helperText={errors.apellido1}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              label="Segundo Apellido"
              name="apellido2"
              value={formData.apellido2}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          
          {/* Datos de contacto */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Datos de Contacto
            </Typography>
            <Divider />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.email}
              helperText={errors.email}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label="Teléfono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          
          {/* Datos profesionales */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Datos Profesionales
            </Typography>
            <Divider />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <TextField
              label="TIP"
              name="tip"
              value={formData.tip}
              onChange={handleChange}
              fullWidth
              required
              disabled={!!user} // No permitir cambios en edición
              error={!!errors.tip}
              helperText={errors.tip || (user ? 'No se puede modificar' : '')}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel id="empleo-label">Empleo</InputLabel>
              <Select
                labelId="empleo-label"
                name="empleo"
                value={formData.empleo}
                onChange={handleChange}
                label="Empleo"
                disabled={loadingEmpleos}
              >
                <MenuItem value="">Ninguno</MenuItem>
                {empleos.map(empleo => (
                  <MenuItem key={empleo.id} value={empleo.id}>
                    {empleo.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel id="tipo-usuario-label">Tipo de Usuario</InputLabel>
              <Select
                labelId="tipo-usuario-label"
                name="tipo_usuario"
                value={formData.tipo_usuario}
                onChange={handleChange}
                label="Tipo de Usuario"
              >
                <MenuItem value="User">Usuario</MenuItem>
                <MenuItem value="Gestor">Gestor</MenuItem>
                <MenuItem value="Admin">Administrador</MenuItem>
                <MenuItem value="SuperAdmin">Super Administrador</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* Unidades */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Unidades Asignadas
            </Typography>
            <Divider />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="unidad-destino-label">Unidad de Destino</InputLabel>
              <Select
                labelId="unidad-destino-label"
                name="unidad_destino"
                value={formData.unidad_destino}
                onChange={handleChange}
                label="Unidad de Destino"
                disabled={loadingUnidades}
              >
                <MenuItem value="">Ninguna</MenuItem>
                {unidades.map(unidad => (
                  <MenuItem key={unidad.id} value={unidad.id}>
                    {unidad.cod_unidad} - {unidad.nombre}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Unidad principal donde está destinado el usuario</FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="unidad-acceso-label">Unidad de Acceso</InputLabel>
              <Select
                labelId="unidad-acceso-label"
                name="unidad_acceso"
                value={formData.unidad_acceso}
                onChange={handleChange}
                label="Unidad de Acceso"
                disabled={loadingUnidades}
              >
                <MenuItem value="">Ninguna</MenuItem>
                {unidades.map(unidad => (
                  <MenuItem key={unidad.id} value={unidad.id}>
                    {unidad.cod_unidad} - {unidad.nombre}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>Unidad adicional a la que el usuario tiene acceso</FormHelperText>
            </FormControl>
          </Grid>
          
          {/* Contraseña */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              {user ? 'Cambiar Contraseña' : 'Contraseña'}
            </Typography>
            <Divider />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label="Contraseña"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              fullWidth
              required={!user}
              error={!!errors.password}
              helperText={errors.password || (user ? 'Dejar en blanco para mantener la actual' : 'Mínimo 8 caracteres')}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label="Confirmar Contraseña"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              fullWidth
              required={!user}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
            />
          </Grid>
          
          {/* Estado */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.estado}
                  onChange={handleCheckboxChange}
                  name="estado"
                  color="primary"
                />
              }
              label={formData.estado ? "Usuario Activo" : "Usuario Inactivo"}
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {user ? 'Actualizar' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserForm;