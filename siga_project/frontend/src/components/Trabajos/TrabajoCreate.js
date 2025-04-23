import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import WorkIcon from '@mui/icons-material/Work';
import procedimientosService from '../../assets/services/procedimientos.service';
import trabajosService from '../../assets/services/trabajos.service';

const TrabajoCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    procedimiento: ''
  });
  const [procedimientos, setProcedimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Cargar lista de procedimientos al iniciar
  useEffect(() => {
    const fetchProcedimientos = async () => {
      setLoading(true);
      try {
        const response = await procedimientosService.getProcedimientos();
        setProcedimientos(response.data.results || []);
      } catch (error) {
        console.error('Error al cargar procedimientos:', error);
        setSnackbar({
          open: true,
          message: 'Error al cargar los procedimientos disponibles',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProcedimientos();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar errores cuando el usuario realiza cambios
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.titulo.trim()) {
      errors.titulo = 'El título es obligatorio';
    }

    if (!formData.procedimiento) {
      errors.procedimiento = 'Debe seleccionar un procedimiento';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await trabajosService.createTrabajo(formData);
      setSnackbar({
        open: true,
        message: 'Trabajo creado correctamente',
        severity: 'success'
      });

      // Navegar al detalle del trabajo creado
      setTimeout(() => {
        navigate(`/dashboard/trabajos/${response.data.id}`);
      }, 1500);
    } catch (error) {
      console.error('Error al crear el trabajo:', error);
      setSnackbar({
        open: true,
        message: 'Error al crear el trabajo',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/dashboard/trabajos');
  };

  const procedimientoSeleccionado = formData.procedimiento ? 
    procedimientos.find(p => p.id === parseInt(formData.procedimiento)) : 
    null;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          variant="outlined"
        >
          Volver a la lista
        </Button>
      </Box>

      <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <WorkIcon color="primary" sx={{ fontSize: 28, mr: 1 }} />
          <Typography variant="h5">Crear Nuevo Trabajo</Typography>
        </Box>

        <Divider sx={{ mb: 4 }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <TextField
              name="titulo"
              label="Título del trabajo"
              value={formData.titulo}
              onChange={handleChange}
              fullWidth
              required
              error={Boolean(formErrors.titulo)}
              helperText={formErrors.titulo}
              disabled={submitting}
              margin="normal"
            />
              
            <TextField
              name="descripcion"
              label="Descripción (opcional)"
              value={formData.descripcion}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
              disabled={submitting}
              margin="normal"
            />
            
            <FormControl 
              fullWidth 
              required 
              error={Boolean(formErrors.procedimiento)}
              margin="normal"
              disabled={submitting}
            >
              <InputLabel>Seleccionar Procedimiento</InputLabel>
              <Select
                name="procedimiento"
                value={formData.procedimiento}
                onChange={handleChange}
                label="Seleccionar Procedimiento"
              >
                <MenuItem value="">
                  <em>Seleccione un procedimiento</em>
                </MenuItem>
                {procedimientos.map(proc => (
                  <MenuItem key={proc.id} value={proc.id}>
                    {proc.nombre} ({proc.nivel_display})
                  </MenuItem>
                ))}
              </Select>
              {formErrors.procedimiento && (
                <FormHelperText>{formErrors.procedimiento}</FormHelperText>
              )}
            </FormControl>
            
            {procedimientoSeleccionado && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #eee' }}>
                <Typography variant="subtitle1">
                  Información del procedimiento seleccionado
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2">
                  <strong>Tipo:</strong> {procedimientoSeleccionado.tipo_nombre}
                </Typography>
                <Typography variant="body2">
                  <strong>Nivel:</strong> {procedimientoSeleccionado.nivel_display}
                </Typography>
                {procedimientoSeleccionado.tiempo_maximo && (
                  <Typography variant="body2">
                    <strong>Tiempo máximo:</strong> {procedimientoSeleccionado.tiempo_maximo} días
                  </Typography>
                )}
                <Alert severity="info" sx={{ mt: 2 }}>
                  Al crear este trabajo, se generarán automáticamente todos los pasos del procedimiento 
                  que podrás ir completando secuencialmente.
                </Alert>
              </Box>
            )}
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                onClick={handleBack} 
                sx={{ mr: 2 }}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={submitting}
              >
                {submitting ? 'Guardando...' : 'Guardar Trabajo'}
              </Button>
            </Box>
          </form>
        )}
      </Paper>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TrabajoCreate;