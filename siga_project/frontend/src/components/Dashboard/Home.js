import React from 'react';
import { Box, Typography, Grid, Paper, Card, CardContent, CardHeader, Divider } from '@mui/material';
import PeopleOutline from '@mui/icons-material/PeopleOutline';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import AlertasWidget from './AlertasWidget';

const Home = () => {
  const stats = [
    { 
      title: 'Usuarios', 
      value: 24, 
      icon: <PeopleOutline fontSize="large" color="primary" />,
      color: '#e3f2fd'
    },
    { 
      title: 'Unidades', 
      value: 8, 
      icon: <BusinessIcon fontSize="large" color="primary" />,
      color: '#e8f5e9'
    },
    { 
      title: 'Empleos', 
      value: 12, 
      icon: <WorkIcon fontSize="large" color="primary" />,
      color: '#f1f8e9'
    }
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom color="primary.dark">
        Panel de Control
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: 2,
                bgcolor: stat.color
              }}
            >
              <Box>
                <Typography variant="h6" color="text.secondary">
                  {stat.title}
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="primary.dark">
                  {stat.value}
                </Typography>
              </Box>
              <Box sx={{ ml: 2 }}>
                {stat.icon}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardHeader title="Usuarios Activos" sx={{ backgroundColor: 'primary.light', color: 'white' }} />
            <Divider />
            <CardContent>
              <Typography variant="body1">
                Resumen de la actividad reciente de usuarios.
              </Typography>
              {/* Aquí iría un gráfico o tabla de usuarios activos */}
              <Box sx={{ height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#f5f5f5', borderRadius: 1, mt: 2 }}>
                <Typography color="text.secondary">
                  Gráfico de actividad
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardHeader title="Estadísticas" sx={{ backgroundColor: 'primary.light', color: 'white' }} />
            <Divider />
            <CardContent>
              <Typography variant="body1">
                Resumen estadístico del sistema.
              </Typography>
              {/* Aquí iría un gráfico de estadísticas */}
              <Box sx={{ height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#f5f5f5', borderRadius: 1, mt: 2 }}>
                <Typography color="text.secondary">
                  Gráfico estadístico
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
              <AlertasWidget />
            </Grid>
      </Grid>
    </Box>
  );
};

export default Home;