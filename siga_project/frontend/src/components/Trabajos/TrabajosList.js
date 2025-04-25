import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert
} from '@mui/material';
// Reemplazar DataTable por DataGrid
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ResumeIcon from '@mui/icons-material/PlayCircleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
// Ya no necesitamos StyleSheetManager
// import { StyleSheetManager } from 'styled-components';

import { AuthContext } from '../../contexts/AuthContext';
import trabajosService from '../../assets/services/trabajos.service';
import procedimientosService from '../../assets/services/procedimientos.service';

// Ya no necesitamos esta función
// const shouldForwardProp = (prop) => { ... };

const TrabajosList = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [trabajos, setTrabajos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalTrabajos, setTotalTrabajos] = useState(0);
  // Cambiar el formato de paginación para DataGrid
  const [paginationModel, setPaginationModel] = useState({
    page: 0, // DataGrid usa índice 0 para la primera página
    pageSize: 10
  });
  const [confirmDialog, setConfirmDialog] = useState({ 
    open: false, 
    id: null, 
    action: '' 
  });
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    loadTrabajos();
  }, [paginationModel.page, paginationModel.pageSize]);
  
  const loadTrabajos = async () => {
    setLoading(true);
    try {
      // Construir parámetros de filtro para la API (ajustando para el índice 0)
      const params = {
        page: paginationModel.page + 1, // Convertir de índice 0 a índice 1
        page_size: paginationModel.pageSize
      };
      
      console.log('Consultando trabajos con parámetros:', params);
      
      const response = await trabajosService.getTrabajos(params);
      
      // Formatear datos para la tabla
      const trabajosConFormato = (response.data.results || []).map(trabajo => ({
        ...trabajo,
        // Usar el formato de fecha para mostrar
        fecha_inicio_formateada: format(new Date(trabajo.fecha_inicio), 'dd/MM/yyyy HH:mm', { locale: es })
      }));
      
      setTrabajos(trabajosConFormato);
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
    
  const handleCreateTrabajo = () => {
    navigate('/dashboard/trabajos/crear');
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
  
  // Función para renderizar la celda de acciones
  const renderAcciones = (params) => {
    const row = params.row;
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Tooltip title="Ver detalle">
          <IconButton 
            size="small" 
            onClick={() => handleViewTrabajo(row.id)}
            sx={{ mx: 0.5 }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        
        {row.estado !== 'COMPLETADO' && row.estado !== 'CANCELADO' && (
          <Tooltip title="Ejecutar trabajo">
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => handleExecuteTrabajo(row.id)}
              sx={{ mx: 0.5 }}
            >
              <PlayArrowIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        
        {row.estado === 'EN_PROGRESO' && (
          <Tooltip title="Pausar trabajo">
            <IconButton 
              size="small" 
              color="warning"
              onClick={() => handleConfirmAction(row.id, 'pausar')}
              sx={{ mx: 0.5 }}
            >
              <PauseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        
        {row.estado === 'PAUSADO' && (
          <Tooltip title="Reanudar trabajo">
            <IconButton 
              size="small" 
              color="success"
              onClick={() => handleConfirmAction(row.id, 'reanudar')}
              sx={{ mx: 0.5 }}
            >
              <ResumeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        
        {row.estado !== 'COMPLETADO' && row.estado !== 'CANCELADO' && (
          <Tooltip title="Cancelar trabajo">
            <IconButton 
              size="small" 
              color="error"
              onClick={() => handleConfirmAction(row.id, 'cancelar')}
              sx={{ mx: 0.5 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  };
  
  // Renderizar la celda de progreso
  const renderProgreso = (params) => {
    const row = params.row;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 150 }}>
        <Box sx={{ width: '100%', mr: 1 }}>
          <LinearProgress 
            variant="determinate" 
            value={row.progreso} 
            color={row.estado === 'COMPLETADO' ? 'success' : 'primary'}
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
            {`${row.progreso}%`}
          </Typography>
        </Box>
      </Box>
    );
  };
  
  // Renderizar la celda de estado
  const renderEstado = (params) => {
    return (
      <Chip 
        label={params.value}
        color={getEstadoColor(params.value)}
        size="small"
        sx={{ fontWeight: 'medium', minWidth: '90px' }}
      />
    );
  };
  
  // Definición de columnas para DataGrid (formato diferente)
  const columns = [
    { 
      field: 'titulo', 
      headerName: 'Título', 
      flex: 2,
      minWidth: 200,
      renderCell: (params) => (
        <Typography sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'procedimiento_nombre', 
      headerName: 'Procedimiento', 
      flex: 2,
      minWidth: 200,
      renderCell: (params) => (
        <Typography sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'usuario_creador_nombre', 
      headerName: 'Usuario', 
      flex: 1,
      minWidth: 150
    },
    { 
      field: 'unidad_nombre', 
      headerName: 'Unidad', 
      flex: 1,
      minWidth: 300
    },
    { 
      field: 'fecha_inicio_formateada', 
      headerName: 'Fecha inicio', 
      flex: 1,
      minWidth: 150
    },
    { 
      field: 'estado', 
      headerName: 'Estado', 
      width: 150,
      renderCell: renderEstado
    },
    { 
      field: 'progreso', 
      headerName: 'Progreso', 
      width: 200,
      renderCell: renderProgreso
    },
    { 
      field: 'acciones', 
      headerName: 'Acciones', 
      width: 180, 
      sortable: false, 
      filterable: false,
      renderCell: renderAcciones
    },
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
    <Box sx={{ p: 3 }}>
      {/* Encabezado y botón de nuevo trabajo */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', mb: { xs: 2, md: 0 } }}>
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
      
      {/* DataGrid */}
      <Card sx={{ 
        width: '100%', 
        boxShadow: 2, 
        borderRadius: 2,
      }}>
        <CardContent sx={{ 
          p: 0, 
          '&:last-child': { pb: 0 },
          height: '100%'
        }}>
          <DataGrid
            rows={trabajos}
            columns={columns}
            rowCount={totalTrabajos}
            loading={loading}
            pageSizeOptions={[5, 10, 25, 50]}
            paginationModel={paginationModel}
            paginationMode="server"
            onPaginationModelChange={setPaginationModel}
            disableRowSelectionOnClick
            autoHeight
            localeText={localeText}
            sx={{
              '& .MuiDataGrid-columnHeader': {
                backgroundColor: 'primary.light',
                color: 'primary.contrastText',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center' // Alineación vertical centrada para encabezados
              },
              '& .MuiDataGrid-cell': {
                display: 'flex',
                alignItems: 'center', // Alineación vertical centrada para todas las celdas
                padding: '8px 16px', // Padding consistente
                whiteSpace: 'normal', // Permitir saltos de línea
                wordWrap: 'break-word' // Asegurar que el texto se rompe correctamente
              },
              '& .MuiDataGrid-cell:focus-within': {
                outline: 'none'
              },
              '& .MuiDataGrid-row': {
                minHeight: '52px', // Altura mínima para las filas
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)'
                },
              },
              border: 'none',
              overflow: 'hidden',
              '& .MuiDataGrid-main': {
                overflow: 'hidden'
              },
              // Asegurar que los componentes de Box dentro de las celdas también se alineen correctamente
              '& .MuiBox-root': {
                display: 'flex',
                alignItems: 'center'
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
          />
        </CardContent>
      </Card>
      
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