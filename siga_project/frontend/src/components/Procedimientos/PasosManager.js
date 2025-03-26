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
  DialogContentText
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
  Description as DocumentIcon
} from '@mui/icons-material';
import { AuthContext } from '../../contexts/AuthContext';
import procedimientosService from '../../assets/services/procedimientos.service';
import ConfirmDialog from '../common/ConfirmDialog';
import PasoDocumentosManager from './PasoDocumentosManager';
import { CSS } from '@dnd-kit/utilities';

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

// Componente para elementos arrastrables
const SortablePasoItem = ({ paso, index, isAdminOrSuperAdmin, handleOpenPasoForm, handleDeletePaso, procedimientoId }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: paso.id.toString()
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 5 : 1,
    backgroundColor: isDragging ? 'rgba(0, 0, 0, 0.05)' : 'inherit',
    position: 'relative',
    zIndex: isDragging ? 1 : 0
  };
  
  const [expanded, setExpanded] = useState(false);
  
  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };
  
  return (
    <ListItem 
      ref={setNodeRef}
      style={style}
      sx={{ 
        display: 'block', 
        p: 0, 
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        '&:last-child': { borderBottom: 'none' }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
        {isAdminOrSuperAdmin && (
          <Box sx={{ mr: 1, cursor: 'grab' }} {...attributes} {...listeners}>
            <DragIndicatorIcon color="action" />
          </Box>
        )}
        
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            flexGrow: 1, 
            cursor: 'pointer'
          }}
          onClick={handleToggleExpand}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Chip 
              label={`Paso ${index + 1}`}
              size="small"
              color="primary"
              sx={{ mr: 1.5 }}
            />
            <Typography variant="subtitle1">{paso.titulo}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {paso.responsable && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                <Typography variant="body2" color="text.secondary">
                  {paso.responsable}
                </Typography>
              </Box>
            )}
            
            {paso.tiempo_estimado && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTimeIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                <Typography variant="body2" color="text.secondary">
                  {paso.tiempo_estimado}
                </Typography>
              </Box>
            )}
            
            {paso.documentos && paso.documentos.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DescriptionIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                <Typography variant="body2" color="text.secondary">
                  {paso.documentos.length} {paso.documentos.length === 1 ? 'documento' : 'documentos'}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        
        {isAdminOrSuperAdmin && (
          <Box>
            <Tooltip title="Editar paso">
              <IconButton 
                size="small" 
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenPasoForm(paso);
                }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar paso">
              <IconButton 
                size="small" 
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePaso(paso.id);
                }}
                sx={{ 
                  bgcolor: 'rgba(211, 47, 47, 0.08)',
                  '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.15)' } 
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
      
      <Accordion 
        expanded={expanded}
        onChange={() => setExpanded(!expanded)}
        disableGutters
        elevation={0}
        sx={{ 
          borderTop: expanded ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
          '&:before': { display: 'none' },
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
        }}
      >
        <AccordionDetails sx={{ px: 2, pt: 0 }}>
          <Box sx={{ ml: 7 }}>
            <Typography variant="body1" color="text.secondary" paragraph>
              {paso.descripcion}
            </Typography>
            
            {paso.documentos && paso.documentos.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Documentos:
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  {paso.documentos.map((docPaso) => (
                    <Box 
                      component="li"
                      key={docPaso.id}
                      sx={{ 
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Typography variant="body2">
                        {docPaso.documento_detalle.nombre}
                      </Typography>
                      
                      <Box>
                        {docPaso.documento_detalle.archivo_url && (
                          <Tooltip title="Ver documento">
                            <IconButton 
                              size="small"
                              href={docPaso.documento_detalle.archivo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {docPaso.documento_detalle.url && (
                          <Tooltip title="Ir a URL">
                            <IconButton 
                              size="small"
                              href={docPaso.documento_detalle.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <LaunchIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
            
            {/* Gestión de documentos para Admin/SuperAdmin */}
            {isAdminOrSuperAdmin && (
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenPasoForm(paso);
                  }}
                >
                  Gestionar documentos
                </Button>
              </Box>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    </ListItem>
  );
};

// Añadir esto justo antes del componente PasoItem

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

// Modificar el componente PasoItem para mejorar el diseño del acordeón

const PasoItem = ({ paso, onEdit, onDelete, onViewDocuments, isAdminOrSuperAdmin }) => {
  const [expanded, setExpanded] = useState(false);
  
  const handleToggle = () => {
    setExpanded(!expanded);
  };

  // Función para renderizar el icono según el tipo de documento
  const getDocumentoIcon = (documento) => {
    if (!documento.archivo_url && documento.url) {
      return <LinkIcon fontSize="small" color="primary" />;
    }
    
    const extension = documento.extension?.toLowerCase();
    
    if (extension === 'pdf') {
      return <PdfIcon fontSize="small" color="error" />;
    } else if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) {
      return <ImageIcon fontSize="small" color="success" />;
    } else if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) {
      return <VideoIcon fontSize="small" color="secondary" />;
    } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
      return <AudioIcon fontSize="small" color="info" />;
    } else {
      return <FileIcon fontSize="small" color="action" />;
    }
  };

  return (
    <Paper 
      elevation={2} 
      sx={{
        mb: 2,
        borderRadius: 2,
        overflow: 'hidden',
        border: expanded ? '1px solid #3f51b5' : '1px solid #e0e0e0',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          borderColor: '#bbdefb'
        }
      }}
    >
      <Box
        onClick={handleToggle}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          bgcolor: expanded ? 'rgba(63, 81, 181, 0.08)' : 'white',
          transition: 'background-color 0.3s ease',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component="div" color="primary" sx={{ fontWeight: 'bold', mr: 2 }}>
            {paso.numero}
          </Typography>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: expanded ? 'bold' : 'medium' }}>
              {paso.titulo}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {paso.tiempo_estimado ? `Tiempo estimado: ${paso.tiempo_estimado}` : ''}
              {paso.tiempo_estimado && paso.responsable ? ' · ' : ''}
              {paso.responsable ? `Responsable: ${paso.responsable}` : ''}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isAdminOrSuperAdmin && (
            <>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(paso);
                }}
                color="primary"
                sx={{ 
                  bgcolor: 'rgba(63, 81, 181, 0.08)',
                  '&:hover': { bgcolor: 'rgba(63, 81, 181, 0.15)' } 
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(paso.id); // Asegúrate de pasar solo el ID, no el objeto completo
                }}
                color="error"
                sx={{ 
                  bgcolor: 'rgba(211, 47, 47, 0.08)',
                  '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.15)' } 
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDocuments(paso);
                }}
                color="info"
                sx={{ 
                  bgcolor: 'rgba(2, 136, 209, 0.08)',
                  '&:hover': { bgcolor: 'rgba(2, 136, 209, 0.15)' } 
                }}
              >
                <DocumentIcon fontSize="small" />
              </IconButton>
            </>
          )}
          <IconButton size="small">
            {expanded ? (
              <ExpandLessIcon fontSize="small" />
            ) : (
              <ExpandMoreIcon fontSize="small" />
            )}
          </IconButton>
        </Box>
      </Box>

      {/* Contenido expandido */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ p: 3, bgcolor: '#f9f9f9', borderTop: '1px solid #e0e0e0' }}>
          {/* Descripción */}
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

          {/* Documentos asociados */}
          {paso.documentos && paso.documentos.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 1, fontWeight: 'bold' }}>
                Documentos asociados:
              </Typography>
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 1,
                  mt: 1
                }}
              >
                {paso.documentos.map((docPaso) => (
                  <Chip
                    key={docPaso.id}
                    icon={getDocumentoIcon(docPaso.documento_detalle)}
                    label={docPaso.documento_detalle.nombre}
                    onClick={() => {
                      if (docPaso.documento_detalle.archivo_url) {
                        window.open(docPaso.documento_detalle.archivo_url, '_blank');
                      } else if (docPaso.documento_detalle.url) {
                        window.open(docPaso.documento_detalle.url, '_blank');
                      }
                    }}
                    variant="outlined"
                    color="primary"
                    size="small"
                    sx={{ 
                      borderRadius: '16px',
                      p: 0.5,
                      '&:hover': {
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Botón para gestionar documentos (solo para admin) */}
          {isAdminOrSuperAdmin && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DocumentIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDocuments(paso);
                }}
                sx={{
                  textTransform: 'none',
                  borderRadius: '20px',
                  px: 2
                }}
              >
                Gestionar documentos
              </Button>
            </Box>
          )}
        </Box>
      </Collapse>
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
    responsable: ''
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
        if (!procedimientoId) {
          console.log("ID de procedimiento no definido");
          return;
        }
        
        console.log("Obteniendo datos para procedimiento:", procedimientoId);
        
        const [procedimientoRes, pasosRes] = await Promise.all([
          procedimientosService.getProcedimiento(procedimientoId),
          procedimientosService.getPasos(procedimientoId)
        ]);

        console.log("Datos de procedimiento:", procedimientoRes.data);
        console.log("Datos de pasos:", pasosRes.data);
        
        setProcedimiento(procedimientoRes.data);
        
        // Manejar diferentes estructuras de respuesta para pasos
        let pasosData = [];
        if (Array.isArray(pasosRes.data)) {
          pasosData = pasosRes.data;
        } else if (pasosRes.data.results && Array.isArray(pasosRes.data.results)) {
          pasosData = pasosRes.data.results;
        }
        
        // Filtrar los pasos para asegurarnos que son de este procedimiento
        const pasosFiltrados = pasosData.filter(paso => 
          parseInt(paso.procedimiento) === parseInt(procedimientoId)
        );
        
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
          errorMessage += ': ' + error.response.data.non_field_errors.join(', ');
        }
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

  // Abrir formulario para crear o editar un paso
  const handleOpenPasoForm = (paso = null) => {
    setPasoActual(paso);
    
    if (paso) {
      setFormData({
        titulo: paso.titulo,
        descripcion: paso.descripcion,
        tiempo_estimado: paso.tiempo_estimado || '',
        responsable: paso.responsable || ''
      });
    } else {
      setFormData({
        titulo: '',
        descripcion: '',
        tiempo_estimado: '',
        responsable: ''
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

  // Corregir la función handleSubmitPaso

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
      const nextNumber = pasos.length > 0 
        ? Math.max(...pasos.map(p => p.numero)) + 1 
        : 1;
      
      await procedimientosService.createPaso({
        ...formData,
        procedimiento: procedimientoId,
        numero: nextNumber
      });
      
      setSnackbar({
        open: true,
        message: 'Paso creado correctamente',
        severity: 'success'
      });
    }
    
    // Recargar pasos
    const response = await procedimientosService.getPasos(procedimientoId);
    
    // Manejar diferentes respuestas posibles
    let pasosData = [];
    if (Array.isArray(response.data)) {
      pasosData = response.data;
    } else if (response.data.results && Array.isArray(response.data.results)) {
      pasosData = response.data.results;
    }
    
    // Filtrar los pasos del procedimiento actual y ordenarlos
    const pasosFiltrados = pasosData
      .filter(paso => parseInt(paso.procedimiento) === parseInt(procedimientoId))
      .sort((a, b) => a.numero - b.numero);
    
    setPasos(pasosFiltrados);
    
    // Limpiar los errores y cerrar el formulario
    setFormErrors({
      titulo: false,
      descripcion: false
    });
    handleClosePasoForm();
  } catch (error) {
    console.error('Error al guardar el paso:', error);
    
    // Extraer mensajes de error si están disponibles
    let errorMessage = 'Error al guardar el paso';
    
    if (error.response && error.response.data) {
      // Construir un mensaje más detallado
      const errorData = error.response.data;
      const errorDetails = [];
      
      for (const field in errorData) {
        if (Array.isArray(errorData[field])) {
          errorDetails.push(`${field.charAt(0).toUpperCase() + field.slice(1)}: ${errorData[field].join(', ')}`);
        }
      }
      
      if (errorDetails.length > 0) {
        errorMessage += ': ' + errorDetails.join('; ');
      }
    }
    
    setSnackbar({
      open: true,
      message: errorMessage,
      severity: 'error'
    });
  }
};

  // Corregir la función handleDeletePaso

// Manejar eliminación de paso
const handleDeletePaso = (paso) => {
  // Verificar si recibimos un ID o un objeto paso completo
  const pasoId = typeof paso === 'object' ? paso.id : paso;
  
  setConfirmDialog({
    open: true,
    title: 'Eliminar paso',
    content: '¿Está seguro de que desea eliminar este paso?',
    onConfirm: async () => {
      try {
        // Asegurar que estamos pasando el ID como número o string, no como objeto
        await procedimientosService.deletePaso(pasoId);
        
        // Recargar pasos
        const response = await procedimientosService.getPasos(procedimientoId);
        
        // Procesar los datos según la estructura de respuesta
        let pasosData = [];
        if (Array.isArray(response.data)) {
          pasosData = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
          pasosData = response.data.results;
        }
        
        // Filtrar los pasos del procedimiento actual y ordenarlos
        const pasosFiltrados = pasosData
          .filter(paso => parseInt(paso.procedimiento) === parseInt(procedimientoId))
          .sort((a, b) => a.numero - b.numero);
        
        setPasos(pasosFiltrados);
        
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

  // Función para manejar la visualización de documentos
  const handleViewDocuments = (paso) => {
    navigate(`/dashboard/procedimientos/${procedimientoId}/pasos/${paso.id}/documentos`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {/* Encabezado con título y acciones */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 4
      }}>
        <Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToProcedimientos}
            sx={{ mb: 2 }}
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
              borderRadius: '20px',
              px: 3,
              py: 1
            }}
          >
            Nuevo paso
          </Button>
        )}
      </Box>

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
                <SortableItem key={paso.id} id={paso.id.toString()}>
                  <PasoItem
                    paso={paso}
                    onEdit={handleOpenPasoForm}
                    onDelete={handleDeletePaso}
                    onViewDocuments={handleViewDocuments}
                    isAdminOrSuperAdmin={isAdminOrSuperAdmin}
                  />
                </SortableItem>
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
    </Container>
  );
};

export default PasosManager;

