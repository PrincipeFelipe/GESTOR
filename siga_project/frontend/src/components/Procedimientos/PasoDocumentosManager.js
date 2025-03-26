import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Paper,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Description as DocumentIcon,
  Link as LinkIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  CloudUpload as UploadIcon,
  GetApp as DownloadIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Movie as VideoIcon,
  AudioFile as AudioIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { AuthContext } from '../../contexts/AuthContext';
import DocumentoForm from './DocumentoForm';
import procedimientosService from '../../assets/services/procedimientos.service';
// Añadir esta importación para el objeto api
import api from '../../assets/services/api';
import { useNavigate } from 'react-router-dom';

// Modificar el componente para que pueda trabajar embebido

const PasoDocumentosManager = ({ pasoId, procedimientoId, embedded = false }) => {
  const { currentUser } = useContext(AuthContext);
  const isAdminOrSuperAdmin = ['Admin', 'SuperAdmin'].includes(currentUser?.tipo_usuario);
  const navigate = useNavigate();
  
  const [documentosPaso, setDocumentosPaso] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDocumentoForm, setOpenDocumentoForm] = useState(false);
  const [documentoActual, setDocumentoActual] = useState(null);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [documentoToDelete, setDocumentoToDelete] = useState(null);
  const [openNotasDialog, setOpenNotasDialog] = useState(false);
  const [currentNotas, setCurrentNotas] = useState('');
  const [currentDocumentoPasoId, setCurrentDocumentoPasoId] = useState(null);

  useEffect(() => {
    if (pasoId) {
      fetchPasoDocumentos();
    }
  }, [pasoId]);

  // Actualizar la función fetchPasoDocumentos

const fetchPasoDocumentos = async () => {
  setLoading(true);
  try {
    // Obtener paso con sus documentos
    const pasoResponse = await procedimientosService.getPaso(pasoId);
    console.log("Respuesta del paso:", pasoResponse.data);
    
    // Verificar si el paso tiene documentos incluidos en la respuesta
    if (pasoResponse.data && Array.isArray(pasoResponse.data.documentos)) {
      console.log("Documentos en la respuesta del paso:", pasoResponse.data.documentos);
      setDocumentosPaso(pasoResponse.data.documentos);
    } else {
      // Si no hay documentos en la respuesta, intentar obtener documentos del paso
      try {
        // Intentar primera estrategia - petición a documentos del paso
        const docResponse = await api.get(`/procedimientos/pasos/${pasoId}/documentos/`);
        console.log("Documentos desde endpoint específico:", docResponse.data);
        setDocumentosPaso(docResponse.data);
      } catch (docError) {
        console.error("Error al cargar documentos del paso:", docError);
        
        // Intentar segunda estrategia - filtrar documentos por paso
        try {
          const allDocsResponse = await procedimientosService.getDocumentos({
            paso: pasoId
          });
          console.log("Documentos filtrados:", allDocsResponse.data);
          setDocumentosPaso(allDocsResponse.data.results || allDocsResponse.data || []);
        } catch (filterError) {
          console.error("Error al filtrar documentos:", filterError);
        }
      }
    }
  } catch (error) {
    console.error("Error al cargar documentos del paso:", error);
  } finally {
    setLoading(false);
  }
};

  const handleOpenDocumentoForm = (documento = null) => {
    setDocumentoActual(documento);
    setOpenDocumentoForm(true);
  };

  const handleCloseDocumentoForm = () => {
    setDocumentoActual(null);
    setOpenDocumentoForm(false);
  };

  const handleSubmitDocumento = async (data) => {
    try {
      if (data.id) {
        // Actualizar documento existente
        await procedimientosService.updateDocumento(data.id, data);
      } else {
        // Crear nuevo documento
        const response = await procedimientosService.createDocumento({
          ...data,
          procedimiento: procedimientoId
        });
        
        // Asociar el documento al paso
        await procedimientosService.addDocumentoPaso(pasoId, response.data.id);
      }
      
      // Recargar documentos
      await fetchPasoDocumentos();
      
    } catch (error) {
      console.error("Error al guardar documento:", error);
    }
  };

  const handleConfirmDeleteOpen = (documentoPaso) => {
    setDocumentoToDelete(documentoPaso);
    setOpenConfirmDelete(true);
  };

  const handleConfirmDeleteClose = () => {
    setOpenConfirmDelete(false);
    setDocumentoToDelete(null);
  };

  const handleDeleteDocumento = async () => {
    if (!documentoToDelete) return;
    
    try {
      // Eliminar la relación del documento con el paso
      await procedimientosService.removeDocumentoPaso(
        pasoId, 
        documentoToDelete.id
      );
      
      // Recargar documentos
      await fetchPasoDocumentos();
    } catch (error) {
      console.error("Error al eliminar documento:", error);
    } finally {
      handleConfirmDeleteClose();
    }
  };

  const handleOpenNotasDialog = (documentoPaso) => {
    setCurrentDocumentoPasoId(documentoPaso.id);
    setCurrentNotas(documentoPaso.notas || '');
    setOpenNotasDialog(true);
  };

  const handleSaveNotas = async () => {
    if (!currentDocumentoPasoId) return;
    
    try {
      // Actualizar notas del documento en el paso
      await procedimientosService.updatePasoDocumento(
        pasoId,
        currentDocumentoPasoId,
        { notas: currentNotas }
      );
      
      // Recargar documentos
      await fetchPasoDocumentos();
    } catch (error) {
      console.error("Error al guardar notas:", error);
    } finally {
      setOpenNotasDialog(false);
    }
  };

  const getIconByFileType = (documento) => {
    // Si es una URL, mostrar icono de enlace
    if (documento.documento_detalle.url) {
      return <LinkIcon color="primary" />;
    }
    
    // Para archivos, determinar el tipo por la extensión
    const extension = documento.documento_detalle.extension?.toLowerCase() || '';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
      return <ImageIcon color="success" />;
    } else if (['pdf'].includes(extension)) {
      return <PdfIcon color="error" />;
    } else if (['mp4', 'webm', 'avi', 'mov', 'wmv'].includes(extension)) {
      return <VideoIcon color="secondary" />;
    } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
      return <AudioIcon color="info" />;
    } else {
      return <FileIcon color="action" />;
    }
  };

  // Si está embebido, no mostrar el botón de volver
  const handleBack = () => {
    if (embedded) return;
    navigate(`/dashboard/procedimientos/${procedimientoId}/pasos`);
  };

  return (
    <Box sx={{ mt: 2 }}>
      {!embedded && (
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Volver a pasos
        </Button>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Documentos del paso
        </Typography>
        
        {isAdminOrSuperAdmin && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDocumentoForm()}
            size="small"
          >
            Añadir Documento
          </Button>
        )}
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : documentosPaso.length === 0 ? (
        <Paper elevation={0} variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No hay documentos asociados a este paso
          </Typography>
          {isAdminOrSuperAdmin && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<UploadIcon />}
              onClick={() => handleOpenDocumentoForm()}
              sx={{ mt: 2 }}
            >
              Añadir primer documento
            </Button>
          )}
        </Paper>
      ) : (
        <Paper elevation={1} sx={{ mb: 3 }}>
          <List>
            {documentosPaso.map((docPaso, index) => (
              <React.Fragment key={docPaso.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem>
                  <ListItemIcon>
                    {getIconByFileType(docPaso)}
                  </ListItemIcon>
                  <ListItemText
                    primary={docPaso.documento_detalle.nombre}
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary" component="span">
                          {docPaso.documento_detalle.descripcion}
                        </Typography>
                        {docPaso.notas && (
                          <Typography 
                            variant="caption" 
                            color="text.secondary" 
                            sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}
                          >
                            Notas: {docPaso.notas}
                          </Typography>
                        )}
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    {isAdminOrSuperAdmin && (
                      <>
                        <Tooltip title="Editar notas">
                          <IconButton 
                            edge="end" 
                            aria-label="notas"
                            onClick={() => handleOpenNotasDialog(docPaso)}
                            size="small"
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton 
                            edge="end" 
                            aria-label="eliminar"
                            onClick={() => handleConfirmDeleteOpen(docPaso)}
                            size="small"
                            sx={{ mr: 1 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    
                    {docPaso.documento_detalle.url ? (
                      <Tooltip title="Abrir enlace">
                        <IconButton 
                          edge="end" 
                          aria-label="abrir"
                          href={docPaso.documento_detalle.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                        >
                          <LinkIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Descargar">
                        <IconButton 
                          edge="end" 
                          aria-label="descargar"
                          href={docPaso.documento_detalle.archivo_url}
                          target="_blank"
                          download
                          size="small"
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
      
      {/* Modal de formulario de documentos */}
      <DocumentoForm
        open={openDocumentoForm}
        onClose={handleCloseDocumentoForm}
        onSubmit={handleSubmitDocumento}
        initialData={documentoActual}
        procedimientoId={procedimientoId}
      />
      
      {/* Diálogo de confirmación para eliminar */}
      <Dialog
        open={openConfirmDelete}
        onClose={handleConfirmDeleteClose}
      >
        <DialogTitle>Eliminar documento</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de que desea eliminar este documento del paso?
            El documento seguirá disponible en el sistema, pero ya no estará asociado a este paso.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmDeleteClose} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleDeleteDocumento} color="error">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Diálogo para editar notas */}
      <Dialog
        open={openNotasDialog}
        onClose={() => setOpenNotasDialog(false)}
      >
        <DialogTitle>Editar notas del documento</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Notas"
            fullWidth
            multiline
            rows={4}
            value={currentNotas}
            onChange={(e) => setCurrentNotas(e.target.value)}
            placeholder="Añade notas o instrucciones sobre este documento"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNotasDialog(false)} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleSaveNotas} color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PasoDocumentosManager;