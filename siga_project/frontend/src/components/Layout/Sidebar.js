import React, { useContext, useState } from 'react';
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
  Box,
  Collapse,
  Avatar
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
  Category as CategoryIcon,
  FileCopy as FileCopyIcon,
  FormatListNumbered as FormatListNumberedIcon,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material';
import { AuthContext } from '../../contexts/AuthContext';

const Sidebar = ({ drawerWidth, mobileOpen, handleDrawerToggle }) => {
  const { currentUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [openSubmenus, setOpenSubmenus] = useState({});

  const handleSubmenuToggle = (menuId) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  // Determinar el rol del usuario actual
  const userRole = currentUser?.tipo_usuario || 'User';

  // Define las rutas del menú con control de acceso según el rol
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      roles: ['User', 'Gestor', 'Admin', 'SuperAdmin']
    },
    {
      id: 'usuarios',
      label: 'Usuarios',
      icon: <PeopleIcon />,
      path: '/dashboard/usuarios',
      roles: ['Admin', 'SuperAdmin']
    },
    {
      id: 'unidades',
      label: 'Unidades',
      icon: <BusinessIcon />,
      path: '/dashboard/unidades',
      roles: ['Admin', 'SuperAdmin']
    },
    {
      id: 'empleos',
      label: 'Empleos',
      icon: <WorkIcon />,
      path: '/dashboard/empleos',
      roles: ['Admin', 'SuperAdmin']
    },
    {
      id: 'procedimientos',
      label: 'Procedimientos',
      icon: <DescriptionIcon />,
      submenu: true,
      roles: ['User', 'Gestor', 'Admin', 'SuperAdmin'],
      items: [
        {
          id: 'procedimientos-lista',
          label: 'Listado',
          icon: <FormatListNumberedIcon />,
          path: '/dashboard/procedimientos',
          roles: ['User', 'Gestor', 'Admin', 'SuperAdmin']
        },
        // Se ha eliminado la opción "Nuevo Procedimiento"
        {
          id: 'procedimientos-tipos',
          label: 'Tipos',
          icon: <CategoryIcon />,
          path: '/dashboard/procedimientos/tipos',
          roles: ['Admin', 'SuperAdmin']
        },
        {
          id: 'procedimientos-documentos',
          label: 'Documentos',
          icon: <FileCopyIcon />,
          path: '/dashboard/procedimientos/documentos',
          roles: ['Admin', 'SuperAdmin']
        }
      ]
    },
    {
      id: 'perfil',
      label: 'Mi Perfil',
      icon: <PersonIcon />,
      path: '/dashboard/perfil',
      roles: ['User', 'Gestor', 'Admin', 'SuperAdmin']
    }
  ];

  // Filtra los elementos del menú según el rol del usuario
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  );

  const drawer = (
    <div>
      <Toolbar sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
        <Avatar 
          sx={{ width: 64, height: 64, mb: 1, bgcolor: 'primary.main' }}
        >
          {currentUser?.nombre ? currentUser.nombre[0].toUpperCase() : <PersonIcon />}
        </Avatar>
        <Typography variant="subtitle1" noWrap component="div">
          {currentUser?.nombre} {currentUser?.apellido1}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {userRole}
        </Typography>
      </Toolbar>
      <Divider />
      <List component="nav">
        {filteredMenuItems.map((item) => (
          item.submenu ? (
            <React.Fragment key={item.id}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => handleSubmenuToggle(item.id)}
                  selected={location.pathname.includes(`/dashboard/${item.id.toLowerCase()}`)}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                  {openSubmenus[item.id] ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
              </ListItem>
              <Collapse in={openSubmenus[item.id]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.items.filter(subItem => subItem.roles.includes(userRole)).map((subItem) => (
                    <ListItemButton
                      key={subItem.id}
                      sx={{ pl: 4 }}
                      onClick={() => navigate(subItem.path)}
                      selected={location.pathname === subItem.path}
                    >
                      <ListItemIcon>
                        {subItem.icon}
                      </ListItemIcon>
                      <ListItemText primary={subItem.label} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            </React.Fragment>
          ) : (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={location.pathname === item.path}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          )
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={logout}>
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
      aria-label="menu de navegación"
    >
      {/* Drawer para dispositivos móviles */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Mejor rendimiento en dispositivos móviles
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Drawer permanente para escritorio */}
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