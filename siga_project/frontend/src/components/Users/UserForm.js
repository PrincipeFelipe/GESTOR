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
    unidad: '',
    unidad_destino: '',
    unidad_acceso: '',
    empleo: '',
    password: '',
    confirmPassword: ''
  });
  
  const [unidades, setUnidades] = useState([]);
  const [empleos, setEmpleos] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Cargar unidades y empleos al abrir el formulario
    const fetchData = async () => {
      setLoading(true);
      try {
        const [unidadesResponse, empleosResponse] = await Promise.all([
          api.get('/unidades/?pagination=false&page_size=1000'),
          api.get('/empleos/?pagination=false&page_size=1000')
        ]);
        
        setUnidades(unidadesResponse.data.results || unidadesResponse.data);
        setEmpleos(empleosResponse.data.results || empleosResponse.data);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (open) {
      fetchData();
    }
  }, [open]);
  
  useEffect(() => {
    // Si estamos editando, poblar el formulario con datos del usuario
    if (user) {
      setFormData({
        nombre: user.nombre || '',
        apellido1: user.apellido1 || '',
        apellido2: user.apellido2 || '',
        email: user.email || '',
        telefono: user.telefono || '',
        tip: user.tip || '',
        estado: user.estado || true,
        tipo_usuario: user.tipo_usuario || 'User',
        unidad: user.unidad || '',
        unidad_destino: user.unidad_destino || '',
        unidad_acceso: user.unidad_acceso || '',
        empleo: user.empleo || '',
        password: '',
        confirmPassword: ''
      });
    } else {
      // Reset para crear un nuevo usuario
      setFormData({
        nombre: '',
        apellido1: '',
        apellido2: '',
        email: '',
        telefono: '',
        tip: '',
        estado: true,
        tipo_usuario: 'User',
        unidad: '',
        unidad_destino: '',
        unidad_acceso: '',
        empleo: '',
        password: '',
        confirmPassword: ''
      });
    }
    
    // Limpiar errores al abrir/cerrar el formulario
    setErrors({});
  }, [user, open]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    
    // Limpiar error del campo cuando se modifica
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: checked
    }));
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Validaciones básicas
    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
    if (!formData.apellido1.trim()) newErrors.apellido1 = "El primer apellido es obligatorio";
    if (!formData.email.trim()) newErrors.email = "El email es obligatorio";
    if (!/\S+@\S+\.\S+/.test(formData.email.trim())) newErrors.email = "El email no tiene un formato válido";
    if (!formData.tip.trim()) newErrors.tip = "El TIP es obligatorio";
    
    // Validación de contraseña solo para nuevos usuarios o si se intenta cambiar
    if (!user && !formData.password) {
      newErrors.password = "La contraseña es obligatoria para nuevos usuarios";
    }
    
    if (formData.password && formData.password.length < 8) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres";
    }
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = () => {
    if (validateForm()) {
      // Preparar datos para enviar (eliminar confirmPassword)
      const { confirmPassword, ...dataToSubmit } = formData;
      
      // Si no hay nueva contraseña en modo edición, eliminarla para no enviarla vacía
      if (user && !dataToSubmit.password) {
        delete dataToSubmit.password;
      }
      
      // Convertir campos numéricos a números
      if (dataToSubmit.unidad) dataToSubmit.unidad = parseInt(dataToSubmit.unidad);
      if (dataToSubmit.unidad_destino) dataToSubmit.unidad_destino = parseInt(dataToSubmit.unidad_destino);
      if (dataToSubmit.unidad_acceso) dataToSubmit.unidad_acceso = parseInt(dataToSubmit.unidad_acceso);
      if (dataToSubmit.empleo) dataToSubmit.empleo = parseInt(dataToSubmit.empleo);
      
      // Llamar a la función de guardado del componente padre
      onSave(user ? user.id : null, dataToSubmit);
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        {user ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Información básica */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Información Personal
            </Typography>
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
          
          <Grid item xs={12} sm={4}>
            <TextField
              label="TIP"
              name="tip"
              value={formData.tip}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.tip}
              helperText={errors.tip || "Identificador único del usuario"}
            />
          </Grid>
          
          <Grid item xs={12} sm={4}>
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
          
          <Grid item xs={12} sm={4}>
            <TextField
              label="Teléfono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          
          <Grid item xs={12}>
            <Divider />
          </Grid>
          
          {/* Información de acceso */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Información de Acceso
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required error={!!errors.tipo_usuario}>
              <InputLabel>Tipo de Usuario</InputLabel>
              <Select
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
              {errors.tipo_usuario && <FormHelperText>{errors.tipo_usuario}</FormHelperText>}
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.estado}
                  onChange={handleSwitchChange}
                  name="estado"
                  color="primary"
                />
              }
              label="Usuario Activo"
            />
            <FormHelperText>
              Los usuarios inactivos no pueden iniciar sesión
            </FormHelperText>
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
              required={!!formData.password}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              disabled={!formData.password}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Divider />
          </Grid>
          
          {/* Información de unidades */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Asignación de Unidades
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Define la jerarquía de acceso del usuario a las unidades
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Unidad Principal</InputLabel>
              <Select
                name="unidad"
                value={formData.unidad}
                onChange={handleChange}
                label="Unidad Principal"
              >
                <MenuItem value="">Ninguna</MenuItem>
                {unidades.map((unidad) => (
                  <MenuItem key={unidad.id} value={unidad.id}>
                    {unidad.nombre} ({unidad.cod_unidad})
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Unidad principal a la que pertenece el usuario
              </FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Unidad de Destino</InputLabel>
              <Select
                name="unidad_destino"
                value={formData.unidad_destino}
                onChange={handleChange}
                label="Unidad de Destino"
              >
                <MenuItem value="">Ninguna</MenuItem>
                {unidades.map((unidad) => (
                  <MenuItem key={unidad.id} value={unidad.id}>
                    {unidad.nombre} ({unidad.cod_unidad})
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Unidad temporal a la que el usuario está destinado
              </FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Unidad de Acceso</InputLabel>
              <Select
                name="unidad_acceso"
                value={formData.unidad_acceso}
                onChange={handleChange}
                label="Unidad de Acceso"
              >
                <MenuItem value="">Ninguna</MenuItem>
                {unidades.map((unidad) => (
                  <MenuItem key={unidad.id} value={unidad.id}>
                    {unidad.nombre} ({unidad.cod_unidad})
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Unidad adicional a la que se concede acceso al usuario
              </FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="subtitle2">
                Funcionamiento de acceso a unidades:
              </Typography>
              <ul style={{ margin: '8px 0', paddingLeft: '16px' }}>
                <li>Los <strong>Administradores</strong> y <strong>Gestores</strong> pueden acceder a las unidades asignadas y todas sus dependientes.</li>
                <li>Los <strong>Usuarios</strong> solo pueden acceder a las unidades directamente asignadas.</li>
                <li>Los <strong>Super Administradores</strong> tienen acceso a todas las unidades.</li>
                <li>Una unidad de tipo <strong>ZONA_COMANDANCIA</strong> permite acceder a procedimientos tanto de zona como de comandancia.</li>
              </ul>
            </Alert>
          </Grid>
          
          <Grid item xs={12}>
            <Divider />
          </Grid>
          
          {/* Información adicional */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Información Adicional
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Empleo</InputLabel>
              <Select
                name="empleo"
                value={formData.empleo}
                onChange={handleChange}
                label="Empleo"
              >
                <MenuItem value="">Sin empleo asignado</MenuItem>
                {empleos.map((empleo) => (
                  <MenuItem key={empleo.id} value={empleo.id}>
                    {empleo.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading}
        >
          {user ? 'Actualizar' : 'Crear Usuario'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserForm;