import React, { useState, useEffect } from 'react';
import {
  Badge, IconButton, Menu, Typography, Box,
  List, ListItem, ListItemText, Divider, Paper, Button,
  Tooltip, CircularProgress, Tabs, Tab, Chip
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InfoIcon from '@mui/icons-material/Info';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate } from 'react-router-dom';
import trabajosService from '../../assets/services/trabajos.service';
import notificacionesService from '../../assets/services/notificaciones.service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 0 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const NotificacionesMenu = () => {
  const [alertasPlazos, setAlertasPlazos] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  const obtenerDatos = async () => {
    setLoading(true);
    try {
      // Obtener alertas de plazos (incluye las de otros miembros de la unidad)
      const plazoData = await trabajosService.getAlertasPlazos();
      setAlertasPlazos(plazoData);
      
      // Obtener notificaciones generales
      const notificacionesData = await notificacionesService.getNotificaciones();
      setNotificaciones(notificacionesData);
    } catch (error) {
      console.error("Error al obtener datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerDatos();
    
    // Programar actualización cada 30 minutos
    const intervalId = setInterval(obtenerDatos, 30 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleNavigateToTrabajo = (trabajoId) => {
    navigate(`/dashboard/trabajos/${trabajoId}/ejecutar`);
    handleClose();
  };

  const handleMarcarNotificacionLeida = async (id) => {
    try {
      await notificacionesService.marcarComoLeida(id);
      // Actualizar el estado de la notificación localmente
      setNotificaciones(prevNotificaciones =>
        prevNotificaciones.map(n => 
          n.id === id ? { ...n, leida: true } : n
        )
      );
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error);
    }
  };

  const handleMarcarTodasLeidas = async () => {
    try {
      await notificacionesService.marcarTodasComoLeidas();
      // Actualizar estado local
      setNotificaciones(prevNotificaciones =>
        prevNotificaciones.map(n => ({ ...n, leida: true }))
      );
    } catch (error) {
      console.error("Error al marcar todas como leídas:", error);
    }
  };

  const getBadgeColor = (diasRestantes) => {
    if (diasRestantes === 0) return 'error';
    if (diasRestantes === 1) return 'error';
    return 'warning';
  };

  const getTotalNotificaciones = () => {
    const plazosNoLeidos = alertasPlazos.length;
    const notificacionesNoLeidas = notificaciones.filter(n => !n.leida).length;
    return plazosNoLeidos + notificacionesNoLeidas;
  };

  return (
    <>
      <Tooltip title="Centro de notificaciones">
        <IconButton
          color="inherit"
          onClick={handleClick}
          aria-label="notificaciones"
        >
          <Badge 
            badgeContent={getTotalNotificaciones()} 
            color="error"
            max={99}
            invisible={getTotalNotificaciones() === 0}
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
        <Paper sx={{ width: 380, maxHeight: 500 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleChangeTab} 
              aria-label="notificaciones tabs"
              variant="fullWidth"
            >
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <InfoIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">Notificaciones</Typography>
                    {notificaciones.filter(n => !n.leida).length > 0 && (
                      <Badge 
                        badgeContent={notificaciones.filter(n => !n.leida).length} 
                        color="error" 
                        sx={{ ml: 1 }}
                        max={99}
                      />
                    )}
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
                    <Typography variant="body2">Plazos</Typography>
                    {alertasPlazos.length > 0 && (
                      <Badge 
                        badgeContent={alertasPlazos.length} 
                        color="error" 
                        sx={{ ml: 1 }}
                        max={99}
                      />
                    )}
                  </Box>
                } 
              />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            {loading ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress size={24} />
              </Box>
            ) : notificaciones.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No hay notificaciones
                </Typography>
              </Box>
            ) : (
              <>
                <List dense disablePadding sx={{ maxHeight: 370, overflow: 'auto' }}>
                  {notificaciones.map((notificacion) => (
                    <React.Fragment key={notificacion.id}>
                      <ListItem
                        onClick={() => handleMarcarNotificacionLeida(notificacion.id)}
                        sx={{
                          py: 1.5,
                          borderLeft: '4px solid',
                          borderLeftColor: notificacion.leida ? 'transparent' : 'primary.main',
                          backgroundColor: notificacion.leida ? 'transparent' : 'rgba(25, 118, 210, 0.08)',
                          '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)', cursor: 'pointer' },
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight={notificacion.leida ? 'normal' : 'bold'}>
                              {notificacion.titulo}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography variant="caption" component="span" display="block" color="text.secondary">
                                {notificacion.mensaje}
                              </Typography>
                              <Typography variant="caption" component="span" color="text.secondary">
                                {format(new Date(notificacion.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
                
                <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between' }}>
                  <Button size="small" onClick={handleMarcarTodasLeidas} disabled={!notificaciones.some(n => !n.leida)}>
                    Marcar todas como leídas
                  </Button>
                  <Button size="small" color="primary">
                    Ver todas
                  </Button>
                </Box>
              </>
            )}
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            {loading ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress size={24} />
              </Box>
            ) : alertasPlazos.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No hay plazos próximos a vencer
                </Typography>
              </Box>
            ) : (
              <>
                <List dense disablePadding sx={{ maxHeight: 370, overflow: 'auto' }}>
                  {alertasPlazos.map((alerta) => (
                    <React.Fragment key={`${alerta.trabajo_id}-${alerta.paso_id}`}>
                      <ListItem
                        onClick={() => handleNavigateToTrabajo(alerta.trabajo_id)}
                        sx={{
                          borderLeft: '4px solid',
                          borderLeftColor: getBadgeColor(alerta.dias_restantes),
                          '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)', cursor: 'pointer' },
                          py: 1.5
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', maxWidth: '70%' }}>
                                <Typography variant="body2" noWrap sx={{ fontWeight: 'bold' }}>
                                  {alerta.trabajo_titulo}
                                </Typography>
                                {!alerta.es_propio && (
                                  <Chip 
                                    size="small" 
                                    icon={<PersonIcon fontSize="small" />} 
                                    label={alerta.usuario_asignado}
                                    variant="outlined"
                                    sx={{ ml: 0.5, height: 20, fontSize: '0.7rem' }}
                                  />
                                )}
                              </Box>
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
                                   `${alerta.dias_restantes} días`}
                                </Typography>
                              </Box>
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="caption" component="span" color="text.secondary" display="block">
                                Paso {alerta.paso_numero}: {alerta.paso_titulo}
                              </Typography>
                              <Typography variant="caption" component="span" color="text.secondary" display="block">
                                {alerta.tiempo_estimado} {parseFloat(alerta.tiempo_estimado) === 1 ? 'día' : 'días'}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
                
                <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between' }}>
                  <Button size="small" onClick={obtenerDatos} disabled={loading}>
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
              </>
            )}
          </TabPanel>
        </Paper>
      </Menu>
    </>
  );
};

export default NotificacionesMenu;