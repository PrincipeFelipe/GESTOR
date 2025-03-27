import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Chip,
  Divider,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

const BifurcacionesManager = ({ bifurcaciones = [], pasos = [], onChange, pasoActual, onBifurcacionClick, readonly = false }) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [showForm, setShowForm] = useState(false);  // Nuevo estado para controlar la visibilidad del formulario
  const [currentBifurcacion, setCurrentBifurcacion] = useState({
    condicion: '',
    descripcion: '',
    paso_destino: ''
  });

  // Pasos disponibles (excluyendo el actual y anteriores para evitar bucles)
  const pasosDisponibles = pasos.filter(p => {
    if (!pasoActual) return true;
    return p.id !== pasoActual.id && p.numero > pasoActual.numero;
  });

  const handleAdd = () => {
    setEditingIndex(null);
    setCurrentBifurcacion({
      condicion: '',
      descripcion: '',
      paso_destino: ''
    });
    setShowForm(true);  // Mostrar el formulario
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setCurrentBifurcacion({ ...bifurcaciones[index] });
    setShowForm(true);  // Mostrar el formulario
  };

  const handleDelete = (index) => {
    const nuevasBifurcaciones = [...bifurcaciones];
    nuevasBifurcaciones.splice(index, 1);
    onChange(nuevasBifurcaciones);
  };

  const handleChangeBifurcacion = (e) => {
    const { name, value } = e.target;
    setCurrentBifurcacion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    if (!currentBifurcacion.condicion || !currentBifurcacion.paso_destino) {
      return; // Validación básica
    }

    const nuevasBifurcaciones = [...bifurcaciones];
    
    if (editingIndex !== null) {
      nuevasBifurcaciones[editingIndex] = currentBifurcacion;
    } else {
      nuevasBifurcaciones.push(currentBifurcacion);
    }
    
    onChange(nuevasBifurcaciones);
    setEditingIndex(null);
    setCurrentBifurcacion({
      condicion: '',
      descripcion: '',
      paso_destino: ''
    });
    setShowForm(false);  // Ocultar el formulario después de guardar
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setCurrentBifurcacion({
      condicion: '',
      descripcion: '',
      paso_destino: ''
    });
    setShowForm(false);  // Ocultar el formulario al cancelar
  };

  const getPasoNombre = (pasoId) => {
    const paso = pasos.find(p => p.id === parseInt(pasoId));
    return paso ? `${paso.numero}. ${paso.titulo}` : 'Desconocido';
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle1" gutterBottom fontWeight="medium">
        Bifurcaciones del flujo
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Define condiciones para dirigir el flujo a pasos específicos. Si no hay bifurcaciones, 
        el flujo continuará al siguiente paso secuencial.
        {readonly && onBifurcacionClick && " Haz clic en una bifurcación para ir directamente a ese paso."}
      </Typography>

      {/* Lista de bifurcaciones existentes */}
      {bifurcaciones.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {bifurcaciones.map((bifurcacion, index) => {
            const pasoDestino = pasos.find(p => p.id === parseInt(bifurcacion.paso_destino));
            return (
              <Paper 
                key={index}
                sx={{ 
                  p: 2, 
                  mb: 1, 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderLeft: '4px solid #3f51b5',
                  cursor: readonly && onBifurcacionClick ? 'pointer' : 'default',
                  transition: 'background-color 0.2s',
                  '&:hover': readonly && onBifurcacionClick ? {
                    backgroundColor: 'rgba(63, 81, 181, 0.08)'
                  } : {}
                }}
                onClick={() => {
                  if (readonly && onBifurcacionClick && pasoDestino) {
                    onBifurcacionClick(pasoDestino);
                  }
                }}
              >
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2">
                    {bifurcacion.condicion}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      {bifurcacion.descripcion}
                    </Typography>
                    <ArrowForwardIcon fontSize="small" sx={{ mx: 1, color: 'text.secondary' }} />
                    <Chip
                      label={getPasoNombre(bifurcacion.paso_destino)}
                      size="small" 
                      color="primary"
                      variant="outlined"
                    />
                  </Box>
                </Box>
                {!readonly && (
                  <Box>
                    <IconButton size="small" onClick={(e) => {
                      e.stopPropagation(); // Prevenir que se propague al onClick del Paper
                      handleEdit(index);
                    }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={(e) => {
                      e.stopPropagation(); // Prevenir que se propague al onClick del Paper
                      handleDelete(index);
                    }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Paper>
            );
          })}
        </Box>
      )}

      {/* Formulario para añadir/editar bifurcaciones */}
      {showForm ? (
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                name="condicion"
                label="Condición"
                value={currentBifurcacion.condicion}
                onChange={handleChangeBifurcacion}
                fullWidth
                placeholder="Ej: Si el documento proviene de un juzgado"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="descripcion"
                label="Descripción detallada (opcional)"
                value={currentBifurcacion.descripcion}
                onChange={handleChangeBifurcacion}
                fullWidth
                multiline
                rows={2}
                placeholder="Explica cuándo se cumple esta condición"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Ir al paso</InputLabel>
                <Select
                  name="paso_destino"
                  value={currentBifurcacion.paso_destino}
                  onChange={handleChangeBifurcacion}
                  label="Ir al paso"
                >
                  <MenuItem value="">Seleccionar paso destino</MenuItem>
                  {pasosDisponibles.map((paso) => (
                    <MenuItem key={paso.id} value={paso.id}>
                      {paso.numero}. {paso.titulo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button 
                variant="outlined"
                onClick={handleCancel}
              >
                Cancelar
              </Button>
              <Button 
                variant="contained"
                onClick={handleSave}
                disabled={!currentBifurcacion.condicion || !currentBifurcacion.paso_destino}
              >
                Guardar
              </Button>
            </Grid>
          </Grid>
        </Paper>
      ) : (
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          sx={{ mb: 2 }}
        >
          Añadir bifurcación
        </Button>
      )}

      {bifurcaciones.length > 0 && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0, 0, 0, 0.04)', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Nota:</strong> Las bifurcaciones se evaluarán en el orden mostrado. 
            Si ninguna condición se cumple, el proceso seguirá al siguiente paso secuencial.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default BifurcacionesManager;