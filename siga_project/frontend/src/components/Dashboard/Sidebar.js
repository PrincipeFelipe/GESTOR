// src/components/Dashboard/Sidebar.js
import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Drawer, 
  Toolbar, 
  List, 
  Typography, 
  Divider, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Box 
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  People as PeopleIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  Assignment as AssignmentIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Folder as FolderIcon,
  ListAlt as ListAltIcon,
  Category as CategoryIcon,
  FileCopy as FileCopyIcon,
  FormatListNumbered as FormatListNumberedIcon
} from '@mui/icons-material';
import { AuthContext } from '../../contexts/AuthContext';

const Sidebar = ({ drawerWidth, mobileOpen, handleDrawerToggle }) => {
  const { currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      roles: ['User', 'Gestor', 'Admin', 'SuperAdmin']
    },
    {
      text: 'Usuarios',
      icon: <PeopleIcon />,
      path: '/dashboard/usuarios',
      roles: ['Admin', 'SuperAdmin']
    },
    {
      text: 'Unidades',
      icon: <BusinessIcon />,
      path: '/dashboard/unidades',
      roles: ['Gestor', 'Admin', 'SuperAdmin']
    },
    {
      text: 'Empleos',
      icon: <WorkIcon />,
      path: '/dashboard/empleos',
      roles: ['Gestor', 'Admin', 'SuperAdmin']
    },
    {
      text: 'Procedimientos',
      icon: <DescriptionIcon />,
      path: '/dashboard/procedimientos',
      roles: ['User', 'Gestor', 'Admin', 'SuperAdmin'],
      submenu: [
        {
          text: 'Lista de Procedimientos',
          icon: <FormatListNumberedIcon />,
          path: '/dashboard/procedimientos',
          roles: ['User', 'Gestor', 'Admin', 'SuperAdmin']
        },
        {
          text: 'Nuevo Procedimiento',
          icon: <AssignmentIcon />,
          path: '/dashboard/procedimientos/nuevo',
          roles: ['Admin', 'SuperAdmin']
        },
        {
          text: 'Tipos de Procedimiento',
          icon: <CategoryIcon />,
          path: '/dashboard/procedimientos/tipos',
          roles: ['Admin', 'SuperAdmin']
        },
        {
          text: 'Documentos',
          icon: <FileCopyIcon />,
          path: '/dashboard/procedimientos/documentos',
          roles: ['Admin', 'SuperAdmin']
        }
      ]
    },
    {
      text: 'Configuración',
      icon: <SettingsIcon />,
      path: '/dashboard/configuracion',
      roles: ['User', 'Gestor', 'Admin', 'SuperAdmin']
    },
    {
      text: 'Mi Perfil',
      icon: <PersonIcon />,
      path: '/dashboard/perfil',
      roles: ['User', 'Gestor', 'Admin', 'SuperAdmin']
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (mobileOpen) {
      handleDrawerToggle();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filtrar elementos del menú según el rol del usuario
  const filteredMenuItems = menuItems.filter(item => {
    // Depuración para ver qué está pasando
    console.log("Usuario actual:", currentUser);
    console.log("Tipo usuario:", currentUser?.tipo_usuario);
    console.log("Item roles:", item.roles);
    console.log("¿Incluye el rol?", currentUser && item.roles.includes(currentUser.tipo_usuario));
    
    // Si el usuario es SuperAdmin, siempre mostrar todas las opciones
    if (currentUser?.tipo_usuario === "SuperAdmin") {
      return true;
    }
    
    // Verificación normal para otros roles
    return currentUser && item.roles.includes(currentUser.tipo_usuario);
  });

  const drawer = (
    <div>
      <Toolbar sx={{ 
        backgroundColor: 'primary.main', 
        color: 'white',
        display: 'flex',
        justifyContent: 'center',
        py: 1.5
      }}>
        <Typography variant="h6" noWrap component="div" fontWeight="bold">
          SIGA
        </Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {currentUser?.nombre} {currentUser?.apellido1}
        </Typography>
        <Typography variant="body2" color="primary">
          {currentUser?.tipo_usuario}
        </Typography>
      </Box>
      <Divider />
      <List>
        {filteredMenuItems.map((item) => (
          <React.Fragment key={item.text}>
            <ListItem disablePadding>
              <ListItemButton 
                onClick={() => handleNavigation(item.path)}
                selected={location.pathname === item.path || 
                        (item.submenu && item.submenu.some(subItem => location.pathname === subItem.path))}
                sx={{ 
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(46, 125, 50, 0.1)',
                    borderRight: '4px solid #2e7d32',
                    '&:hover': {
                      backgroundColor: 'rgba(46, 125, 50, 0.2)',
                    }
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  color: (location.pathname === item.path || 
                        (item.submenu && item.submenu.some(subItem => location.pathname === subItem.path))) 
                        ? 'primary.main' : 'inherit'
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontWeight: (location.pathname === item.path || 
                                (item.submenu && item.submenu.some(subItem => location.pathname === subItem.path))) 
                                ? 'medium' : 'normal',
                    color: (location.pathname === item.path || 
                          (item.submenu && item.submenu.some(subItem => location.pathname === subItem.path))) 
                          ? 'primary.main' : 'inherit'
                  }}
                />
              </ListItemButton>
            </ListItem>
            
            {/* Renderizar submenú si existe y la ruta actual coincide con la ruta del padre o alguna de sus hijas */}
            {item.submenu && (location.pathname.startsWith(item.path) || 
              item.submenu.some(subItem => location.pathname.startsWith(subItem.path))) && (
              <List component="div" disablePadding>
                {item.submenu
                  .filter(subItem => currentUser && subItem.roles.includes(currentUser.tipo_usuario))
                  .map(subItem => (
                    <ListItem key={subItem.text} disablePadding>
                      <ListItemButton 
                        onClick={() => handleNavigation(subItem.path)}
                        selected={location.pathname === subItem.path}
                        sx={{ pl: 4 }}
                      >
                        <ListItemIcon sx={{ 
                          color: location.pathname === subItem.path ? 'primary.main' : 'inherit' 
                        }}>
                          {subItem.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={subItem.text} 
                          primaryTypographyProps={{ 
                            fontWeight: location.pathname === subItem.path ? 'medium' : 'normal',
                            color: location.pathname === subItem.path ? 'primary.main' : 'inherit',
                            fontSize: '0.9rem'
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))
                }
              </List>
            )}
          </React.Fragment>
        ))}
      </List>
      <Divider sx={{ mt: 'auto' }} />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Cerrar Sesión" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      {/* Drawer para móviles */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Mejor rendimiento en móviles
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Drawer permanente para pantallas grandes */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;