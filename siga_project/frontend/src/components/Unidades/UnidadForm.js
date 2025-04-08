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
  Typography,
  Box
} from '@mui/material';

const UnidadForm = ({ open, onClose, unidad, unidades, onSave }) => {
  const [formData, setFormData] = useState({
    id: null,
    cod_unidad: '',
    nombre: '',
    id_padre: '',
    tipo_unidad: 'PUESTO',
    descripcion: ''
  });
  
  const [errors, setErrors] = useState({});
  
  useEffect(() => {
    if (open && unidad) {
      setFormData({
        id: unidad.id,
        cod_unidad: unidad.cod_unidad || '',
        nombre: unidad.nombre || '',
        id_padre: unidad.id_padre || '',
        tipo_unidad: unidad.tipo_unidad || 'PUESTO',
        descripcion: unidad.descripcion || ''
      });
    } else if (open) {
      // Reset para un nuevo formulario
      setFormData({
        id: null,
        cod_unidad: '', // Este campo ahora se deja vacío para nuevas unidades
        nombre: '',
        id_padre: '',
        tipo_unidad: 'PUESTO',
        descripcion: ''
      });
    }
    // Resetear errores al abrir el formulario
    setErrors({});
  }, [open, unidad]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Limpiar errores cuando el usuario cambia un campo
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = () => {
    if (validateForm()) {
      // Preparar los datos para enviar al servidor
      const dataToSubmit = {
        ...formData,
        id_padre: formData.id_padre || null
      };
      
      // Si estamos creando una nueva unidad, eliminar el cod_unidad para que el backend lo genere
      if (!formData.id) {
        delete dataToSubmit.cod_unidad;
      }
      
      console.log("Datos a enviar:", dataToSubmit);
      onSave(dataToSubmit);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {formData.id ? 'Editar Unidad' : 'Nueva Unidad'}
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              error={!!errors.nombre}
              helperText={errors.nombre}
              required
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="tipo-unidad-label">Tipo de Unidad</InputLabel>
              <Select
                labelId="tipo-unidad-label"
                name="tipo_unidad"
                value={formData.tipo_unidad}
                onChange={handleChange}
                label="Tipo de Unidad"
              >
                <MenuItem value="DIRECCION">Dirección General</MenuItem>
                <MenuItem value="ZONA">Zona</MenuItem>
                <MenuItem value="COMANDANCIA">Comandancia</MenuItem>
                <MenuItem value="ZONA_COMANDANCIA">Zona-Comandancia</MenuItem> {/* Nuevo tipo híbrido */}
                <MenuItem value="COMPANIA">Compañía</MenuItem>
                <MenuItem value="PUESTO">Puesto</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="unidad-padre-label">Unidad Superior</InputLabel>
              <Select
                labelId="unidad-padre-label"
                name="id_padre"
                value={formData.id_padre || ''}
                onChange={handleChange}
                label="Unidad Superior"
              >
                <MenuItem value="">Ninguna (Unidad Raíz)</MenuItem>
                {unidades
                  .filter(u => u.id !== formData.id) // Evitar selección circular
                  .map(u => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.cod_unidad} - {u.nombre}
                    </MenuItem>
                  ))
                }
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descripción"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              multiline
              rows={3}
            />
          </Grid>

          {/* Mostrar el código solo si estamos editando una unidad existente */}
          {formData.id && (
            <Grid item xs={12}>
              <TextField
                name="cod_unidad"
                label="Código de Unidad"
                value={formData.cod_unidad}
                onChange={handleChange}
                fullWidth
                disabled={true} // Siempre deshabilitado, ya que se genera automáticamente
                helperText="Generado automáticamente"
              />
            </Grid>
          )}
          
          {/* Mensaje informativo para nuevas unidades */}
          {!formData.id && (
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  El código de unidad se generará automáticamente después de crear la unidad.
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {formData.id ? 'Actualizar' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnidadForm;