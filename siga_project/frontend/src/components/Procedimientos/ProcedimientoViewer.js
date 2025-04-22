import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  IconButton,
  Grid,
  Tabs,
  Tab
} from '@mui/material';

// Importar Timeline desde @mui/lab en lugar de @mui/material
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';

// Importaciones de iconos
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DescriptionIcon from '@mui/icons-material/Description';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import FileIcon from '@mui/icons-material/InsertDriveFile';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import procedimientosService from '../../assets/services/procedimientos.service';
import DocumentPreview from '../common/DocumentPreview';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ProcedimientoViewer = () => {
  const { procedimientoId } = useParams();
  const navigate = useNavigate();
  
  const [procedimiento, setProcedimiento] = useState(null);
  const [pasos, setPasos] = useState([]);
  const [documentosGenerales, setDocumentosGenerales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState({ url: '', name: '' });
  const [viewMode, setViewMode] = useState(0); // 0 = stepper, 1 = timeline
  
  useEffect(() => {
    const fetchProcedimiento = async () => {
      try {
        // Obtener detalles del procedimiento
        const procResponse = await procedimientosService.getProcedimiento(procedimientoId);
        setProcedimiento(procResponse.data);
        
        // Obtener pasos del procedimiento - desactivar paginación explícitamente
        const pasosResponse = await procedimientosService.getPasos(procedimientoId, { 
          pagination: false,  
          page_size: 1000     
        });
        
        // Verificar la estructura de la respuesta y procesar adecuadamente
        let pasosData = [];
        if (Array.isArray(pasosResponse.data)) {
          pasosData = pasosResponse.data;
        } else if (pasosResponse.data.results && Array.isArray(pasosResponse.data.results)) {
          pasosData = pasosResponse.data.results;
        }
        
        // Filtrar y ordenar pasos por número
        const pasosOrdenados = pasosData
          .filter(paso => parseInt(paso.procedimiento) === parseInt(procedimientoId))
          .sort((a, b) => a.numero - b.numero);
        
        console.log('Pasos ordenados:', pasosOrdenados.length, pasosOrdenados);
        
        // Para cada paso, obtener sus documentos específicos
        const pasosConDocumentos = await Promise.all(
          pasosOrdenados.map(async (paso) => {
            try {
              const docsResponse = await procedimientosService.getDocumentosPorPaso(paso.id);
              const documentos = docsResponse.data.results || docsResponse.data || [];
              return { ...paso, documentos };
            } catch (err) {
              console.error(`Error al obtener documentos del paso ${paso.id}:`, err);
              return { ...paso, documentos: [] };
            }
          })
        );
        
        setPasos(pasosConDocumentos);
        
        // Obtener documentos generales del procedimiento - Solicitar explícitamente solo documentos generales
        try {
          // Si puedes modificar la API, usa el enfoque 1
          const docsGeneralesResponse = await procedimientosService.getDocumentosGenerales(procedimientoId);
          
          // Filtrar solo los documentos en la carpeta general
          const documentosGeneralesFiltrados = (docsGeneralesResponse.data.results || docsGeneralesResponse.data || [])
            .filter(doc => {
              // Verificar que el documento no tenga paso asociado
              const noPaso = !doc.paso;
              
              // Verificar que esté en la carpeta general mediante la URL
              const esCarpetaGeneral = doc.archivo_url && 
                                      doc.archivo_url.includes(`/media/procedimientos/${procedimientoId}/general/`);
              
              // También considera los documentos marcados explícitamente como generales
              const marcadoGeneral = doc.es_general === true;
              
              return noPaso && (esCarpetaGeneral || marcadoGeneral);
            });
          
          console.log("Documentos generales filtrados:", documentosGeneralesFiltrados.length);
          setDocumentosGenerales(documentosGeneralesFiltrados);
        } catch (err) {
          console.error('Error al obtener documentos generales:', err);
          setDocumentosGenerales([]);
        }
        
      } catch (err) {
        console.error('Error al cargar el procedimiento:', err);
        setError('No se pudo cargar el procedimiento. Por favor, inténtelo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProcedimiento();
  }, [procedimientoId]);
  
  const getEstadoChip = (estado) => {
    switch (estado) {
      case 'BORRADOR':
        return <Chip label="Borrador" color="warning" size="small" />;
      case 'VIGENTE':
        return <Chip label="Vigente" color="success" size="small" />;
      case 'OBSOLETO':
        return <Chip label="Obsoleto" color="error" size="small" />;
      default:
        return <Chip label={estado} size="small" />;
    }
  };

  const handlePreviewDocument = (url, name) => {
    setPreviewDocument({ url, name });
    setPreviewOpen(true);
  };
  
  const getDocumentoIcon = (extension) => {
    if (!extension) return <FileIcon />;
    extension = extension.toLowerCase();
    
    if (extension === 'pdf') return <PdfIcon color="error" />;
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) return <ImageIcon color="primary" />;
    return <FileIcon />;
  };

  // Función para encontrar el paso siguiente en la secuencia normal
  const getSiguientePaso = (pasoActual) => {
    if (!pasoActual) return null;
    const siguienteNumero = pasoActual.numero + 1;
    return pasos.find(p => p.numero === siguienteNumero);
  };

  // Añadir una función para manejar el clic en una bifurcación
  const handleBifurcacionClick = (pasoDestinoId) => {
    // Buscar el índice del paso de destino en el array de pasos
    const pasoIndex = pasos.findIndex(p => p.id === pasoDestinoId);
    if (pasoIndex !== -1) {
      setViewMode(0); // Cambiar a vista detallada
      setActiveStep(pasoIndex); // Establecer el paso activo
    }
  };

  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box mt={3}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard/procedimientos')}
          sx={{ mt: 2 }}
        >
          Volver al listado
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center">
            <IconButton 
              color="primary" 
              onClick={() => navigate('/dashboard/procedimientos')}
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" component="h1">
              Visualizar Procedimiento
            </Typography>
          </Box>
          
          {/* Botón opcional para ver la cadena completa */}
          {procedimiento && procedimiento.procedimiento_relacionado && (
            <Button
              variant="outlined"
              startIcon={<AccountTreeIcon />}
              onClick={() => navigate(`/dashboard/procedimientos/${procedimientoId}/cadena`)}
              size="small"
            >
              Ver cadena completa
            </Button>
          )}
        </Box>
        
        {procedimiento && (
          <>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {procedimiento.nombre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {procedimiento.descripcion}
                    </Typography>
                    
                    <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                      {getEstadoChip(procedimiento.estado)}
                      <Chip 
                        label={`Tipo: ${procedimiento.tipo_nombre}`} 
                        size="small" 
                        variant="outlined" 
                      />
                      <Chip 
                        label={`Nivel: ${procedimiento.nivel_display || procedimiento.nivel}`} 
                        size="small" 
                        variant="outlined" 
                      />
                      <Chip 
                        label={`Versión: ${procedimiento.version}`} 
                        size="small" 
                        variant="outlined" 
                      />
                      {procedimiento.tiempo_maximo && (
                        <Chip 
                          icon={<AccessTimeIcon />}
                          label={`${procedimiento.tiempo_maximo} días máx.`}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      )}

                      
                    </Box>
                    
                    <Typography variant="body2">
                      <strong>Actualizado:</strong> {format(new Date(procedimiento.fecha_actualizacion), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {/* Mostrar documentos generales si existen */}
            {documentosGenerales && documentosGenerales.length > 0 && (
              <Box mt={2} mb={4}>
                <Typography variant="h6" gutterBottom>
                  Documentos Generales
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper' }}>
                  <List dense>
                    {documentosGenerales.map((doc) => (
                      <ListItem key={doc.id} disablePadding sx={{ mb: 1 }}>
                        <ListItemIcon sx={{ minWidth: '30px' }}>
                          {getDocumentoIcon(doc.extension)}
                        </ListItemIcon>
                        <ListItemText 
                          primary={doc.nombre} 
                          secondary={doc.descripcion}
                        />
                        {doc.archivo_url && (
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => handlePreviewDocument(doc.archivo_url, doc.nombre)}
                          >
                            Ver
                          </Button>
                        )}
                        {doc.url && !doc.archivo_url && (
                          <Button 
                            size="small" 
                            variant="outlined"
                            component="a"
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Enlace
                          </Button>
                        )}
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Box>
            )}
            
            <Divider sx={{ my: 3 }} />
            
            {pasos.length > 0 ? (
              <Box mt={4}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                  <Tabs value={viewMode} onChange={(e, newValue) => setViewMode(newValue)}>
                    <Tab label="Vista detallada" />
                    <Tab label="Flujo de proceso" />
                  </Tabs>
                </Box>
                
                {viewMode === 0 && (
                  <Stepper activeStep={activeStep} orientation="vertical">
                    {pasos.map((paso, index) => (
                      <Step key={paso.id}>
                        <StepLabel
                          onClick={() => setActiveStep(index)}
                          sx={{ cursor: 'pointer' }}
                          StepIconProps={{
                            // Color especial para pasos con bifurcaciones
                            style: { 
                              color: paso.bifurcaciones?.length > 0 ? '#9c27b0' : undefined 
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle1">
                              {paso.titulo}
                            </Typography>
                            {paso.es_final && (
                              <Chip 
                                label="Finaliza" 
                                size="small" 
                                color="info" 
                                sx={{ ml: 1 }} 
                              />
                            )}
                          </Box>
                        </StepLabel>
                        <StepContent>
                          <Box mb={2}>
                            <Typography variant="body1" paragraph>
                              {paso.descripcion}
                            </Typography>
                            
                            {paso.responsable && (
                              <Box display="flex" alignItems="center" mb={1}>
                                <PersonIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Responsable:</strong> {paso.responsable}
                                </Typography>
                              </Box>
                            )}

                            {/* Añadir visualización de tiempo estimado */}
                            {paso.tiempo_estimado && (
                              <Box display="flex" alignItems="center" mb={1}>
                                <AccessTimeIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Tiempo estimado:</strong> {paso.tiempo_estimado} {parseFloat(paso.tiempo_estimado) === 1 ? 'día' : 'días'}
                                </Typography>
                              </Box>
                            )}
                            
                            {/* Mostrar bifurcaciones si las hay */}
                            {paso.bifurcaciones && paso.bifurcaciones.length > 0 && (
                              <Box mt={2} mb={2}>
                                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  <CallSplitIcon fontSize="small" color="secondary" sx={{ mr: 0.5 }} />
                                  Bifurcaciones:
                                </Typography>
                                
                                <Box sx={{ pl: 2 }}>
                                  {paso.bifurcaciones.map((bifurcacion, idx) => {
                                    const pasoDestino = pasos.find(p => p.id === parseInt(bifurcacion.paso_destino));
                                    return (
                                      <Paper 
                                        key={idx} 
                                        variant="outlined"
                                        sx={{ 
                                          p: 1.5, 
                                          mb: 1, 
                                          display: 'flex',
                                          alignItems: 'center',
                                          bgcolor: 'rgba(156, 39, 176, 0.05)',
                                          borderRadius: '8px',
                                          cursor: pasoDestino ? 'pointer' : 'default',
                                          '&:hover': pasoDestino ? {
                                            boxShadow: 2,
                                            bgcolor: 'rgba(156, 39, 176, 0.1)',
                                          } : {}
                                        }}
                                        onClick={() => pasoDestino && handleBifurcacionClick(pasoDestino.id)}
                                      >
                                        <Box sx={{ flex: 1 }}>
                                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                            {bifurcacion.condicion}
                                          </Typography>
                                          {bifurcacion.descripcion && (
                                            <Typography variant="caption" color="text.secondary" display="block">
                                              {bifurcacion.descripcion}
                                            </Typography>
                                          )}
                                        </Box>
                                        
                                        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                                          <ArrowForwardIcon fontSize="small" color="secondary" sx={{ mr: 0.5 }} />
                                          <Typography variant="body2">
                                            Ir al paso {pasoDestino ? pasoDestino.numero : '?'}: {pasoDestino ? pasoDestino.titulo : 'No encontrado'}
                                          </Typography>
                                        </Box>
                                      </Paper>
                                    );
                                  })}
                                </Box>
                              </Box>
                            )}

                            {/* Mostrar siguiente paso SOLO cuando no hay bifurcaciones y no es un paso final */}
                            {!paso.es_final && (!paso.bifurcaciones || paso.bifurcaciones.length === 0) && (() => {
                              const siguientePaso = getSiguientePaso(paso);
                              if (siguientePaso) {
                                return (
                                  <Box mt={2}>
                                    <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                      <ArrowForwardIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                                      Siguiente paso:
                                    </Typography>
                                    
                                    <Paper 
                                      variant="outlined"
                                      sx={{ 
                                        p: 1.5, 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        bgcolor: 'rgba(33, 150, 243, 0.05)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        '&:hover': {
                                          boxShadow: 2,
                                          bgcolor: 'rgba(33, 150, 243, 0.1)'
                                        }
                                      }}
                                      onClick={() => handleBifurcacionClick(siguientePaso.id)}
                                    >
                                      <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        width: '28px', 
                                        height: '28px', 
                                        borderRadius: '50%', 
                                        bgcolor: 'rgba(33, 150, 243, 0.1)',
                                        color: 'primary.main',
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem',
                                        mr: 2
                                      }}>
                                        {siguientePaso.numero}
                                      </Box>
                                      
                                      <Typography variant="body2">
                                        {siguientePaso.titulo}
                                      </Typography>
                                    </Paper>
                                  </Box>
                                );
                              }
                              return null;
                            })()}

                            {/* Mostrar documentos asociados al paso */}
                            {paso.documentos && paso.documentos.length > 0 && (
                              <Box mt={3}>
                                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                  <DescriptionIcon fontSize="small" sx={{ mr: 0.5 }} color="info" />
                                  Documentos asociados:
                                </Typography>
                                <List dense>
                                  {paso.documentos.map((docPaso) => {
                                    // Asegurarnos de tener la estructura correcta del documento
                                    const doc = docPaso.documento_detalle || docPaso;
                                    return (
                                      <ListItem key={docPaso.id || doc.id} disablePadding sx={{ mb: 0.5 }}>
                                        <ListItemIcon sx={{ minWidth: '30px' }}>
                                          {getDocumentoIcon(doc.extension)}
                                        </ListItemIcon>
                                        <ListItemText 
                                          primary={doc.nombre} 
                                          secondary={doc.descripcion}
                                        />
                                        {doc.archivo_url && (
                                          <Button 
                                            size="small" 
                                            variant="outlined"
                                            onClick={() => handlePreviewDocument(doc.archivo_url, doc.nombre)}
                                          >
                                            Ver
                                          </Button>
                                        )}
                                        {doc.url && !doc.archivo_url && (
                                          <Button 
                                            size="small" 
                                            variant="outlined"
                                            component="a"
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            Enlace
                                          </Button>
                                        )}
                                      </ListItem>
                                    );
                                  })}
                                </List>
                              </Box>
                            )}
                          </Box>
                        </StepContent>
                      </Step>
                    ))}
                  </Stepper>
                )}
                
                {viewMode === 1 && (
                  <Timeline position="alternate">
                    {pasos.map((paso, index) => (
                      <TimelineItem key={paso.id}>
                        <TimelineOppositeContent color="text.secondary">
                          Paso {paso.numero}
                        </TimelineOppositeContent>
                        <TimelineSeparator>
                          <TimelineDot color={paso.bifurcaciones?.length ? "secondary" : "primary"} />
                          {index < pasos.length - 1 && <TimelineConnector />}
                        </TimelineSeparator>
                        <TimelineContent>
                          <Paper 
                            elevation={3} 
                            sx={{ 
                              p: 2, 
                              bgcolor: paso.bifurcaciones?.length ? 'rgba(156, 39, 176, 0.05)' : 'white',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              setViewMode(0); // Cambiar a vista detallada
                              setActiveStep(index); // Activar este paso
                            }}
                          >
                            <Typography variant="h6" component="span">
                              {paso.titulo}
                            </Typography>
                            
                            {paso.responsable && (
                              <Typography variant="body2" color="text.secondary">
                                Responsable: {paso.responsable}
                              </Typography>
                            )}

                            {/* Añadir tiempo estimado en la vista timeline */}
                            {paso.tiempo_estimado && (
                              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
                                {paso.tiempo_estimado} {parseFloat(paso.tiempo_estimado) === 1 ? 'día' : 'días'}
                              </Typography>
                            )}
                            
                            {paso.bifurcaciones && paso.bifurcaciones.length > 0 && (
                              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
                                <Typography variant="body2" color="textSecondary">
                                  <CallSplitIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                  Este paso tiene {paso.bifurcaciones.length} {paso.bifurcaciones.length === 1 ? 'bifurcación' : 'bifurcaciones'}
                                </Typography>
                              </Box>
                            )}
                            
                            {paso.es_final && (
                              <Chip 
                                label="Finaliza el procedimiento" 
                                size="small" 
                                color="info"
                                sx={{ mt: 1 }} 
                              />
                            )}
                            
                            {paso.documentos && paso.documentos.length > 0 && (
                              <Box sx={{ mt: 1.5 }}>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  <DescriptionIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                  {paso.documentos.length} documento{paso.documentos.length !== 1 ? 's' : ''}
                                </Typography>
                              </Box>
                            )}
                          </Paper>
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
                )}
              </Box>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                Este procedimiento no tiene pasos definidos.
              </Alert>
            )}
          </>
        )}
      </Paper>
      
      <DocumentPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        documentUrl={previewDocument.url}
        documentName={previewDocument.name}
      />
    </Box>
  );
};

export default ProcedimientoViewer;