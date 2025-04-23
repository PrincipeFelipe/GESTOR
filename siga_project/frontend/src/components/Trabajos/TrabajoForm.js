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
  FormHelperText,
  CircularProgress,
  Box,
  Typography,
  Divider
} from '@mui/material';

const TrabajoForm = ({ open, onClose, onSave, procedimientos }) => {
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    procedimiento: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (open) {
      // Reiniciar el formulario cuando se abre
      setFormData({
        titulo: '',
        descripcion: '',
        procedimiento: ''
      });
      setFormErrors({});
    }
  }, [open]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo modificado
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: false
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
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error al guardar trabajo:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const procedimientoSeleccionado = formData.procedimiento ? 
    procedimientos.find(p => p.id === parseInt(formData.procedimiento)) : null;
  
  return (
    <Dialog 
      open={open} 
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>Nuevo Trabajo</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            name="titulo"
            label="Título del trabajo"
            value={formData.titulo}
            onChange={handleChange}
            fullWidth
            required
            error={Boolean(formErrors.titulo)}
            helperText={formErrors.titulo}
            disabled={loading}
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
            disabled={loading}
            margin="normal"
          />
          
          <FormControl 
            fullWidth 
            required 
            error={Boolean(formErrors.procedimiento)}
            margin="normal"
            disabled={loading}
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
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TrabajoForm;