import React, { useState, useEffect, useContext } from 'react';
import {
  Badge, IconButton, Menu, Typography, Box,
  List, ListItem, ListItemText, Divider, Paper, Button,
  Tooltip, CircularProgress, Chip
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningIcon from '@mui/icons-material/Warning';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'; // Nuevo icono para vencidos
import { useNavigate } from 'react-router-dom';
import trabajosService from '../../assets/services/trabajos.service';
import { AuthContext } from '../../contexts/AuthContext'; // Importar el contexto de autenticación

const AlertasPlazos = () => {
  const [alertas, setAlertas] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); // Obtener el usuario actual del contexto

  const obtenerAlertas = async () => {
    setLoading(true);
    try {
      // Si es SuperAdmin, obtener todas las alertas
      const isSuperAdmin = user && user.roles && user.roles.includes('SUPERADMIN');
      const data = await trabajosService.getAlertasPlazos(isSuperAdmin);
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
  }, [user]); // Añadir user como dependencia para recargar si cambia el usuario

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

  // Función mejorada para obtener el color e icono según el estado de vencimiento
  const getBadgeInfo = (diasRestantes) => {
    // Valores negativos indican plazos vencidos
    if (diasRestantes < 0) {
      return { 
        color: 'error',
        icon: <ErrorOutlineIcon fontSize="small" sx={{ mr: 0.5 }} />,
        text: `Vencido hace ${Math.abs(diasRestantes)} ${Math.abs(diasRestantes) === 1 ? 'día' : 'días'}`
      };
    }
    
    if (diasRestantes === 0) {
      return { 
        color: 'error',
        icon: <AccessTimeIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />,
        text: 'Vence hoy'
      };
    }
    
    if (diasRestantes === 1) {
      return { 
        color: 'error',
        icon: <AccessTimeIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />,
        text: 'Vence mañana'
      };
    }
    
    return { 
      color: 'warning',
      icon: <AccessTimeIcon fontSize="small" color="warning" sx={{ mr: 0.5 }} />,
      text: `${diasRestantes} días restantes`
    };
  };
  
  // Contar alertas críticas (vencidas o que vencen hoy o mañana)
  const alertasCriticas = alertas.filter(a => a.dias_restantes <= 1).length;
  
  // Verificar si el usuario es SuperAdmin
  const isSuperAdmin = user && user.roles && user.roles.includes('SUPERADMIN');

  return (
    <>
      <Tooltip title={alertas.length > 0 ? `${alertas.length} alertas de plazos` : 'No hay alertas'}>
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
        <Paper sx={{ width: 400, maxHeight: 500, overflow: 'auto' }}>
          <Box sx={{ p: 2, bgcolor: 'background.paper', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {isSuperAdmin ? 'Todas las alertas de plazos' : 'Plazos por vencer y vencidos'}
            </Typography>
            {alertas.length > 0 && (
              <Tooltip title={`${alertasCriticas} plazos críticos`}>
                <Badge 
                  badgeContent={alertasCriticas} 
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
                No hay plazos por vencer ni vencidos
              </Typography>
            </Box>
          ) : (
            <List dense disablePadding>
              {alertas.map((alerta) => {
                // Obtener color, icono y texto para este elemento
                const badgeInfo = getBadgeInfo(alerta.dias_restantes);
                
                return (
                  <React.Fragment key={`${alerta.trabajo_id}-${alerta.paso_id}`}>
                    <ListItem
                      button
                      onClick={() => handleNavigateToTrabajo(alerta.trabajo_id)}
                      sx={{
                        borderLeft: '4px solid',
                        borderLeftColor: badgeInfo.color,
                        backgroundColor: alerta.dias_restantes < 0 ? 'rgba(211, 47, 47, 0.04)' : 'inherit',
                        '&:hover': { 
                          bgcolor: alerta.dias_restantes < 0 
                            ? 'rgba(211, 47, 47, 0.08)' 
                            : 'rgba(0, 0, 0, 0.04)' 
                        },
                        py: 1.5
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="body2" noWrap sx={{ 
                              fontWeight: 'bold', 
                              maxWidth: '70%',
                              color: alerta.dias_restantes < 0 ? 'error.main' : 'inherit'
                            }}>
                              {alerta.trabajo_titulo}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {badgeInfo.icon}
                              <Typography 
                                variant="caption" 
                                fontWeight="bold"
                                color={badgeInfo.color}
                              >
                                {badgeInfo.text}
                              </Typography>
                            </Box>
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="caption" color={alerta.dias_restantes < 0 ? 'error' : 'text.secondary'} noWrap>
                              Paso {alerta.paso_numero}: {alerta.paso_titulo}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Tiempo estimado: {alerta.tiempo_estimado} {parseFloat(alerta.tiempo_estimado) === 1 ? 'día' : 'días'}
                            </Typography>
                            
                            {/* Mostrar información adicional solo para SuperAdmin */}
                            {isSuperAdmin && (
                              <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {alerta.unidad_nombre && (
                                  <Chip
                                    size="small"
                                    icon={<BusinessIcon fontSize="small" />}
                                    label={alerta.unidad_nombre}
                                    variant="outlined"
                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                  />
                                )}
                                {alerta.responsable_nombre && (
                                  <Chip
                                    size="small"
                                    icon={<PersonIcon fontSize="small" />}
                                    label={alerta.responsable_nombre}
                                    variant="outlined"
                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                  />
                                )}
                              </Box>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                );
              })}
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