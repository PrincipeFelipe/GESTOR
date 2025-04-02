import React, { useState } from 'react';
import { Box, CssBaseline } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
  const drawerWidth = 260;
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Header fijo en la parte superior */}
      <Header drawerWidth={drawerWidth} handleDrawerToggle={handleDrawerToggle} />
      
      {/* Sidebar */}
      <Sidebar 
        drawerWidth={drawerWidth} 
        mobileOpen={mobileOpen} 
        handleDrawerToggle={handleDrawerToggle} 
      />
      
      {/* Contenedor principal con espacio para el header y ajustado al ancho correcto */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
          marginLeft: { xs: 0, md: `${drawerWidth}px` },
          marginTop: '64px', // Altura del AppBar
          backgroundColor: 'background.default',
          minHeight: 'calc(100vh - 64px)', // Altura total menos el AppBar
          transition: 'margin-left 0.3s ease-out',
          overflowY: 'auto'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;