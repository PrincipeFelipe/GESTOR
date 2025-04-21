import React, { useState } from 'react';
import { Container, Box, Typography, Tabs, Tab, Paper } from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ListIcon from '@mui/icons-material/List';
import UnidadesList from '../components/Unidades/UnidadesList';
import UnidadTree from '../components/Unidades/UnidadTree';

const UnidadesPage = () => {  const [tabIndex, setTabIndex] = useState(0);  const handleTabChange = (event, newValue) => {    setTabIndex(newValue);  };  return (    <Container maxWidth="lg" sx={{ py: 2 }}> {/* Eliminar margin-top */}      <Typography variant="h4" component="h1" gutterBottom>        Gestión de Unidades      </Typography>      <Paper sx={{ mb: 3 }}>        <Tabs          value={tabIndex}          onChange={handleTabChange}          indicatorColor="primary"          textColor="primary"          variant="fullWidth"        >          <Tab icon={<ListIcon />} label="Lista de Unidades" />          <Tab icon={<AccountTreeIcon />} label="Vista Jerárquica" />        </Tabs>      </Paper>      <Box>        {tabIndex === 0 ? (          <UnidadesList />        ) : (          <UnidadTree />        )}      </Box>    </Container>  );};export default UnidadesPage;