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
  Paper,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { usePermissions } from '../../hooks/usePermissions';

const BifurcacionesManager = ({ bifurcaciones = [], pasos = [], onChange, pasoActual, onBifurcacionClick, readonly = false, esPasoFinal = false }) => {
  const { isAdmin } = usePermissions();
  
  const [editingIndex, setEditingIndex] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentBifurcacion, setCurrentBifurcacion] = useState({
    condicion: '',
    descripcion: '',
    paso_destino: ''
  });

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
    setShowForm(true);
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setCurrentBifurcacion({ ...bifurcaciones[index] });
    setShowForm(true);
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
      return;
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
    setShowForm(false);
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setCurrentBifurcacion({
      condicion: '',
      descripcion: '',
      paso_destino: ''
    });
    setShowForm(false);
  };

  const getPasoNombre = (pasoId) => {
    const paso = pasos.find(p => p.id === parseInt(pasoId));
    return paso ? `${paso.numero}. ${paso.titulo}` : 'Desconocido';
  };

  return (
    <Box sx={{ mt: 3 }}>
      {esPasoFinal && bifurcaciones.length > 0 && (
        <Alert 
          severity="warning" 
          sx={{ mb: 2 }}
          variant="outlined"
        >
          Este paso está marcado como final del procedimiento, pero tiene bifurcaciones definidas. 
          Las bifurcaciones sólo se utilizarán si el paso no es el último en ejecutarse.
        </Alert>
      )}

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
                {!readonly && isAdmin && (
                  <Box>
                    <IconButton size="small" onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(index);
                    }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={(e) => {
                      e.stopPropagation();
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
        !readonly && isAdmin && (
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            sx={{ mb: 2 }}
          >
            Añadir bifurcación
          </Button>
        )
      )}

    </Box>
  );
};

export default BifurcacionesManager;