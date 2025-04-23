import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Divider,
  Alert,
  FormHelperText,
  CircularProgress
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SendIcon from '@mui/icons-material/Send';

const EnvioPasoForm = ({ onSubmit, onCancel, loading, errors }) => {
  const [envioDatos, setEnvioDatos] = useState({
    numero_salida: '',
    notas_adicionales: ''
  });
  
  const [archivo, setArchivo] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEnvioDatos(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setArchivo(e.target.files[0]);
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('documentacion', archivo);
    
    onSubmit({
      formData,
      envio: envioDatos
    });
  };
  
  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <SendIcon color="secondary" sx={{ mr: 1 }} />
        <Typography variant="h6">Información de envío</Typography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Para completar este paso, debe registrar el número de salida y adjuntar la documentación enviada.
      </Alert>
      
      <form onSubmit={handleSubmit}>
        <TextField
          label="Número de salida"
          name="numero_salida"
          value={envioDatos.numero_salida}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          error={Boolean(errors?.numero_salida)}
          helperText={errors?.numero_salida}
          disabled={loading}
        />
        
        <TextField
          label="Notas adicionales (opcional)"
          name="notas_adicionales"
          value={envioDatos.notas_adicionales}
          onChange={handleChange}
          fullWidth
          margin="normal"
          multiline
          rows={3}
          disabled={loading}
        />
        
        <Box sx={{ mt: 3 }}>
          <Button
            component="label"
            variant="outlined"
            startIcon={<UploadFileIcon />}
            sx={{ mb: 1 }}
            disabled={loading}
          >
            Seleccionar archivo ZIP
            <input
              type="file"
              hidden
              accept=".zip"
              onChange={handleFileChange}
            />
          </Button>
          
          {archivo && (
            <Typography variant="body2" sx={{ ml: 2, display: 'inline' }}>
              Archivo seleccionado: {archivo.name}
            </Typography>
          )}
          
          {errors?.documentacion && (
            <FormHelperText error>
              {errors.documentacion}
            </FormHelperText>
          )}
        </Box>
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="text"
            onClick={onCancel}
            sx={{ mr: 1 }}
            disabled={loading}
          >
            Cancelar
          </Button>
          
          <Button
            type="submit"
            variant="contained"
            color="secondary"
            startIcon={loading ? <CircularProgress size={18} /> : <SendIcon />}
            disabled={!envioDatos.numero_salida || !archivo || loading}
          >
            {loading ? 'Enviando...' : 'Registrar envío'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default EnvioPasoForm;