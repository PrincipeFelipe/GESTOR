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
  RadioGroup,
  Radio,
  FormControlLabel,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Chip
} from '@mui/material';
import UploadIcon from '@mui/icons-material/CloudUpload';
import CancelIcon from '@mui/icons-material/Cancel';
import FileIcon from '@mui/icons-material/Description';
import LinkIcon from '@mui/icons-material/Link';

const DocumentoForm = ({ open, onClose, onSubmit, initialData, procedimientoId, pasoId }) => {
  const [formData, setFormData] = useState({
    id: null,
    nombre: '',
    descripcion: '',
    archivo: null,
    url: '',
    tipo_documento: 'ARCHIVO',
    procedimiento: procedimientoId || null
  });
  
  const [filePreview, setFilePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [fileError, setFileError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          id: initialData.id,
          nombre: initialData.nombre || '',
          descripcion: initialData.descripcion || '',
          archivo: null, // No podemos cargar el archivo actual
          url: initialData.url || '',
          tipo_documento: initialData.archivo_url ? 'ARCHIVO' : 'URL',
          procedimiento: procedimientoId || initialData.procedimiento || null
        });
        
        if (initialData.archivo_url) {
          setFilePreview({
            name: initialData.nombre,
            url: initialData.archivo_url,
            exists: true
          });
        } else {
          setFilePreview(null);
        }
      } else {
        // Reset form para nuevo documento
        setFormData({
          id: null,
          nombre: '',
          descripcion: '',
          archivo: null,
          url: '',
          tipo_documento: 'ARCHIVO',
          procedimiento: procedimientoId || null
        });
        setFilePreview(null);
      }
      setErrors({});
      setFileError(null);
    }
  }, [initialData, open, procedimientoId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error al cambiar el campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño (10MB máximo)
      if (file.size > 10 * 1024 * 1024) {
        setFileError('El archivo es demasiado grande. Máximo 10MB.');
        return;
      }
      
      // Crear un objeto URL para previsualización
      const fileObj = {
        file,
        name: file.name,
        url: URL.createObjectURL(file),
        exists: false
      };
      
      setFormData(prev => ({
        ...prev,
        archivo: file,
        tipo_documento: 'ARCHIVO'
      }));
      
      setFilePreview(fileObj);
      setFileError(null);
    }
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({
      ...prev,
      archivo: null
    }));
    
    if (filePreview && !filePreview.exists) {
      URL.revokeObjectURL(filePreview.url);
    }
    
    setFilePreview(null);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }
    
    if (formData.tipo_documento === 'ARCHIVO' && !formData.archivo && !filePreview?.exists) {
      setFileError('Debe seleccionar un archivo');
      return false;
    }
    
    if (formData.tipo_documento === 'URL' && !formData.url.trim()) {
      newErrors.url = 'La URL es obligatoria';
    } else if (formData.tipo_documento === 'URL' && !/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(formData.url)) {
      newErrors.url = 'Introduce una URL válida';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formDataToSend = {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      procedimiento: procedimientoId,
    };
    
    // Si es un documento de un paso específico, incluirlo
    if (pasoId) {
      formDataToSend.paso = pasoId; // El backend manejará esto para guardar en la carpeta adecuada
    }
    
    // Si hay un archivo seleccionado, añadirlo
    if (formData.archivo) {
      formDataToSend.archivo = formData.archivo;
    } else if (formData.url) {
      formDataToSend.url = formData.url;
    }
    
    // Si se está editando, incluir el ID
    if (initialData && initialData.id) {
      formDataToSend.id = initialData.id;
    }
    
    onSubmit(formDataToSend);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {initialData ? 'Editar Documento' : 'Nuevo Documento'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            label="Nombre del documento"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            fullWidth
            margin="normal"
            error={!!errors.nombre}
            helperText={errors.nombre}
            required
          />
          
          <TextField
            label="Descripción"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
          
          <FormControl component="fieldset" margin="normal">
            <RadioGroup
              row
              name="tipo_documento"
              value={formData.tipo_documento}
              onChange={handleChange}
            >
              <FormControlLabel 
                value="ARCHIVO" 
                control={<Radio />} 
                label="Subir archivo" 
              />
              <FormControlLabel 
                value="URL" 
                control={<Radio />} 
                label="Enlace URL" 
              />
            </RadioGroup>
          </FormControl>
          
          {formData.tipo_documento === 'ARCHIVO' && (
            <Box 
              sx={{ 
                mt: 2, 
                border: '1px dashed #ccc', 
                p: 3, 
                borderRadius: 1,
                backgroundColor: '#f9f9f9',
                textAlign: 'center'
              }}
            >
              {filePreview ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1" sx={{ flexGrow: 1 }}>
                    {filePreview.name}
                    {filePreview.exists && (
                      <Chip 
                        size="small" 
                        label="Archivo existente" 
                        color="info" 
                        sx={{ ml: 1 }} 
                      />
                    )}
                  </Typography>
                  <IconButton onClick={handleRemoveFile} color="error" title="Quitar archivo">
                    <CancelIcon />
                  </IconButton>
                </Box>
              ) : (
                <>
                  <input
                    accept="*/*"
                    id="documento-archivo"
                    type="file"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="documento-archivo">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<UploadIcon />}
                    >
                      Seleccionar Archivo
                    </Button>
                  </label>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Puedes subir cualquier tipo de archivo (PDF, Word, Excel, imágenes, etc.)
                  </Typography>
                </>
              )}
              {fileError && (
                <Typography color="error" variant="caption" sx={{ display: 'block', mt: 1 }}>
                  {fileError}
                </Typography>
              )}
            </Box>
          )}
          
          {formData.tipo_documento === 'URL' && (
            <TextField
              label="URL del documento"
              name="url"
              value={formData.url}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={!!errors.url}
              helperText={errors.url}
              placeholder="https://ejemplo.com/documento.pdf"
              InputProps={{
                startAdornment: <LinkIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
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
          {loading ? <CircularProgress size={24} /> : initialData ? 'Actualizar' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentoForm;