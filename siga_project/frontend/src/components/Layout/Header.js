import React, { useContext, useEffect, useState } from 'react';
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

const Header = ({ drawerWidth, handleDrawerToggle, headerHeight = '72px' }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [actualWidth, setActualWidth] = useState(`calc(100% - ${drawerWidth}px)`);
  const [actualMargin, setActualMargin] = useState(`${drawerWidth}px`);

  useEffect(() => {
    if (window.innerWidth >= 900) { // md breakpoint es 900px
      setActualWidth(`calc(100% - ${drawerWidth}px)`);
      setActualMargin(`${drawerWidth}px`);
    } else {
      setActualWidth('100%');
      setActualMargin('0px');
    }
  }, [drawerWidth]);

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { 
          xs: '100%', 
          md: actualWidth
        },
        ml: { 
          xs: 0, 
          md: actualMargin
        },
        backgroundColor: 'white',
        color: 'text.primary',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        transition: 'width 0.3s ease, margin-left 0.3s ease',
        height: headerHeight
      }}
    >
      <Toolbar sx={{ minHeight: `${headerHeight} !important` }}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        
        <Box sx={{ flexGrow: 1 }} />
        
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