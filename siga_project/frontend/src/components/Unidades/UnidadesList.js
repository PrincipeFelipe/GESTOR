import React, { useState, useEffect } from 'react';
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
  IconButton,
  Button,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  List,
  ListItemIcon,
  ListItemText,
  Divider,
  ListItemButton
} from '@mui/material';

// Importar iconos
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountTree as AccountTreeIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  GetApp as GetAppIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';

// Reemplazar importación de AuthContext
import { usePermissions } from '../../hooks/usePermissions';

import unidadesService from '../../assets/services/unidades.service';
import UnidadForm from './UnidadForm';
import ConfirmDialog from '../common/ConfirmDialog';

const UnidadesList = () => {
  // Reemplazar uso de AuthContext
  const { isAdmin, user } = usePermissions();

  // Estados
  const [unidades, setUnidades] = useState([]);
  const [unidadesPadre, setUnidadesPadre] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRows, setTotalRows] = useState(0);
  const [openForm, setOpenForm] = useState(false);
  const [currentUnidad, setCurrentUnidad] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    onConfirm: () => {},
    onCancel: () => {}
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [hierarchyDialogOpen, setHierarchyDialogOpen] = useState(false);
  const [selectedUnidad, setSelectedUnidad] = useState(null);
  const [orderBy, setOrderBy] = useState('cod_unidad'); // Por defecto ordenar por código
  const [order, setOrder] = useState('asc');

  // Para depuración - elimina esto después
  useEffect(() => {
    if (user) {
      console.log('Usuario completo:', user);
      console.log('Tipo de usuario:', user.tipo_usuario);
      console.log('¿Es SuperAdmin?', user.tipo_usuario === 'SuperAdmin');
      console.log('¿Es Admin?', user.tipo_usuario === 'Admin');
      console.log('¿Tiene permisos de admin?', isAdmin);
    } else {
      console.log('No hay usuario autenticado');
    }
  }, [user, isAdmin]);

  // Cargar unidades al montar el componente y cuando cambian los parámetros de paginación
  useEffect(() => {
    fetchUnidades();
  }, [page, rowsPerPage]);

  // Función para cargar las unidades desde el API
  const fetchUnidades = async () => {
    setLoading(true);
    try {
      const response = await unidadesService.getAll(page + 1, rowsPerPage);
      setUnidades(response.results || []);
      setTotalRows(response.count || 0);
      
      // Cargar todas las unidades para ser usadas como posibles padres en el formulario
      const allUnidades = await unidadesService.getAll(1, 1000);
      setUnidadesPadre(allUnidades.results || []);
    } catch (error) {
      console.error("Error al cargar unidades:", error);
      setSnackbar({
        open: true,
        message: 'Error al cargar la lista de unidades',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Función auxiliar para obtener el nombre de la unidad padre
  const getNombreUnidadPadre = (id_padre) => {
    if (!id_padre) return 'Ninguna (Unidad principal)';
    const unidadPadre = unidades.find(u => u.id === id_padre) || 
                        unidadesPadre.find(u => u.id === id_padre);
    return unidadPadre ? unidadPadre.nombre : 'Unidad no encontrada';
  };

  // Función para determinar si una unidad tiene hijos
  const hasChildren = (unidadId) => {
    return unidades.some(u => u.id_padre === unidadId);
  };

  // Funciones para manejar la paginación
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Funciones para el formulario de unidades
  const handleOpenForm = (unidad = null) => {
    setCurrentUnidad(unidad);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setTimeout(() => setCurrentUnidad(null), 300);
  };

  // Modificar la función handleSaveUnidad para manejar la actualización de códigos jerárquicos

  const handleSaveUnidad = async (unidadData) => {
    try {
      if (unidadData.id) {
        // Actualizar unidad existente
        const unidadExistente = unidades.find(u => u.id === unidadData.id);
        const cambioJerarquico = unidadExistente && unidadExistente.id_padre !== unidadData.id_padre;
        
        // Si hay cambio jerárquico, mostrar aviso antes de continuar
        if (cambioJerarquico) {
          // Contar unidades dependientes que se verán afectadas
          const unidadesDependientes = contarUnidadesDependientes(unidadData.id);
          
          if (unidadesDependientes > 0) {
            setConfirmDialog({
              open: true,
              title: 'Cambio en la estructura jerárquica',
              content: `Al cambiar la unidad superior, se actualizará el código jerárquico de esta unidad y de sus ${unidadesDependientes} unidades dependientes. ¿Desea continuar?`,
              onConfirm: async () => {
                setConfirmDialog({...confirmDialog, open: false});
                await realizarActualizacion(unidadData, true);
              },
              onCancel: () => {
                setConfirmDialog({...confirmDialog, open: false});
              }
            });
            return;
          }
        }
        
        // Continuar con la actualización normal
        await realizarActualizacion(unidadData);
      } else {
        // Crear nueva unidad
        const response = await unidadesService.create(unidadData);
        fetchUnidades(); // Recargar para mantener la consistencia
        
        setSnackbar({
          open: true,
          message: 'Unidad creada correctamente',
          severity: 'success'
        });
      }
      
      // Cerrar formulario
      handleCloseForm();
    } catch (error) {
      console.error("Error al guardar unidad:", error);
      
      // Mostrar mensaje específico según el error
      let errorMessage = 'Error al guardar los datos de la unidad';
      let severity = 'error';
      
      // Extraer el mensaje de error del objeto de error
      if (error.message) {
        if (error.message.includes("Duplicate entry") && error.message.includes("cod_unidad")) {
          errorMessage = "Ya existe una unidad con el mismo código jerárquico. Intente nuevamente.";
        } else if (error.message.includes("límite de 9 unidades")) {
          errorMessage = "Se ha alcanzado el límite de unidades para este nivel jerárquico.";
        } else {
          // Usar el mensaje de error original si existe
          errorMessage = error.message;
        }
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: severity
      });
    }
  };

  // Función auxiliar para realizar la actualización de la unidad
  const realizarActualizacion = async (unidadData, esRecodificacion = false) => {
    const response = await unidadesService.update(unidadData.id, unidadData);
    
    // Si es una recodificación, necesitamos actualizar todos los datos
    if (esRecodificacion) {
      // Recargar datos completos para asegurar que tenemos todos los códigos actualizados
      await fetchUnidades();
      
      setSnackbar({
        open: true,
        message: 'Unidad actualizada y códigos jerárquicos regenerados correctamente',
        severity: 'success'
      });
    } else {
      // Actualización simple
      const updatedUnidades = unidades.map(u => 
        u.id === unidadData.id ? { ...u, ...unidadData, _highlight: true } : u
      );
      setUnidades(updatedUnidades);
      
      setSnackbar({
        open: true,
        message: 'Unidad actualizada correctamente',
        severity: 'success'
      });
    }
  };

  // Función recursiva para contar cuántas unidades dependen de una unidad dada
  const contarUnidadesDependientes = (unidadId) => {
    const hijos = unidades.filter(u => u.id_padre === unidadId);
    
    if (hijos.length === 0) return 0;
    
    return hijos.length + hijos.reduce((total, hijo) => {
      return total + contarUnidadesDependientes(hijo.id);
    }, 0);
  };

  // Función mejorada para eliminar una unidad
  const handleDeleteUnidad = (unidad) => {
    // Verificar si la unidad tiene subordinados
    const tieneSubordinados = unidades.some(u => u.id_padre === unidad.id);
    
    if (tieneSubordinados) {
      setSnackbar({
        open: true,
        message: 'No se puede eliminar la unidad porque tiene unidades subordinadas',
        severity: 'warning'
      });
      return;
    }
    
    setConfirmDialog({
      open: true,
      title: 'Eliminar unidad',
      content: `¿Está seguro que desea eliminar la unidad "${unidad.nombre}"? Esta acción no se puede deshacer.`,
      onConfirm: () => confirmDeleteUnidad(unidad.id)
    });
  };

  const confirmDeleteUnidad = async (id) => {
    try {
      await unidadesService.remove(id);
      setSnackbar({
        open: true,
        message: 'Unidad eliminada correctamente',
        severity: 'success'
      });
      fetchUnidades();
    } catch (error) {
      console.error("Error al eliminar unidad:", error);
      let errorMsg = 'Error al eliminar la unidad';
      
      // Si hay unidades dependientes, mostrar mensaje específico
      if (error.response && error.response.status === 400 && error.response.data.detail) {
        errorMsg = error.response.data.detail;
      }
      
      setSnackbar({
        open: true,
        message: errorMsg,
        severity: 'error'
      });
    } finally {
      setConfirmDialog({...confirmDialog, open: false});
    }
  };

  // Funciones para dialogo de vista detallada
  const handleViewUnidad = (unidad) => {
    setSelectedUnidad(unidad);
    setViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setTimeout(() => setSelectedUnidad(null), 300);
  };

  // Funciones para dialogo de jerarquía
  const handleViewHierarchy = (unidad) => {
    setSelectedUnidad(unidad);
    setHierarchyDialogOpen(true);
  };

  const handleCloseHierarchyDialog = () => {
    setHierarchyDialogOpen(false);
    setTimeout(() => setSelectedUnidad(null), 300);
  };

  // Función para duplicar una unidad
  const handleDuplicateUnidad = (unidad) => {
    // Crear una copia sin el ID para que se trate como nueva
    const duplicatedUnidad = {
      ...unidad,
      nombre: `Copia de ${unidad.nombre}`,
      id: null
    };
    
    // Abrir el formulario con los datos duplicados
    setCurrentUnidad(duplicatedUnidad);
    setOpenForm(true);
  };

  // Función para refrescar la lista de unidades
  const handleRefresh = () => {
    fetchUnidades();
    setSnackbar({
      open: true,
      message: 'Lista de unidades actualizada',
      severity: 'info'
    });
  };

  // Función para exportar a CSV
  const handleExportCSV = () => {
    // Definir cabeceras
    const headers = ['ID', 'Código', 'Nombre', 'Unidad Superior']; // Añadido "Código"
    
    // Preparar datos para CSV
    const csvData = unidades.map(unidad => [
      unidad.id,
      unidad.cod_unidad, // Añadido código
      unidad.nombre,
      getNombreUnidadPadre(unidad.id_padre)
    ]);
    
    // Crear contenido CSV
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    // Crear un Blob con el contenido CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Crear un link temporal para descargar
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'unidades_organizativas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSnackbar({
      open: true,
      message: 'Lista exportada correctamente',
      severity: 'success'
    });
  };

  // Función para solicitar ordenación
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
    
    // Si es ordenación local (de datos ya cargados)
    const sortedUnidades = [...unidades].sort((a, b) => {
      if (property === 'cod_unidad') {
        // Ordenar por niveles de jerarquía para cod_unidad
        const partsA = a.cod_unidad.split('.');
        const partsB = b.cod_unidad.split('.');
        
        // Comparar cada nivel
        for (let i = 0; i < Math.min(partsA.length, partsB.length); i++) {
          const numA = parseInt(partsA[i], 10);
          const numB = parseInt(partsB[i], 10);
          if (numA !== numB) {
            return order === 'asc' ? numA - numB : numB - numA;
          }
        }
        
        // Si todos los niveles comunes son iguales, el más corto va primero
        return order === 'asc' 
          ? partsA.length - partsB.length 
          : partsB.length - partsA.length;
      }
      
      // Otras columnas...
    });
    
    setUnidades(sortedUnidades);
  };

  // Función para manejar la expansión/colapso de items en la vista de detalles
  const handleToggle = (unidadId) => {
    handleCloseViewDialog();
    const subunidad = unidades.find(u => u.id === unidadId);
    if (subunidad) {
      setTimeout(() => {
        setSelectedUnidad(subunidad);
        setViewDialogOpen(true);
      }, 300);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2">
          Unidades Organizativas
        </Typography>
        <Box>
          <Tooltip title={loading ? "Actualizando datos..." : "Actualizar lista"}>
            <Box component="span"> {/* Contenedor para el botón deshabilitado */}
              <IconButton 
                color="default" 
                onClick={handleRefresh}
                sx={{ mr: 1 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
            </Box>
          </Tooltip>
          
          <Tooltip title="Filtrar unidades">
            <IconButton 
              color="default" 
              onClick={() => alert('Función de filtrado no implementada')}
              sx={{ mr: 2 }}
            >
              <FilterListIcon />
            </IconButton>
          </Tooltip>

          <Button 
            variant="outlined"
            color="primary"
            startIcon={<GetAppIcon />}
            onClick={handleExportCSV}
            sx={{ mr: 2 }}
          >
            Exportar CSV
          </Button>
          
          {isAdmin && (
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />} 
              onClick={() => handleOpenForm()}
            >
              Nueva Unidad
            </Button>
          )}
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 240px)' }}>
            <Table stickyHeader aria-label="unidades table">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell 
                    sortDirection={orderBy === 'cod_unidad' ? order : false}
                    onClick={() => handleRequestSort('cod_unidad')}
                    style={{ cursor: 'pointer' }}
                  >
                    Código
                    {orderBy === 'cod_unidad' && (
                      <Box component="span" sx={{ ml: 1, color: 'text.secondary' }}>
                        {order === 'asc' ? '↑' : '↓'}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Unidad Superior</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {unidades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No hay unidades disponibles</TableCell>
                  </TableRow>
                ) : (
                  unidades.map((unidad) => (
                    <TableRow 
                      key={unidad.id} 
                      hover
                      sx={{
                        animation: unidad._highlight ? 'highlightRow 2s ease-in-out' : 'none',
                        '@keyframes highlightRow': {
                          '0%': { backgroundColor: 'rgba(33, 150, 243, 0.2)' },
                          '100%': { backgroundColor: 'transparent' }
                        }
                      }}
                    >
                      <TableCell>{unidad.id}</TableCell>
                      <TableCell>{unidad.cod_unidad}</TableCell>
                      <TableCell>{unidad.nombre}</TableCell>
                      <TableCell>{getNombreUnidadPadre(unidad.id_padre)}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Tooltip title="Ver detalles">
                            <IconButton 
                              size="small" 
                              color="info" 
                              onClick={() => handleViewUnidad(unidad)}
                              sx={{ mr: 1 }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Ver jerarquía">
                            <IconButton 
                              size="small" 
                              color="secondary" 
                              onClick={() => handleViewHierarchy(unidad)}
                              sx={{ mr: 1 }}
                            >
                              <AccountTreeIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Duplicar">
                            <IconButton 
                              size="small" 
                              color="info" 
                              onClick={() => handleDuplicateUnidad(unidad)}
                              sx={{ mr: 1 }}
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {isAdmin && (
                            <>
                              <Tooltip title="Editar">
                                <IconButton 
                                  size="small" 
                                  color="primary" 
                                  onClick={() => handleOpenForm(unidad)}
                                  sx={{ mr: 1 }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar">
                                <IconButton 
                                  size="small" 
                                  color="error" 
                                  onClick={() => handleDeleteUnidad(unidad)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
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
            count={totalRows}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
          />
        </Paper>
      )}

      {/* Formulario para crear/editar unidades */}
      <UnidadForm
        open={openForm}
        onClose={handleCloseForm}
        unidad={currentUnidad}
        unidades={unidadesPadre}
        onSave={handleSaveUnidad}
      />

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        content={confirmDialog.content}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog({...confirmDialog, open: false})}
      />

      {/* Diálogo para ver detalles de la unidad */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={handleCloseViewDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Detalles de la Unidad
          <IconButton
            aria-label="close"
            onClick={handleCloseViewDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedUnidad && (
            <Box>
              <Typography variant="subtitle1" color="primary" sx={{ mb: 1 }}>
                Información General
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">ID:</Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>{selectedUnidad.id}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Código:</Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>{selectedUnidad.cod_unidad}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Nombre:</Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>{selectedUnidad.nombre}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Unidad Superior:</Typography>
                    <Typography variant="body1">{getNombreUnidadPadre(selectedUnidad.id_padre)}</Typography>
                  </Grid>
                </Grid>
              </Paper>
              
              <Typography variant="subtitle1" color="primary" sx={{ mt: 3, mb: 1 }}>
                Unidades Subordinadas
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                {unidades.filter(u => u.id_padre === selectedUnidad.id).length > 0 ? (
                  <List dense>
                    {unidades
                      .filter(u => u.id_padre === selectedUnidad.id)
                      .map(subunidad => (
                        <ListItemButton 
                          onClick={() => handleToggle(subunidad.id)}
                          sx={{ cursor: 'pointer' }}
                          key={subunidad.id}
                        >
                          <ListItemIcon>
                            <AccountTreeIcon color="action" fontSize="small" />
                            {hasChildren(subunidad.id) && (
                              <Box 
                                component="span" 
                                sx={{ 
                                  width: 8, 
                                  height: 8, 
                                  bgcolor: 'primary.main', 
                                  borderRadius: '50%',
                                  position: 'absolute',
                                  bottom: 6,
                                  right: 6
                                }} 
                              />
                            )}
                          </ListItemIcon>
                          <ListItemText 
                            primary={subunidad.nombre}
                            secondary={
                              <React.Fragment>
                                <Typography variant="caption" component="span" color="text.secondary">
                                  ID: {subunidad.id}
                                </Typography>
                                <Typography variant="caption" component="span" color="text.secondary" sx={{ ml: 1 }}>
                                  Código: {subunidad.cod_unidad}
                                </Typography>
                              </React.Fragment>
                            }
                          />
                        </ListItemButton>
                      ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="textSecondary" sx={{ py: 1 }}>
                    Esta unidad no tiene subordinados directos.
                  </Typography>
                )}
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {isAdmin && selectedUnidad && (
            <Button 
              color="primary" 
              startIcon={<EditIcon />}
              onClick={() => {
                handleCloseViewDialog();
                handleOpenForm(selectedUnidad);
              }}
            >
              Editar Unidad
            </Button>
          )}
          <Button onClick={handleCloseViewDialog} color="inherit">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para ver jerarquía */}
      <Dialog 
        open={hierarchyDialogOpen} 
        onClose={handleCloseHierarchyDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Estructura Jerárquica
          <IconButton
            aria-label="close"
            onClick={handleCloseHierarchyDialog}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedUnidad && (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom color="primary">
                {selectedUnidad.nombre}
              </Typography>
              
              {/* Función recursiva para mostrar la jerarquía */}
              {(() => {
                // Encontrar las unidades hijas
                const hijos = unidades.filter(u => u.id_padre === selectedUnidad.id);
                
                const renderUnidadHija = (unidadHija, nivel = 1) => {
                  const hijosDeHijo = unidades.filter(u => u.id_padre === unidadHija.id);
                  
                  return (
                    <Box key={unidadHija.id} sx={{ ml: nivel * 3, mt: 1 }}>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 1, 
                          display: 'flex', 
                          alignItems: 'center',
                          borderLeft: '3px solid #2196f3' 
                        }}
                      >
                        <AccountTreeIcon sx={{ mr: 1, color: 'action.active', fontSize: 'small' }} />
                        <Box>
                          <Typography variant="body2">{unidadHija.nombre}</Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                            Código: {unidadHija.cod_unidad}
                          </Typography>
                        </Box>
                      </Paper>
                      
                      {/* Renderizar recursivamente los hijos */}
                      {hijosDeHijo.map(hijo => renderUnidadHija(hijo, nivel + 1))}
                    </Box>
                  );
                };
                
                if (hijos.length > 0) {
                  return (
                    <Box sx={{ mt: 2 }}>
                      {hijos.map(hijo => renderUnidadHija(hijo))}
                    </Box>
                  );
                } else {
                  return (
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                      Esta unidad no tiene unidades subordinadas.
                    </Typography>
                  );
                }
              })()}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHierarchyDialog} color="inherit">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({...snackbar, open: false})}
      >
        <Alert 
          onClose={() => setSnackbar({...snackbar, open: false})}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UnidadesList;

