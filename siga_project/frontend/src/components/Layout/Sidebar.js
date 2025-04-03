import React, { useContext } from 'react';
import { 
  Drawer, 
  List, 
  ListItem,
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Collapse,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  Button
} from '@mui/material';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { styled } from '@mui/material/styles';

// Iconos
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import CategoryIcon from '@mui/icons-material/Category';
import PersonIcon from '@mui/icons-material/Person';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PolicyIcon from '@mui/icons-material/Policy';
import LogoutIcon from '@mui/icons-material/Logout';

// Importar el logo
import logo from '../../assets/images/logo.png';

// Estilizado de enlaces activos
const StyledNavLink = styled(NavLink)(({ theme }) => ({
  textDecoration: 'none',
  color: 'inherit',
  display: 'flex',
  width: '100%',
  padding: theme.spacing(1, 2),
  borderRadius: theme.shape.borderRadius,
  '&.active': {
    backgroundColor: theme.palette.action.selected,
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.main,
    }
  },
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  }
}));

const Sidebar = ({ drawerWidth = 260, mobileOpen, handleDrawerToggle }) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [openMenus, setOpenMenus] = React.useState({
    procedimientos: true,
    unidades: false,
    empleos: false,
    usuarios: false
  });

  // Función para manejar la apertura/cierre de menús colapsables
  const handleMenuToggle = (menu) => {
    setOpenMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  // Verificar permisos de administrador
  const isAdmin = user && (user.tipo_usuario === 'Admin' || user.tipo_usuario === 'SuperAdmin' || user.is_staff || user.is_superuser);

  // Manejar cierre de sesión
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const drawer = (
    <>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        overflowY: 'hidden'  // Previene overflow en el contenedor principal
      }}>
        {/* Logo y Título de la Aplicación */}
        <Box sx={{ 
          p: 2, 
          textAlign: 'center', 
          backgroundColor: 'background.paper',
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img src={logo} alt="SIGA Logo" style={{ width: '60px', height: 'auto', marginBottom: '8px' }} />
          <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            S.I.G.A.
          </Typography>
          <Typography variant="caption" color="text.secondary" align="center" sx={{ fontSize: '0.7rem' }}>
            Sistema Integral de Gestión Administrativa
          </Typography>
        </Box>
        
        <Divider />
        
        {/* Lista de navegación con scroll independiente */}
        <List 
          component="nav" 
          sx={{ 
            flexGrow: 1, 
            overflowY: 'auto',
            overflowX: 'hidden',
            // Estilizado para el scrollbar
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'rgba(0,0,0,0.05)',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0,0,0,0.15)',
              borderRadius: '6px',
            },
          }}
        >
          {/* Dashboard */}
          <ListItem component={StyledNavLink} to="/dashboard" end>
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItem>
          
          {/* Unidades */}
          <ListItemButton onClick={() => handleMenuToggle('unidades')}>
            <ListItemIcon>
              <AccountTreeIcon />
            </ListItemIcon>
            <ListItemText primary="Unidades" />
            {openMenus.unidades ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={openMenus.unidades} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItem component={StyledNavLink} to="/dashboard/unidades" sx={{ pl: 4 }} end>
                <ListItemIcon>
                  <ListAltIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Página Principal" />
              </ListItem>
              <ListItem component={StyledNavLink} to="/dashboard/unidades/lista" sx={{ pl: 4 }}>
                <ListItemIcon>
                  <ListAltIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Lista de Unidades" />
              </ListItem>
              <ListItem component={StyledNavLink} to="/dashboard/unidades/arbol" sx={{ pl: 4 }}>
                <ListItemIcon>
                  <AccountTreeIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Árbol Jerárquico" />
              </ListItem>
            </List>
          </Collapse>
          
          {/* Empleos */}
          <ListItemButton onClick={() => handleMenuToggle('empleos')}>
            <ListItemIcon>
              <MilitaryTechIcon />
            </ListItemIcon>
            <ListItemText primary="Empleos" />
            {openMenus.empleos ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={openMenus.empleos} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItem component={StyledNavLink} to="/dashboard/empleos" sx={{ pl: 4 }}>
                <ListItemIcon>
                  <ListAltIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Lista de Empleos" />
              </ListItem>
            </List>
          </Collapse>
          
          {/* Procedimientos */}
          <ListItemButton onClick={() => handleMenuToggle('procedimientos')}>
            <ListItemIcon>
              <PolicyIcon />
            </ListItemIcon>
            <ListItemText primary="Procedimientos" />
            {openMenus.procedimientos ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={openMenus.procedimientos} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItem component={StyledNavLink} to="/dashboard/procedimientos" sx={{ pl: 4 }} end>
                <ListItemIcon>
                  <ListAltIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Listado" />
              </ListItem>
              {isAdmin && (
                <>
                  <ListItem component={StyledNavLink} to="/dashboard/procedimientos/tipos" sx={{ pl: 4 }}>
                    <ListItemIcon>
                      <CategoryIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Tipos" />
                  </ListItem>
                  
                </>
              )}
            </List>
          </Collapse>
          
          {/* Usuarios - Solo visible para administradores */}
          {isAdmin && (
            <>
              <ListItemButton onClick={() => handleMenuToggle('usuarios')}>
                <ListItemIcon>
                  <PeopleIcon />
                </ListItemIcon>
                <ListItemText primary="Usuarios" />
                {openMenus.usuarios ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
              <Collapse in={openMenus.usuarios} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItem component={StyledNavLink} to="/dashboard/usuarios" sx={{ pl: 4 }}>
                    <ListItemIcon>
                      <ListAltIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Listado" />
                  </ListItem>
                </List>
              </Collapse>
            </>
          )}
        </List>
        
        <Divider />
        
        {/* Perfil de Usuario y Cerrar Sesión */}
        <List>
          {/* Perfil de Usuario */}
          <ListItem component={StyledNavLink} to="/dashboard/perfil">
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Mi Perfil" 
              secondary={user ? `${user.nombre} ${user.apellido1 || ''}` : 'Usuario'} 
              secondaryTypographyProps={{
                noWrap: true,
                style: { fontSize: '0.7rem' }
              }}
            />
          </ListItem>
          
          {/* Opción para cerrar sesión */}
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Cerrar Sesión" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </>
  );

  return (
    <>
      {/* Drawer para versión móvil */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            backgroundColor: (theme) => theme.palette.background.default,
            // El drawer móvil debe aparecer por debajo del AppBar
            marginTop: '64px',
            height: 'calc(100% - 64px)'
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Drawer permanente para escritorio */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            backgroundColor: (theme) => theme.palette.background.default,
            borderRight: (theme) => `1px solid ${theme.palette.divider}`,
            // Drawer permanente debe estar por debajo del AppBar
            marginTop: '64px',
            height: 'calc(100% - 64px)'
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Sidebar;