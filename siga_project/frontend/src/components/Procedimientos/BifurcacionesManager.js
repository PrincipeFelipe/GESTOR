import React, { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LoopIcon from '@mui/icons-material/Loop';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { usePermissions } from '../../hooks/usePermissions';

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
    return p.id !== pasoActual.id;
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
    
    // Crear una copia de la bifurcación actual para modificarla
    const bifurcacionFinal = { ...currentBifurcacion };
    
    // Si no se proporcionó descripción, utilizar la condición como descripción
    if (!bifurcacionFinal.descripcion || bifurcacionFinal.descripcion.trim() === '') {
      bifurcacionFinal.descripcion = bifurcacionFinal.condicion;
    }
    
    const nuevasBifurcaciones = [...bifurcaciones];
    if (editingIndex !== null) {
      nuevasBifurcaciones[editingIndex] = bifurcacionFinal;
    } else {
      nuevasBifurcaciones.push(bifurcacionFinal);
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
  const getDireccionPaso = (pasoDestinoId) => {
    if (!pasoActual) return 'forward';
    const paso = pasos.find(p => p.id === parseInt(pasoDestinoId));
    if (!paso) return 'forward';
    if (paso.numero < pasoActual.numero) return 'backward';
    if (paso.numero > pasoActual.numero) return 'forward';
    return 'loop';
  };
  const getDireccionIcon = (pasoDestinoId) => {
    const direccion = getDireccionPaso(pasoDestinoId);
    if (direccion === 'backward') return <ArrowBackIcon fontSize="small" sx={{ color: '#ff9800' }} />;
    if (direccion === 'loop') return <LoopIcon fontSize="small" sx={{ color: '#9c27b0' }} />;
    return <ArrowForwardIcon fontSize="small" sx={{ color: '#2196f3' }} />;
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
            const direccion = getDireccionPaso(bifurcacion.paso_destino);
            const borderColor = {
              backward: '#ff9800',
              loop: '#9c27b0',
              forward: '#2196f3'
            }[direccion];
            return (
              <Paper 
                key={index}
                sx={{ 
                  p: 2, 
                  mb: 1, 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderLeft: `4px solid ${borderColor}`,
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
                    {getDireccionIcon(bifurcacion.paso_destino)}
                    <Chip
                      label={getPasoNombre(bifurcacion.paso_destino)}
                      size="small" 
                      color={direccion === 'backward' ? 'warning' : direccion === 'loop' ? 'secondary' : 'primary'}
                      variant="outlined"
                      sx={{ ml: 1 }}
                    />
                    {direccion === 'backward' && (
                      <Typography variant="caption" sx={{ ml: 1, color: 'warning.main' }}>
                        (Paso anterior)
                      </Typography>
                    )}
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
                  {pasosDisponibles.length > 0 && (
                    [
                      <MenuItem key="header-anterior" disabled divider>
                        <Typography variant="caption" color="text.secondary">
                          — Pasos anteriores —
                        </Typography>
                      </MenuItem>,
                      ...pasosDisponibles
                        .filter(paso => !pasoActual || paso.numero < pasoActual.numero)
                        .sort((a, b) => b.numero - a.numero)
                        .map((paso) => (
                          <MenuItem key={`prev-${paso.id}`} value={paso.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <ArrowBackIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }} />
                              {paso.numero}. {paso.titulo}
                            </Box>
                          </MenuItem>
                        )),
                      <MenuItem key="header-posterior" disabled divider>
                        <Typography variant="caption" color="text.secondary">
                          — Pasos posteriores —
                        </Typography>
                      </MenuItem>,
                      ...pasosDisponibles
                        .filter(paso => !pasoActual || paso.numero > pasoActual.numero)
                        .sort((a, b) => a.numero - b.numero)
                        .map((paso) => (
                          <MenuItem key={`next-${paso.id}`} value={paso.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <ArrowForwardIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                              {paso.numero}. {paso.titulo}
                            </Box>
                          </MenuItem>
                        ))
                    ]
                  )}
                </Select>
              </FormControl>
              {currentBifurcacion.paso_destino && pasoActual && (
                <Box sx={{ mt: 1 }}>
                  {(() => {
                    const direccion = getDireccionPaso(currentBifurcacion.paso_destino);
                    const paso = pasos.find(p => p.id === parseInt(currentBifurcacion.paso_destino));
                    if (direccion === 'backward') {
                      return (
                        <Alert severity="info" icon={<ArrowBackIcon />} sx={{ py: 0 }}>
                          Esta bifurcación regresa a un paso anterior (paso {paso?.numero}).
                        </Alert>
                      );
                    }
                    return null;
                  })()}
                </Box>
              )}
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