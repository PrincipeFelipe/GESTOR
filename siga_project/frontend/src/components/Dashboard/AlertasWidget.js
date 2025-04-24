import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, List, ListItem, ListItemText, Box,
  Divider, Button, CircularProgress, Chip
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningIcon from '@mui/icons-material/Warning';
import { useNavigate } from 'react-router-dom';
import trabajosService from '../../assets/services/trabajos.service';

const AlertasWidget = () => {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const obtenerAlertas = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Obteniendo alertas de plazos...');
      const data = await trabajosService.getAlertasPlazos();
      console.log('Alertas recibidas:', data);
      setAlertas(data || []);
    } catch (error) {
      console.error("Error al obtener alertas:", error);
      setError('No se pudieron cargar las alertas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerAlertas();
  }, []);

  const getBadgeColor = (diasRestantes) => {
    if (diasRestantes === 0) return 'error';
    if (diasRestantes === 1) return 'error';
    return 'warning';
  };

  // Manejo de estado de error
  if (error) {
    return (
      <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <Typography color="error">{error}</Typography>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={obtenerAlertas}
          sx={{ mt: 2 }}
        >
          Reintentar
        </Button>
      </Paper>
    );
  }

  // Estado de carga
  if (loading) {
    return (
      <Paper sx={{ p: 3, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={30} />
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">
          Plazos próximos a vencer
        </Typography>
        {alertas.length > 0 && (
          <Chip 
            label={`${alertas.length} ${alertas.length === 1 ? 'alerta' : 'alertas'}`} 
            color="error" 
            size="small" 
            icon={<WarningIcon fontSize="small" />}
          />
        )}
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {alertas.length === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            No hay plazos próximos a vencer en los próximos 2 días.
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <List dense disablePadding>
              {alertas.slice(0, 5).map((alerta) => (
                <ListItem 
                  key={`${alerta.trabajo_id}-${alerta.paso_id}`}
                  onClick={() => navigate(`/dashboard/trabajos/${alerta.trabajo_id}/ejecutar`)}
                  sx={{
                    borderLeft: '4px solid',
                    borderLeftColor: getBadgeColor(alerta.dias_restantes || 0),
                    mb: 1,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    boxShadow: 1,
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)', cursor: 'pointer' }
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1" fontWeight="medium" noWrap sx={{ maxWidth: '70%' }}>
                          {alerta.trabajo_titulo}
                        </Typography>
                        <Chip
                          icon={<AccessTimeIcon fontSize="small" />}
                          label={alerta.dias_restantes === 0 ? 'Vence hoy' : 
                               alerta.dias_restantes === 1 ? 'Mañana' : 
                               `${alerta.dias_restantes} días`}
                          size="small"
                          color={getBadgeColor(alerta.dias_restantes || 0)}
                        />
                      </Box>
                    }
                    // CORRECCIÓN AQUÍ: No usar Box dentro del secondary para evitar div dentro de p
                    secondary={
                      <>
                        <Typography variant="body2" component="span" color="text.secondary" display="block">
                          Paso {alerta.paso_numero}: {alerta.paso_titulo || ''}
                        </Typography>
                        {alerta.tiempo_estimado && (
                          <Typography variant="caption" component="span" color="text.secondary" display="block">
                            Tiempo estimado: {alerta.tiempo_estimado} {parseFloat(alerta.tiempo_estimado) === 1 ? 'día' : 'días'}
                          </Typography>
                        )}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
            
            {alertas.length > 5 && (
              <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block', mb: 2 }}>
                y {alertas.length - 5} más...
              </Typography>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
            <Button 
              variant="outlined"
              size="small"
              onClick={() => navigate('/dashboard/trabajos')}
            >
              Ver todos los trabajos
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default AlertasWidget;