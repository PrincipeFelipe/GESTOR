import React, { useContext } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton,
  Box,
  Button,
  Tooltip,
  Avatar
} from '@mui/material';
import { 
  Menu as MenuIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

const Header = ({ drawerWidth, handleDrawerToggle }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
        ml: { xs: 0, md: `${drawerWidth}px` },
        backgroundColor: 'white',
        color: 'text.primary',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
        zIndex: (theme) => theme.zIndex.drawer + 1, // Asegura que esté por encima del drawer en dispositivos móviles
        transition: 'width 0.3s ease, margin-left 0.3s ease'
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { md: 'none' } }} // Solo mostrar en dispositivos móviles
        >
          <MenuIcon />
        </IconButton>
        
        <Box sx={{ flexGrow: 1 }} />
        
        {/* Botones a la derecha */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Ayuda">
            <IconButton color="inherit">
              <HelpIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Notificaciones">
            <IconButton color="inherit">
              <NotificationsIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Mi Perfil">
            <IconButton 
              color="inherit" 
              onClick={() => navigate('/dashboard/perfil')}
              sx={{ ml: 1 }}
            >
              <Avatar 
                sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
              >
                {user?.nombre ? user.nombre[0].toUpperCase() : <PersonIcon />}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;