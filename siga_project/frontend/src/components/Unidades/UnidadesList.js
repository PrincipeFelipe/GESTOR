import React, { useState, useEffect } from 'react';
import {
  Box, 
  Typography, 
  Paper, 
  Button,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Card,
  CardContent,
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
  ListItemButton
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { usePermissions } from '../../hooks/usePermissions';
import unidadesService from '../../assets/services/unidades.service';
import UnidadForm from './UnidadForm';
import ConfirmDialog from '../common/ConfirmDialog';

const UnidadesList = () => {
  const { isAdmin, user } = usePermissions();
  
  const [unidades, setUnidades] = useState([]);
  const [unidadesPadre, setUnidadesPadre] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRows, setTotalRows] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10
  });
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

  // Cargar unidades al montar el componente y cuando cambian los parámetros de paginación
  useEffect(() => {
    fetchUnidades();
  }, [paginationModel.page, paginationModel.pageSize]);

  // Función para cargar las unidades desde el API
  const fetchUnidades = async () => {
    setLoading(true);
    try {
      const response = await unidadesService.getAll(paginationModel.page + 1, paginationModel.pageSize);
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

  // Función auxiliar para obtener el tipo de unidad
  const getTipoDisplay = (tipo) => {
    const tipos = {
      'DIRECCION': 'Dirección General',
      'ZONA': 'Zona',
      'COMANDANCIA': 'Comandancia',
      'COMPANIA': 'Compañía',
      'PUESTO': 'Puesto'
    };
    return tipos[tipo] || tipo;
  };

  // Función para determinar si una unidad tiene hijos
  const hasChildren = (unidadId) => {
    return unidades.some(u => u.id_padre === unidadId);
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

  const handleSaveUnidad = async (unidadData) => {
    try {
      // Solo verificar cod_unidad para actualizaciones, no para creaciones nuevas
      if (unidadData.id) {
        // Si es una actualización y no tiene código, buscar el código actual
        if (!unidadData.cod_unidad) {
          const unidadActual = unidades.find(u => u.id === unidadData.id);
          if (unidadActual) {
            unidadData.cod_unidad = unidadActual.cod_unidad;
          } else {
            // Si no se puede recuperar el código, mostrar error solo para actualizaciones
            setSnackbar({
              open: true,
              message: 'El código de unidad es obligatorio para actualizar',
              severity: 'error'
            });
            return;
          }
        }
        // Ahora realizar la actualización
        await realizarActualizacion(unidadData);
      } else {
        // Para creación nueva, NO verificar cod_unidad (se generará automáticamente)
        const response = await unidadesService.create(unidadData);
        handleCreateSuccess(response);
      }
      handleCloseForm();
      await fetchUnidades();
    } catch (error) {
      console.error("Error al guardar unidad:", error);
      setSnackbar({
        open: true,
        message: `Error al guardar unidad: ${error.message}`,
        severity: 'error'
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

  const handleCreateSuccess = (response) => {
    // Agregar la nueva unidad a la lista con un efecto de resaltado
    const nuevaUnidad = { ...response.data, _highlight: true };
    // Si estamos en la primera página, añadir la unidad a la lista actual
    if (paginationModel.page === 0) {
      // Añadir al principio para que sea más visible
      setUnidades([nuevaUnidad, ...unidades.slice(0, paginationModel.pageSize - 1)]);
    }
    // Incrementar el contador total
    setTotalRows(prevTotal => prevTotal + 1);
    // Mostrar mensaje de éxito
    setSnackbar({
      open: true,
      message: 'Unidad creada correctamente',
      severity: 'success'
    });
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

  // Exportar a CSV (se aprovecha la funcionalidad del GridToolbar)
  const handleExportCSV = () => {
    // Usar la funcionalidad de exportación del DataGrid
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

  // Función para renderizar la celda de acciones
  const renderAcciones = (params) => {
    const unidad = params.row;
    
    // Función auxiliar para detener la propagación del evento
    const handleActionClick = (event, action) => {
      event.stopPropagation();
      action();
    };
    
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Tooltip title="Ver detalles">
          <IconButton 
            size="small" 
            color="info" 
            onClick={(event) => handleActionClick(event, () => handleViewUnidad(unidad))}
            sx={{ mr: 1 }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Ver jerarquía">
          <IconButton 
            size="small" 
            color="secondary" 
            onClick={(event) => handleActionClick(event, () => handleViewHierarchy(unidad))}
            sx={{ mr: 1 }}
          >
            <AccountTreeIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Duplicar">
          <IconButton 
            size="small" 
            color="info" 
            onClick={(event) => handleActionClick(event, () => handleDuplicateUnidad(unidad))}
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
                onClick={(event) => handleActionClick(event, () => handleOpenForm(unidad))}
                sx={{ mr: 1 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar">
              <IconButton 
                size="small" 
                color="error" 
                onClick={(event) => handleActionClick(event, () => handleDeleteUnidad(unidad))}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
    );
  };

  // Renderizador de celda para la unidad padre
  const renderUnidadPadre = (params) => (
    <Typography variant="body2">
      {getNombreUnidadPadre(params.value)}
    </Typography>
  );
  
  // Renderizador de celda para el tipo de unidad
  const renderTipoUnidad = (params) => (
    <Typography variant="body2">
      {params.row.tipo_unidad_display || getTipoDisplay(params.value)}
    </Typography>
  );

  // Definición de columnas para DataGrid
  const columns = [
    { 
      field: 'id', 
      headerName: 'ID', 
      width: 70 
    },
    { 
      field: 'cod_unidad', 
      headerName: 'Código', 
      width: 120 
    },
    { 
      field: 'nombre', 
      headerName: 'Nombre', 
      flex: 2,
      minWidth: 200,
      renderCell: (params) => (
        <Typography sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'tipo_unidad', 
      headerName: 'Tipo de Unidad', 
      width: 160,
      renderCell: renderTipoUnidad
    },
    { 
      field: 'id_padre', 
      headerName: 'Unidad Superior', 
      flex: 1,
      minWidth: 180,
      renderCell: renderUnidadPadre
    },
    { 
      field: 'acciones', 
      headerName: 'Acciones', 
      width: 250, 
      sortable: false, 
      filterable: false,
      renderCell: renderAcciones
    }
  ];

  // Definir textos en español para el DataGrid
  const localeText = {
    // Columnas
    columnMenuLabel: 'Menú',
    columnMenuShowColumns: 'Mostrar columnas',
    columnMenuManageColumns: 'Gestionar columnas',
    columnMenuFilter: 'Filtro',
    columnMenuHideColumn: 'Ocultar columna',
    columnMenuUnsort: 'Quitar orden',
    columnMenuSortAsc: 'Ordenar ascendente',
    columnMenuSortDesc: 'Ordenar descendente',
    
    // Filtros
    filterOperatorContains: 'contiene',
    filterOperatorEquals: 'es igual a',
    filterOperatorStartsWith: 'comienza con',
    filterOperatorEndsWith: 'termina con',
    filterOperatorIsEmpty: 'está vacío',
    filterOperatorIsNotEmpty: 'no está vacío',
    filterOperatorIsAnyOf: 'es cualquiera de',
    
    // Paginación
    footerRowSelected: count => count !== 1
      ? `${count.toLocaleString()} filas seleccionadas`
      : `${count.toLocaleString()} fila seleccionada`,
    footerTotalRows: 'Filas totales:',
    footerTotalVisibleRows: (visibleCount, totalCount) =>
      `${visibleCount.toLocaleString()} de ${totalCount.toLocaleString()}`,
    MuiTablePagination: {
      labelRowsPerPage: 'Filas por página:',
      labelDisplayedRows: ({ from, to, count }) =>
        `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
    },
    
    // Toolbar
    toolbarFilters: 'Filtros',
    toolbarFiltersTooltipShow: 'Mostrar filtros',
    toolbarFiltersTooltipHide: 'Ocultar filtros',
    toolbarColumns: 'Columnas',
    toolbarColumnsLabel: 'Seleccionar columnas',
    toolbarDensity: 'Densidad',
    toolbarDensityLabel: 'Densidad',
    toolbarDensityCompact: 'Compacta',
    toolbarDensityStandard: 'Estándar',
    toolbarDensityComfortable: 'Confortable',
    toolbarExport: 'Exportar',
    toolbarExportLabel: 'Exportar',
    toolbarExportCSV: 'Descargar como CSV',
    toolbarExportPrint: 'Imprimir',
    
    // Búsqueda
    toolbarQuickFilterPlaceholder: 'Buscar...',
    toolbarQuickFilterLabel: 'Buscar',
    
    // Otros
    noRowsLabel: 'No hay datos',
    noResultsOverlayLabel: 'No se encontraron resultados',
  };

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Unidades Organizativas
        </Typography>
        
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
      
      <Card sx={{ 
        width: '100%', 
        boxShadow: 2, 
        borderRadius: 2,
      }}>
        <CardContent sx={{ 
          p: 0, 
          '&:last-child': { pb: 0 },
        }}>
          <DataGrid
            rows={unidades}
            columns={columns}
            rowCount={totalRows}
            loading={loading}
            pageSizeOptions={[5, 10, 25, 50]}
            paginationModel={paginationModel}
            paginationMode="server"
            onPaginationModelChange={setPaginationModel}
            onRowClick={(params) => handleViewUnidad(params.row)}
            localeText={localeText}
            autoHeight
            sx={{
              '& .MuiDataGrid-columnHeader': {
                backgroundColor: 'primary.light',
                color: 'primary.contrastText',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center' // Centrar verticalmente los encabezados
              },
              '& .MuiDataGrid-cell': {
                display: 'flex',
                alignItems: 'center', // Centrar verticalmente todas las celdas
                padding: '8px 16px', // Padding consistente
                whiteSpace: 'normal', // Permitir saltos de línea
                wordWrap: 'break-word' // Asegurar que el texto se rompe correctamente
              },
              '& .MuiDataGrid-cell:focus-within': {
                outline: 'none'
              },
              '& .MuiDataGrid-row': {
                minHeight: '48px', // Altura mínima para las filas
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                },
              },
              border: 'none',
              overflow: 'hidden',
              '& .MuiDataGrid-main': {
                overflow: 'hidden'
              },
              '& .MuiTypography-root': {
                width: '100%' // Asegurar que los Typography ocupan todo el ancho disponible
              }
            }}
            slots={{
              toolbar: GridToolbar,
              loadingOverlay: LinearProgress,
            }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 300 },
              }
            }}
            initialState={{
              filter: {
                filterModel: {
                  items: [],
                },
              },
              pagination: {
                paginationModel: { pageSize: 10 }
              }
            }}
            disableColumnFilter={false}
            disableColumnSelector={false}
            disableDensitySelector={false}
          />
        </CardContent>
      </Card>
      
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
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Tipo de Unidad:</Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {selectedUnidad.tipo_unidad_display || getTipoDisplay(selectedUnidad.tipo_unidad)}
                    </Typography>
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