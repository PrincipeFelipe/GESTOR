import React from 'react';
import { Box, Toolbar } from '@mui/material';

const Main = ({ children, drawerWidth }) => {
  return (
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
      {children}
    </Box>
  );
};

export default Main;