import React, { useState, useEffect } from 'react';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ActiveIcon from '@mui/icons-material/CheckCircle';
import InactiveIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonIcon from '@mui/icons-material/Person';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import UserForm from './UserForm';
import UserDetail from './UserDetail';
import { usePermissions } from '../../hooks/usePermissions';
import api from '../../assets/services/api';

import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  IconButton, 
  CircularProgress, 
  Tooltip,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Card,
  CardContent,
  LinearProgress
} from '@mui/material';

const UsersList = () => {
  // Estados para la lista de usuarios
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  // Estado para paginación con DataGrid
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10
  });
  // Estados para ordenación
  const [sortModel, setSortModel] = useState([
    {
      field: 'nombre',
      sort: 'asc'
    }
  ]);
  // Estados para el formulario de usuario
  const [formOpen, setFormOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  // Estado para alertas y mensajes
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  // Estado para diálogo de confirmación
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null
  });
  // Estado para vista de detalle
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailUser, setDetailUser] = useState(null);
  // Estado para menú de acciones
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuUser, setMenuUser] = useState(null);
  // Obtener información de permisos
  const { isAdmin, isSuperAdmin } = usePermissions();
  
  // Cargar usuarios al montar el componente y cuando cambian los parámetros de filtrado/paginación
  useEffect(() => {
    fetchUsers();
  }, [paginationModel.page, paginationModel.pageSize, sortModel]);
  
  // Función para cargar usuarios
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Crear el string de ordenación para la API
      let ordering = '';
      if (sortModel.length > 0) {
        const { field, sort } = sortModel[0];
        ordering = sort === 'desc' ? `-${field}` : field;
      }
      
      const params = {
        page: paginationModel.page + 1, // Convertir de índice 0 a índice 1 para la API
        page_size: paginationModel.pageSize,
        ordering: ordering
      };
      
      const response = await api.get('/users/', { params });
      setUsers(response.data.results || []);
      setTotalCount(response.data.count || 0);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      showSnackbar('Error al cargar usuarios', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Funciones para manejo del formulario
  const handleOpenForm = (user = null) => {
    setCurrentUser(user);
    setFormOpen(true);
  };
  
  const handleCloseForm = () => {
    setFormOpen(false);
    setTimeout(() => setCurrentUser(null), 300);
  };
  
  // Función para guardar usuario (crear/editar)
  const handleSaveUser = async (userId, userData) => {
    try {
      let response;
      if (userId) {
        // Actualizar usuario existente
        response = await api.put(`/users/${userId}/`, userData);
        showSnackbar('Usuario actualizado con éxito', 'success');
      } else {
        // Crear nuevo usuario
        response = await api.post('/users/', userData);
        showSnackbar('Usuario creado con éxito', 'success');
      }
      handleCloseForm();
      await fetchUsers();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      let errorMessage = 'Error al guardar usuario';
      if (error.response && error.response.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (typeof error.response.data === 'object') {
          // Formatear mensajes de error de campos específicos
          const fieldErrors = [];
          Object.entries(error.response.data).forEach(([field, errors]) => {
            fieldErrors.push(`${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`);
          });
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join('. ');
          }
        }
      }
      showSnackbar(errorMessage, 'error');
    }
  };
  
  // Funciones para eliminar usuario
  const confirmDeleteUser = (user) => {
    setConfirmDialog({
      open: true,
      title: 'Confirmar eliminación',
      message: `¿Está seguro de que desea eliminar al usuario ${user.nombre} ${user.apellido1}?`,
      onConfirm: () => handleDeleteUser(user.id)
    });
  };
  
  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/users/${userId}/`);
      showSnackbar('Usuario eliminado con éxito', 'success');
      await fetchUsers();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      showSnackbar('Error al eliminar usuario', 'error');
    } finally {
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };
  
  // Funciones para ver detalles de usuario
  const handleViewUser = (user) => {
    setDetailUser(user);
    setDetailOpen(true);
  };
  
  // Funciones para menú de acciones
  const handleOpenMenu = (event, user) => {
    setAnchorEl(event.currentTarget);
    setMenuUser(user);
  };
  
  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuUser(null);
  };
  
  // Función para cambiar estado de usuario (activo/inactivo)
  const handleToggleStatus = async (user) => {
    try {
      const updatedUser = { ...user, estado: !user.estado };
      await api.patch(`/users/${user.id}/`, { estado: !user.estado });
      showSnackbar(`Usuario ${updatedUser.estado ? 'activado' : 'desactivado'} con éxito`, 'success');
      await fetchUsers();
    } catch (error) {
      console.error('Error al cambiar estado de usuario:', error);
      showSnackbar('Error al cambiar estado del usuario', 'error');
    }
  };
  
  // Función para mostrar mensajes
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Función para renderizar la celda con el nombre completo
  const renderNombre = (params) => (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <PersonIcon fontSize="small" sx={{ mr: 1, color: 'primary.main', opacity: 0.7 }} />
      <Typography 
        variant="body2"
        sx={{ fontWeight: !params.row.estado ? 'normal' : 'medium' }}
      >
        {params.row.nombre} {params.row.apellido1} {params.row.apellido2 || ''}
      </Typography>
    </Box>
  );

  // Actualizar la función renderUnidades para mejorar la presentación vertical
  const renderUnidades = (params) => {
    if (!params || !params.row) return null;
    
    return (
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        width: '100%',
        py: 1 // Padding vertical para dar espacio
      }}>
        {params.row.unidad_destino_nombre ? (
          <Chip 
            label={
              <Typography sx={{ 
                fontSize: '0.7rem', 
                whiteSpace: 'normal',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}>
                Destino: {params.row.unidad_destino_nombre}
              </Typography>
            }
            color="primary" 
            size="small" 
            variant="outlined" 
            sx={{ 
              height: 'auto',
              '& .MuiChip-label': { 
                whiteSpace: 'normal',
                overflow: 'hidden',
                py: 0.5,
                px: 1,
                width: '100%'
              }
            }}
          />
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ 
            fontSize: '0.7rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            Sin unidad de destino
          </Typography>
        )}
        
        {params.row.unidad_acceso && (
          <Box sx={{ mt: 0.7 }}>
            <Chip 
              label={
                <Typography sx={{ 
                  fontSize: '0.7rem', 
                  whiteSpace: 'normal',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  width: '100%',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  Acceso: {params.row.unidad_acceso_nombre || ''}
                </Typography>
              }
              color="secondary" 
              size="small" 
              variant="outlined" 
              sx={{ 
                height: 'auto',
                '& .MuiChip-label': { 
                  whiteSpace: 'normal',
                  overflow: 'hidden',
                  py: 0.5,
                  px: 1,
                  width: '100%'
                }
              }}
            />
          </Box>
        )}
      </Box>
    );
  };

  // Función para renderizar la celda de tipo de usuario
  const renderTipoUsuario = (params) => (
    <Chip 
      label={params.value} 
      color={
        params.value === 'SuperAdmin' ? 'error' :
        params.value === 'Admin' ? 'warning' :
        params.value === 'Gestor' ? 'info' : 'default'
      }
      size="small"
      variant={params.value === 'User' ? 'outlined' : 'filled'}
    />
  );

  // Función para renderizar la celda de estado
  const renderEstado = (params) => (
    params.value ? (
      <Tooltip title="Activo">
        <ActiveIcon color="success" />
      </Tooltip>
    ) : (
      <Tooltip title="Inactivo">
        <InactiveIcon color="error" />
      </Tooltip>
    )
  );

  // Función para renderizar las acciones (con manejo de stopPropagation)
  const renderAcciones = (params) => {
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
            color="primary"
            onClick={(event) => handleActionClick(event, () => handleViewUser(params.row))}
          >
            <AccountBoxIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        {isAdmin && (
          <>
            <Tooltip title="Editar">
              <IconButton 
                size="small" 
                color="primary"
                onClick={(event) => handleActionClick(event, () => handleOpenForm(params.row))}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Más acciones">
              <IconButton
                size="small"
                onClick={(event) => handleActionClick(event, (e) => handleOpenMenu(event, params.row))}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
    );
  };

  // Actualizar la definición de la columna unidades para adaptarse mejor
  const unidadesColumn = { 
    field: 'unidades', 
    headerName: 'Unidades', 
    width: 300,  // Ancho fijo en lugar de flex
    minWidth: 180, 
    maxWidth: 400,
    renderCell: renderUnidades,
    sortable: false
  };

  // Actualizar la definición de columnas reemplazando la columna unidades
  const columns = [
    { 
      field: 'nombre', 
      headerName: 'Nombre',
      flex: 2,
      minWidth: 200, 
      maxWidth: 400,
      renderCell: renderNombre,
      // Agregar verificación para prevenir error cuando row es undefined
      valueGetter: (params) => {
        if (!params || !params.row) return '';
        return `${params.row.nombre || ''} ${params.row.apellido1 || ''} ${params.row.apellido2 || ''}`;
      }
    },
    { 
      field: 'tip', 
      headerName: 'TIP', 
      width: 120 
    },
    { 
      field: 'email', 
      headerName: 'Email', 
      flex: 1.5,
      minWidth: 180 
    },
    // Reemplazar la definición anterior de la columna unidades
    unidadesColumn,
    { 
      field: 'empleo_nombre', 
      headerName: 'Empleo', 
      width: 150,
      valueGetter: (params) => params.value || "—"
    },
    { 
      field: 'tipo_usuario', 
      headerName: 'Tipo', 
      width: 140,
      renderCell: renderTipoUsuario
    },
    { 
      field: 'estado', 
      headerName: 'Estado', 
      width: 100,
      renderCell: renderEstado,
      type: 'boolean'
    },
    { 
      field: 'acciones', 
      headerName: 'Acciones', 
      width: 150,
      renderCell: renderAcciones,
      sortable: false,
      filterable: false
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
    toolbarQuickFilterPlaceholder: 'Buscar usuarios...',
    toolbarQuickFilterLabel: 'Buscar',
    
    // Otros
    noRowsLabel: 'No hay datos',
    noResultsOverlayLabel: 'No se encontraron resultados',
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" color="primary.dark">
          Gestión de Usuarios
        </Typography>
        {isAdmin && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
          >
            Nuevo Usuario
          </Button>
        )}
      </Box>

      {/* DataGrid */}
      <Card sx={{ width: '100%', boxShadow: 2, borderRadius: 2 }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <DataGrid
            rows={users}
            columns={columns}
            rowCount={totalCount}
            loading={loading}
            pageSizeOptions={[5, 10, 25, 50]}
            paginationModel={paginationModel}
            paginationMode="server"
            onPaginationModelChange={setPaginationModel}
            sortingMode="server"
            sortModel={sortModel}
            onSortModelChange={setSortModel}
            autoHeight
            onRowClick={(params) => handleViewUser(params.row)}
            localeText={localeText}
            sx={{
              '& .MuiDataGrid-columnHeader': {
                backgroundColor: 'primary.light',
                color: 'primary.contrastText',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center', // Centrado vertical para encabezados
              },
              '& .MuiDataGrid-cell': {
                display: 'flex',
                alignItems: 'center', // Centrado vertical para todas las celdas
                padding: '0 16px', // Asegurar padding consistente
                overflowWrap: 'break-word',
                wordWrap: 'break-word'
              },
              '& .MuiDataGrid-cell:focus-within': {
                outline: 'none'
              },
              '& .MuiDataGrid-row': {
                minHeight: '48px',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                },
              },
              // Estilo para filas inactivas
              '& .MuiDataGrid-row[data-estado="false"]': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.08)',
                },
              },
              border: 'none',
              overflow: 'hidden',
              '& .MuiDataGrid-main': {
                overflow: 'hidden'
              },
              // Asegurar que todo el contenido se alinea correctamente
              '& .MuiBox-root': {
                display: 'flex',
                alignItems: 'center'
              },
              '& .MuiDataGrid-cell[data-field="unidades"]': {
                overflow: 'hidden',
                whiteSpace: 'normal',  // Permitir el salto de línea
                height: 'auto !important',
                padding: '8px 16px',
                alignItems: 'stretch',  // Estiramos el contenido
                '& .MuiBox-root': {
                  alignItems: 'flex-start',  // Alinear desde arriba
                  width: '100%'  // Ocupar todo el ancho disponible
                }
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
            getRowClassName={(params) => params.row.estado ? '' : 'inactive-row'}
            getRowHeight={params => {
              // Ajustar automáticamente la altura de las filas según el contenido
              const hasUnidadAcceso = params.model.unidad_acceso;
              const hasUnidadDestino = params.model.unidad_destino_nombre;
              
              // Altura base para filas normales
              if (!hasUnidadAcceso && !hasUnidadDestino) return 52;
              
              // Altura para filas con una unidad
              if ((!hasUnidadAcceso && hasUnidadDestino) || (hasUnidadAcceso && !hasUnidadDestino)) return 70;
              
              // Altura para filas con dos unidades
              return 100;
            }}
          />
        </CardContent>
      </Card>
      
      {/* Formulario para crear/editar usuario */}
      <UserForm
        open={formOpen}
        onClose={handleCloseForm}
        user={currentUser}
        onSave={handleSaveUser}
      />
      
      {/* Vista detallada del usuario */}
      <UserDetail
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        user={detailUser}
      />
      
      {/* Diálogo de confirmación para eliminar */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
            color="primary"
          >
            Cancelar
          </Button>
          <Button 
            onClick={confirmDialog.onConfirm}
            color="error"
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Menú de acciones adicionales */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => {
          handleToggleStatus(menuUser);
          handleCloseMenu();
        }}>
          <ListItemIcon>
            {menuUser?.estado ? <InactiveIcon color="error" /> : <ActiveIcon color="success" />}
          </ListItemIcon>
          <ListItemText>
            {menuUser?.estado ? 'Desactivar' : 'Activar'} usuario
          </ListItemText>
        </MenuItem>
        {isSuperAdmin && (
          <MenuItem onClick={() => {
            confirmDeleteUser(menuUser);
            handleCloseMenu();
          }}>
            <ListItemIcon>
              <DeleteIcon color="error" />
            </ListItemIcon>
            <ListItemText>Eliminar usuario</ListItemText>
          </MenuItem>
        )}
      </Menu>
      
      {/* Snackbar para mensajes */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UsersList;