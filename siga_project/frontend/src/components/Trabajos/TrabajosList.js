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
  LinearProgress,
  Divider,
  Card,
  CardContent,
  Stack,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ResumeIcon from '@mui/icons-material/PlayCircleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
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
  const [filtersApplied, setFiltersApplied] = useState(false);
  
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
        setProcedimientos(response.data.results || []);
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
      
      // Verificar si hay filtros aplicados
      const hasActiveFilters = Object.values(filter).some(value => value !== '');
      setFiltersApplied(hasActiveFilters);
      
      console.log('Consultando trabajos con parámetros:', params);
      
      const response = await trabajosService.getTrabajos(params);
      setTrabajos(response.data.results || []);
      setTotalTrabajos(response.data.count || 0);
    } catch (error) {
      console.error('Error al cargar trabajos:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar los trabajos: ' + (error.message || 'Error desconocido'),
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
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
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
    
    // Usamos setTimeout para asegurar que la UI se actualice primero
    setTimeout(() => loadTrabajos(), 100);
  };
  
  const handleKeyPress = (e) => {
    // Ejecutar búsqueda al presionar Enter en el campo de búsqueda
    if (e.key === 'Enter') {
      handleSearch();
    }
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
        message: 'Error al crear el trabajo: ' + (error.message || 'Error desconocido'),
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
  
  const handleConfirmAction = (id, action, event) => {
    if (event) {
      event.stopPropagation();
    }
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
        message: `Error al ${action} el trabajo: ${error.message || 'Error desconocido'}`,
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

  // Agrega estas funciones debajo de los otros handlers
  const customSelectProps = {
    MenuProps: {
      PaperProps: {
        style: {
          maxHeight: 300,
          minWidth: '100%', // Asegurar que el menú tenga al menos el ancho del select
        },
      },
      // Mejorar visualización en móviles
      anchorOrigin: {
        vertical: 'bottom',
        horizontal: 'left',
      },
      transformOrigin: {
        vertical: 'top',
        horizontal: 'left',
      },
    }
  };

  // Aseguramos que los elementos del menú tengan suficiente ancho y altura
  const menuItemStyle = {
    minHeight: '40px',
    padding: '8px 16px',
    whiteSpace: 'normal', // Permitir wrap del texto en elementos muy largos
  };
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Encabezado y botón de nuevo trabajo */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Mis Trabajos
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateTrabajo}
          sx={{ 
            borderRadius: 2,
            boxShadow: 2,
            '&:hover': { boxShadow: 4 }
          }}
        >
          Nuevo Trabajo
        </Button>
      </Box>
      
      {/* Panel de filtros mejorado */}
      <Card sx={{ mb: 3, boxShadow: 2, borderRadius: 2 }}>
        <CardContent sx={{ 
          pb: 2, // Ajuste: reducir padding bottom para evitar espacio excesivo
          '& .MuiFormHelperText-root': { // Ajuste: estilizar textos de ayuda
            marginTop: '4px', 
            marginLeft: '4px' 
          },
          // Asegurar espaciado consistente
          '& .MuiFormControl-root': {
            width: '100%',
            marginBottom: 0
          },
          // Asegurar que los textos de ayuda tengan un espacio consistente
          '& .MuiFormHelperText-root': {
            marginTop: '4px', 
            marginLeft: '4px',
            height: '20px'
          }
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 2,
            flexWrap: 'wrap', // Ajuste: permitir wrap en móviles
            gap: 1 // Ajuste: espaciado entre elementos
          }}>
            <FilterListIcon color="primary" />
            <Typography variant="h6" component="h2" sx={{ ml: 1 }}>Filtros de búsqueda</Typography>
            {filtersApplied && (
              <Chip 
                label="Filtros aplicados" 
                color="primary" 
                size="small"
                icon={<FilterAltOffIcon fontSize="small" />} // Añadir icono para mejor identificación
              />
            )}
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2} alignItems="flex-start">
            {/* Ajuste: quitar alignItems="flex-end" del container para mejor alineación */}
            <Grid item xs={12} md={4}>
              <TextField
                name="search"
                label="Buscar por título"
                value={filter.search}
                onChange={handleFilterChange}
                onKeyPress={handleKeyPress}
                fullWidth
                variant="outlined"
                size="medium" // Ajuste: asegurar tamaño consistente
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                helperText="Presiona Enter para buscar"
                // Ajustar altura para compensar el texto de ayuda
                sx={{ 
                  mb: 0,
                  '& .MuiInputBase-root': { height: '56px' }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined" size="medium">
                {/* Ajuste: asegurar tamaño consistente */}
                <InputLabel id="estado-label">Estado</InputLabel>
                <Select
                  labelId="estado-label"
                  id="estado-select" // Ajuste: agregar id para mejor accesibilidad
                  name="estado"
                  value={filter.estado}
                  onChange={handleFilterChange}
                  label="Estado"
                  MenuProps={{ 
                    PaperProps: { 
                      sx: { maxHeight: 300 } // Ajuste: controlar altura del menú desplegable
                    } 
                  }}
                  sx={{ 
                    minHeight: '56px', // Ajuste: altura mínima igual al TextField
                    '& .MuiSelect-select': { 
                      display: 'flex', 
                      alignItems: 'center',
                      padding: '12px 14px' // Padding consistente
                    }
                  }}
                  {...customSelectProps}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="INICIADO" sx={{ ...menuItemStyle, color: 'info.main' }}>Iniciado</MenuItem>
                  <MenuItem value="EN_PROGRESO" sx={{ ...menuItemStyle, color: 'primary.main' }}>En progreso</MenuItem>
                  <MenuItem value="PAUSADO" sx={{ ...menuItemStyle, color: 'warning.main' }}>Pausado</MenuItem>
                  <MenuItem value="COMPLETADO" sx={{ ...menuItemStyle, color: 'success.main' }}>Completado</MenuItem>
                  <MenuItem value="CANCELADO" sx={{ ...menuItemStyle, color: 'error.main' }}>Cancelado</MenuItem>
                </Select>
                {/* Espacio invisible para compensar el helperText del TextField */}
                <Typography variant="caption" sx={{ visibility: 'hidden', height: '20px', display: 'block' }}>
                  Espacio para alinear
                </Typography>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined" size="medium">
                {/* Ajuste: asegurar tamaño consistente */}
                <InputLabel id="procedimiento-label">Procedimiento</InputLabel>
                <Select
                  labelId="procedimiento-label"
                  id="procedimiento-select" // Ajuste: agregar id para mejor accesibilidad
                  name="procedimiento"
                  value={filter.procedimiento}
                  onChange={handleFilterChange}
                  label="Procedimiento"
                  MenuProps={{ 
                    PaperProps: { 
                      sx: { maxHeight: 300 } // Ajuste: controlar altura del menú desplegable
                    } 
                  }}
                  sx={{ 
                    minHeight: '56px', // Ajuste: altura mínima igual al TextField
                    '& .MuiSelect-select': { 
                      display: 'flex', 
                      alignItems: 'center',
                      padding: '12px 14px' // Padding consistente
                    }
                  }}
                  {...customSelectProps}
                >
                  <MenuItem value="">Todos los procedimientos</MenuItem>
                  {procedimientos.map(proc => (
                    <MenuItem key={proc.id} value={proc.id} sx={menuItemStyle}>
                      {proc.nombre}
                    </MenuItem>
                  ))}
                </Select>
                {/* Espacio invisible para compensar el helperText del TextField */}
                <Typography variant="caption" sx={{ visibility: 'hidden', height: '20px', display: 'block' }}>
                  Espacio para alinear
                </Typography>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'flex-start' }}>
              {/* Ajuste: contenedor flex para alinear verticalmente con otros campos */}
              <Stack 
                direction={{ xs: 'row', md: 'row' }}
                spacing={1} 
                justifyContent={{ xs: 'center', md: 'flex-end' }} 
                width="100%"
                sx={{ mt: { xs: 1, md: 0 } }} // Ajuste: margen superior en móvil
              >
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSearch}
                  startIcon={<SearchIcon />}
                  sx={{ 
                    borderRadius: 2,
                    flex: { xs: 1, md: 'initial' },
                    height: '56px', // Altura igual a los inputs
                  }}
                >
                  Buscar
                </Button>
                <Tooltip title="Limpiar filtros">
                  <span> {/* Ajuste: wrapper para que Tooltip funcione con Button disabled */}
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={handleResetFilter}
                      startIcon={<FilterAltOffIcon />}
                      disabled={!filtersApplied}
                      sx={{ 
                        borderRadius: 2,
                        flex: { xs: 1, md: 'initial' },
                        height: '56px', // Altura igual a los inputs
                      }}
                    >
                      Limpiar
                    </Button>
                  </span>
                </Tooltip>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {/* Tabla de resultados */}
      <Paper sx={{ borderRadius: 2, boxShadow: 2, overflow: 'hidden' }}>
        {loading && <LinearProgress color="primary" />}
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'primary.light' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>Título</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>Procedimiento</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>Usuario</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>Unidad</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>Fecha inicio</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>Progreso</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'primary.contrastText', textAlign: 'center' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {trabajos.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Typography variant="body1" color="textSecondary" gutterBottom>
                        No hay trabajos disponibles {filtersApplied ? 'con los filtros aplicados' : ''}
                      </Typography>
                      {filtersApplied && (
                        <Button 
                          variant="text" 
                          color="primary" 
                          onClick={handleResetFilter} 
                          startIcon={<FilterAltOffIcon />}
                          sx={{ mt: 1 }}
                        >
                          Limpiar filtros
                        </Button>
                      )}
                    </Box>
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
                    <TableCell sx={{ fontWeight: 'medium' }}>{trabajo.titulo}</TableCell>
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
                        sx={{ fontWeight: 'medium', minWidth: '90px' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 150 }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={trabajo.progreso} 
                            color={trabajo.estado === 'COMPLETADO' ? 'success' : 'primary'}
                            sx={{ 
                              height: 8, 
                              borderRadius: 2,
                              bgcolor: 'background.paper',
                              boxShadow: 'inset 0 0 2px rgba(0,0,0,0.2)'
                            }}
                          />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                          <Typography variant="body2" fontWeight="bold">
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
                            sx={{ mx: 0.5 }}
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
                              sx={{ mx: 0.5 }}
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
                              onClick={(e) => handleConfirmAction(trabajo.id, 'pausar', e)}
                              sx={{ mx: 0.5 }}
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
                              onClick={(e) => handleConfirmAction(trabajo.id, 'reanudar', e)}
                              sx={{ mx: 0.5 }}
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
                              onClick={(e) => handleConfirmAction(trabajo.id, 'cancelar', e)}
                              sx={{ mx: 0.5 }}
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
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalTrabajos}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
          sx={{ borderTop: '1px solid rgba(224, 224, 224, 1)' }}
        />
      </Paper>
      
      {/* Dialog de confirmación para acciones */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseConfirm}
      >
        <DialogTitle>
          {confirmDialog.action === 'pausar' ? 'Pausar trabajo' : 
           confirmDialog.action === 'reanudar' ? 'Reanudar trabajo' : 
           'Cancelar trabajo'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.action === 'pausar' ? 
              '¿Está seguro de que desea pausar este trabajo? Podrá reanudarlo más tarde.' : 
             confirmDialog.action === 'reanudar' ? 
              '¿Está seguro de que desea reanudar este trabajo?' : 
              '¿Está seguro de que desea cancelar este trabajo? Esta acción no se puede deshacer.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirm}>
            Cancelar
          </Button>
          <Button 
            onClick={executeAction} 
            color={confirmDialog.action === 'cancelar' ? 'error' : 'primary'}
            variant="contained"
            autoFocus
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
          elevation={6}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TrabajosList;