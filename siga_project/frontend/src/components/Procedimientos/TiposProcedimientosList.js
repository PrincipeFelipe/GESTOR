import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  Button, 
  IconButton, 
  Tooltip, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon 
} from '@mui/icons-material';
import procedimientosService from '../../assets/services/procedimientos.service';
import TipoProcedimientoForm from './TipoProcedimientoForm';

const TiposProcedimientosList = () => {
  const [tiposProcedimiento, setTiposProcedimiento] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [currentTipo, setCurrentTipo] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchTiposProcedimiento();
  }, []);

  const fetchTiposProcedimiento = async () => {
    try {
      setLoading(true);
      const response = await procedimientosService.getTiposProcedimiento();
      setTiposProcedimiento(response.data.results || response.data);
    } catch (error) {
      console.error('Error al cargar tipos de procedimiento:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar los tipos de procedimiento',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (tipo = null) => {
    setCurrentTipo(tipo);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setCurrentTipo(null);
  };

  const handleSubmit = async (data, isEdit) => {
    try {
      if (isEdit) {
        await procedimientosService.updateTipoProcedimiento(data.id, data);
        setSnackbar({
          open: true,
          message: 'Tipo de procedimiento actualizado correctamente',
          severity: 'success'
        });
      } else {
        await procedimientosService.createTipoProcedimiento(data);
        setSnackbar({
          open: true,
          message: 'Tipo de procedimiento creado correctamente',
          severity: 'success'
        });
      }
      handleCloseForm();
      fetchTiposProcedimiento();
    } catch (error) {
      console.error('Error:', error);
      setSnackbar({
        open: true,
        message: `Error al ${isEdit ? 'actualizar' : 'crear'} el tipo de procedimiento`,
        severity: 'error'
      });
    }
  };

  const handleOpenDelete = (id) => {
    setDeleteId(id);
    setOpenDelete(true);
  };

  const handleCloseDelete = () => {
    setOpenDelete(false);
    setDeleteId(null);
  };

  const handleDelete = async () => {
    try {
      await procedimientosService.deleteTipoProcedimiento(deleteId);
      setSnackbar({
        open: true,
        message: 'Tipo de procedimiento eliminado correctamente',
        severity: 'success'
      });
      handleCloseDelete();
      fetchTiposProcedimiento();
    } catch (error) {
      console.error('Error al eliminar:', error);
      setSnackbar({
        open: true,
        message: 'Error al eliminar el tipo de procedimiento',
        severity: 'error'
      });
      handleCloseDelete();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" color="primary.main">
          Tipos de Procedimiento
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
        >
          Nuevo Tipo
        </Button>
      </Box>
      
      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tiposProcedimiento.length > 0 ? (
                  tiposProcedimiento.map((tipo) => (
                    <TableRow key={tipo.id}>
                      <TableCell>{tipo.nombre}</TableCell>
                      <TableCell>{tipo.descripcion || 'N/A'}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Editar">
                          <IconButton onClick={() => handleOpenForm(tipo)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton color="error" onClick={() => handleOpenDelete(tipo.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      No hay tipos de procedimiento registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Form Dialog */}
      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="sm" fullWidth>
        <DialogTitle>{currentTipo ? 'Editar Tipo de Procedimiento' : 'Nuevo Tipo de Procedimiento'}</DialogTitle>
        <DialogContent>
          <TipoProcedimientoForm 
            initialData={currentTipo}
            onSubmit={handleSubmit}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDelete} onClose={handleCloseDelete}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar este tipo de procedimiento? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TiposProcedimientosList;