import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Snackbar,
  Alert,
  Tooltip,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ResumeIcon from '@mui/icons-material/PlayCircleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { AuthContext } from '../../contexts/AuthContext';
import trabajosService from '../../assets/services/trabajos.service';
import procedimientosService from '../../assets/services/procedimientos.service';
import TrabajoForm from './TrabajoForm';

const TrabajosList = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [trabajos, setTrabajos] = useState([]);
  const [procedimientos, setProcedimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalTrabajos, setTotalTrabajos] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openForm, setOpenForm] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, id: null, action: '' });
  
  const [filter, setFilter] = useState({
    search: '',
    estado: '',
    procedimiento: ''
  });
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  useEffect(() => {
    // Cargar procedimientos para el filtro y formulario
    const fetchProcedimientos = async () => {
      try {
        const response = await procedimientosService.getProcedimientos({
          estado: 'VIGENTE',
          page_size: 500
        });
        setProcedimientos(response.data.results);
      } catch (error) {
        console.error('Error al cargar procedimientos:', error);
      }
    };
    
    fetchProcedimientos();
    loadTrabajos();
  }, [page, rowsPerPage]);
  
  const loadTrabajos = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        page_size: rowsPerPage,
        ...filter
      };
      
      const response = await trabajosService.getTrabajos(params);
      setTrabajos(response.data.results);
      setTotalTrabajos(response.data.count);
    } catch (error) {
      console.error('Error al cargar trabajos:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar los trabajos',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter({
      ...filter,
      [name]: value
    });
  };
  
  const handleSearch = () => {
    setPage(0);
    loadTrabajos();
  };
  
  const handleResetFilter = () => {
    setFilter({
      search: '',
      estado: '',
      procedimiento: ''
    });
    setPage(0);
    setTimeout(() => loadTrabajos(), 100);
  };
  
  const handleCreateTrabajo = () => {
    navigate('/dashboard/trabajos/crear');
  };
  
  const handleCloseForm = () => {
    setOpenForm(false);
  };
  
  const handleSaveTrabajo = async (trabajoData) => {
    try {
      await trabajosService.createTrabajo(trabajoData);
      setOpenForm(false);
      setSnackbar({
        open: true,
        message: 'Trabajo creado correctamente',
        severity: 'success'
      });
      loadTrabajos();
    } catch (error) {
      console.error('Error al crear trabajo:', error);
      setSnackbar({
        open: true,
        message: 'Error al crear el trabajo',
        severity: 'error'
      });
    }
  };
  
  const handleViewTrabajo = (id) => {
    navigate(`/dashboard/trabajos/${id}`);
  };
  
  const handleExecuteTrabajo = (id) => {
    navigate(`/dashboard/trabajos/${id}/ejecutar`);
  };
  
  const handleConfirmAction = (id, action) => {
    setConfirmDialog({
      open: true,
      id,
      action
    });
  };
  
  const handleCloseConfirm = () => {
    setConfirmDialog({
      open: false,
      id: null,
      action: ''
    });
  };
  
  const executeAction = async () => {
    const { id, action } = confirmDialog;
    
    if (!id || !action) return;
    
    try {
      switch (action) {
        case 'pausar':
          await trabajosService.pausarTrabajo(id);
          setSnackbar({
            open: true,
            message: 'Trabajo pausado correctamente',
            severity: 'info'
          });
          break;
        case 'reanudar':
          await trabajosService.reanudarTrabajo(id);
          setSnackbar({
            open: true,
            message: 'Trabajo reanudado correctamente',
            severity: 'success'
          });
          break;
        case 'cancelar':
          await trabajosService.cancelarTrabajo(id);
          setSnackbar({
            open: true,
            message: 'Trabajo cancelado correctamente',
            severity: 'warning'
          });
          break;
        default:
          break;
      }
      
      loadTrabajos();
    } catch (error) {
      console.error(`Error al ${action} trabajo:`, error);
      setSnackbar({
        open: true,
        message: `Error al ${action} el trabajo`,
        severity: 'error'
      });
    } finally {
      handleCloseConfirm();
    }
  };
  
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'INICIADO': return 'info';
      case 'EN_PROGRESO': return 'primary';
      case 'PAUSADO': return 'warning';
      case 'COMPLETADO': return 'success';
      case 'CANCELADO': return 'error';
      default: return 'default';
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          Mis Trabajos
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateTrabajo}
        >
          Nuevo Trabajo
        </Button>
      </Box>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={4}>
            <TextField
              name="search"
              label="Buscar por título"
              value={filter.search}
              onChange={handleFilterChange}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                name="estado"
                value={filter.estado}
                onChange={handleFilterChange}
                label="Estado"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="INICIADO">Iniciado</MenuItem>
                <MenuItem value="EN_PROGRESO">En progreso</MenuItem>
                <MenuItem value="PAUSADO">Pausado</MenuItem>
                <MenuItem value="COMPLETADO">Completado</MenuItem>
                <MenuItem value="CANCELADO">Cancelado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Procedimiento</InputLabel>
              <Select
                name="procedimiento"
                value={filter.procedimiento}
                onChange={handleFilterChange}
                label="Procedimiento"
              >
                <MenuItem value="">Todos</MenuItem>
                {procedimientos.map(proc => (
                  <MenuItem key={proc.id} value={proc.id}>
                    {proc.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSearch}
            >
              Buscar
            </Button>
          </Grid>
          
          <Grid item xs={6}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleResetFilter}
            >
              Limpiar
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper>
        <TableContainer>
          {loading && <LinearProgress />}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Título</TableCell>
                <TableCell>Procedimiento</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell>Unidad</TableCell>
                <TableCell>Fecha inicio</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Progreso</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {trabajos.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No hay trabajos disponibles
                  </TableCell>
                </TableRow>
              ) : (
                trabajos.map((trabajo) => (
                  <TableRow 
                    key={trabajo.id}
                    hover
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                    }}
                    onClick={() => handleViewTrabajo(trabajo.id)}
                  >
                    <TableCell>{trabajo.titulo}</TableCell>
                    <TableCell>{trabajo.procedimiento_nombre}</TableCell>
                    <TableCell>{trabajo.usuario_creador_nombre}</TableCell>
                    <TableCell>{trabajo.unidad_nombre}</TableCell>
                    <TableCell>
                      {format(new Date(trabajo.fecha_inicio), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={trabajo.estado}
                        color={getEstadoColor(trabajo.estado)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={trabajo.progreso} 
                            color={trabajo.estado === 'COMPLETADO' ? 'success' : 'primary'}
                          />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                          <Typography variant="body2" color="text.secondary">
                            {`${trabajo.progreso}%`}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Tooltip title="Ver detalle">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewTrabajo(trabajo.id);
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {trabajo.estado !== 'COMPLETADO' && trabajo.estado !== 'CANCELADO' && (
                          <Tooltip title="Ejecutar trabajo">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExecuteTrabajo(trabajo.id);
                              }}
                            >
                              <PlayArrowIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {trabajo.estado === 'EN_PROGRESO' && (
                          <Tooltip title="Pausar trabajo">
                            <IconButton 
                              size="small" 
                              color="warning"
                              onClick={(e) => handleConfirmAction(trabajo.id, 'pausar')}
                            >
                              <PauseIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {trabajo.estado === 'PAUSADO' && (
                          <Tooltip title="Reanudar trabajo">
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={(e) => handleConfirmAction(trabajo.id, 'reanudar')}
                            >
                              <ResumeIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {trabajo.estado !== 'COMPLETADO' && trabajo.estado !== 'CANCELADO' && (
                          <Tooltip title="Cancelar trabajo">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={(e) => handleConfirmAction(trabajo.id, 'cancelar')}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalTrabajos}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
        />
      </Paper>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TrabajosList;