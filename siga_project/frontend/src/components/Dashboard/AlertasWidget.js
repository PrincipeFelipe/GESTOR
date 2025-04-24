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
  const navigate = useNavigate();

  const obtenerAlertas = async () => {
    setLoading(true);
    try {
      const data = await trabajosService.getAlertasPlazos();
      setAlertas(data);
    } catch (error) {
      console.error("Error al obtener alertas:", error);
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
            No hay pasos próximos a vencer en los próximos 2 días.
          </Typography>
        </Box>
      ) : (
        <>
          <List dense disablePadding sx={{ overflow: 'auto', flexGrow: 1 }}>
            {alertas.slice(0, 5).map((alerta) => (
              <ListItem 
                key={`${alerta.trabajo_id}-${alerta.paso_id}`}
                button 
                onClick={() => navigate(`/dashboard/trabajos/${alerta.trabajo_id}/ejecutar`)}
                sx={{
                  borderLeft: '4px solid',
                  borderLeftColor: getBadgeColor(alerta.dias_restantes),
                  mb: 1,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  boxShadow: 1,
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
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
                        color={getBadgeColor(alerta.dias_restantes)}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Paso {alerta.paso_numero}: {alerta.paso_titulo}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Tiempo estimado: {alerta.tiempo_estimado} {parseFloat(alerta.tiempo_estimado) === 1 ? 'día' : 'días'}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
          
          {alertas.length > 5 && (
            <Typography variant="caption" color="text.secondary" align="center" sx={{ my: 1 }}>
              y {alertas.length - 5} más...
            </Typography>
          )}
          
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