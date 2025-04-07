import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Tooltip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { usePermissions } from '../../hooks/usePermissions';
import procedimientosService from '../../assets/services/procedimientos.service';
import api from '../../assets/services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ProcedimientosList = () => {
  const navigate = useNavigate();
  const { isAdmin, user } = usePermissions();
  
  const [procedimientos, setProcedimientos] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  
  useEffect(() => {
    const fetchTipos = async () => {
      try {
        const response = await procedimientosService.getTiposProcedimiento();
        setTipos(response.data.results || response.data);
      } catch (error) {
        console.error('Error al cargar tipos de procedimiento:', error);
        showAlert('Error al cargar tipos de procedimiento', 'error');
      }
    };
    
    fetchTipos();
  }, []);
  
  useEffect(() => {
    const fetchProcedimientos = async () => {
      setLoading(true);
      try {
        const params = {
          page: page + 1,
          page_size: rowsPerPage,
          search: searchTerm,
          tipo: filtroTipo,
          estado: filtroEstado
        };
        
        console.log('Parámetros de búsqueda:', params);
        const response = await procedimientosService.getProcedimientos(params);
        console.log('Respuesta completa de la API:', response);
        
        let procedimientosData = [];
        let totalItems = 0;
        
        if (response.data) {
          if (Array.isArray(response.data)) {
            procedimientosData = response.data;
            totalItems = response.data.length;
          } else if (response.data.results && Array.isArray(response.data.results)) {
            procedimientosData = response.data.results;
            totalItems = response.data.count || procedimientosData.length;
          } else if (response.data.procedimientos) {
            const procResponse = await api.get(response.data.procedimientos);
            console.log('Segunda llamada a procedimientos:', procResponse);
            procedimientosData = procResponse.data.results || procResponse.data || [];
            totalItems = procResponse.data.count || procedimientosData.length;
          }
        }
        
        console.log('Procedimientos procesados:', procedimientosData);
        setProcedimientos(procedimientosData);
        setTotalCount(totalItems);
      } catch (error) {
        console.error('Error al cargar procedimientos:', error.response || error);
        showAlert('Error al cargar procedimientos', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProcedimientos();
  }, [page, rowsPerPage, searchTerm, filtroTipo, filtroEstado]);
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleEditProcedimiento = (id) => {
    navigate(`/dashboard/procedimientos/${id}/editar`);
  };
  
  const handleManagePasos = (id) => {
    navigate(`/dashboard/procedimientos/${id}/pasos`);
  };
  
  const handleDeleteProcedimiento = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este procedimiento?')) {
      try {
        await procedimientosService.deleteProcedimiento(id);
        setProcedimientos(procedimientos.filter(p => p.id !== id));
        showAlert('Procedimiento eliminado correctamente', 'success');
      } catch (error) {
        console.error('Error al eliminar procedimiento:', error);
        showAlert('Error al eliminar procedimiento', 'error');
      }
    }
  };
  
  const showAlert = (message, severity) => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setOpenSnackbar(true);
  };
  
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };
  
  const getEstadoChip = (estado) => {
    switch (estado) {
      case 'BORRADOR':
        return <Chip label="Borrador" color="warning" size="small" />;
      case 'VIGENTE':
        return <Chip label="Vigente" color="success" size="small" />;
      case 'OBSOLETO':
        return <Chip label="Obsoleto" color="error" size="small" />;
      default:
        return <Chip label={estado} size="small" />;
    }
  };
  
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h1">
            Procedimientos
          </Typography>
          
          {isAdmin && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/dashboard/procedimientos/nuevo')}
            >
              Nuevo Procedimiento
            </Button>
          )}
        </Box>
        
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Buscar procedimientos"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="tipo-filter-label">Tipo de Procedimiento</InputLabel>
              <Select
                labelId="tipo-filter-label"
                value={filtroTipo}
                label="Tipo de Procedimiento"
                onChange={(e) => setFiltroTipo(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {tipos.map((tipo) => (
                  <MenuItem key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="estado-filter-label">Estado</InputLabel>
              <Select
                labelId="estado-filter-label"
                value={filtroEstado}
                label="Estado"
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="BORRADOR">Borrador</MenuItem>
                <MenuItem value="VIGENTE">Vigente</MenuItem>
                <MenuItem value="OBSOLETO">Obsoleto</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Nombre</strong></TableCell>
                    <TableCell><strong>Tipo</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                    <TableCell><strong>Versión</strong></TableCell>
                    <TableCell><strong>Actualización</strong></TableCell>
                    <TableCell align="center"><strong>Acciones</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {procedimientos.length > 0 ? (
                    procedimientos.map((procedimiento) => (
                      <TableRow key={procedimiento.id} hover>
                        <TableCell>{procedimiento.nombre}</TableCell>
                        <TableCell>{procedimiento.tipo_nombre}</TableCell>
                        <TableCell>{getEstadoChip(procedimiento.estado)}</TableCell>
                        <TableCell>{procedimiento.version}</TableCell>
                        <TableCell>
                          {format(new Date(procedimiento.fecha_actualizacion), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" justifyContent="center">
                            {isAdmin && (
                              <>
                                
                                <Tooltip title="Gestionar pasos">
                                  <IconButton
                                    color="secondary"
                                    onClick={() => handleManagePasos(procedimiento.id)}
                                  >
                                    <AssignmentIcon />
                                  </IconButton>
                                </Tooltip>
                                
                                <Tooltip title="Editar procedimiento">
                                  <IconButton
                                    color="primary"
                                    onClick={() => handleEditProcedimiento(procedimiento.id)}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                                
                                <Tooltip title="Eliminar procedimiento">
                                  <IconButton
                                    color="error"
                                    onClick={() => handleDeleteProcedimiento(procedimiento.id)}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No se encontraron procedimientos
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />
          </>
        )}
      </Paper>
      
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={alertSeverity}
          sx={{ width: '100%' }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProcedimientosList;