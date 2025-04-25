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
  CircularProgress,
  Collapse
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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import VideocamIcon from '@mui/icons-material/Videocam';
import LaunchIcon from '@mui/icons-material/Launch';
import DescriptionIcon from '@mui/icons-material/Description';
import VisibilityIcon from '@mui/icons-material/Visibility';
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
  // Nuevo estado para controlar qué pasos están expandidos
  const [expandedSteps, setExpandedSteps] = useState({});
  
  useEffect(() => {
    const loadTrabajo = async () => {
      setLoading(true);
      try {
        const response = await trabajosService.getTrabajoById(id);
        console.log("Datos del trabajo recibidos:", response.data);

        // Manejar los documentos generales
        if (response.data && response.data.documentos && Array.isArray(response.data.documentos)) {
          // Filtrar solo los documentos generales
          const documentosGeneralesFiltrados = response.data.documentos
            .filter(doc => {
              if (!doc) return false;
              
              // Verificar si es documento general (carpeta general o sin paso asociado)
              const esCarpetaGeneral = doc.archivo_url && 
                                    (doc.archivo_url.includes('/general/') || 
                                      !doc.archivo_url.includes('/pasos/'));
              
              return esCarpetaGeneral;
            });
          
          console.log("Documentos generales filtrados:", documentosGeneralesFiltrados.length, documentosGeneralesFiltrados);
          
          // Asignar los documentos generales al procedimiento
          if (response.data.procedimiento_detalle) {
            const trabajo_con_docs = {
              ...response.data,
              procedimiento_detalle: {
                ...response.data.procedimiento_detalle,
                documentos: documentosGeneralesFiltrados || []
              }
            };
            setTrabajo(trabajo_con_docs);
          } else {
            setTrabajo(response.data);
          }
        } else {
          // Si no hay documentos en la respuesta, asignamos el trabajo tal cual
          setTrabajo(response.data);
        }
        
        // Manejar los pasos y sus documentos
        if (response.data.pasos) {
          const pasosEnriquecidos = await Promise.all(
            [...response.data.pasos].sort((a, b) => a.paso_numero - b.paso_numero)
            .map(async (paso) => {
              // Primero, asignamos los detalles básicos del paso desde el procedimiento
              let pasoEnriquecido = { ...paso };
              
              // Buscar el detalle del paso en el procedimiento
              const pasoProcedimiento = response.data.procedimiento_detalle?.pasos?.find(
                p => p.numero === paso.paso_numero
              );
              
              if (pasoProcedimiento) {
                pasoEnriquecido.paso_detalle = {
                  ...pasoProcedimiento,
                  ...paso.paso_detalle
                };
              }
              
              // Si el paso está completado, obtener detalles adicionales (incluidos documentos)
              if (paso.estado === 'COMPLETADO' || paso.estado === 'EN_PROGRESO') {
                try {
                  const pasoDetailResponse = await trabajosService.getPasoTrabajoById(paso.id);
                  if (pasoDetailResponse.data) {
                    // Integrar detalles del paso completado
                    pasoEnriquecido = {
                      ...pasoEnriquecido,
                      ...pasoDetailResponse.data,
                      paso_detalle: {
                        ...pasoEnriquecido.paso_detalle,
                        ...pasoDetailResponse.data.paso_detalle,
                        // Asegurar que mantenemos los documentos del paso
                        documentos: pasoEnriquecido.paso_detalle?.documentos || []
                      }
                    };
                  }
                } catch (err) {
                  console.error(`Error al obtener detalles del paso ${paso.id}:`, err);
                }
              }
              
              // Asegurarse de que hay una estructura correcta para los documentos
              if (pasoEnriquecido.paso_detalle && !pasoEnriquecido.paso_detalle.documentos) {
                pasoEnriquecido.paso_detalle.documentos = [];
              }
              
              console.log(`Paso ${paso.paso_numero} enriquecido:`, pasoEnriquecido);
              return pasoEnriquecido;
            })
          );
          
          console.log("Todos los pasos enriquecidos:", pasosEnriquecidos);
          setPasos(pasosEnriquecidos);
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
  
  // Función para manejar la expansión de pasos
  const handleStepToggle = (pasoId) => {
    setExpandedSteps(prev => ({
      ...prev,
      [pasoId]: !prev[pasoId]
    }));
  };
  
  // Resto del código sin cambios...
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

  const getDocumentoIcon = (doc) => {
    if (!doc || !doc.extension) return <InsertDriveFileIcon color="action" />;
    
    const ext = doc.extension.toLowerCase();
    
    if (ext === 'pdf') return <PictureAsPdfIcon color="error" />;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return <ImageIcon color="primary" />;
    if (['doc', 'docx'].includes(ext)) return <InsertDriveFileIcon color="info" />;
    if (['xls', 'xlsx'].includes(ext)) return <InsertDriveFileIcon color="success" />;
    if (['ppt', 'pptx'].includes(ext)) return <InsertDriveFileIcon color="warning" />;
    if (['zip', 'rar', '7z'].includes(ext)) return <FolderZipIcon color="action" />;
    if (['mp4', 'avi', 'mov'].includes(ext)) return <VideocamIcon color="secondary" />;
    
    return <InsertDriveFileIcon color="action" />;
  };
  
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
  
  // Función para renderizar documentos generales del procedimiento
  const renderDocumentosGenerales = () => {
    if (!trabajo?.procedimiento_detalle?.documentos || 
        trabajo.procedimiento_detalle.documentos.length === 0) {
      return null;
    }
    
    return (
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
          Documentación General del Procedimiento
        </Typography>
        
        <List dense disablePadding>
          {trabajo.procedimiento_detalle.documentos.map(doc => (
            <ListItem 
              key={doc.id} 
              sx={{ 
                bgcolor: 'background.paper',
                borderRadius: 1,
                mb: 0.5,
                border: '1px solid #eee',
                py: 1,
                px: 1.5,
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' }
              }}
              dense
            >
              <ListItemIcon sx={{ minWidth: '30px' }}>
                {getDocumentoIcon(doc)}
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {doc.nombre || "Documento sin nombre"}
                    </Typography>
                    {doc.extension && (
                      <Chip 
                        label={doc.extension.toUpperCase()} 
                        size="small" 
                        variant="outlined"
                        sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                }
                secondary={doc.descripcion && (
                  <Typography variant="caption" color="text.secondary">
                    {doc.descripcion}
                  </Typography>
                )}
              />
              <Box sx={{ display: 'flex' }}>
                {doc.archivo_url && (
                  <>
                    <Tooltip title="Visualizar">
                      <IconButton
                        size="small"
                        component="a"
                        href={doc.archivo_url}
                        target="_blank"
                        sx={{ mr: 0.5 }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Descargar">
                      <IconButton
                        size="small"
                        component="a"
                        href={doc.archivo_url}
                        download
                        sx={{ mr: 0.5 }}
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
                {doc.url && (
                  <Tooltip title="Abrir enlace externo">
                    <IconButton
                      size="small"
                      component="a"
                      href={doc.url}
                      target="_blank"
                    >
                      <LaunchIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </ListItem>
          ))}
        </List>
      </Paper>
    );
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
      {/* Botones de acción en la parte superior */}
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
      
      {/* Información general del trabajo en la parte superior */}
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
      
      {/* Nueva organización: Grid de dos columnas con pasos a la izquierda y estadísticas/documentos a la derecha */}
      <Grid container spacing={3}>
        {/* Columna izquierda: Pasos del trabajo */}
        <Grid item xs={12} md={8}>
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
                {pasos.map((paso) => {
                  // Determinar si este paso debe estar expandido
                  const isExpanded = !!expandedSteps[paso.id];
                  
                  return (
                    <Step key={paso.id} completed={paso.estado === 'COMPLETADO'}>
                      <StepLabel
                        StepIconComponent={() => getEstadoPasoIcon(paso)}
                        onClick={() => handleStepToggle(paso.id)}
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { 
                            bgcolor: 'rgba(25, 118, 210, 0.04)', 
                            borderRadius: '4px' 
                          }
                        }}
                      >
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          width: '100%',
                          flexWrap: 'wrap'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                            <Typography variant="subtitle1">
                              {paso.paso_numero}. {paso.paso_titulo}
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
                                label={paso.envio ? "Envío completado" : "Requiere envío"}
                                size="small"
                                color={paso.envio ? "success" : "secondary"}
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
                          
                          {/* Icono de expansión */}
                          <IconButton 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStepToggle(paso.id);
                            }}
                          >
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Box>
                      </StepLabel>
                      
                      {/* Contenido del paso - controlado por Collapse */}
                      <Collapse in={isExpanded}>
                        {/* Contenido del paso... */}
                      </Collapse>
                    </Step>
                  );
                })}
              </Stepper>
            )}
          </Paper>
        </Grid>
        
        {/* Columna derecha: Estadísticas y documentación general */}
        <Grid item xs={12} md={4}>
          {/* Estadísticas del trabajo */}
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
          
          {/* Documentación general del procedimiento */}
          {renderDocumentosGenerales()}
        </Grid>
      </Grid>
      
      {/* Diálogos y notificaciones */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
      >
        {/* Contenido del diálogo... */}
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