import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    IconButton,
    Typography,
    CircularProgress,
    Paper,
    Button,
    Alert
} from '@mui/material';
import { Close, Download as DownloadIcon, OpenInNew } from '@mui/icons-material';
import axios from 'axios';

const DocumentPreview = ({ open, onClose, document: documentData }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [localBlobUrl, setLocalBlobUrl] = useState(null);

    // Determinar el tipo de archivo
    const getFileType = () => {
        if (!documentData) return null;
        
        // Obtener la URL del documento
        const fileUrl = documentData.archivo_url || 
                       (documentData.documento_detalle && documentData.documento_detalle.archivo_url) || 
                       documentData.file_url;
        
        if (!fileUrl) return null;
        
        const fileName = fileUrl.toLowerCase();
        if (fileName.endsWith('.pdf')) return 'pdf';
        if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || 
            fileName.endsWith('.png') || fileName.endsWith('.gif')) return 'image';
        return 'other';
    };

    const fileType = getFileType();
    
    // Abrir en una nueva pestaña
    const handleOpenInNewTab = () => {
        const fileUrl = documentData.archivo_url || 
                       (documentData.documento_detalle && documentData.documento_detalle.archivo_url) || 
                       documentData.file_url;
        if (fileUrl) {
            window.open(fileUrl, '_blank');
        }
    };
    
    // Reemplazar la función handleDownload completa con esta implementación

    const handleDownload = () => {
        // Si ya tenemos el blob cargado, usarlo directamente
        if (localBlobUrl && !loading) {
            const fileName = documentData?.nombre || 
                            (documentData?.documento_detalle && documentData.documento_detalle.nombre) || 
                            documentData?.title || 
                            'documento.pdf';
            
            // Crear un enlace temporal y forzar la descarga
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = localBlobUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            return;
        }
        
        // Si no tenemos el blob aún (por alguna razón), lo descargamos
        const fileUrl = documentData.archivo_url || 
                       (documentData.documento_detalle && documentData.documento_detalle.archivo_url) || 
                       documentData.file_url;
        
        if (!fileUrl) return;
        
        const fileName = documentData?.nombre || 
                        (documentData?.documento_detalle && documentData.documento_detalle.nombre) || 
                        documentData?.title || 
                        'documento.pdf';
        
        // Mostrar indicador de carga
        setLoading(true);
        
        // Descargar el archivo como blob y forzar la descarga
        axios({
            url: fileUrl,
            method: 'GET',
            responseType: 'blob',
        })
        .then(response => {
            // Crear un blob
            const blob = new Blob([response.data], { 
                type: response.headers['content-type'] || getMimeType(fileUrl) 
            });
            
            // Crear una URL del blob
            const url = window.URL.createObjectURL(blob);
            
            // Crear un enlace temporal y forzar la descarga
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            
            // Limpiar
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                setLoading(false);
            }, 100);
        })
        .catch(error => {
            console.error('Error al descargar el documento:', error);
            setLoading(false);
            
            // Si falla, intentar con un método alternativo más directo
            try {
                // Crear un iframe oculto (esto a veces funciona mejor para archivos grandes)
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = fileUrl;
                document.body.appendChild(iframe);
                
                // Alertar al usuario
                alert('Descargando el documento. Si no se inicia automáticamente, intente con el botón "Abrir en nueva pestaña" y luego guarde manualmente el archivo.');
                
                // Limpiar
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 1000);
            } catch (iframeError) {
                console.error('Error en método alternativo:', iframeError);
                alert('No se pudo descargar el archivo. Por favor, utilice el botón "Abrir en nueva pestaña" y luego guarde manualmente el archivo.');
            }
        });
    };
    
    // Función que descarga el documento directamente y crea un blob URL local
    const fetchDocumentBlob = async () => {
        if (!documentData) {
            setError(true);
            setLoading(false);
            return;
        }
        
        const fileUrl = documentData.archivo_url || 
                       (documentData.documento_detalle && documentData.documento_detalle.archivo_url) || 
                       documentData.file_url;
        
        if (!fileUrl) {
            setError(true);
            setLoading(false);
            return;
        }

        // Para depuración
        console.log('Documento completo:', documentData);
        console.log('URL del documento:', fileUrl);
        console.log('Tipo de documento:', fileType);

        try {
            setLoading(true);
            
            // Simplificar los encabezados para evitar problemas de CORS
            const response = await axios.get(fileUrl, {
                responseType: 'blob',
                headers: {}  // Sin encabezados personalizados que puedan causar problemas CORS
            });
            
            // Crear una URL de objeto blob
            const blob = new Blob([response.data], { 
                type: response.headers['content-type'] || getMimeType(fileUrl) 
            });
            const url = URL.createObjectURL(blob);
            
            // Guardar la URL del blob
            setLocalBlobUrl(url);
            setLoading(false);
            setError(false);
        } catch (error) {
            console.error('Error al cargar el documento:', error);
            setError(true);
            setLoading(false);
        }
    };

    // Función para adivinar el MIME type basado en la extensión del archivo
    const getMimeType = (url) => {
        const ext = url.split('.').pop().toLowerCase();
        const mimeTypes = {
            'pdf': 'application/pdf',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        };
        return mimeTypes[ext] || 'application/octet-stream';
    };

    // Cargar el documento cuando el componente se monte o cambie el documento
    useEffect(() => {
        if (documentData) {
            fetchDocumentBlob();
        }
        
        // Limpiar la URL del blob cuando el componente se desmonte
        return () => {
            if (localBlobUrl) {
                URL.revokeObjectURL(localBlobUrl);
                setLocalBlobUrl(null);
            }
        };
    }, [documentData]);

    // Obtener el nombre del documento
    const documentName = documentData?.nombre || 
                        (documentData?.documento_detalle && documentData.documento_detalle.nombre) || 
                        documentData?.title || 
                        'Documento';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: { 
                    height: '80vh',
                    display: 'flex', 
                    flexDirection: 'column'
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Typography variant="h6" component="div" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {documentName}
                </Typography>
                <Box>
                    <IconButton 
                        onClick={handleOpenInNewTab}
                        title="Abrir en nueva pestaña"
                    >
                        <OpenInNew />
                    </IconButton>
                    <IconButton 
                        onClick={handleDownload}
                        title="Descargar"
                    >
                        <DownloadIcon />
                    </IconButton>
                    <IconButton onClick={onClose} title="Cerrar">
                        <Close />
                    </IconButton>
                </Box>
            </DialogTitle>
            
            <DialogContent sx={{ flexGrow: 1, overflow: 'hidden', p: 0 }}>
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress />
                    </Box>
                )}
                
                {!loading && !error && fileType === 'pdf' && localBlobUrl && (
                    <Box sx={{ width: '100%', height: '100%', overflow: 'hidden', background: '#f5f5f5' }}>
                        <object
                            data={localBlobUrl}
                            type="application/pdf"
                            width="100%"
                            height="100%"
                            style={{ border: 'none' }}
                        >
                            <Alert severity="warning" sx={{ m: 2 }}>
                                Tu navegador no puede mostrar PDFs directamente. 
                                <Button 
                                    onClick={handleOpenInNewTab}
                                    variant="text" 
                                    color="primary"
                                    sx={{ ml: 1 }}
                                >
                                    Abrir en nueva pestaña
                                </Button>
                            </Alert>
                        </object>
                    </Box>
                )}
                
                {!loading && !error && fileType === 'image' && localBlobUrl && (
                    <Box 
                        sx={{ 
                            height: '100%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            overflow: 'auto',
                            background: '#f5f5f5',
                            p: 2
                        }}
                    >
                        <img
                            src={localBlobUrl}
                            alt={documentName}
                            style={{ 
                                maxWidth: '100%', 
                                maxHeight: '100%', 
                                objectFit: 'contain'
                            }}
                        />
                    </Box>
                )}
                
                {(error || fileType === 'other' || (!localBlobUrl && !loading)) && (
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        flexDirection: 'column',
                        height: '100%',
                        p: 3,
                        textAlign: 'center' 
                    }}>
                        <Paper sx={{ p: 4, maxWidth: '80%' }}>
                            <Typography variant="h6" gutterBottom>
                                {error ? 'Error al cargar el documento' : 'Vista previa no disponible'}
                            </Typography>
                            <Typography variant="body1" paragraph>
                                {error ? 
                                    'Ha ocurrido un error al intentar mostrar este documento.' : 
                                    'Este tipo de documento no se puede previsualizar directamente en el navegador.'}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
                                <Button 
                                    variant="contained" 
                                    onClick={handleOpenInNewTab}
                                    startIcon={<OpenInNew />}
                                >
                                    Abrir en nueva pestaña
                                </Button>
                                <Button 
                                    variant="outlined" 
                                    onClick={handleDownload}
                                    startIcon={<DownloadIcon />}
                                >
                                    Descargar
                                </Button>
                            </Box>
                        </Paper>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default DocumentPreview;