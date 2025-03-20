import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Grid, 
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  FormHelperText,
  Input,
  Snackbar,
  Alert,
  Divider,
  IconButton
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import procedimientosService from '../../assets/services/procedimientos.service';

const DocumentoForm = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    id: '',
    nombre: '',
    descripcion: '',
    archivo: null,
    url: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [filePreview, setFilePreview] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id || '',
        nombre: initialData.nombre || '',
        descripcion: initialData.descripcion || '',
        archivo: null,
        url: initialData.url || ''
      });

      if (initialData.archivo_url) {
        setFilePreview(initialData.archivo_url);
      }
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        archivo: file
      }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Clear error if any
      if (errors.archivo) {
        setErrors(prev => ({
          ...prev,
          archivo: ''
        }));
      }
    }
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({
      ...prev,
      archivo: null
    }));
    setFilePreview(null);
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }
    
    if (!formData.archivo && !formData.url && !initialData?.archivo_url) {
      newErrors.archivo = 'Debe proporcionar un archivo o una URL';
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
      
      setSnackbar({
        open: true,
        message: 'Documento guardado correctamente',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error en el formulario:', error);
      setSnackbar({
        open: true,
        message: 'Error al guardar el documento',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            name="nombre"
            label="Nombre del documento"
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
            rows={3}
            value={formData.descripcion}
            onChange={handleChange}
            disabled={loading}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            name="url"
            label="URL (opcional si sube un archivo)"
            fullWidth
            value={formData.url}
            onChange={handleChange}
            disabled={loading}
            placeholder="https://ejemplo.com/documento.pdf"
          />
        </Grid>
        
        <Grid item xs={12}>
          <Box sx={{ border: '1px dashed grey', p: 2, borderRadius: 1 }}>
            <FormControl error={!!errors.archivo} fullWidth>
              <Typography variant="body2" gutterBottom>
                Archivo (opcional si proporciona URL)
              </Typography>
              
              <Input
                type="file"
                id="archivo-input"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={loading}
              />
              
              <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
                <label htmlFor="archivo-input">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    disabled={loading}
                  >
                    {initialData?.archivo_url ? 'Cambiar archivo' : 'Subir archivo'}
                  </Button>
                </label>
                
                {(filePreview || initialData?.archivo_url) && (
                  <Box display="flex" alignItems="center">
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {formData.archivo ? formData.archivo.name : 'Archivo actual'}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={handleRemoveFile}
                      color="error"
                      disabled={loading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                )}
              </Box>
              
              {errors.archivo && (
                <FormHelperText>{errors.archivo}</FormHelperText>
              )}
            </FormControl>
          </Box>
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Box display="flex" justifyContent="flex-end" gap={1}>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {initialData ? 'Actualizar' : 'Crear'}
            </Button>
          </Box>
        </Grid>
      </Grid>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={handleCloseSnackbar}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DocumentoForm;