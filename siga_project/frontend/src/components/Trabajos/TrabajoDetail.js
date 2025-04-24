import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Divider,
  Chip,
  LinearProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ResumeIcon from '@mui/icons-material/PlayCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import PendingIcon from '@mui/icons-material/Pending';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import BusinessIcon from '@mui/icons-material/Business';
import SendIcon from '@mui/icons-material/Send';
import DownloadIcon from '@mui/icons-material/Download';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

import trabajosService from '../../assets/services/trabajos.service';
import { AuthContext } from '../../contexts/AuthContext';

const TrabajoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = React.useContext(AuthContext);
  
  const [trabajo, setTrabajo] = useState(null);
  const [pasos, setPasos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  useEffect(() => {
    const loadTrabajo = async () => {
      setLoading(true);
      try {
        const response = await trabajosService.getTrabajoById(id);
        console.log("Datos del trabajo recibidos:", response.data);
        setTrabajo(response.data);
        
        // Ordenar los pasos por número
        if (response.data.pasos) {
          const sortedPasos = [...response.data.pasos].sort((a, b) => {
            return a.paso_numero - b.paso_numero;
          });
          setPasos(sortedPasos);
        }
      } catch (error) {
        console.error('Error al cargar trabajo:', error);
        setSnackbar({
          open: true,
          message: 'Error al cargar los datos del trabajo',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadTrabajo();
  }, [id]);
  
  const handleBack = () => {
    navigate('/dashboard/trabajos');
  };
  
  const handleExecute = () => {
    navigate(`/dashboard/trabajos/${id}/ejecutar`);
  };
  
  const handleConfirmAction = (action) => {
    setConfirmDialog({
      open: true,
      action
    });
  };
  
  const executeAction = async () => {
    const { action } = confirmDialog;
    
    try {
      switch (action) {
        case 'pausar':
          await trabajosService.pausarTrabajo(id);
          setSnackbar({
            open: true,
            message: 'Trabajo pausado correctamente',
            severity: 'info'
          });
          break;
        case 'reanudar':
          await trabajosService.reanudarTrabajo(id);
          setSnackbar({
            open: true,
            message: 'Trabajo reanudado correctamente',
            severity: 'success'
          });
          break;
        case 'cancelar':
          await trabajosService.cancelarTrabajo(id);
          setSnackbar({
            open: true,
            message: 'Trabajo cancelado correctamente',
            severity: 'warning'
          });
          break;
        default:
          break;
      }
      
      // Recargar los datos del trabajo
      const response = await trabajosService.getTrabajoById(id);
      setTrabajo(response.data);
      
      if (response.data.pasos) {
        const sortedPasos = [...response.data.pasos].sort((a, b) => {
          return a.paso_numero - b.paso_numero;
        });
        setPasos(sortedPasos);
      }
      
    } catch (error) {
      console.error(`Error al ${action} trabajo:`, error);
      setSnackbar({
        open: true,
        message: `Error al ${action} el trabajo`,
        severity: 'error'
      });
    } finally {
      setConfirmDialog({ open: false, action: '' });
    }
  };
  
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'INICIADO': return 'info';
      case 'EN_PROGRESO': return 'primary';
      case 'PAUSADO': return 'warning';
      case 'COMPLETADO': return 'success';
      case 'CANCELADO': return 'error';
      default: return 'default';
    }
  };
  
  const getEstadoPasoColor = (estado) => {
    switch (estado) {
      case 'PENDIENTE': return 'info';
      case 'EN_PROGRESO': return 'primary';
      case 'COMPLETADO': return 'success';
      case 'BLOQUEADO': return 'default';
      default: return 'default';
    }
  };
  
  const getEstadoPasoIcon = (paso) => {
    switch (paso.estado) {
      case 'COMPLETADO':
        return <CheckCircleIcon fontSize="small" color="success" />;
      case 'EN_PROGRESO':
        return <HourglassEmptyIcon fontSize="small" color="primary" />;
      case 'BLOQUEADO':
        return <PendingIcon fontSize="small" color="disabled" />;
      case 'PENDIENTE':
        return <PendingIcon fontSize="small" color="info" />;
      default:
        return <PendingIcon fontSize="small" />;
    }
  };
  
  // Modifica la función calcularProgreso para mostrar 100% en trabajos finalizados
  const calcularProgreso = () => {
    // Si el trabajo está completado, mostrar 100% de progreso
    if (trabajo.estado === 'COMPLETADO') {
      return 100;
    }
    
    // Para otros estados, calcular basado en pasos completados
    if (!pasos || pasos.length === 0) return 0;
    const completados = pasos.filter(p => p.estado === 'COMPLETADO').length;
    return Math.round((completados / pasos.length) * 100);
  };

  // Modifica la función obtenerNumeroPasoActual para manejar trabajos finalizados
  const obtenerNumeroPasoActual = () => {
    // Si el trabajo está completado, mostrar el número total de pasos
    if (trabajo.estado === 'COMPLETADO') {
      return pasos.length;
    }
    
    if (!pasos || pasos.length === 0) return 1;
    
    // Si hay un paso en progreso, ese es el actual
    const enProgreso = pasos.find(p => p.estado === 'EN_PROGRESO');
    if (enProgreso) return enProgreso.paso_numero;
    
    // Si no hay ninguno en progreso, buscar el primer pendiente
    const primerPendiente = pasos.find(p => p.estado === 'PENDIENTE');
    if (primerPendiente) return primerPendiente.paso_numero;
    
    // Si todos están completados pero el trabajo no está marcado como completado
    if (pasos.every(p => p.estado === 'COMPLETADO')) {
      return pasos.length;
    }
    
    // Fallback al paso 1
    return 1;
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!trabajo) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">No se pudo cargar el trabajo o no existe</Typography>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Volver a la lista
        </Button>
      </Box>
    );
  }
  
  const progreso = calcularProgreso();
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          variant="outlined"
        >
          Volver a la lista
        </Button>
        
        <Box>
          {trabajo.estado !== 'COMPLETADO' && trabajo.estado !== 'CANCELADO' && (
            <>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrowIcon />}
                onClick={handleExecute}
                sx={{ mr: 1 }}
              >
                Ejecutar
              </Button>
              
              {trabajo.estado === 'EN_PROGRESO' ? (
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<PauseIcon />}
                  onClick={() => handleConfirmAction('pausar')}
                  sx={{ mr: 1 }}
                >
                  Pausar
                </Button>
              ) : trabajo.estado === 'PAUSADO' ? (
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<ResumeIcon />}
                  onClick={() => handleConfirmAction('reanudar')}
                  sx={{ mr: 1 }}
                >
                  Reanudar
                </Button>
              ) : null}
              
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => handleConfirmAction('cancelar')}
              >
                Cancelar
              </Button>
            </>
          )}
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              {trabajo.titulo}
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Chip 
                label={trabajo.estado}
                color={getEstadoColor(trabajo.estado)}
                sx={{ mr: 1 }}
              />
              
              <Chip 
                icon={<BusinessIcon />}
                label={trabajo.unidad_nombre}
                variant="outlined"
                sx={{ mr: 1 }}
              />
            </Box>
            
            {trabajo.descripcion && (
              <Typography variant="body1" paragraph>
                {trabajo.descripcion}
              </Typography>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PersonIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    <strong>Creado por:</strong> {trabajo.usuario_creador_nombre}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CalendarTodayIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    <strong>Fecha de inicio:</strong> {format(new Date(trabajo.fecha_inicio), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </Typography>
                </Box>
                
                {trabajo.fecha_fin && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarTodayIcon color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      <strong>Fecha de fin:</strong> {format(new Date(trabajo.fecha_fin), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </Typography>
                  </Box>
                )}
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AccessTimeIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    <strong>Tiempo transcurrido:</strong> {trabajo.tiempo_transcurrido_dias} días
                  </Typography>
                </Box>
                
                {trabajo.procedimiento_detalle.tiempo_maximo && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccessTimeIcon color={
                      trabajo.tiempo_transcurrido_dias > trabajo.procedimiento_detalle.tiempo_maximo 
                        ? 'error' 
                        : 'success'
                    } sx={{ mr: 1 }} />
                    <Typography variant="body2" color={
                      trabajo.tiempo_transcurrido_dias > trabajo.procedimiento_detalle.tiempo_maximo 
                        ? 'error' 
                        : 'inherit'
                    }>
                      <strong>Tiempo máximo:</strong> {trabajo.procedimiento_detalle.tiempo_maximo} días
                      {trabajo.tiempo_transcurrido_dias > trabajo.procedimiento_detalle.tiempo_maximo && (
                        <span> (¡Excedido!)</span>
                      )}
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <BusinessIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    <strong>Procedimiento:</strong> {trabajo.procedimiento_detalle.nombre} ({trabajo.procedimiento_detalle.nivel_display})
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Progreso del trabajo
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={progreso} 
                    color={trabajo.estado === 'COMPLETADO' ? 'success' : 'primary'}
                  />
                </Box>
                <Box sx={{ minWidth: 35 }}>
                  <Typography variant="body2" color="text.secondary">
                    {`${progreso}%`}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Pasos del Trabajo
            </Typography>
            
            {pasos.length === 0 ? (
              <Alert severity="info">
                No hay pasos definidos para este trabajo
              </Alert>
            ) : (
              <Stepper orientation="vertical" nonLinear activeStep={-1}>
                {pasos.map((paso) => (
                  <Step key={paso.id} completed={paso.estado === 'COMPLETADO'}>
                    <StepLabel
                      StepIconComponent={() => getEstadoPasoIcon(paso)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1">
                          {paso.paso_titulo}
                        </Typography>
                        
                        <Chip 
                          label={paso.estado}
                          color={getEstadoPasoColor(paso.estado)}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                        
                        {paso.paso_detalle?.requiere_envio && (
                          <Chip 
                            icon={<SendIcon />}
                            label="Requiere envío"
                            size="small"
                            color="secondary"
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        )}
                        
                        {paso.estado === 'COMPLETADO' && paso.usuario_completado_nombre && (
                          <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                            (Completado por {paso.usuario_completado_nombre})
                          </Typography>
                        )}
                      </Box>
                    </StepLabel>
                    
                    <StepContent>
                      <Box sx={{ mb: 2 }}>
                        {paso.paso_detalle?.descripcion && (
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                            {paso.paso_detalle.descripcion}
                          </Typography>
                        )}
                        
                        {paso.notas && (
                          <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(0, 0, 0, 0.04)', borderRadius: 1 }}>
                            <Typography variant="body2" fontStyle="italic">
                              <strong>Notas:</strong> {paso.notas}
                            </Typography>
                          </Box>
                        )}
                        
                        <Box sx={{ mt: 2 }}>
                          {paso.fecha_inicio && (
                            <Typography variant="body2" color="text.secondary">
                              <strong>Iniciado:</strong> {format(new Date(paso.fecha_inicio), 'dd/MM/yyyy HH:mm', { locale: es })}
                            </Typography>
                          )}
                          {paso.fecha_fin && (
                            <Typography variant="body2" color="text.secondary">
                              <strong>Finalizado:</strong> {format(new Date(paso.fecha_fin), 'dd/MM/yyyy HH:mm', { locale: es })}
                            </Typography>
                          )}
                        </Box>
                        
                        {paso.envio && (
                          <Card variant="outlined" sx={{ mt: 2 }}>
                            <CardContent>
                              <Typography variant="subtitle2" gutterBottom>
                                <SendIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                                Información de envío
                              </Typography>
                              <Typography variant="body2">
                                <strong>Número de salida:</strong> {paso.envio.numero_salida}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Fecha de envío:</strong> {format(new Date(paso.envio.fecha_envio), 'dd/MM/yyyy', { locale: es })}
                              </Typography>
                              {paso.envio.notas_adicionales && (
                                <Typography variant="body2">
                                  <strong>Notas:</strong> {paso.envio.notas_adicionales}
                                </Typography>
                              )}
                              <Button
                                variant="text"
                                size="small"
                                startIcon={<DownloadIcon />}
                                href={paso.envio.documentacion}
                                target="_blank"
                                sx={{ mt: 1 }}
                              >
                                Descargar documentación
                              </Button>
                            </CardContent>
                          </Card>
                        )}
                      </Box>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Resumen del Trabajo
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <BusinessIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Procedimiento" 
                  secondary={trabajo.procedimiento_detalle.nombre} 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Responsable" 
                  secondary={trabajo.usuario_creador_nombre} 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CalendarTodayIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Fecha de inicio" 
                  secondary={format(new Date(trabajo.fecha_inicio), 'dd/MM/yyyy', { locale: es })} 
                />
              </ListItem>
              {trabajo.fecha_fin && (
                <ListItem>
                  <ListItemIcon>
                    <CalendarTodayIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Fecha de finalización" 
                    secondary={format(new Date(trabajo.fecha_fin), 'dd/MM/yyyy', { locale: es })} 
                  />
                </ListItem>
              )}
              <ListItem>
                <ListItemIcon>
                  <PendingIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Paso actual" 
                  secondary={`${obtenerNumeroPasoActual()} de ${pasos.length}`} 
                />
              </ListItem>
            </List>
            
            {trabajo.estado === 'COMPLETADO' && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Este trabajo ha sido completado correctamente el {format(new Date(trabajo.fecha_fin), 'dd/MM/yyyy', { locale: es })}.
              </Alert>
            )}
            
            {trabajo.estado === 'CANCELADO' && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Este trabajo ha sido cancelado el {format(new Date(trabajo.fecha_fin), 'dd/MM/yyyy', { locale: es })}.
              </Alert>
            )}
          </Paper>
          
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Información del trabajo
            </Typography>
            
            <List dense>
              {/* Mostrar usuario creador */}
              <ListItem>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Creado por" 
                  secondary={trabajo.usuario_creador_nombre || "No especificado"} 
                />
              </ListItem>

              {/* Mostrar usuario que inició el trabajo (si existe) */}
              {trabajo.usuario_iniciado_nombre && (
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Iniciado por" 
                    secondary={trabajo.usuario_iniciado_nombre} 
                  />
                </ListItem>
              )}
              
              {/* Fechas y otros detalles */}
              <ListItem>
                <ListItemIcon>
                  <CalendarTodayIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Fecha de creación" 
                  secondary={format(new Date(trabajo.fecha_inicio), 'dd/MM/yyyy', { locale: es })} 
                />
              </ListItem>
              
              {/* Resto de la información... */}
            </List>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Estadísticas del Trabajo
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Pasos completados:</strong> {pasos.filter(p => p.estado === 'COMPLETADO').length} de {pasos.length}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={progreso} 
                color={trabajo.estado === 'COMPLETADO' ? 'success' : 'primary'}
                sx={{ mt: 1, mb: 2 }}
              />
            </Box>
            
            {trabajo.procedimiento_detalle.tiempo_maximo && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Tiempo estimado total:</strong> {trabajo.procedimiento_detalle.tiempo_maximo} días
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Tiempo transcurrido:</strong> {trabajo.tiempo_transcurrido_dias} días
                  {trabajo.tiempo_transcurrido_dias > trabajo.procedimiento_detalle.tiempo_maximo && (
                    <span style={{ color: 'red' }}> (Excedido)</span>
                  )}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min((trabajo.tiempo_transcurrido_dias / trabajo.procedimiento_detalle.tiempo_maximo) * 100, 100)} 
                  color={trabajo.tiempo_transcurrido_dias > trabajo.procedimiento_detalle.tiempo_maximo ? 'error' : 'primary'}
                  sx={{ mt: 1 }}
                />
              </Box>
            )}
            
            {trabajo.estado !== 'COMPLETADO' && trabajo.estado !== 'CANCELADO' && (
              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<PlayArrowIcon />}
                onClick={handleExecute}
                sx={{ mt: 2 }}
              >
                Continuar Trabajo
              </Button>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
      >
        <DialogTitle>
          {confirmDialog.action === 'pausar' ? 'Pausar trabajo' : 
           confirmDialog.action === 'reanudar' ? 'Reanudar trabajo' : 
           'Cancelar trabajo'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.action === 'pausar' ? 
              '¿Está seguro de que desea pausar este trabajo? Podrá reanudarlo más tarde.' : 
             confirmDialog.action === 'reanudar' ? 
              '¿Está seguro de que desea reanudar este trabajo?' : 
              '¿Está seguro de que desea cancelar este trabajo? Esta acción no se puede deshacer.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
            Cancelar
          </Button>
          <Button 
            onClick={executeAction} 
            color={confirmDialog.action === 'cancelar' ? 'error' : 'primary'}
            variant="contained"
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TrabajoDetail;