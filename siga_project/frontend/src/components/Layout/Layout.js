import React, { useState } from 'react';
import { Box, CssBaseline } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Header from './Header';  // Ahora importamos desde la misma carpeta
import Sidebar from './Sidebar'; // Ahora importamos desde la misma carpeta

const Layout = () => {
  const drawerWidth = 260;
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <Header drawerWidth={drawerWidth} handleDrawerToggle={handleDrawerToggle} />
      <Sidebar 
        drawerWidth={drawerWidth} 
        mobileOpen={mobileOpen} 
        handleDrawerToggle={handleDrawerToggle} 
      />
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          bgcolor: 'background.default'
        }}
      >
        <Box sx={{ minHeight: 64 }} /> {/* Espacio para compensar la altura del header */}
        <Outlet /> {/* Aquí se renderizarán las rutas anidadas */}
      </Box>
    </Box>
  );
};

export default Layout;