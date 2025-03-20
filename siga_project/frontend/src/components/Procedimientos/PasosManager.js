import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
  Chip,
  Snackbar,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon,
  ExpandMore as ExpandMoreIcon,
  Description as DescriptionIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import procedimientosService from '../../assets/services/procedimientos.service';
import { AuthContext } from '../../contexts/AuthContext';
import ConfirmDialog from '../common/ConfirmDialog';

// Componente para cada paso con funcionalidad de arrastrar y soltar
const SortablePasoItem = ({ paso, index, isAdminOrSuperAdmin, handleOpenPasoForm, handleDeletePaso }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: paso.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      divider={true}
      sx={{ bgcolor: 'background.paper' }}
    >
      {isAdminOrSuperAdmin && (
        <ListItemIcon {...attributes} {...listeners} sx={{ cursor: 'grab' }}>
          <DragIndicatorIcon />
        </ListItemIcon>
      )}
      
      <ListItemText
        primary={
          <Typography variant="subtitle1">
            {paso.numero}. {paso.titulo}
          </Typography>
        }
        secondary={
          <Accordion elevation={0}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`panel-${paso.id}-content`}
              id={`panel-${paso.id}-header`}
            >
              <Typography variant="body2">Ver detalles</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph variant="body2">
                {paso.descripcion}
              </Typography>
              
              {(paso.tiempo_estimado || paso.responsable) && (
                <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
                  {paso.tiempo_estimado && (
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <AccessTimeIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {paso.tiempo_estimado}
                      </Typography>
                    </Box>
                  )}
                  
                  {paso.responsable && (
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {paso.responsable}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
              
              {paso.documentos && paso.documentos.length > 0 && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    Documentos asociados:
                  </Typography>
                  <List dense>
                    {paso.documentos.map((docPaso) => (
                      <ListItem key={docPaso.id} disablePadding>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <DescriptionIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={docPaso.documento_detalle.nombre}
                          secondary={docPaso.documento_detalle.descripcion}
                        />
                        {docPaso.documento_detalle.archivo_url && (
                          <Tooltip title="Ver archivo">
                            <IconButton 
                              size="small"
                              component="a"
                              href={docPaso.documento_detalle.archivo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <DescriptionIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {docPaso.documento_detalle.url && (
                          <Tooltip title="Abrir URL">
                            <IconButton 
                              size="small"
                              component="a"
                              href={docPaso.documento_detalle.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <DescriptionIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </AccordionDetails>
          </Accordion>
        }
      />
      
      {isAdminOrSuperAdmin && (
        <ListItemSecondaryAction>
          <Tooltip title="Editar">
            <IconButton 
              edge="end" 
              aria-label="edit"
              onClick={() => handleOpenPasoForm(paso)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton 
              edge="end" 
              aria-label="delete"
              onClick={() => handleDeletePaso(paso)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </ListItemSecondaryAction>
      )}
    </ListItem>
  );
};

const PasosManager = () => {
  const { procedimientoId } = useParams();
  console.log("Parámetros de ruta:", useParams());
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);
  const isAdminOrSuperAdmin = ['Admin', 'SuperAdmin'].includes(currentUser?.tipo_usuario);
  
  const [procedimiento, setProcedimiento] = useState(null);
  const [pasos, setPasos] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [documentosDialogOpen, setDocumentosDialogOpen] = useState(false);
  const [pasoActual, setPasoActual] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tiempo_estimado: '',
    responsable: '',
    documentos_ids: []
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    onConfirm: null
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Configuración de sensores para dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requiere un desplazamiento mínimo de 5px para activarse
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Verifica que el ID está definido
        if (!procedimientoId) {
          console.error("ID de procedimiento no definido");
          setSnackbar({
            open: true,
            message: 'Error: ID de procedimiento no encontrado',
            severity: 'error'
          });
          setLoading(false);
          return;
        }
        
        console.log("Obteniendo datos para procedimiento:", procedimientoId);
        
        const [procedimientoRes, pasosRes, documentosRes] = await Promise.all([
          procedimientosService.getProcedimiento(procedimientoId),
          procedimientosService.getPasos(procedimientoId),  // Usa el ID del procedimiento
          procedimientosService.getDocumentos()
        ]);
        
        console.log("Procedimiento:", procedimientoRes.data);
        console.log("Pasos (respuesta completa):", pasosRes);
        console.log("Pasos (datos):", pasosRes.data);
        
        setProcedimiento(procedimientoRes.data);
        
        // Verifica la estructura de la respuesta y extrae los pasos correctamente
        // La API puede devolver directamente un array o un objeto con propiedad 'results'
        const pasosData = Array.isArray(pasosRes.data) 
          ? pasosRes.data 
          : (pasosRes.data.results || []);
        
        console.log("Pasos después de procesamiento:", pasosData);
        
        setPasos(pasosData);
        setDocumentos(documentosRes.data.results || documentosRes.data);
      } catch (error) {
        console.error('Error al cargar los datos:', error);
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

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    // Si no hay cambio, regresamos
    if (!over || active.id === over.id) return;
    
    // Encontrar los índices actuales
    const oldIndex = pasos.findIndex(paso => paso.id.toString() === active.id);
    const newIndex = pasos.findIndex(paso => paso.id.toString() === over.id);
    
    // Actualizar el orden en el estado
    const updatedPasos = arrayMove(pasos, oldIndex, newIndex);
    
    // Actualizar números de los pasos
    const reorderedPasos = updatedPasos.map((paso, idx) => ({
      ...paso,
      numero: idx + 1
    }));
    
    setPasos(reorderedPasos);
    
    // Actualizar en el servidor
    try {
      for (const paso of reorderedPasos) {
        await procedimientosService.updatePaso(paso.id, {
          numero: paso.numero,
          procedimiento: procedimientoId  // Cambiar id por procedimientoId
        });
      }
      
      setSnackbar({
        open: true,
        message: 'Orden de pasos actualizado correctamente',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error al actualizar el orden:', error);
      setSnackbar({
        open: true,
        message: 'Error al actualizar el orden de los pasos',
        severity: 'error'
      });
    }
  };
  
  const handleOpenPasoForm = (paso = null) => {
    if (paso) {
      setPasoActual(paso);
      setFormData({
        titulo: paso.titulo,
        descripcion: paso.descripcion,
        tiempo_estimado: paso.tiempo_estimado || '',
        responsable: paso.responsable || '',
        documentos_ids: paso.documentos?.map(doc => doc.documento) || []
      });
    } else {
      setPasoActual(null);
      setFormData({
        titulo: '',
        descripcion: '',
        tiempo_estimado: '',
        responsable: '',
        documentos_ids: []
      });
    }
    setDialogOpen(true);
  };
  
  const handleClosePasoForm = () => {
    setDialogOpen(false);
    setPasoActual(null);
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleDocumentosChange = (event) => {
    setFormData({
      ...formData,
      documentos_ids: event.target.value
    });
  };
  
  const handleSubmitPaso = async (e) => {
    e.preventDefault();
    
    try {
      if (pasoActual) {
        // Actualizar paso existente
        await procedimientosService.updatePaso(pasoActual.id, {
          ...formData,
          procedimiento: procedimientoId  // Cambiar id por procedimientoId
        });
        
        setSnackbar({
          open: true,
          message: 'Paso actualizado correctamente',
          severity: 'success'
        });
      } else {
        // Crear nuevo paso
        const nuevoNumero = pasos.length + 1;
        await procedimientosService.createPaso({
          ...formData,
          procedimiento: procedimientoId,  // Cambiar id por procedimientoId
          numero: nuevoNumero
        });
        
        setSnackbar({
          open: true,
          message: 'Paso creado correctamente',
          severity: 'success'
        });
      }
      
      // Recargar pasos
      const response = await procedimientosService.getPasos(procedimientoId);  // Cambiar id por procedimientoId
      setPasos(response.data.results || response.data);
      
      handleClosePasoForm();
    } catch (error) {
      console.error('Error al guardar el paso:', error);
      setSnackbar({
        open: true,
        message: `Error al ${pasoActual ? 'actualizar' : 'crear'} el paso`,
        severity: 'error'
      });
    }
  };
  
  const handleDeletePaso = (paso) => {
    setConfirmDialog({
      open: true,
      title: 'Eliminar paso',
      content: `¿Está seguro de que desea eliminar el paso "${paso.titulo}"?`,
      onConfirm: async () => {
        try {
          await procedimientosService.deletePaso(paso.id);
          
          // Recargar pasos
          const response = await procedimientosService.getPasos(procedimientoId);  // Cambiar id por procedimientoId
          setPasos(response.data.results || response.data);
          
          setSnackbar({
            open: true,
            message: 'Paso eliminado correctamente',
            severity: 'success'
          });
        } catch (error) {
          console.error('Error al eliminar el paso:', error);
          setSnackbar({
            open: true,
            message: 'Error al eliminar el paso',
            severity: 'error'
          });
        } finally {
          setConfirmDialog({ ...confirmDialog, open: false });
        }
      }
    });
  };
  
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  const handleBackToProcedimientos = () => {
    navigate('/dashboard/procedimientos');
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <IconButton onClick={handleBackToProcedimientos} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" component="h1">
            Pasos del Procedimiento
          </Typography>
        </Box>
        
        {isAdminOrSuperAdmin && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenPasoForm()}
          >
            Añadir Paso
          </Button>
        )}
      </Box>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {procedimiento?.nombre}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {procedimiento?.descripcion}
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          <Chip 
            label={`Tipo: ${procedimiento?.tipo_detalle?.nombre}`} 
            color="primary" 
            variant="outlined" 
          />
          <Chip 
            label={`Estado: ${procedimiento?.estado}`} 
            color={
              procedimiento?.estado === 'BORRADOR' ? 'warning' : 
              procedimiento?.estado === 'VIGENTE' ? 'success' : 'error'
            }
            variant="outlined" 
          />
          <Chip 
            label={`Versión: ${procedimiento?.version}`} 
            color="secondary" 
            variant="outlined" 
          />
        </Box>
      </Paper>
      
      {pasos.length === 0 ? (
        <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary" paragraph>
            Este procedimiento no tiene pasos definidos
          </Typography>
          {isAdminOrSuperAdmin && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenPasoForm()}
            >
              Añadir Primer Paso
            </Button>
          )}
        </Paper>
      ) : (
        <Paper elevation={3} sx={{ mb: 3 }}>
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={pasos.map(paso => paso.id.toString())}
              strategy={verticalListSortingStrategy}
            >
              <List>
                {pasos.map((paso, index) => (
                  <SortablePasoItem 
                    key={paso.id} 
                    paso={paso} 
                    index={index}
                    isAdminOrSuperAdmin={isAdminOrSuperAdmin}
                    handleOpenPasoForm={handleOpenPasoForm}
                    handleDeletePaso={handleDeletePaso}
                  />
                ))}
              </List>
            </SortableContext>
          </DndContext>
        </Paper>
      )}
      
      {/* Dialog para crear/editar paso */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleClosePasoForm}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {pasoActual ? `Editar Paso ${pasoActual.numero}` : 'Nuevo Paso'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmitPaso} sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Título"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Descripción"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={4}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Tiempo estimado (opcional)"
                  name="tiempo_estimado"
                  value={formData.tiempo_estimado}
                  onChange={handleChange}
                  fullWidth
                  placeholder="Ej: 30 minutos, 2 horas"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Responsable (opcional)"
                  name="responsable"
                  value={formData.responsable}
                  onChange={handleChange}
                  fullWidth
                  placeholder="Ej: Jefe de Sección, Oficial de Guardia"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="documentos-label">Documentos asociados</InputLabel>
                  <Select
                    labelId="documentos-label"
                    multiple
                    value={formData.documentos_ids}
                    onChange={handleDocumentosChange}
                    label="Documentos asociados"
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const doc = documentos.find(d => d.id === value);
                          return (
                            <Chip key={value} label={doc ? doc.nombre : value} />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {documentos.map((doc) => (
                      <MenuItem key={doc.id} value={doc.id}>
                        {doc.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasoForm}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitPaso} 
            startIcon={<SaveIcon />}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo de confirmación */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        content={confirmDialog.content}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
      />
      
      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PasosManager;

