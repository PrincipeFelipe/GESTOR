import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  IconButton, 
  CircularProgress, 
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  KeyboardArrowUp as SortUpIcon,
  KeyboardArrowDown as SortDownIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  AccountBox as AccountBoxIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import UserForm from './UserForm';
import UserDetail from './UserDetail';
import { usePermissions } from '../../hooks/usePermissions';
import api from '../../assets/services/api';


const UsersList = () => {
  // Estados para la lista de usuarios
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Estados para filtrado y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [orderBy, setOrderBy] = useState('nombre');
  const [orderDirection, setOrderDirection] = useState('asc');
  
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
  
  // Cargar usuarios al montar el componente
  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, orderBy, orderDirection, searchTerm]);
  
  // Función para cargar usuarios
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        page_size: rowsPerPage,
        search: searchTerm,
        ordering: `${orderDirection === 'desc' ? '-' : ''}${orderBy}`
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
  
  // Funciones para manejo de paginación
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Funciones para ordenación
  const handleSort = (field) => {
    if (orderBy === field) {
      setOrderDirection(orderDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(field);
      setOrderDirection('asc');
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
  
  // Renderizado de la tabla de usuarios
  const renderTable = () => {
    if (loading && users.length === 0) {
      return (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (users.length === 0) {
      return (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="textSecondary">
            No se encontraron usuarios
          </Typography>
          {searchTerm && (
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => setSearchTerm('')}
              sx={{ mt: 2 }}
            >
              Limpiar búsqueda
            </Button>
          )}
        </Box>
      );
    }
    
    return (
      <>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell 
                  onClick={() => handleSort('nombre')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Nombre
                    {orderBy === 'nombre' && (
                      orderDirection === 'asc' ? <SortUpIcon fontSize="small" /> : <SortDownIcon fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell>TIP</TableCell>
                <TableCell 
                  onClick={() => handleSort('email')}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    Email
                    {orderBy === 'email' && (
                      orderDirection === 'asc' ? <SortUpIcon fontSize="small" /> : <SortDownIcon fontSize="small" />
                    )}
                  </Box>
                </TableCell>
                <TableCell>Unidad</TableCell>
                <TableCell>Empleo</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow 
                  key={user.id} 
                  hover
                  sx={{
                    backgroundColor: !user.estado ? 'rgba(0, 0, 0, 0.04)' : 'inherit'
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <PersonIcon fontSize="small" sx={{ mr: 1, color: 'primary.main', opacity: 0.7 }} />
                      <Typography 
                        variant="body2"
                        sx={{ fontWeight: !user.estado ? 'normal' : 'medium' }}
                      >
                        {user.nombre} {user.apellido1} {user.apellido2 || ''}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{user.tip}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.unidad_nombre || "—"}
                    {user.unidad_destino && (
                      <Box mt={0.5}>
                        <Chip 
                          label={`Destino: ${user.unidad_destino_nombre || ''}`}
                          color="info" 
                          size="small" 
                          variant="outlined" 
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </Box>
                    )}
                    {user.unidad_acceso && (
                      <Box mt={0.5}>
                        <Chip 
                          label={`Acceso: ${user.unidad_acceso_nombre || ''}`}
                          color="secondary" 
                          size="small" 
                          variant="outlined" 
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.empleo_nombre || "—"}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={user.tipo_usuario} 
                      color={
                        user.tipo_usuario === 'SuperAdmin' ? 'error' :
                        user.tipo_usuario === 'Admin' ? 'warning' :
                        user.tipo_usuario === 'Gestor' ? 'info' : 'default'
                      }
                      size="small"
                      variant={user.tipo_usuario === 'User' ? 'outlined' : 'filled'}
                    />
                  </TableCell>
                  <TableCell>
                    {user.estado ? (
                      <Tooltip title="Activo">
                        <ActiveIcon color="success" />
                      </Tooltip>
                    ) : (
                      <Tooltip title="Inactivo">
                        <InactiveIcon color="error" />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Tooltip title="Ver detalles">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleViewUser(user)}
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
                              onClick={() => handleOpenForm(user)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Más acciones">
                            <IconButton
                              size="small"
                              onClick={(e) => handleOpenMenu(e, user)}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </>
    );
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
      
      <Box mb={3}>
        <TextField
          fullWidth
          variant="outlined"
          label="Buscar usuarios"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchTerm('')}
                >
                  <CancelIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
          placeholder="Buscar por nombre, TIP o email..."
        />
      </Box>
      
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {renderTable()}
      </Paper>
      
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
        
        <MenuItem onClick={() => {
          handleViewUser(menuUser);
          handleCloseMenu();
        }}>
          <ListItemIcon>
            <AccountBoxIcon />
          </ListItemIcon>
          <ListItemText>Ver detalles</ListItemText>
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