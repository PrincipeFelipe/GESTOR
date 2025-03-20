import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Grid, 
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  IconButton,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Save as SaveIcon, 
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import procedimientosService from '../../assets/services/procedimientos.service';
import { AuthContext } from '../../contexts/AuthContext';

const ProcedimientoForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: '',
    estado: 'BORRADOR',
    version: '1.0',
  });
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Cargar tipos de procedimiento al montar el componente
  useEffect(() => {
    const fetchTipos = async () => {
      try {
        const response = await procedimientosService.getTiposProcedimiento();
        setTipos(response.data.results || response.data);
      } catch (error) {
        console.error('Error al cargar tipos de procedimiento:', error);
        setSnackbar({
          open: true,
          message: 'Error al cargar tipos de procedimiento',
          severity: 'error'
        });
      }
    };

    fetchTipos();
  }, []);

  // Cargar datos del procedimiento en modo edición
  useEffect(() => {
    if (isEditMode) {
      const fetchProcedimiento = async () => {
        try {
          setInitialLoading(true);
          const response = await procedimientosService.getProcedimiento(id);
          const procedimiento = response.data;
          
          setFormData({
            nombre: procedimiento.nombre || '',
            descripcion: procedimiento.descripcion || '',
            tipo: procedimiento.tipo || '',
            estado: procedimiento.estado || 'BORRADOR',
            version: procedimiento.version || '1.0',
          });
        } catch (error) {
          console.error('Error al cargar el procedimiento:', error);
          setSnackbar({
            open: true,
            message: 'Error al cargar el procedimiento',
            severity: 'error'
          });
        } finally {
          setInitialLoading(false);
        }
      };

      fetchProcedimiento();
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar el error cuando el usuario modifica el campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }
    
    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es obligatoria';
    }
    
    if (!formData.tipo) {
      newErrors.tipo = 'El tipo de procedimiento es obligatorio';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    setLoading(true);
    
    try {
      if (isEditMode) {
        await procedimientosService.updateProcedimiento(id, formData);
        setSnackbar({
          open: true,
          message: 'Procedimiento actualizado correctamente',
          severity: 'success'
        });
      } else {
        const response = await procedimientosService.createProcedimiento(formData);
        setSnackbar({
          open: true,
          message: 'Procedimiento creado correctamente',
          severity: 'success'
        });
        
        // Si se crea con éxito, redirigir a la página de edición de pasos
        setTimeout(() => {
          navigate(`/dashboard/procedimientos/editar/${response.data.id}`);
        }, 1000);
      }
    } catch (error) {
      console.error('Error al guardar el procedimiento:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Error al guardar el procedimiento',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (initialLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/dashboard/procedimientos')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1">
          {isEditMode ? 'Editar Procedimiento' : 'Nuevo Procedimiento'}
        </Typography>
      </Box>

      <Paper component="form" onSubmit={handleSubmit} elevation={3} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nombre del Procedimiento"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              error={!!errors.nombre}
              helperText={errors.nombre}
              disabled={loading}
              required
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.tipo} required>
              <InputLabel id="tipo-label">Tipo de Procedimiento</InputLabel>
              <Select
                labelId="tipo-label"
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                label="Tipo de Procedimiento"
                disabled={loading}
              >
                {tipos.map((tipo) => (
                  <MenuItem key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </MenuItem>
                ))}
              </Select>
              {errors.tipo && (
                <Typography variant="caption" color="error">
                  {errors.tipo}
                </Typography>
              )}
            </FormControl>
          </Grid>

          {isEditMode && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="estado-label">Estado</InputLabel>
                <Select
                  labelId="estado-label"
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  label="Estado"
                  disabled={loading}
                >
                  <MenuItem value="BORRADOR">Borrador</MenuItem>
                  <MenuItem value="VIGENTE">Vigente</MenuItem>
                  <MenuItem value="OBSOLETO">Obsoleto</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}

          {isEditMode && (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Versión"
                name="version"
                value={formData.version}
                onChange={handleChange}
                disabled={loading}
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descripción"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              error={!!errors.descripcion}
              helperText={errors.descripcion}
              multiline
              rows={4}
              disabled={loading}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {isEditMode ? 'Actualizar' : 'Crear'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProcedimientoForm;