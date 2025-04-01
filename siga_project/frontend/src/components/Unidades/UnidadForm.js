import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Box
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const UnidadForm = ({ open, onClose, unidad, unidades, onSave }) => {
  const [formData, setFormData] = useState({
    id: null,
    nombre: '',
    id_padre: null
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (unidad) {
      setFormData({
        id: unidad.id,
        nombre: unidad.nombre || '',
        id_padre: unidad.id_padre || null
      });
    } else {
      setFormData({
        id: null,
        nombre: '',
        id_padre: null
      });
    }
    setErrors({});
  }, [unidad, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Limpiar error cuando se modifica el campo
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }
    
    // Verificar que una unidad no pueda ser su propio padre
    // o que no se creen ciclos en la jerarquía
    if (formData.id && formData.id_padre) {
      // Verificar si la unidad seleccionada como padre es la misma unidad
      if (formData.id === formData.id_padre) {
        newErrors.id_padre = 'Una unidad no puede ser su propio padre';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      // Crear un objeto nuevo sin propiedades undefined
      const unidadToSave = {
        ...(formData.id && { id: formData.id }), // Solo incluir ID si existe
        nombre: formData.nombre,
        id_padre: formData.id_padre || null
      };
      
      onSave(unidadToSave);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {unidad ? 'Editar Unidad' : 'Nueva Unidad'}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Box sx={{ pt: 1 }}>
            <TextField
              name="nombre"
              label="Nombre de la unidad"
              value={formData.nombre}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.nombre}
              helperText={errors.nombre}
              margin="normal"
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="id-padre-label">Unidad superior</InputLabel>
              <Select
                labelId="id-padre-label"
                name="id_padre"
                value={formData.id_padre || ''}
                onChange={handleChange}
                label="Unidad superior"
              >
                <MenuItem value="">
                  <em>Ninguna (Unidad principal)</em>
                </MenuItem>
                {unidades
                  .filter(u => u.id !== formData.id) // No mostrar la unidad actual como padre
                  .map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.nombre}
                    </MenuItem>
                  ))
                }
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancelar
          </Button>
          <Button type="submit" variant="contained" color="primary">
            {unidad ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UnidadForm;