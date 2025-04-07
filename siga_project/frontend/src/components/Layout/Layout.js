import React, { useState, useEffect } from 'react';
import { Box, CssBaseline } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
  const expandedDrawerWidth = 260;
  const collapsedDrawerWidth = 80;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const actualDrawerWidth = isCollapsed ? collapsedDrawerWidth : expandedDrawerWidth;
  const headerHeight = '72px'; // Definir como constante para consistencia

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarCollapse = (collapsed) => {
    setIsCollapsed(collapsed);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Sidebar primero - ahora con la capacidad de contraerse */}
      <Sidebar 
        drawerWidth={expandedDrawerWidth} 
        mobileOpen={mobileOpen} 
        handleDrawerToggle={handleDrawerToggle}
        isCollapsed={isCollapsed}
        setIsCollapsed={handleSidebarCollapse}
        headerHeight={headerHeight}
      />
      
      {/* Header fijo en la parte superior */}
      <Header 
        drawerWidth={actualDrawerWidth} 
        handleDrawerToggle={handleDrawerToggle} 
        headerHeight={headerHeight}
      />
      
      {/* Contenedor principal con espacio para el header y ajustado al ancho correcto */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { xs: '100%', md: '100%' },
          marginLeft: { xs: 0, md: 0 },
          marginTop: headerHeight, // Usar la constante de altura
          backgroundColor: 'background.default',
          minHeight: `calc(100vh - ${headerHeight})`, // Usar la constante
          overflowY: 'auto',
          transition: 'margin-top 0.3s ease'
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;