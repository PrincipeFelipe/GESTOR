import React, { useState } from 'react';
import { Box, Toolbar, CssBaseline, Typography, Grid } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const Dashboard = () => {
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
        <Toolbar /> {/* Espacio para compensar la altura del header */}
        <Outlet /> {/* Aquí se renderizarán las rutas anidadas */}
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>Dashboard</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;