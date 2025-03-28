import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Grid,
  Chip,
  Divider,
  ListItem,
  CircularProgress,
  Tabs,
  Tab,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Collapse,
  Container,
  DialogContentText,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  DragIndicator as DragIndicatorIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  AccessTime as AccessTimeIcon,
  Description as DescriptionIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  Launch as LaunchIcon,
  Link as LinkIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  Audiotrack as AudioIcon,
  InsertDriveFile as FileIcon,
  ExpandLess as ExpandLessIcon,
  Description as DocumentIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { AuthContext } from '../../contexts/AuthContext';
import procedimientosService from '../../assets/services/procedimientos.service';
import ConfirmDialog from '../common/ConfirmDialog';
import PasoDocumentosManager from './PasoDocumentosManager';
import { CSS } from '@dnd-kit/utilities';
import axios from 'axios';

// Asegúrate de instalar estas dependencias
// npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @dnd-kit/modifiers
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

// Añadir la importación del nuevo componente
import BifurcacionesManager from './BifurcacionesManager';

// Añadir estas líneas en las importaciones al inicio del archivo
import DocumentPreview from '../common/DocumentPreview';

// Componente SortableItem para elementos arrastrables con @dnd-kit
const SortableItem = ({ children, id }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    zIndex: isDragging ? 1000 : 1
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

// En PasoItem, optimizamos el diseño visual y la experiencia de usuario
const PasoItem = ({ 
  paso, 
  onEdit, 
  onDelete, 
  onViewDocuments, 
  isAdminOrSuperAdmin, 
  pasos,
  expanded,
  onToggle
}) => {
  // Estados para la visualización de documentos
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState({ url: '', name: '' });
  
  // Determinar características del paso para estilización
  const tieneBifurcaciones = paso.bifurcaciones && paso.bifurcaciones.length > 0;
  const tieneDocumentos = paso.documentos && paso.documentos.length > 0;

  // Función para manejar la previsualización de documentos
  const handlePreviewDocument = (documento) => {
    setPreviewDocument({
      url: documento.archivo_url,
      name: documento.nombre
    });
    setPreviewOpen(true);
  };

  // Función para descargar documentos directamente
  const handleDirectDownload = (e, url) => {
    e.stopPropagation();
    window.open(url, '_blank');
  };

  // Función para renderizar el icono según el tipo de documento
  const getDocumentoIcon = (documento) => {
    if (!documento || !documento.extension) return <DocumentIcon fontSize="small" />;
    
    const extension = documento.extension?.toLowerCase();
    
    if (extension === 'pdf') return <PdfIcon fontSize="small" color="error" />;
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) return <ImageIcon fontSize="small" color="success" />;
    if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) return <VideoIcon fontSize="small" color="secondary" />;
    if (['mp3', 'wav', 'ogg'].includes(extension)) return <AudioIcon fontSize="small" color="info" />;
    
    return <FileIcon fontSize="small" color="action" />;
  };

  return (
    <Paper 
      id={`paso-${paso.id}`}
      elevation={expanded ? 3 : 1} 
      sx={{
        mb: 2.5,
        borderRadius: '8px',
        overflow: 'hidden',
        border: `1px solid ${expanded ? (tieneBifurcaciones ? '#9c27b0' : '#2196f3') : '#e0e0e0'}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          borderColor: tieneBifurcaciones ? '#9c27b0' : '#2196f3'
        }
      }}
    >
      <Box
        onClick={onToggle}
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          bgcolor: expanded ? (tieneBifurcaciones ? 'rgba(156, 39, 176, 0.08)' : 'rgba(33, 150, 243, 0.08)') : 'white',
          transition: 'background-color 0.3s ease',
          borderBottom: expanded ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '36px', 
            height: '36px', 
            borderRadius: '50%', 
            bgcolor: tieneBifurcaciones ? 'rgba(156, 39, 176, 0.1)' : 'rgba(33, 150, 243, 0.1)', 
            marginRight: '16px',
            color: tieneBifurcaciones ? 'secondary.main' : 'primary.main',
            fontWeight: 'bold',
            fontSize: '1rem'
          }}>
            {paso.numero}
          </Box>
          
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 0.5 }}>
              {paso.titulo}
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {paso.tiempo_estimado && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccessTimeIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    {paso.tiempo_estimado}
                  </Typography>
                </Box>
              )}
              
              {paso.responsable && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    {paso.responsable}
                  </Typography>
                </Box>
              )}
              
              {tieneDocumentos && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DescriptionIcon fontSize="small" color="info" sx={{ mr: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    {paso.documentos.length} {paso.documentos.length === 1 ? 'documento' : 'documentos'}
                  </Typography>
                </Box>
              )}
              
              {tieneBifurcaciones && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ArrowForwardIcon fontSize="small" color="secondary" sx={{ mr: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">
                    {paso.bifurcaciones.length} {paso.bifurcaciones.length === 1 ? 'bifurcación' : 'bifurcaciones'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isAdminOrSuperAdmin && (
            <Box sx={{ display: 'flex', mr: 1 }}>
              <Tooltip title="Editar paso">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(paso);
                  }}
                  color="primary"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Eliminar paso">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(paso.id);
                  }}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Gestionar documentos">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDocuments(paso);
                  }}
                  color="info"
                >
                  <DocumentIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
          
          <IconButton size="small" onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}>
            {expanded ? (
              <ExpandLessIcon fontSize="small" />
            ) : (
              <ExpandMoreIcon fontSize="small" />
            )}
          </IconButton>
        </Box>
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ 
          p: 3, 
          bgcolor: 'rgba(250, 250, 250, 0.7)',
        }}>
          {/* Contenido de la descripción */}
          <Typography 
            variant="body1" 
            sx={{ 
              mb: 2, 
              whiteSpace: 'pre-line',
              color: 'text.primary',
              lineHeight: 1.6 
            }}
          >
            {paso.descripcion || 'Sin descripción'}
          </Typography>

          {/* Documentos asociados con estilo mejorado */}
          {tieneDocumentos && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <DescriptionIcon fontSize="small" sx={{ mr: 1 }} />
                Documentos asociados:
              </Typography>
              
              <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: '6px' }}>
                <List disablePadding>
                  {paso.documentos.map((docPaso, index) => (
                    <React.Fragment key={docPaso.id}>
                      {index > 0 && <Divider />}
                      <ListItem sx={{
                        py: 1.5,
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' }
                      }}>
                        <ListItemIcon>
                          {getDocumentoIcon(docPaso.documento_detalle)}
                        </ListItemIcon>
                        
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {docPaso.documento_detalle.nombre}
                              </Typography>
                              {docPaso.documento_detalle.extension && (
                                <Chip 
                                  label={docPaso.documento_detalle.extension.toUpperCase()} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                          }
                          secondary={docPaso.notas && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              {docPaso.notas}
                            </Typography>
                          )}
                        />
                        
                        <Box sx={{ display: 'flex' }}>
                          {docPaso.documento_detalle.archivo_url && (
                            <>
                              <Tooltip title="Visualizar">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePreviewDocument(docPaso.documento_detalle);
                                  }}
                                  sx={{ mr: 0.5 }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Descargar">
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleDirectDownload(e, docPaso.documento_detalle.archivo_url)}
                                  sx={{ mr: 0.5 }}
                                >
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          
                          {docPaso.documento_detalle.url && (
                            <Tooltip title="Abrir enlace externo">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(docPaso.documento_detalle.url, '_blank');
                                }}
                              >
                                <LaunchIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            </Box>
          )}

          {/* Bifurcaciones con estilo mejorado */}
          {tieneBifurcaciones && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="secondary" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <ArrowForwardIcon fontSize="small" sx={{ mr: 1 }} />
                Siguientes pasos posibles:
              </Typography>
              
              <Box>
                {paso.bifurcaciones.map((bifurcacion, index) => {
                  const pasoDestino = pasos.find(p => p.id === parseInt(bifurcacion.paso_destino));
                  return (
                    <Paper 
                      key={index}
                      variant="outlined"
                      sx={{ 
                        p: 1.5, 
                        mb: 1, 
                        display: 'flex',
                        alignItems: 'center',
                        borderLeft: '3px solid #9c27b0',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: 'rgba(156, 39, 176, 0.05)'
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (pasoDestino) {
                          document.dispatchEvent(new CustomEvent('pasoNavigation', {
                            detail: { pasoId: pasoDestino.id }
                          }));
                        }
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 'medium', flex: 1 }}>
                        {bifurcacion.condicion}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                        <ArrowForwardIcon fontSize="small" color="secondary" sx={{ mr: 1 }} />
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

          {/* Botón para gestionar documentos */}
          {isAdminOrSuperAdmin && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<DocumentIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDocuments(paso);
                }}
                sx={{ textTransform: 'none' }}
              >
                Gestionar documentos
              </Button>
            </Box>
          )}
        </Box>
      </Collapse>
      
      <DocumentPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        documentUrl={previewDocument.url}
        documentName={previewDocument.name}
      />
    </Paper>
  );
};

const PasosManager = () => {
  const { procedimientoId } = useParams(); // Obtener ID de la URL
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const isAdminOrSuperAdmin = ['Admin', 'SuperAdmin'].includes(currentUser?.tipo_usuario);
  
  const [procedimiento, setProcedimiento] = useState(null);
  const [pasos, setPasos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pasoActual, setPasoActual] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tiempo_estimado: '',
    responsable: '',
    bifurcaciones: [] // Nueva propiedad para manejar bifurcaciones
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    onConfirm: null
  });

  // Añadir estado para errores de validación
  const [formErrors, setFormErrors] = useState({
    titulo: false,
    descripcion: false
  });

  // Añadir este estado al componente PasosManager

  // Estado para gestión de documentos en modal
  const [documentosDialogOpen, setDocumentosDialogOpen] = useState(false);
  const [pasoSeleccionado, setPasoSeleccionado] = useState(null);

  // Configurar keyboard cooridnates getter para DnD
  const keyboardCoordinatesGetter = (event, { context }) => {
    const { active, droppableContainers } = context;
    if (!active || !droppableContainers.length) return;

    const activeId = active.id;
    const activeIndex = pasos.findIndex(p => p.id.toString() === activeId);
    
    if (activeIndex < 0) return;
    
    const activeNode = document.querySelector(`[data-id="${activeId}"]`);
    if (!activeNode) return;
    
    const rect = activeNode.getBoundingClientRect();
    
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  };

  // Configurar sensors para DnD
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: keyboardCoordinatesGetter
    })
  );

  // Efecto para cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!procedimientoId) {
          console.log("ID de procedimiento no definido");
          return;
        }
        
        const [procedimientoRes, allPasos] = await Promise.all([
          procedimientosService.getProcedimiento(procedimientoId),
          fetchAllPasos(procedimientoId)
        ]);

        setProcedimiento(procedimientoRes.data);
        
        // Filtrar los pasos para asegurarnos que son de este procedimiento
        const pasosFiltrados = allPasos.filter(paso => 
          parseInt(paso.procedimiento) === parseInt(procedimientoId)
        );
        
        console.log(`Total de pasos encontrados: ${pasosFiltrados.length}`);
        setPasos(pasosFiltrados.sort((a, b) => a.numero - b.numero));
        
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setSnackbar({
          open: true,
          message: 'Error al cargar los datos del procedimiento',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [procedimientoId]);

  // Manejar el cambio de orden mediante drag and drop
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }
    
    // Encontrar los índices originales
    const oldIndex = pasos.findIndex(paso => paso.id.toString() === active.id);
    const newIndex = pasos.findIndex(paso => paso.id.toString() === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    // Crear una copia del array para manipular
    const newPasos = [...pasos];
    
    // Remover el elemento arrastrado
    const [movedItem] = newPasos.splice(oldIndex, 1);
    
    // Insertar en la nueva posición
    newPasos.splice(newIndex, 0, movedItem);
    
    // Actualizar el estado en la UI primero (optimistic update)
    const reorderedPasos = newPasos.map((paso, idx) => ({
      ...paso,
      numero: idx + 1
    }));
    setPasos(reorderedPasos);
    
    try {
      // NUEVA SOLUCIÓN: Usar números temporales muy altos en lugar de negativos
      
      // Obtener el número más alto actual para evitar conflictos
      const maxNumero = Math.max(...pasos.map(p => p.numero || 0)) + 1000;
      
      // 1. Primera pasada: Asignar números temporales muy altos (que no existan en la BD)
      for (let i = 0; i < reorderedPasos.length; i++) {
        const paso = reorderedPasos[i];
        await procedimientosService.updatePaso(paso.id, {
          titulo: paso.titulo,
          descripcion: paso.descripcion,
          procedimiento: paso.procedimiento,
          numero: maxNumero + i  // Usar un número muy alto temporal único
        });
      }
      
      // 2. Segunda pasada: Asignar los números finales deseados
      for (let i = 0; i < reorderedPasos.length; i++) {
        const paso = reorderedPasos[i];
        await procedimientosService.updatePaso(paso.id, {
          titulo: paso.titulo,
          descripcion: paso.descripcion,
          procedimiento: paso.procedimiento,
          numero: i + 1  // Números finales secuenciales
        });
      }
      
      setSnackbar({
        open: true,
        message: 'Orden de pasos actualizado correctamente',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error al actualizar el orden:', error);
      
      // Mostrar mensaje de error más detallado
      let errorMessage = 'Error al actualizar el orden de los pasos';
      if (error.response && error.response.data) {
        // Extraer los detalles del error
        const errorData = error.response.data;
        const errorDetails = [];
        
        for (const field in errorData) {
          if (Array.isArray(errorData[field])) {
            errorDetails.push(`${field.charAt(0).toUpperCase() + field.slice(1)}: ${errorData[field].join(', ')}`);
          } else if (typeof errorData[field] === 'string') {
            errorDetails.push(`${field}: ${errorData[field]}`);
          }
        }
        
        if (errorDetails.length > 0) {
          errorMessage += ': ' + errorDetails.join('; ');
        } else if (error.response.data.detail) {
          errorMessage += ': ' + error.response.data.detail;
        } else if (error.response.data.non_field_errors) {
          errorMessage += ': ' + error.response.data.non_field_errors.join(', ')}
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
      
      // Recargar los datos originales en caso de error
      try {
        const pasosRes = await procedimientosService.getPasos(procedimientoId);
        const pasosData = Array.isArray(pasosRes.data) 
          ? pasosRes.data 
          : (pasosRes.data.results || []);
        
        const pasosFiltrados = pasosData.filter(paso => 
          parseInt(paso.procedimiento) === parseInt(procedimientoId)
        );
        
        setPasos(pasosFiltrados.sort((a, b) => a.numero - b.numero));
      } catch (reloadError) {
        console.error("Error al recargar los pasos después del error:", reloadError);
      }
    }
  };

  // Navegación de regreso a la lista de procedimientos
  const handleBackToProcedimientos = () => {
    navigate('/dashboard/procedimientos');
  };

  // Modificar la función handleOpenPasoForm para incluir bifurcaciones
const handleOpenPasoForm = (paso = null) => {
  setPasoActual(paso);
  
  if (paso) {
    setFormData({
      titulo: paso.titulo,
      descripcion: paso.descripcion,
      tiempo_estimado: paso.tiempo_estimado || '',
      responsable: paso.responsable || '',
      bifurcaciones: paso.bifurcaciones || [] // Cargar bifurcaciones existentes
    });
  } else {
    setFormData({
      titulo: '',
      descripcion: '',
      tiempo_estimado: '',
      responsable: '',
      bifurcaciones: []
    });
  }
  
  setDialogOpen(true);
};

  // Modificar la función handleClosePasoForm para limpiar errores

const handleClosePasoForm = () => {
  setDialogOpen(false);
  setPasoActual(null);
  // Limpiar errores al cerrar el formulario
  setFormErrors({
    titulo: false,
    descripcion: false
  });
};

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Actualizar errores si el campo está siendo corregido
    if (formErrors[name] && value.trim()) {
      setFormErrors(prev => ({
        ...prev,
        [name]: false
      }));
    }
  };

  // Reemplazar la función handleSubmitPaso por esta versión mejorada

const handleSubmitPaso = async () => {
  // Validar campos requeridos
  const errors = {
    titulo: !formData.titulo.trim(),
    descripcion: !formData.descripcion.trim()
  };
  
  // Actualizar estado de errores
  setFormErrors(errors);
  
  // Si hay errores, detener el envío del formulario
  if (Object.values(errors).some(error => error)) {
    setSnackbar({
      open: true,
      message: 'Por favor, completa los campos requeridos',
      severity: 'warning'
    });
    return;
  }
  
  // Validar bifurcaciones - asegurarse que los pasos destino existan
  if (formData.bifurcaciones && formData.bifurcaciones.length > 0) {
    const bifurcacionesInvalidas = formData.bifurcaciones.filter(
      b => !pasos.some(p => p.id === parseInt(b.paso_destino))
    );
    
    if (bifurcacionesInvalidas.length > 0) {
      setSnackbar({
        open: true,
        message: 'Algunas bifurcaciones tienen pasos destino inválidos',
        severity: 'warning'
      });
      return;
    }
  }
  
  try {
    if (pasoActual) {
      // Actualizar paso existente
      await procedimientosService.updatePaso(pasoActual.id, {
        ...formData,
        procedimiento: procedimientoId,
        numero: pasoActual.numero
      });
      
      setSnackbar({
        open: true,
        message: 'Paso actualizado correctamente',
        severity: 'success'
      });
    } else {
      // Crear nuevo paso
      
      // 2. Calcular el próximo número disponible de forma más robusta
      let nextNumber = 1;
      if (pasos.length > 0) {
        // Estrategia 1: Usar el máximo número existente + 1
        const maxNumeroExistente = Math.max(...pasos.map(p => parseInt(p.numero) || 0));
        nextNumber = maxNumeroExistente + 1;
        
        console.log("Máximo número existente:", maxNumeroExistente);
        console.log("Próximo número calculado (máx+1):", nextNumber);
        
        // Verificar si este número ya existe
        if (pasos.some(p => parseInt(p.numero) === nextNumber)) {
          console.warn("El número calculado ya existe, buscando el primer hueco...");
          
          // Estrategia 2: Buscar el primer hueco en la secuencia
          const numerosOrdenados = [...pasos]
            .map(p => parseInt(p.numero) || 0)
            .filter(n => !isNaN(n))
            .sort((a, b) => a - b);
          
          console.log("Números ordenados:", numerosOrdenados);
          
          // Encontrar el primer hueco
          nextNumber = 1; // Empezamos desde 1
          for (let i = 0; i < numerosOrdenados.length; i++) {
            if (numerosOrdenados[i] !== nextNumber) {
              break; // Encontramos un hueco
            }
            nextNumber++;
          }
          
          console.log("Hueco encontrado en secuencia:", nextNumber);
          
          // Verificar si este número también está ocupado
          if (pasos.some(p => parseInt(p.numero) === nextNumber)) {
            console.error("Error crítico: número encontrado también está ocupado");
            // Última opción: usar un timestamp para asegurar unicidad
            nextNumber = Date.now() % 10000;
            console.log("Usando timestamp como último recurso:", nextNumber);
          }
        }
      }
      
      console.log("Finalmente creando paso con número:", nextNumber);

      // Verificar explícitamente antes de crear
      const numeroDisponible = await verificarNumeroDisponible(procedimientoId, nextNumber);
      if (!numeroDisponible) {
        // Si no está disponible, usar un número muy alto basado en timestamp
        nextNumber = Math.floor(Date.now() / 1000) % 1000000;
        console.log("Número no disponible, usando alternativa:", nextNumber);
      }

      console.log("Intentando crear paso con número definitivo:", nextNumber);

      // Crear el paso con el número verificado
      try {
        const newPaso = await procedimientosService.createPaso({
          ...formData,
          procedimiento: procedimientoId,
          numero: nextNumber
        });
        
        setSnackbar({
          open: true,
          message: 'Paso creado correctamente',
          severity: 'success'
        });
      } catch (createError) {
        console.error("Error específico al crear paso:", createError);
        
        // Si el error persiste, intentar con un último número aleatorio
        if (createError.response?.data?.non_field_errors?.includes('Los campos procedimiento, numero deben formar un conjunto único')) {
          const ultimoIntento = Math.floor(Math.random() * 100000) + 100000;
          
          console.log("Último intento con número aleatorio:", ultimoIntento);
          
          try {
            const newPaso = await procedimientosService.createPaso({
              ...formData,
              procedimiento: procedimientoId,
              numero: ultimoIntento
            });
            
            setSnackbar({
              open: true,
              message: 'Paso creado correctamente (usando número alternativo)',
              severity: 'success'
            });
          } catch (finalError) {
            throw finalError; // Propagar el error si incluso el último intento falla
          }
        } else {
          throw createError; // Propagar otros errores
        }
      }
    }
    
    // Recargar pasos después de crear/actualizar usando fetchAllPasos para obtener TODOS
    const allPasos = await fetchAllPasos(procedimientoId);
    
    // Filtrar y ordenar los pasos del procedimiento actual
    const pasosFiltrados = allPasos
      .filter(paso => parseInt(paso.procedimiento) === parseInt(procedimientoId))
      .sort((a, b) => a.numero - b.numero);

    setPasos(pasosFiltrados);
    
    // Cerrar formulario
    handleClosePasoForm();
  } catch (error) {
    console.error('Error al guardar el paso:', error);
    
    // Extraer mensajes de error del servidor
    let errorMessage = 'Error al guardar el paso';
    
    if (error.response && error.response.data) {
      // Construir un mensaje detallado con todos los errores
      const errorDetails = [];
      
      for (const field in error.response.data) {
        if (Array.isArray(error.response.data[field])) {
          errorDetails.push(`${field.charAt(0).toUpperCase() + field.slice(1)}: ${error.response.data[field].join(', ')}`);
        }
      }
      
      if (errorDetails.length > 0) {
        errorMessage = `Error al guardar: ${errorDetails.join('; ')}`;
      }
    }
    
    setSnackbar({
      open: true,
      message: errorMessage,
      severity: 'error'
    });
  }
};

  // Reemplazar la función handleDeletePaso con esta versión mejorada

// Manejar eliminación de paso
const handleDeletePaso = (paso) => {
  // Verificar si recibimos un ID o un objeto paso completo
  const pasoId = typeof paso === 'object' ? paso.id : paso;
  const pasoAEliminar = pasos.find(p => p.id === pasoId);
  
  if (!pasoAEliminar) {
    console.error('No se encontró el paso a eliminar');
    return;
  }
  
  const numeroEliminado = pasoAEliminar.numero;
  
  setConfirmDialog({
    open: true,
    title: 'Eliminar paso',
    content: '¿Está seguro de que desea eliminar este paso?',
    onConfirm: async () => {
      try {
        // 1. Primero eliminar el paso
        await procedimientosService.deletePaso(pasoId);
        
        // 2. Recargar la lista actual de pasos (sin el eliminado)
        const response = await procedimientosService.getPasos(procedimientoId);
        
        // Procesar los datos según la estructura de respuesta
        let pasosData = [];
        if (Array.isArray(response.data)) {
          pasosData = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          pasosData = response.data.results;
        }
        
        // Filtrar solo los pasos de este procedimiento
        const pasosFiltrados = pasosData
          .filter(paso => parseInt(paso.procedimiento) === parseInt(procedimientoId))
          .sort((a, b) => a.numero - b.numero);
        
        // 3. Identificar pasos que necesitan actualización (los que tienen número mayor al eliminado)
        const pasosParaActualizar = pasosFiltrados.filter(p => p.numero > numeroEliminado);
        
        // 4. Actualizar temporalmente el estado para feedback inmediato
        const pasosActualizados = pasosFiltrados.map(p => {
          if (p.numero > numeroEliminado) {
            return { ...p, numero: p.numero - 1 };
          }
          return p;
        });
        setPasos(pasosActualizados.sort((a, b) => a.numero - b.numero));
        
        // 5. Realizar las actualizaciones en el backend
        // Primero asignar números temporales altos para evitar conflictos
        const maxNumero = Math.max(...pasosFiltrados.map(p => p.numero || 0)) + 1000;
        
        // Primera pasada: asignar números temporales
        for (let i = 0; i < pasosParaActualizar.length; i++) {
          const paso = pasosParaActualizar[i];
          await procedimientosService.updatePaso(paso.id, {
            titulo: paso.titulo,
            descripcion: paso.descripcion,
            procedimiento: paso.procedimiento,
            numero: maxNumero + i  // Número temporal alto
          });
        }
        
        // Segunda pasada: asignar números finales
        for (let i = 0; i < pasosParaActualizar.length; i++) {
          const paso = pasosParaActualizar[i];
          const nuevoNumero = paso.numero - 1; // Decrementar en 1
          
          await procedimientosService.updatePaso(paso.id, {
            titulo: paso.titulo,
            descripcion: paso.descripcion,
            procedimiento: paso.procedimiento,
            numero: nuevoNumero
          });
        }
        
        // 6. Recargar para asegurarnos de tener el estado correcto
        const finalPasos = await fetchAllPasos(procedimientoId);

        const finalPasosFiltrados = finalPasos
          .filter(paso => parseInt(paso.procedimiento) === parseInt(procedimientoId))
          .sort((a, b) => a.numero - b.numero);

        setPasos(finalPasosFiltrados);
        
        setSnackbar({
          open: true,
          message: 'Paso eliminado correctamente',
          severity: 'success'
        });
      } catch (error) {
        console.error('Error al eliminar el paso:', error);
        setSnackbar({
          open: true,
          message: `Error al eliminar el paso: ${error.response?.data?.detail || error.message}`,
          severity: 'error'
        });
      }
    }
  });
};

  // Cerrar snackbar
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Modificar la función handleViewDocuments

// Función para manejar la visualización de documentos
const handleViewDocuments = (paso) => {
  // En lugar de navegar, abrir el modal
  setPasoSeleccionado(paso);
  setDocumentosDialogOpen(true);
};

  // Añadir una función para manejar cambios en bifurcaciones
const handleBifurcacionesChange = (nuevasBifurcaciones) => {
  setFormData(prev => ({
    ...prev,
    bifurcaciones: nuevasBifurcaciones
  }));
};

  // Añadir este estado al componente PasosManager

  // Nuevo estado para controlar qué pasos están expandidos
  const [expandedPasos, setExpandedPasos] = useState({});
  
  // Efecto para escuchar eventos de navegación entre pasos
  useEffect(() => {
    const handlePasoNavigation = (event) => {
      const { pasoId } = event.detail;
      
      // Expandir solo el paso de destino
      let nuevoEstado = {};
      nuevoEstado[pasoId] = true;
      setExpandedPasos(nuevoEstado);
      
      // Scroll suave y efecto visual
      setTimeout(() => {
        const elemento = document.getElementById(`paso-${pasoId}`);
        if (elemento) {
          elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Efecto de resaltado temporal
          elemento.style.transition = 'box-shadow 0.5s ease';
          elemento.style.boxShadow = '0 0 0 3px rgba(33, 150, 243, 0.3)';
          
          // Remover el resaltado después de un tiempo
          setTimeout(() => {
            elemento.style.boxShadow = '';
          }, 2000);
        }
      }, 100);
    };
    
    document.addEventListener('pasoNavigation', handlePasoNavigation);
    
    return () => {
      document.removeEventListener('pasoNavigation', handlePasoNavigation);
    };
  }, []);

  // Añadir esta función en el componente PasosManager:
const handleDocumentosChange = async () => {
  try {
    if (pasoSeleccionado && pasoSeleccionado.id) {
      console.log("Actualizando documentos del paso:", pasoSeleccionado.id);
      
      // Recargar datos del paso específico
      const response = await procedimientosService.getPaso(pasoSeleccionado.id);
      const pasoActualizado = response.data;
      
      // Actualizar el paso en la lista de pasos
      setPasos(prevPasos => 
        prevPasos.map(paso => 
          paso.id === pasoActualizado.id ? pasoActualizado : paso
        )
      );
      
      // Actualizar también el pasoSeleccionado para reflejar los cambios en el modal
      setPasoSeleccionado(pasoActualizado);
      
      console.log("Documentos actualizados correctamente");
    }
  } catch (error) {
    console.error("Error al actualizar los documentos del paso:", error);
    setSnackbar({
      open: true,
      message: "Error al actualizar la lista de documentos",
      severity: "error"
    });
  }
};

// Optimización de fetchAllPasos para asegurar que se cargan TODOS los pasos
const fetchAllPasos = async (procedimientoId) => {
  let allPasos = [];
  let nextPageUrl = null;
  let page = 1;
  let totalPages = 1;
  
  console.log("Iniciando carga de todos los pasos para el procedimiento:", procedimientoId);

  try {
    // Primero obtenemos la cantidad total sin paginación para verificar después
    const countResponse = await procedimientosService.getPasos(procedimientoId, { 
      page_size: 1,
      pagination: true 
    });
    
    let totalCount = 0;
    if (countResponse.data.count) {
      totalCount = countResponse.data.count;
      totalPages = Math.ceil(totalCount / 100); // Usando page_size=100
      console.log(`Se detectaron ${totalCount} pasos totales, requiere ${totalPages} páginas`);
    }
  } catch (countError) {
    console.error("Error al obtener conteo de pasos:", countError);
  }

  // Intentar obtener todos los pasos sin paginación primero
  try {
    const noPaginationResponse = await procedimientosService.getPasos(procedimientoId, { 
      pagination: false,
      page_size: 1000
    });
    
    if (Array.isArray(noPaginationResponse.data)) {
      allPasos = noPaginationResponse.data;
      console.log(`Éxito al cargar ${allPasos.length} pasos sin paginación`);
      return allPasos;
    }
  } catch (error) {
    console.log("No se pudo obtener sin paginación, procediendo a paginación manual");
  }

  // Si no funcionó cargar sin paginación, hacemos paginación manual
  do {
    try {
      const response = await procedimientosService.getPasos(procedimientoId, { 
        page,
        page_size: 100 // Usar un tamaño de página grande
      });
      
      // Obtener los datos según la estructura de respuesta
      if (Array.isArray(response.data)) {
        allPasos = [...allPasos, ...response.data];
        nextPageUrl = null; // No hay más páginas
      } else if (response.data.results && Array.isArray(response.data.results)) {
        allPasos = [...allPasos, ...response.data.results];
        nextPageUrl = response.data.next; // URL de la siguiente página si existe
      }
      
      console.log(`Página ${page}/${totalPages || '?'} cargada, total acumulado: ${allPasos.length} pasos`);
      page++;
      
    } catch (error) {
      console.error(`Error al cargar la página ${page}:`, error);
      nextPageUrl = null;
    }
  } while (nextPageUrl || page <= totalPages);

  console.log(`Carga completada: ${allPasos.length} pasos obtenidos en total`);
  return allPasos;
};

// Función para manejar la actualización después de guardar bifurcaciones
const handleBifurcationSave = async () => {
  try {
    // Recargar todos los pasos para asegurar que las bifurcaciones estén actualizadas
    const allPasos = await fetchAllPasos(procedimientoId);
    
    // Filtrar y ordenar los pasos del procedimiento actual
    const pasosFiltrados = allPasos
      .filter(paso => parseInt(paso.procedimiento) === parseInt(procedimientoId))
      .sort((a, b) => a.numero - b.numero);
    
    setPasos(pasosFiltrados);
    
    setSnackbar({
      open: true,
      message: 'Bifurcaciones actualizadas correctamente',
      severity: 'success'
    });
  } catch (error) {
    console.error('Error al recargar los pasos:', error);
    setSnackbar({
      open: true,
      message: 'Error al actualizar las bifurcaciones',
      severity: 'error'
    });
  }
};

// Añadir esta función a PasosManager
const verificarNumeroDisponible = async (procedimientoId, numero) => {
  try {
    // Intentar obtener un paso con este número específico
    const response = await procedimientosService.getPasos(procedimientoId, {
      numero: numero
    });
    
    let existentes = [];
    if (Array.isArray(response.data)) {
      existentes = response.data;
    } else if (response.data.results && Array.isArray(response.data.results)) {
      existentes = response.data.results;
    }
    
    // Filtrar por este procedimiento específico
    const coincidencias = existentes.filter(
      p => parseInt(p.procedimiento) === parseInt(procedimientoId) && 
           parseInt(p.numero) === parseInt(numero)
    );
    
    console.log(`Verificación explícita: número ${numero} ${coincidencias.length > 0 ? 'ya existe' : 'disponible'}`);
    
    return coincidencias.length === 0;
  } catch (error) {
    console.error("Error al verificar disponibilidad de número:", error);
    return false; // En caso de error, asumir que no está disponible
  }
};

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Encabezado con título y navegación */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'center' },
        mb: 4
      }}>
        <Box>
          <Button
            variant="text"
            size="medium"
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToProcedimientos}
            sx={{ mb: 1 }}
          >
            Volver a procedimientos
          </Button>
          <Typography variant="h4" component="h1" gutterBottom>
            {procedimiento?.nombre || 'Cargando...'}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            {procedimiento?.tipo_nombre || ''}
            {procedimiento && ` • Versión ${procedimiento.version || '1.0'}`}
          </Typography>
        </Box>
        
        {isAdminOrSuperAdmin && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenPasoForm()}
            sx={{ 
              borderRadius: '8px',
              px: 3,
              py: 1.2,
              mt: { xs: 2, md: 0 },
              boxShadow: '0 3px 5px rgba(0,0,0,0.1)'
            }}
          >
            Nuevo paso
          </Button>
        )}
      </Box>
      
      {/* Mostrar resumen de pasos */}
      {!loading && pasos.length > 0 && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          mb: 4, 
          p: 2, 
          bgcolor: 'background.paper',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
            <Typography variant="h5" color="primary">{pasos.length}</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>pasos</Typography>
          </Box>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
            <Typography variant="h5" color="info.main">
              {pasos.reduce((acc, paso) => acc + (paso.documentos?.length || 0), 0)}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>documentos</Typography>
          </Box>
          
          <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h5" color="secondary.main">
              {pasos.reduce((acc, paso) => acc + (paso.bifurcaciones?.length || 0), 0)}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>bifurcaciones</Typography>
          </Box>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : pasos.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No hay pasos definidos
          </Typography>
          {isAdminOrSuperAdmin && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenPasoForm()}
              sx={{ mt: 2 }}
            >
              Añadir el primer paso
            </Button>
          )}
        </Paper>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={pasos.map(paso => paso.id.toString())}
            strategy={verticalListSortingStrategy}
          >
            <Box sx={{ mt: 2 }}>
              {pasos.map((paso) => (
                <Box
                  key={paso.id}
                  sx={{
                    animation: 'fadeIn 0.5s ease',
                    '@keyframes fadeIn': {
                      '0%': { opacity: 0, transform: 'translateY(10px)' },
                      '100%': { opacity: 1, transform: 'translateY(0)' }
                    },
                  }}
                >
                  <SortableItem id={paso.id.toString()}>
                    <PasoItem
                      paso={paso}
                      pasos={pasos}
                      onEdit={handleOpenPasoForm}
                      onDelete={handleDeletePaso}
                      onViewDocuments={handleViewDocuments}
                      isAdminOrSuperAdmin={isAdminOrSuperAdmin}
                      expanded={expandedPasos[paso.id] || false}
                      onToggle={() => {
                        setExpandedPasos(prev => ({
                          ...prev,
                          [paso.id]: !prev[paso.id]
                        }));
                      }}
                    />
                  </SortableItem>
                </Box>
              ))}
            </Box>
          </SortableContext>
        </DndContext>
      )}
      
      {/* Dialog para crear/editar pasos */}
      <Dialog
        open={dialogOpen}
        onClose={handleClosePasoForm}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {pasoActual ? 'Editar Paso' : 'Nuevo Paso'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Título"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              fullWidth
              margin="normal"
              variant="outlined"
              required
              error={formErrors.titulo}
              helperText={formErrors.titulo ? "El título es obligatorio" : ""}
              onBlur={() => {
                // Validar al perder el foco
                if (!formData.titulo.trim()) {
                  setFormErrors(prev => ({ ...prev, titulo: true }));
                } else {
                  setFormErrors(prev => ({ ...prev, titulo: false }));
                }
              }}
            />
            <TextField
              label="Descripción"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              fullWidth
              margin="normal"
              multiline
              rows={4}
              variant="outlined"
              required
              error={formErrors.descripcion}
              helperText={formErrors.descripcion ? "La descripción es obligatoria" : ""}
              onBlur={() => {
                // Validar al perder el foco
                if (!formData.descripcion.trim()) {
                  setFormErrors(prev => ({ ...prev, descripcion: true }));
                } else {
                  setFormErrors(prev => ({ ...prev, descripcion: false }));
                }
              }}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Tiempo estimado"
                  name="tiempo_estimado"
                  value={formData.tiempo_estimado}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  placeholder="Ej: 15 minutos"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Responsable"
                  name="responsable"
                  value={formData.responsable}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  placeholder="Ej: Jefe de sección"
                />
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            {/* Componente para gestionar bifurcaciones */}
            <BifurcacionesManager 
              bifurcaciones={formData.bifurcaciones || []} 
              pasos={pasos}
              onChange={handleBifurcacionesChange}
              pasoActual={pasoActual}
              onSave={handleBifurcationSave} // Añadir esta prop
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasoForm} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmitPaso} 
            color="primary" 
            variant="contained"
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Dialog de confirmación para eliminar */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmDialog.content}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialog({ ...confirmDialog, open: false })} 
            color="inherit"
          >
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              confirmDialog.onConfirm();
              setConfirmDialog({ ...confirmDialog, open: false });
            }} 
            color="error" 
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para gestión de documentos */}
      {pasoSeleccionado && (
        <Dialog
          open={documentosDialogOpen}
          onClose={() => setDocumentosDialogOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            Gestionar documentos - {pasoSeleccionado.titulo}
          </DialogTitle>
          <DialogContent>
            <PasoDocumentosManager 
              pasoId={pasoSeleccionado.id} 
              procedimientoId={procedimientoId} 
              embedded={true} // Indicar que está embebido en un modal
              onDocumentosChange={handleDocumentosChange} // Añadir esta prop
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDocumentosDialogOpen(false)} color="primary">
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
};

export default PasosManager;
