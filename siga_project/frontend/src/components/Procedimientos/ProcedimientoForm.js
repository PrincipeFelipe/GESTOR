import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import procedimientosService from '../../assets/services/procedimientos.service';
import { AuthContext } from '../../contexts/AuthContext';

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
  Alert,
  InputAdornment
} from '@mui/material';
const ProcedimientoForm = () => {
  const { procedimientoId } = useParams();  // Obtener el ID de la URL
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const isEditMode = !!procedimientoId;  // Si hay ID, estamos en modo edición
  console.log("Modo edición:", isEditMode, "ID:", procedimientoId);  // Para depuración
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: '',
    nivel: 'GENERAL', // Valor por defecto para el nuevo campo nivel
    estado: 'BORRADOR',
    version: '1.0',
    procedimiento_relacionado: '', // Añadimos el campo para procedimiento relacionado
    tiempo_maximo: '' // Añadir campo tiempo_maximo al estado
  });
  const [tipos, setTipos] = useState([]);
  const [procedimientosRelacionados, setProcedimientosRelacionados] = useState([]); // Para los procedimientos relacionables
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  // Definir los niveles disponibles
  const NIVEL_CHOICES = [
    { value: 'PUESTO', label: 'Puesto' },
    { value: 'COMPANIA', label: 'Compañía' },
    { value: 'COMANDANCIA', label: 'Comandancia' },
    { value: 'ZONA', label: 'Zona' },
    { value: 'DIRECCION', label: 'Dirección General' },
    { value: 'GENERAL', label: 'General' }
  ];
  // Función auxiliar para obtener la etiqueta del siguiente nivel
  const getNextNivelLabel = (nivelActual) => {
    switch(nivelActual) {
      case 'PUESTO': 
        return 'Compañía';
      case 'COMPANIA': 
        return 'Comandancia';
      case 'COMANDANCIA': 
        return 'Zona';
      case 'ZONA': 
        return 'Dirección General';
      default:
        return '';
    }
  };
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
    // Cargar procedimientos que pueden ser relacionados
    const fetchProcedimientosRelacionados = async () => {
      try {
        const response = await procedimientosService.getProcedimientos({
          page_size: 100 // Cargar un número razonable de procedimientos
        });
        // Filtrar procedimientos según la estructura jerárquica
        const procs = response.data.results || response.data || [];
        // Filtrar el procedimiento actual si estamos en modo edición
        setProcedimientosRelacionados(
          isEditMode 
            ? procs.filter(p => p.id !== parseInt(procedimientoId)) 
            : procs
        );
      } catch (error) {
        console.error('Error al cargar procedimientos relacionados:', error);
      }
    };
    fetchTipos();
    fetchProcedimientosRelacionados();
  }, [isEditMode, procedimientoId]);
  // Cargar datos del procedimiento en modo edición
  useEffect(() => {
    if (isEditMode) {
      const fetchProcedimiento = async () => {
        try {
          setInitialLoading(true);
          const response = await procedimientosService.getProcedimiento(procedimientoId);
          const procedimiento = response.data;
          setFormData({
            nombre: procedimiento.nombre || '',
            descripcion: procedimiento.descripcion || '',
            tipo: procedimiento.tipo || '',
            nivel: procedimiento.nivel || 'GENERAL', // Inicializar el campo nivel
            estado: procedimiento.estado || 'BORRADOR',
            version: procedimiento.version || '1.0',
            procedimiento_relacionado: procedimiento.procedimiento_relacionado || '',
            tiempo_maximo: procedimiento.tiempo_maximo || '' // Inicializar el campo tiempo_maximo
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
  }, [isEditMode, procedimientoId]);
  // Modificar la función handleChange para manejar adecuadamente el campo tiempo_maximo
const handleChange = (e) => {
  const { name, value } = e.target;
  
  // Procesamiento especial para el campo tiempo_maximo
  if (name === 'tiempo_maximo') {
    // Si el valor está vacío, establecerlo como cadena vacía
    // Si no, intentar convertirlo a entero
    const processedValue = value === '' ? '' : parseInt(value, 10);
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    // Limpiar errores cuando el usuario modifica el campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    return;
  }
  
  // Si se está cambiando el nivel, verificar si hay que limpiar el procedimiento relacionado
  if (name === 'nivel') {
    if (value === 'DIRECCION' || value === 'GENERAL') {
      // Si es un nivel superior, eliminar cualquier procedimiento relacionado
      setFormData(prev => ({
        ...prev,
        [name]: value,
        procedimiento_relacionado: '' // Limpiar el procedimiento relacionado
      }));
    } else {
      // Si es otro nivel, verificar si el procedimiento relacionado actual es válido
      const nivelSiguienteValido = {
        'PUESTO': 'COMPANIA',
        'COMPANIA': 'COMANDANCIA',
        'COMANDANCIA': 'ZONA',
        'ZONA': 'DIRECCION'
      };
      // Si hay un procedimiento seleccionado, verificar si sigue siendo válido
      if (formData.procedimiento_relacionado) {
        const procRelacionado = procedimientosRelacionados.find(p => p.id === parseInt(formData.procedimiento_relacionado));
        // Si el procedimiento no es del nivel adecuado, limpiarlo
        if (!procRelacionado || procRelacionado.nivel !== nivelSiguienteValido[value]) {
          setFormData(prev => ({
            ...prev,
            [name]: value,
            procedimiento_relacionado: ''
          }));
          return;
        }
      }
      // Caso normal: solo actualizar el nivel
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  } else {
    // Comportamiento normal para otros campos
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }
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
    if (!formData.nivel) {
      newErrors.nivel = 'El nivel del procedimiento es obligatorio';
    }
    // Validar tiempo_maximo
    if (formData.tiempo_maximo && (isNaN(parseInt(formData.tiempo_maximo)) || parseInt(formData.tiempo_maximo) <= 0)) {
      newErrors.tiempo_maximo = 'El tiempo máximo debe ser un número entero positivo';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  // En la función handleSubmit, asegurarnos de que el valor se envíe correctamente
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validate()) {
    return;
  }
  
  // Crear una copia del formData para procesar el campo tiempo_maximo
  const submitData = {
    ...formData,
    tiempo_maximo: formData.tiempo_maximo === '' ? null : parseInt(formData.tiempo_maximo, 10)
  };
  
  setLoading(true);
  try {
    if (isEditMode) {
      await procedimientosService.updateProcedimiento(procedimientoId, submitData);
      setSnackbar({
        open: true,
        message: 'Procedimiento actualizado correctamente',
        severity: 'success'
      });
    } else {
      const response = await procedimientosService.createProcedimiento(submitData);
      setSnackbar({
        open: true,
        message: 'Procedimiento creado correctamente',
        severity: 'success'
      });
      setTimeout(() => {
        navigate(`/dashboard/procedimientos/${response.data.id}/editar`);
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
          {/* Nuevo campo para el nivel */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.nivel} required>
              <InputLabel id="nivel-label">Nivel del Procedimiento</InputLabel>
              <Select
                labelId="nivel-label"
                name="nivel"
                value={formData.nivel}
                onChange={handleChange}
                label="Nivel del Procedimiento"
                disabled={loading}
              >
                {NIVEL_CHOICES.map((nivel) => (
                  <MenuItem key={nivel.value} value={nivel.value}>
                    {nivel.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.nivel && (
                <Typography variant="caption" color="error">
                  {errors.nivel}
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
          {/* Campo para tiempo máximo */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Tiempo máximo (días)"
              name="tiempo_maximo"
              type="number"
              value={formData.tiempo_maximo || ''}
              onChange={handleChange}
              InputProps={{
                endAdornment: <InputAdornment position="end">días</InputAdornment>,
                inputProps: { min: 1 }
              }}
              helperText="Número máximo de días para completar el procedimiento"
              disabled={loading}
              error={!!errors.tiempo_maximo}
            />
          </Grid>
          {/* Campo para el procedimiento relacionado */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth disabled={formData.nivel === 'DIRECCION' || formData.nivel === 'GENERAL'}>
              <InputLabel id="procedimiento-relacionado-label">Continúa en Nivel Superior</InputLabel>
              <Select
                labelId="procedimiento-relacionado-label"
                name="procedimiento_relacionado"
                value={formData.nivel === 'DIRECCION' || formData.nivel === 'GENERAL' ? '' : formData.procedimiento_relacionado}
                onChange={handleChange}
                label="Continúa en Nivel Superior"
                disabled={loading || formData.nivel === 'DIRECCION' || formData.nivel === 'GENERAL'}
              >
                <MenuItem value="">Ninguno</MenuItem>
                {procedimientosRelacionados
                  .filter(p => {
                    // Lógica de jerarquía estricta según los requisitos
                    switch(formData.nivel) {
                      case 'PUESTO': 
                        return p.nivel === 'COMPANIA';
                      case 'COMPANIA': 
                        return p.nivel === 'COMANDANCIA';
                      case 'COMANDANCIA': 
                        return p.nivel === 'ZONA';
                      case 'ZONA': 
                        return p.nivel === 'DIRECCION';
                      case 'DIRECCION':
                      case 'GENERAL':
                      default:
                        return false; // No hay opciones para los niveles superiores
                    }
                  })
                  .map((proc) => (
                    <MenuItem key={proc.id} value={proc.id}>
                      {proc.nombre} ({proc.nivel_display || proc.nivel})
                    </MenuItem>
                  ))
                }
              </Select>
              <Typography variant="caption" color="text.secondary">
                {formData.nivel === 'DIRECCION' || formData.nivel === 'GENERAL' 
                  ? 'Este nivel no puede tener un procedimiento superior' 
                  : `Un procedimiento de nivel ${NIVEL_CHOICES.find(n => n.value === formData.nivel)?.label || ''} solo puede continuar en ${getNextNivelLabel(formData.nivel)}`}
              </Typography>
            </FormControl>
          </Grid>
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