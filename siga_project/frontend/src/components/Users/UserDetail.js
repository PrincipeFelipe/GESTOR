import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Divider,
  Box,
  Paper,
  Chip,
  Avatar,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Card,
  CardContent
} from '@mui/material';
import {
  Close as CloseIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  Check as CheckIcon,
  Clear as ClearIcon,
  Badge as BadgeIcon
} from '@mui/icons-material';
import api from '../../assets/services/api';

const UserDetail = ({ open, onClose, user }) => {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [unidadData, setUnidadData] = useState({});
  const [unidadAccesoData, setUnidadAccesoData] = useState(null);
  const [unidadDestinoData, setUnidadDestinoData] = useState(null);
  
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user || !open) return;
      
      try {
        setLoading(true);
        
        // Obtener datos actualizados del usuario
        const response = await api.get(`/users/${user.id}/`);
        setUserData(response.data);
        
        // Cargar datos de las unidades si existen
        const unidadesPromises = [];
        
        if (response.data.unidad) {
          unidadesPromises.push(
            api.get(`/unidades/${response.data.unidad}/`)
              .then(res => setUnidadData(res.data))
              .catch(err => console.error(`Error al cargar unidad ${response.data.unidad}:`, err))
          );
        }
        
        if (response.data.unidad_destino) {
          unidadesPromises.push(
            api.get(`/unidades/${response.data.unidad_destino}/`)
              .then(res => setUnidadDestinoData(res.data))
              .catch(err => console.error(`Error al cargar unidad destino ${response.data.unidad_destino}:`, err))
          );
        }
        
        if (response.data.unidad_acceso) {
          unidadesPromises.push(
            api.get(`/unidades/${response.data.unidad_acceso}/`)
              .then(res => setUnidadAccesoData(res.data))
              .catch(err => console.error(`Error al cargar unidad acceso ${response.data.unidad_acceso}:`, err))
          );
        }
        
        // Esperar a que se carguen todos los datos
        if (unidadesPromises.length > 0) {
          await Promise.all(unidadesPromises);
        }
      } catch (error) {
        console.error("Error al cargar detalles de usuario:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserDetails();
    
    return () => {
      // Limpiar estados al cerrar
      setUnidadData({});
      setUnidadAccesoData(null);
      setUnidadDestinoData(null);
    };
  }, [user, open]);
  
  const handleClose = () => {
    onClose();
    // Pequeña demora para limpiar datos después de que se cierre el diálogo
    setTimeout(() => {
      setUserData(null);
    }, 300);
  };
  
  // Obtener las iniciales para el avatar
  const getInitials = () => {
    if (!userData) return '';
    
    const firstInitial = userData.nombre ? userData.nombre.charAt(0) : '';
    const lastInitial = userData.apellido1 ? userData.apellido1.charAt(0) : '';
    
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };
  
  // Obtener color para el tipo de usuario
  const getUserTypeColor = (tipo) => {
    switch (tipo) {
      case 'SuperAdmin':
        return 'error';
      case 'Admin':
        return 'warning';
      case 'Gestor':
        return 'info';
      default:
        return 'default';
    }
  };
  
  if (!user) return null;
  
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Detalles del Usuario</Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : userData ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              {/* Tarjeta perfil */}
              <Card sx={{ height: '100%', borderRadius: 2 }}>
                <Box 
                  sx={{ 
                    p: 3, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    bgcolor: 'primary.light',
                    color: 'white'
                  }}
                >
                  <Avatar 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      mb: 2, 
                      bgcolor: 'primary.main',
                      fontSize: '1.8rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {getInitials()}
                  </Avatar>
                  
                  <Typography variant="h6">
                    {userData.nombre} {userData.apellido1}
                  </Typography>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    {userData.apellido2 || ''}
                  </Typography>
                  
                  <Chip 
                    label={userData.tipo_usuario} 
                    color={getUserTypeColor(userData.tipo_usuario)}
                    sx={{ mt: 1, fontWeight: 'bold' }}
                  />
                </Box>
                
                <CardContent>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <BadgeIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="TIP"
                        secondary={userData.tip || 'No asignado'}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <EmailIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Email"
                        secondary={userData.email || 'No asignado'}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <PhoneIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Teléfono"
                        secondary={userData.telefono || 'No asignado'}
                      />
                    </ListItem>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <ListItem>
                      <ListItemIcon>
                        <SecurityIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Estado"
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            {userData.estado ? (
                              <>
                                <CheckIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                                <Typography variant="body2" color="success.main">
                                  Activo
                                </Typography>
                              </>
                            ) : (
                              <>
                                <ClearIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
                                <Typography variant="body2" color="error">
                                  Inactivo
                                </Typography>
                              </>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <AdminIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Referencia"
                        secondary={userData.ref || 'No asignada'}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={8}>
              {/* Información de unidades */}
              <Paper sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Unidades Asignadas
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <BusinessIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="subtitle1">
                        Unidad Principal
                      </Typography>
                    </Box>
                    
                    {unidadData && unidadData.id ? (
                      <Box sx={{ pl: 4 }}>
                        <Typography variant="body1" fontWeight="medium">
                          {unidadData.nombre}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Código: {unidadData.cod_unidad}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Tipo: {unidadData.tipo_unidad_display || unidadData.tipo_unidad}
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ pl: 4 }}>
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                          No tiene unidad principal asignada
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                  
                  {unidadDestinoData && (
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <BusinessIcon color="info" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1">
                          Unidad de Destino
                          <Chip 
                            label="Temporal" 
                            size="small" 
                            color="info" 
                            variant="outlined"
                            sx={{ ml: 1, height: 20 }}
                          />
                        </Typography>
                      </Box>
                      
                      <Box sx={{ pl: 4 }}>
                        <Typography variant="body1" fontWeight="medium">
                          {unidadDestinoData.nombre}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Código: {unidadDestinoData.cod_unidad}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Tipo: {unidadDestinoData.tipo_unidad_display || unidadDestinoData.tipo_unidad}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                  
                  {unidadAccesoData && (
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <BusinessIcon color="secondary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1">
                          Unidad de Acceso
                          <Chip 
                            label="Adicional" 
                            size="small" 
                            color="secondary" 
                            variant="outlined"
                            sx={{ ml: 1, height: 20 }}
                          />
                        </Typography>
                      </Box>
                      
                      <Box sx={{ pl: 4 }}>
                        <Typography variant="body1" fontWeight="medium">
                          {unidadAccesoData.nombre}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Código: {unidadAccesoData.cod_unidad}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Tipo: {unidadAccesoData.tipo_unidad_display || unidadAccesoData.tipo_unidad}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Paper>
              
              {/* Información adicional */}
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Información adicional
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" color="primary">
                      Empleo
                    </Typography>
                    <Typography variant="body1">
                      {userData.empleo_nombre || 'No asignado'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" color="primary">
                      Fecha de Registro
                    </Typography>
                    <Typography variant="body1">
                      {userData.date_joined ? new Date(userData.date_joined).toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'No disponible'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Typography variant="body1" align="center">
            No se encontraron datos del usuario
          </Typography>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserDetail;