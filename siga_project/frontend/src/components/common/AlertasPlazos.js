import React, { useState, useEffect } from 'react';
import {
  Badge, IconButton, Menu, Typography, Box,
  List, ListItem, ListItemText, Divider, Paper, Button,
  Tooltip, CircularProgress
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningIcon from '@mui/icons-material/Warning';
import { useNavigate } from 'react-router-dom';
import trabajosService from '../../assets/services/trabajos.service';


const AlertasPlazos = () => {
  const [alertas, setAlertas] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const open = Boolean(anchorEl);
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
    
    // Programar actualización cada 30 minutos
    const intervalId = setInterval(obtenerAlertas, 30 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigateToTrabajo = (trabajoId) => {
    navigate(`/dashboard/trabajos/${trabajoId}/ejecutar`);
    handleClose();
  };

  const getBadgeColor = (diasRestantes) => {
    if (diasRestantes === 0) return 'error';
    if (diasRestantes === 1) return 'error';
    return 'warning';
  };

  return (
    <>
      <Tooltip title="Alertas de plazos">
        <IconButton
          color="inherit"
          onClick={handleClick}
          aria-label="alertas de plazos"
        >
          <Badge 
            badgeContent={alertas.length} 
            color="error"
            max={99}
            invisible={alertas.length === 0}
          >
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Paper sx={{ width: 350, maxHeight: 400, overflow: 'auto' }}>
          <Box sx={{ p: 2, bgcolor: 'background.paper', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Pasos próximos a vencer
            </Typography>
            {alertas.length > 0 && (
              <Tooltip title="Plazos críticos">
                <Badge 
                  badgeContent={alertas.length} 
                  color="error" 
                  max={99}
                >
                  <WarningIcon color="error" fontSize="small" />
                </Badge>
              </Tooltip>
            )}
          </Box>
          
          <Divider />
          
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          ) : alertas.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No hay pasos próximos a vencer
              </Typography>
            </Box>
          ) : (
            <List dense disablePadding>
              {alertas.map((alerta) => (
                <React.Fragment key={`${alerta.trabajo_id}-${alerta.paso_id}`}>
                  <ListItem
                    button
                    onClick={() => handleNavigateToTrabajo(alerta.trabajo_id)}
                    sx={{
                      borderLeft: '4px solid',
                      borderLeftColor: getBadgeColor(alerta.dias_restantes),
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' },
                      py: 1.5
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="body2" noWrap sx={{ fontWeight: 'bold', maxWidth: '70%' }}>
                            {alerta.trabajo_titulo}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AccessTimeIcon 
                              fontSize="small" 
                              color={getBadgeColor(alerta.dias_restantes)} 
                              sx={{ mr: 0.5 }} 
                            />
                            <Typography 
                              variant="caption" 
                              fontWeight="bold"
                              color={getBadgeColor(alerta.dias_restantes)}
                            >
                              {alerta.dias_restantes === 0 ? 'Vence hoy' : 
                               alerta.dias_restantes === 1 ? 'Vence mañana' :
                               `${alerta.dias_restantes} días restantes`}
                            </Typography>
                          </Box>
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            Paso {alerta.paso_numero}: {alerta.paso_titulo}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Tiempo estimado: {alerta.tiempo_estimado} {parseFloat(alerta.tiempo_estimado) === 1 ? 'día' : 'días'}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          )}
          
          <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between' }}>
            <Button size="small" onClick={obtenerAlertas} disabled={loading}>
              Actualizar
            </Button>
            <Button 
              size="small" 
              color="primary" 
              onClick={() => { navigate('/dashboard/trabajos'); handleClose(); }}
            >
              Ver todos los trabajos
            </Button>
          </Box>
        </Paper>
      </Menu>
    </>
  );
};

export default AlertasPlazos;