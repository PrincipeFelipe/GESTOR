import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Alert
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { usePermissions } from '../../hooks/usePermissions';
import procedimientosService from '../../assets/services/procedimientos.service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ProcedimientosList = () => {
  const navigate = useNavigate();
  const { isAdmin, user } = usePermissions();
  
  const [procedimientos, setProcedimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('success');
  const [unidadActual, setUnidadActual] = useState(null);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10
  });
  
  useEffect(() => {
    const fetchProcedimientos = async () => {
      setLoading(true);
      try {
        const params = {
          page: paginationModel.page + 1, // Convertir de índice 0 a índice 1 para la API
          page_size: paginationModel.pageSize
        };
        
        const response = await procedimientosService.getProcedimientos(params);
        
        let procedimientosData = [];
        let totalItems = 0;
        
        if (response.data) {
          if (Array.isArray(response.data)) {
            procedimientosData = response.data;
            totalItems = response.data.length;
          } else if (response.data.results && Array.isArray(response.data.results)) {
            procedimientosData = response.data.results;
            totalItems = response.data.count || procedimientosData.length;
          }
        }
        
        // Formatear fechas para visualización
        const procedimientosFormateados = procedimientosData.map(proc => ({
          ...proc,
          fecha_actualizacion_formateada: format(new Date(proc.fecha_actualizacion), 'dd/MM/yyyy HH:mm', { locale: es })
        }));
        
        setProcedimientos(procedimientosFormateados);
        setTotalCount(totalItems);
      } catch (error) {
        console.error('Error al cargar procedimientos:', error.response || error);
        showAlert('Error al cargar procedimientos', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProcedimientos();
  }, [paginationModel.page, paginationModel.pageSize]);
  
  useEffect(() => {
    if (user && user.unidad_destino) {
      setUnidadActual({
        id: user.unidad_destino,
        nombre: user.unidad_destino_nombre,
        tipo_unidad: user.unidad_destino_tipo
      });
    }
  }, [user]);
  
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
  
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'BORRADOR': return 'warning';
      case 'VIGENTE': return 'success';
      case 'OBSOLETO': return 'error';
      default: return 'default';
    }
  };

  const procedimientosAplicables = procedimientos.filter(proc => {
    // Si el usuario es SuperAdmin, mostrar todos los procedimientos
    if (user && user.tipo_usuario === 'SuperAdmin') {
      return true;
    }
    
    // Para los procedimientos de tipo GENERAL, mostrarlos a todos los usuarios
    if (proc.nivel === 'GENERAL') {
      return true;
    }
    
    // Si la unidad actual es de tipo híbrido
    if (unidadActual?.tipo_unidad === 'ZONA_COMANDANCIA') {
      // Mostrar procedimientos tanto de nivel ZONA como COMANDANCIA
      return proc.nivel === 'ZONA' || proc.nivel === 'COMANDANCIA' || proc.nivel === 'ZONA_COMANDANCIA';
    }
    
    // Para otras unidades, mostrar los procedimientos del mismo nivel
    return proc.nivel === unidadActual?.tipo_unidad;
  });
  
  const handleViewProcedimiento = (id) => {
    navigate(`/dashboard/procedimientos/${id}/ver`);
  };
  
  // Función para renderizar la columna de estado con chip
  const renderEstado = (params) => (
    <Chip 
      label={params.value}
      color={getEstadoColor(params.value)}
      size="small"
      sx={{ fontWeight: 'medium', minWidth: '90px' }}
    />
  );
  
  // Función para renderizar la columna de tiempo máximo
  const renderTiempoMaximo = (params) => {
    const tiempoMaximo = params.value;
    return tiempoMaximo ? (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} color="secondary" />
        {tiempoMaximo} días
      </Box>
    ) : (
      <Typography variant="caption" color="text.secondary">No definido</Typography>
    );
  };
  
  // Función para renderizar la columna de acciones
  const renderAcciones = (params) => {
    const procedimiento = params.row;
    
    // Función auxiliar para detener la propagación del evento
    const handleActionClick = (event, action) => {
      event.stopPropagation();
      action();
    };
    
    return (
      <Box display="flex" justifyContent="center">
        {/* Botón para ver procedimiento - visible para TODOS los usuarios */}
        <Tooltip title="Ver procedimiento">
          <IconButton
            color="info"
            size="small"
            onClick={(event) => handleActionClick(event, () => handleViewProcedimiento(procedimiento.id))}
          >
            <VisibilityIcon />
          </IconButton>
        </Tooltip>
        
        {/* Botones de administración - solo para admins */}
        {isAdmin && (
          <>
            <Tooltip title="Gestionar pasos">
              <IconButton
                color="secondary"
                size="small"
                onClick={(event) => handleActionClick(event, () => handleManagePasos(procedimiento.id))}
              >
                <AssignmentIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Editar procedimiento">
              <IconButton
                color="primary"
                size="small"
                onClick={(event) => handleActionClick(event, () => handleEditProcedimiento(procedimiento.id))}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Eliminar procedimiento">
              <IconButton
                color="error"
                size="small"
                onClick={(event) => handleActionClick(event, () => handleDeleteProcedimiento(procedimiento.id))}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
    );
  };
  
  // Definición de columnas para DataGrid
  const columns = [
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
      field: 'tipo_nombre', 
      headerName: 'Tipo', 
      flex: 1,
      minWidth: 150 
    },
    { 
      field: 'nivel_display', 
      headerName: 'Nivel', 
      flex: 1,
      minWidth: 120 
    },
    { 
      field: 'estado', 
      headerName: 'Estado', 
      width: 130,
      renderCell: renderEstado
    },
    { 
      field: 'version', 
      headerName: 'Versión', 
      width: 120 
    },
    { 
      field: 'fecha_actualizacion_formateada', 
      headerName: 'Actualización', 
      width: 180 
    },
    { 
      field: 'tiempo_maximo', 
      headerName: 'Tiempo Max.', 
      width: 150,
      renderCell: renderTiempoMaximo
    },
    { 
      field: 'acciones', 
      headerName: 'Acciones', 
      width: 200, 
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
        
        {/* DataGrid con herramientas de filtrado incorporadas */}
        <Card sx={{ 
          width: '100%', 
          boxShadow: 1, 
          borderRadius: 1,
        }}>
          <CardContent sx={{ 
            p: 0, 
            '&:last-child': { pb: 0 },
          }}>
            <DataGrid
              rows={procedimientosAplicables}
              columns={columns}
              rowCount={totalCount}
              loading={loading}
              pageSizeOptions={[5, 10, 25, 50]}
              paginationModel={paginationModel}
              paginationMode="server"
              onPaginationModelChange={setPaginationModel}
              onRowClick={(params) => handleViewProcedimiento(params.id)}
              localeText={localeText}
              autoHeight
              sx={{
                '& .MuiDataGrid-columnHeader': {
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center' // Alineación vertical para encabezados
                },
                '& .MuiDataGrid-cell': {
                  display: 'flex',
                  alignItems: 'center', // Alineación vertical para todas las celdas
                  padding: '8px 16px', // Padding consistente
                  whiteSpace: 'normal', // Permitir saltos de línea
                  wordWrap: 'break-word' // Asegurar que el texto se rompe correctamente
                },
                '& .MuiDataGrid-cell:focus-within': {
                  outline: 'none'
                },
                '& .MuiDataGrid-row': {
                  minHeight: '48px', // Establecer una altura mínima para las filas
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
                // Asegurar que todos los contenedores Box dentro de las celdas también estén centrados verticalmente
                '& .MuiBox-root': {
                  display: 'flex',
                  alignItems: 'center'
                },
                // Asegurar que los Typography dentro de las celdas estén bien alineados
                '& .MuiTypography-root': {
                  width: '100%'
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
                  paginationModel: { pageSize: 10 } // Configurar tamaño de página por defecto
                }
              }}
              disableColumnFilter={false}
              disableColumnSelector={false}
              disableDensitySelector={false}
            />
          </CardContent>
        </Card>
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