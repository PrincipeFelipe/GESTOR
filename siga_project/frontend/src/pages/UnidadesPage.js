import React, { useState } from 'react';
import { Container, Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import { AccountTree as AccountTreeIcon, List as ListIcon } from '@mui/icons-material';
import UnidadesList from '../components/Unidades/UnidadesList';
import UnidadTree from '../components/Unidades/UnidadTree';

const UnidadesPage = () => {
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Gestión de Unidades
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<ListIcon />} label="Lista de Unidades" />
          <Tab icon={<AccountTreeIcon />} label="Vista Jerárquica" />
        </Tabs>
      </Paper>

      <Box sx={{ mt: 3 }}>
        {tabIndex === 0 ? (
          <UnidadesList />
        ) : (
          <UnidadTree />
        )}
      </Box>
    </Container>
  );
};

export default UnidadesPage;