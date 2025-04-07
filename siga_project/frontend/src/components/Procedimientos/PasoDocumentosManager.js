import React, { useState, useEffect } from 'react'; // Quitar useContext
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
  TextField,
  Snackbar,
  Alert
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
// Reemplazar la importación del AuthContext
import { usePermissions } from '../../hooks/usePermissions'; // Usar el nuevo hook
import DocumentoForm from './DocumentoForm';
import procedimientosService from '../../assets/services/procedimientos.service';
import api from '../../assets/services/api';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PasoDocumentosManager = ({ 
  pasoId, 
  procedimientoId, 
  embedded = false,
  onDocumentosChange
}) => {
  // Usar el hook de permisos en lugar del contexto directamente
  const { isAdmin } = usePermissions();
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
  const [confirmDeleteMessage, setConfirmDeleteMessage] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    if (pasoId) {
      fetchPasoDocumentos();
    }
  }, [pasoId]);

  const fetchPasoDocumentos = async () => {
    setLoading(true);
    try {
      // Usar la nueva función específica para documentos de paso
      const docResponse = await procedimientosService.getDocumentosPorPaso(pasoId);
      console.log("Documentos desde endpoint específico:", docResponse.data);
      setDocumentosPaso(docResponse.data);
    } catch (error) {
      console.error("Error al cargar documentos del paso:", error);
      setSnackbar({
        open: true,
        message: 'Error al cargar documentos del paso',
        severity: 'error'
      });
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
      // Asegurarnos de incluir el ID del paso en la información
      const documentoData = {
        ...data,
        procedimiento: procedimientoId,
        paso: pasoId  // Importante: asegurar que se envía el ID del paso
      };
      
      if (data.id) {
        // Si es una actualización, mantener el comportamiento actual
        await procedimientosService.updateDocumento(data.id, documentoData);
      } else {
        // Para un nuevo documento, usar la ruta específica para documentos de paso
        await procedimientosService.addDocumentToPaso(pasoId, documentoData);
      }
      
      await fetchPasoDocumentos();
      notificarCambios();
      handleCloseDocumentoForm();
      
      setSnackbar({
        open: true,
        message: data.id ? 'Documento actualizado correctamente' : 'Documento añadido correctamente',
        severity: 'success'
      });
      
    } catch (error) {
      console.error("Error al guardar documento:", error);
      setSnackbar({
        open: true,
        message: `Error al guardar documento: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const handleConfirmDeleteOpen = (documentoPaso) => {
    setDocumentoToDelete(documentoPaso);
    
    const tieneArchivo = documentoPaso.documento_detalle?.archivo_url;
    const mensaje = tieneArchivo 
      ? '¿Está seguro de que desea eliminar este documento? El archivo físico también será eliminado permanentemente del servidor.'
      : '¿Está seguro de que desea eliminar este documento del paso?';
      
    setConfirmDeleteMessage(mensaje);
    setOpenConfirmDelete(true);
  };

  const handleConfirmDeleteClose = () => {
    setOpenConfirmDelete(false);
    setDocumentoToDelete(null);
  };

  const notificarCambios = () => {
    if (typeof onDocumentosChange === 'function') {
      onDocumentosChange();
    }
  };

  const handleDeleteDocumento = async () => {
    if (!documentoToDelete) return;
    
    try {
      const tieneArchivo = documentoToDelete.documento_detalle?.archivo_url;
      
      await procedimientosService.removeDocumentoPaso(
        pasoId, 
        documentoToDelete.id,
        { eliminar_archivo: tieneArchivo ? true : false }
      );
      
      setSnackbar({
        open: true,
        message: 'Documento eliminado correctamente',
        severity: 'success'
      });
      
      await fetchPasoDocumentos();
      notificarCambios();
      
    } catch (error) {
      console.error("Error al eliminar documento:", error);
      setSnackbar({
        open: true,
        message: `Error al eliminar documento: ${error.message}`,
        severity: 'error'
      });
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
      await procedimientosService.updatePasoDocumento(
        pasoId,
        currentDocumentoPasoId,
        { notas: currentNotas }
      );
      
      await fetchPasoDocumentos();
      notificarCambios();
      
      setSnackbar({
        open: true,
        message: 'Notas actualizadas correctamente',
        severity: 'success'
      });
    } catch (error) {
      console.error("Error al guardar notas:", error);
      setSnackbar({
        open: true,
        message: `Error al guardar notas: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setOpenNotasDialog(false);
    }
  };

  const getIconByFileType = (documento) => {
    if (documento.documento_detalle.url) {
      return <LinkIcon color="primary" />;
    }
    
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

  const handleDirectDownload = async (e, documentoUrl) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const fileName = documentoUrl.split('/').pop();
      
      let fullUrl = documentoUrl;
      if (!fullUrl.startsWith('http')) {
        if (fullUrl.startsWith('/api/media')) {
          fullUrl = fullUrl.replace('/api/media', '/media');
        }
        if (!fullUrl.startsWith('/')) {
          fullUrl = '/' + fullUrl;
        }
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        fullUrl = baseUrl + fullUrl;
      }
      
      const button = e.currentTarget;
      const originalInnerHTML = button.innerHTML;
      button.disabled = true;
      button.innerHTML = '<span class="MuiCircularProgress-root MuiCircularProgress-indeterminate MuiCircularProgress-colorPrimary" style="width: 18px; height: 18px;" role="progressbar"></span>';
      
      const response = await axios({
        url: fullUrl,
        method: 'GET',
        responseType: 'blob',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/octet-stream'
      });
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = blobUrl;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 200);
      
      setTimeout(() => {
        button.disabled = false;
        button.innerHTML = originalInnerHTML;
      }, 1000);
      
    } catch (error) {
      console.error('Error al descargar el documento:', error);
      e.currentTarget.disabled = false;
      e.currentTarget.innerHTML = '<svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeSmall" focusable="false" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12h2v5h16v-5h2v5a2 2 0 01-2 2H4a2 2 0 01-2-2v-5zm10-7.41l3.88 3.88 1.41-1.42L12 2.59 6.71 7.88l1.41 1.42L12 5.41z"></path></svg>';
    }
  };

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
        
        {isAdmin && (
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
          {isAdmin && (
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
                    {isAdmin && (
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
                          onClick={(e) => handleDirectDownload(e, docPaso.documento_detalle.archivo_url)}
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
      
      <DocumentoForm
        open={openDocumentoForm}
        onClose={handleCloseDocumentoForm}
        onSubmit={handleSubmitDocumento}
        initialData={documentoActual}
        procedimientoId={procedimientoId}
      />
      
      <Dialog
        open={openConfirmDelete}
        onClose={handleConfirmDeleteClose}
      >
        <DialogTitle>Eliminar documento</DialogTitle>
        <DialogContent>
          <Typography>
            {confirmDeleteMessage}
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({...snackbar, open: false})}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({...snackbar, open: false})} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PasoDocumentosManager;