import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Grid,
  CircularProgress
} from '@mui/material';

const TipoProcedimientoForm = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    descripcion: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || '',
        nombre: initialData.nombre || '',
        descripcion: initialData.descripcion || ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    try {
      setLoading(true);
      await onSubmit(formData, !!initialData);
    } catch (error) {
      console.error('Error en el formulario:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            name="nombre"
            label="Nombre"
            fullWidth
            required
            value={formData.nombre}
            onChange={handleChange}
            error={!!errors.nombre}
            helperText={errors.nombre}
            disabled={loading}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            name="descripcion"
            label="Descripción"
            fullWidth
            multiline
            rows={4}
            value={formData.descripcion}
            onChange={handleChange}
            disabled={loading}
          />
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 1 }}>
        <Button onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : initialData ? 'Actualizar' : 'Crear'}
        </Button>
      </Box>
    </Box>
  );
};

export default TipoProcedimientoForm;