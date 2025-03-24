import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import procedimientosService from '../../assets/services/procedimientos.service';
import { AuthContext } from '../../contexts/AuthContext';
import TipoProcedimientoForm from './TipoProcedimientoForm';

const TiposProcedimientosList = () => {
  const { currentUser } = useContext(AuthContext);
  const isAdminOrSuperAdmin = ['Admin', 'SuperAdmin'].includes(currentUser?.tipo_usuario);
  
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
      console.log('Respuesta de tipos de procedimiento:', response.data);
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
      fetchTiposProcedimiento();
    } catch (error) {
      console.error('Error al eliminar:', error);
      setSnackbar({
        open: true,
        message: 'Error al eliminar el tipo de procedimiento',
        severity: 'error'
      });
    } finally {
      handleCloseDelete();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h1">
            Tipos de Procedimiento
          </Typography>
          {isAdminOrSuperAdmin && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenForm()}
            >
              Nuevo Tipo
            </Button>
          )}
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Descripción</TableCell>
                  {isAdminOrSuperAdmin && <TableCell align="center">Acciones</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {tiposProcedimiento.length > 0 ? (
                  tiposProcedimiento.map((tipo) => (
                    <TableRow key={tipo.id} hover>
                      <TableCell>{tipo.nombre}</TableCell>
                      <TableCell>{tipo.descripcion || 'Sin descripción'}</TableCell>
                      {isAdminOrSuperAdmin && (
                        <TableCell align="center">
                          <Tooltip title="Editar">
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenForm(tipo)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              color="error"
                              onClick={() => handleOpenDelete(tipo.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isAdminOrSuperAdmin ? 3 : 2} align="center">
                      No hay tipos de procedimiento registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Formulario Modal */}
      {openForm && (
        <TipoProcedimientoForm
          open={openForm}
          onClose={handleCloseForm}
          onSubmit={handleSubmit}
          initialData={currentTipo}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      <Dialog
        open={openDelete}
        onClose={handleCloseDelete}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar este tipo de procedimiento?
            Esta acción no se puede deshacer y podría afectar a los procedimientos asociados.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TiposProcedimientosList;