import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  FormControl,
  FormControlLabel,
  Switch,
  Typography,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const DocumentoForm = ({ open, onClose, onSubmit, initialData, procedimientoId }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    url: '',
    archivo: null,
    procedimiento: procedimientoId,
    paso: null, // Puede ser null si es un documento general del procedimiento
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUrlDocument, setIsUrlDocument] = useState(false);
  const [nombreArchivo, setNombreArchivo] = useState('');
  
  // Cargar datos iniciales si hay un documento para editar
  useEffect(() => {
    if (initialData) {
      setFormData({
        id: initialData.id,
        nombre: initialData.nombre || '',
        descripcion: initialData.descripcion || '',
        url: initialData.url || '',
        procedimiento: procedimientoId,
        paso: initialData.paso || null,
      });
      setIsUrlDocument(!!initialData.url);
      setNombreArchivo(initialData.nombre || '');
    } else {
      // Reiniciar formulario
      setFormData({
        nombre: '',
        descripcion: '',
        url: '',
        archivo: null,
        procedimiento: procedimientoId,
        paso: null,
      });
      setIsUrlDocument(false);
      setNombreArchivo('');
    }
    setError('');
  }, [initialData, procedimientoId, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      setFormData(prev => ({
        ...prev,
        archivo: file,
      }));
      
      // Extraer la extensión del archivo
      const extension = file.name.split('.').pop().toLowerCase();
      
      // Asignar nombre del archivo si el nombre está vacío
      if (!formData.nombre) {
        // Usar el nombre del archivo sin la extensión
        const baseName = file.name.replace(`.${extension}`, '');
        setFormData(prev => ({
          ...prev,
          nombre: baseName
        }));
      }
      
      setNombreArchivo(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Validar campos obligatorios
      if (!formData.nombre.trim()) {
        throw new Error('El nombre del documento es obligatorio');
      }
      
      if (isUrlDocument && !formData.url.trim()) {
        throw new Error('La URL es obligatoria para documentos de tipo enlace');
      }
      
      if (!isUrlDocument && !formData.archivo && !initialData?.archivo_url) {
        throw new Error('Debe seleccionar un archivo para subir');
      }
      
      // Preparar datos para el envío
      const dataToSubmit = { ...formData };
      
      // Si es un documento de tipo URL, eliminar el archivo
      if (isUrlDocument) {
        delete dataToSubmit.archivo;
      } else {
        delete dataToSubmit.url;
      }
      
      // Enviar al componente padre para su procesamiento
      await onSubmit(dataToSubmit);
      
      // Limpiar formulario
      setFormData({
        nombre: '',
        descripcion: '',
        url: '',
        archivo: null,
        procedimiento: procedimientoId,
        paso: null,
      });
      setNombreArchivo('');
    } catch (err) {
      console.error('Error al guardar documento:', err);
      setError(err.message || 'Error al guardar el documento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={loading ? null : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {initialData ? 'Editar Documento' : 'Nuevo Documento'}
        <IconButton 
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
          disabled={loading}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            name="nombre"
            label="Nombre del documento"
            value={formData.nombre}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            disabled={loading}
          />
          
          <TextField
            name="descripcion"
            label="Descripción"
            value={formData.descripcion}
            onChange={handleChange}
            fullWidth
            margin="normal"
            multiline
            rows={3}
            disabled={loading}
          />
          
          <Box sx={{ mt: 2, mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isUrlDocument}
                  onChange={(e) => setIsUrlDocument(e.target.checked)}
                  disabled={loading || (initialData && !!initialData.archivo_url)}
                />
              }
              label="Documento externo (URL)"
            />
          </Box>
          
          {isUrlDocument ? (
            <TextField
              name="url"
              label="URL del documento"
              value={formData.url}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              disabled={loading}
              placeholder="https://..."
            />
          ) : (
            <Box>
              <input
                accept="*/*"
                style={{ display: 'none' }}
                id="documento-archivo"
                type="file"
                onChange={handleFileChange}
                disabled={loading}
              />
              <label htmlFor="documento-archivo">
                <Button
                  variant="outlined"
                  component="span"
                  disabled={loading}
                  sx={{ mb: 2 }}
                >
                  Seleccionar archivo
                </Button>
              </label>
              
              {(nombreArchivo || (initialData && initialData.archivo_url)) && (
                <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(0,0,0,0.04)', borderRadius: 1 }}>
                  <Typography variant="body2">
                    {nombreArchivo || initialData.nombre} 
                    {initialData && !formData.archivo && ' (ya subido)'}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={onClose} 
            disabled={loading}
            color="inherit"
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              initialData ? 'Actualizar' : 'Guardar'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default DocumentoForm;