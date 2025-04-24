import React, { useState, useEffect} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  CircularProgress,
  Divider,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  AlertTitle,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import PendingIcon from '@mui/icons-material/Pending';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DescriptionIcon from '@mui/icons-material/Description';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import LaunchIcon from '@mui/icons-material/Launch';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import VideocamIcon from '@mui/icons-material/Videocam';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import trabajosService from '../../assets/services/trabajos.service';
import DocumentPreview from '../common/DocumentPreview';

import FolderIcon from '@mui/icons-material/Folder';

const TrabajoEjecutor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [trabajo, setTrabajo] = useState(null);
  const [pasos, setPasos] = useState([]);
  const [pasoActual, setPasoActual] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [respuestaCondicion, setRespuestaCondicion] = useState('');
  const [notasCompletado, setNotasCompletado] = useState('');
  const [envioData, setEnvioData] = useState({
    numero_salida: '',
    notas_adicionales: ''
  });
  const [envioFile, setEnvioFile] = useState(null);
  const [envioErrors, setEnvioErrors] = useState({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState({ url: '', name: '' });
  
  useEffect(() => {
    const fetchTrabajo = async () => {
      try {
        setLoading(true);
        // Obtener detalles del trabajo
        const response = await trabajosService.getTrabajoById(id);
        console.log("Datos completos del trabajo:", response.data);
        
        // IMPORTANTE: Primero filtramos los documentos generales que ya vienen en la respuesta
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
          
          // Asegúrate de que procedimiento_detalle existe antes de intentar modificarlo
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
          setTrabajo({
            ...response.data,
            procedimiento_detalle: {
              ...response.data.procedimiento_detalle,
              documentos: []
            }
          });
        }
        
        // Resto del código para procesar pasos...
        if (response.data.pasos) {
          const sortedPasos = [...response.data.pasos].sort((a, b) => {
            return a.paso_numero - b.paso_numero;
          });
          
          // Tu código existente para enriquecer los pasos...
          const pasosEnriquecidos = sortedPasos.map(paso => {
            // El código existente...
            if (!paso.paso_detalle || !paso.paso_detalle.documentos) {
              // Buscar el paso correspondiente en el procedimiento
              const pasoProcedimiento = response.data.procedimiento_detalle?.pasos?.find(
                p => p.numero === paso.paso_numero
              );
              
              if (pasoProcedimiento) {
                // Asegurarnos de que las bifurcaciones son seguras de procesar
                let bifurcaciones = [];
                if (pasoProcedimiento.bifurcaciones && Array.isArray(pasoProcedimiento.bifurcaciones)) {
                  bifurcaciones = pasoProcedimiento.bifurcaciones.map(bif => ({
                    ...bif,
                    // Asegurar que paso_destino_id siempre es un valor válido
                    paso_destino_id: bif.paso_destino_id || null,
                    paso_destino_numero: bif.paso_destino_numero || '?'
                  }));
                }
                
                return {
                  ...paso,
                  paso_detalle: {
                    ...paso.paso_detalle,
                    titulo: paso.paso_detalle?.titulo || pasoProcedimiento.titulo,
                    descripcion: paso.paso_detalle?.descripcion || pasoProcedimiento.descripcion,
                    tiempo_estimado: paso.paso_detalle?.tiempo_estimado || pasoProcedimiento.tiempo_estimado,
                    responsable: paso.paso_detalle?.responsable || pasoProcedimiento.responsable,
                    requiere_envio: paso.paso_detalle?.requiere_envio || pasoProcedimiento.requiere_envio,
                    bifurcaciones: paso.paso_detalle?.bifurcaciones || bifurcaciones,
                    documentos: paso.paso_detalle?.documentos || pasoProcedimiento.documentos || [],
                    es_final: paso.paso_detalle?.es_final || pasoProcedimiento.es_final
                  }
                };
              }
            }
            return paso;
          });
          
          console.log("Pasos enriquecidos:", pasosEnriquecidos);
          setPasos(pasosEnriquecidos);
          
          // Establecer paso actual
          const pasoEnProgreso = pasosEnriquecidos.find(p => p.estado === 'EN_PROGRESO');
          const primerPasoPendiente = pasosEnriquecidos.find(p => p.estado === 'PENDIENTE');
          const pasoActual = pasoEnProgreso || primerPasoPendiente || pasosEnriquecidos[0];
          
          setPasoActual(pasoActual);
          setActiveStep(pasosEnriquecidos.indexOf(pasoActual));
        }
      } catch (error) {
        console.error('Error al cargar trabajo:', error);
        setError('No se pudo cargar el trabajo solicitado');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrabajo();
  }, [id]);

  // Corregir el useEffect que causa el bucle infinito (líneas 99-113)

  // Observar cambios en el paso activo para cargar detalles adicionales si es necesario
  useEffect(() => {
    // Añadir una bandera para evitar bucles infinitos
    if (!pasoActual || !trabajo || !trabajo.procedimiento_detalle) return;
    
    // Si ya tiene documentos, no hacer nada
    if (pasoActual.paso_detalle?.documentos && 
        pasoActual.paso_detalle.documentos.length > 0) {
      return;
    }
    
    // Buscar el paso correspondiente en el procedimiento
    const pasoProcedimiento = trabajo.procedimiento_detalle.pasos?.find(
      p => p.numero === pasoActual.paso_numero
    );
    
    // Solo actualizar si encontramos el paso en el procedimiento y tiene documentos
    if (pasoProcedimiento && pasoProcedimiento.documentos && 
        (!pasoActual.paso_detalle?.documentos || pasoActual.paso_detalle.documentos.length === 0)) {
      
      // Actualizar el paso en la lista de pasos sin modificar la referencia del estado pasos directamente
      setPasos(prevPasos => {
        const updatedPasos = prevPasos.map(paso => {
          if (paso.id === pasoActual.id) {
            return {
              ...paso,
              paso_detalle: {
                ...paso.paso_detalle,
                documentos: pasoProcedimiento.documentos
              }
            };
          }
          return paso;
        });
        
        // Actualizar también el pasoActual con la misma información
        const updatedPasoActual = updatedPasos.find(p => p.id === pasoActual.id);
        if (updatedPasoActual) {
          setPasoActual(updatedPasoActual);
        }
        
        return updatedPasos;
      });
    }
    
    // La dependencia pasoActual.id en lugar de pasoActual completo ayuda a evitar bucles
  }, [pasoActual?.id, trabajo?.id]);

  useEffect(() => {
    // Resetear la respuesta de bifurcación al cambiar de paso
    setRespuestaCondicion('');
  }, [activeStep, pasoActual?.id]);

  // Añade un useEffect para depurar cuando cambia respuestaCondicion
useEffect(() => {
  if (respuestaCondicion) {
    console.log("respuestaCondicion actualizada:", respuestaCondicion);
    console.log("Tipo:", typeof respuestaCondicion);
    
    // Intentar convertir a número para verificar
    const numerico = parseInt(respuestaCondicion, 10);
    console.log("Valor convertido a número:", numerico, "es NaN:", isNaN(numerico));
    
    // Mostrar información de la bifurcación seleccionada
    if (pasoActual?.paso_detalle?.bifurcaciones) {
      const bifurcacionSeleccionada = pasoActual.paso_detalle.bifurcaciones.find(b => 
        String(b.paso_destino_id) === respuestaCondicion
      );
      console.log("Bifurcación seleccionada:", bifurcacionSeleccionada);
    }
  }
}, [respuestaCondicion, pasoActual]);

// 2. Agrega este useEffect después del useEffect para reiniciar respuestaCondicion (~línea 235)
useEffect(() => {
  // Si el paso actual tiene solo una bifurcación, seleccionarla automáticamente
  if (
    pasoActual?.estado === 'EN_PROGRESO' &&
    pasoActual?.paso_detalle?.bifurcaciones &&
    Array.isArray(pasoActual.paso_detalle.bifurcaciones) &&
    pasoActual.paso_detalle.bifurcaciones.length === 1
  ) {
    const bifurcacion = pasoActual.paso_detalle.bifurcaciones[0];
    let valueToUse;
    
    // Usar la misma lógica que en la renderización para determinar el valor
    if (bifurcacion.paso_destino_id !== undefined && bifurcacion.paso_destino_id !== null) {
      valueToUse = String(bifurcacion.paso_destino_id);
    } else if (bifurcacion.paso_destino !== undefined && bifurcacion.paso_destino !== null) {
      valueToUse = String(bifurcacion.paso_destino);
    } else {
      valueToUse = `fallback-0`;
    }
    
    console.log("Seleccionando automáticamente la única bifurcación disponible:", valueToUse);
    setRespuestaCondicion(valueToUse);
  }
}, [pasoActual]);

  const handleBack = () => {
    navigate(`/dashboard/trabajos/${id}`);
  };

  const handlePreviewDocument = (url, name) => {
    setPreviewDocument({ url, name });
    setPreviewOpen(true);
  };

  const handleDirectDownload = (e, url) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Crear un elemento <a> temporal
    const link = document.createElement('a');
    link.href = url;
    
    // Extraer el nombre del archivo de la URL
    const fileName = url.split('/').pop().split('?')[0];
    
    // Establecer el atributo download
    link.setAttribute('download', fileName);
    
    // Hacer la descarga de manera programática
    document.body.appendChild(link);
    link.click();
    
    // Limpieza: eliminar el elemento
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      setEnvioFile(event.target.files[0]);
      setEnvioErrors(prev => ({ ...prev, documentacion: undefined }));
    }
  };

  const handleEnvioChange = (e) => {
    const { name, value } = e.target;
    setEnvioData(prev => ({ 
      ...prev, 
      [name]: value 
    }));
    
    if (name === 'numero_salida' && value) {
      setEnvioErrors(prev => ({ ...prev, numero_salida: undefined }));
    }
  };

  const validarEnvio = () => {
    const errores = {};
    
    if (!envioData.numero_salida) {
      errores.numero_salida = 'Debe ingresar el número de salida';
    }
    
    if (!envioFile) {
      errores.documentacion = 'Debe adjuntar el archivo con la documentación';
    }
    
    setEnvioErrors(errores);
    return Object.keys(errores).length === 0;
  };

  const handlePasoInicio = async () => {
    if (!pasoActual || pasoActual.estado !== 'PENDIENTE') return;
    
    setSubmitting(true);
    try {
      await trabajosService.iniciarPasoTrabajo(pasoActual.id);
      window.location.reload();
    } catch (err) {
      console.error('Error al iniciar paso:', err);
      alert('Ocurrió un error al iniciar el paso. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  // Modifica la función handlePasoCompletado
const handlePasoCompletado = async () => {
  if (!pasoActual || pasoActual.estado !== 'EN_PROGRESO') return;
  
  console.log("Intentando completar paso:", pasoActual.id);
  console.log("Tiene bifurcaciones:", pasoActual.paso_detalle?.bifurcaciones?.length > 0);
  console.log("Respuesta bifurcación seleccionada:", respuestaCondicion);
  
  // Verificar que si hay bifurcaciones, se ha seleccionado una (excepto para bifurcación única)
  if (
    pasoActual.paso_detalle?.bifurcaciones && 
    Array.isArray(pasoActual.paso_detalle.bifurcaciones) &&
    pasoActual.paso_detalle.bifurcaciones.length > 1 && // Solo verificar para múltiples opciones
    !respuestaCondicion
  ) {
    alert('Debe seleccionar un camino para continuar');
    return;
  }
  
  if (pasoActual.paso_detalle && pasoActual.paso_detalle.requiere_envio && !validarEnvio()) {
    return;
  }
  
  setSubmitting(true);
  try {
    // Formamos la estructura base de los datos a enviar
    const requestData = {
      notas: notasCompletado || ''
    };
    
    // Añadimos la información de bifurcación si corresponde
    if (pasoActual.paso_detalle?.bifurcaciones && 
        Array.isArray(pasoActual.paso_detalle.bifurcaciones) &&
        pasoActual.paso_detalle.bifurcaciones.length > 0 && 
        respuestaCondicion) {
      
      console.log("Valor original de la bifurcación elegida:", respuestaCondicion);
      
      // Verificar si se trata de un valor de fallback
      if (respuestaCondicion.startsWith('fallback-')) {
        // Obtener el índice del valor de fallback
        const index = parseInt(respuestaCondicion.replace('fallback-', ''), 10);
        
        // Buscar la bifurcación correspondiente
        const bifurcacion = pasoActual.paso_detalle.bifurcaciones[index];
        
        if (bifurcacion) {
          console.log("Usando bifurcación de fallback:", bifurcacion);
          
          if (bifurcacion.paso_destino) {
            // IMPORTANTE: Usar paso_destino como bifurcacion_elegida
            const pasoDestinoNumero = parseInt(bifurcacion.paso_destino, 10);
            if (!isNaN(pasoDestinoNumero)) {
              console.log("Usando paso_destino como bifurcacion_elegida:", pasoDestinoNumero);
              requestData.bifurcacion_elegida = pasoDestinoNumero;
            }
          } else if (bifurcacion.paso_destino_numero && bifurcacion.paso_destino_numero !== '?') {
            // Intentar usar paso_destino_numero si tiene un valor numérico
            const pasoDestinoNumero = parseInt(bifurcacion.paso_destino_numero, 10);
            if (!isNaN(pasoDestinoNumero)) {
              console.log("Usando paso_destino_numero como bifurcacion_elegida:", pasoDestinoNumero);
              requestData.bifurcacion_elegida = pasoDestinoNumero;
            }
          }
          
          // Si no se pudo obtener un valor numérico para bifurcacion_elegida
          if (!requestData.bifurcacion_elegida) {
            console.warn("No se encontró un valor numérico válido para bifurcacion_elegida");
            throw new Error("No se pudo determinar el valor de bifurcación");
          }
        }
      } else {
        // Intentar convertir a número entero
        const bifurcacionId = parseInt(respuestaCondicion, 10);
        
        // Si es un número válido, usarlo como bifurcacion_elegida
        if (!isNaN(bifurcacionId)) {
          console.log("Enviando bifurcación elegida (como número):", bifurcacionId);
          requestData.bifurcacion_elegida = bifurcacionId;
        } else {
          // Si no es un número, pero tampoco es un fallback, mostrar una advertencia
          console.warn("Valor de bifurcación no es un número válido ni un fallback:", respuestaCondicion);
          throw new Error("El ID de bifurcación no es válido");
        }
      }
      
      // Verificación final para asegurarnos de que tenemos un valor numérico
      if (requestData.bifurcacion_elegida === undefined || 
          requestData.bifurcacion_elegida === null || 
          isNaN(requestData.bifurcacion_elegida)) {
        console.error("No se pudo determinar un valor válido para bifurcacion_elegida");
        throw new Error("No se pudo determinar un valor válido para la bifurcación");
      }
    }
    
    // Preparar los datos a enviar según si hay archivos o no
    let dataToSend;

    if (pasoActual.paso_detalle && pasoActual.paso_detalle.requiere_envio) {
      const formData = new FormData();
      
      // IMPORTANTE: No enviar los datos como un único JSON, sino separados
      // Añadir campos básicos del paso
      formData.append('notas', notasCompletado || '');
      
      if (requestData.bifurcacion_elegida) {
        formData.append('bifurcacion_elegida', requestData.bifurcacion_elegida);
      }
      
      // Añadir los campos del envío por separado, no como un objeto JSON anidado
      formData.append('numero_salida', envioData.numero_salida);
      if (envioData.notas_adicionales) {
        formData.append('notas_adicionales', envioData.notas_adicionales);
      }
      
      // Añadir el archivo - mantener el nombre 'documentacion'
      if (envioFile) {
        formData.append('documentacion', envioFile);
      }
      
      // Verificar contenido del FormData para depuración
      console.log("FormData creado con estructura plana:");
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1] instanceof File ? `[Archivo: ${pair[1].name}]` : pair[1]);
      }
      
      dataToSend = formData;
    } else {
      // Para casos sin archivos, enviamos directamente el JSON
      dataToSend = requestData;
    }
    
    console.log("Datos a enviar:", dataToSend);
    
    const result = await trabajosService.completarPasoTrabajo(pasoActual.id, dataToSend);
    console.log("Paso completado con éxito:", result);
    window.location.reload();
  } catch (err) {
    console.error('Error al completar paso:', err);
    alert('Ocurrió un error al completar el paso. Inténtalo de nuevo.');
  } finally {
    setSubmitting(false);
  }
};

  // Mejorar la función getDocumentoIcon
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

  // Añadir esta función para verificar si hay documentos cargados
  const hayDocumentosVisibles = () => {
    // Verificar documentos en pasos
    const hayDocumentosEnPasos = pasos.some(paso => 
      paso.paso_detalle && 
      paso.paso_detalle.documentos && 
      paso.paso_detalle.documentos.length > 0
    );
    
    // Verificar documentos generales del procedimiento
    const hayDocumentosGenerales = trabajo?.procedimiento_detalle?.documentos && 
      trabajo.procedimiento_detalle.documentos.length > 0;
    
    return hayDocumentosEnPasos || hayDocumentosGenerales;
  };


  const getStepIcon = (paso) => {
    switch (paso.estado) {
      case 'COMPLETADO':
        return <CheckCircleIcon fontSize="small" color="success" />;
      case 'EN_PROGRESO':
        return <PlayArrowIcon fontSize="small" color="primary" />;
      case 'BLOQUEADO':
        return <PendingIcon fontSize="small" color="disabled" />;
      case 'PENDIENTE':
        return <PendingIcon fontSize="small" color="info" />;
      default:
        return <PendingIcon fontSize="small" />;
    }
  };

// Modifica la función calcularProgreso para que sea más precisa
const calcularProgreso = () => {
  if (!pasos || pasos.length === 0) return 0;
  const completados = pasos.filter(p => p.estado === 'COMPLETADO').length;
  return Math.round((completados / pasos.length) * 100);
};

// Función para obtener el número del paso actual (no su ID)
const obtenerNumeroPasoActual = () => {
  if (!pasoActual || !pasos.length) return 1;
  
  // Si hay un paso en progreso, ese es el actual
  const enProgreso = pasos.find(p => p.estado === 'EN_PROGRESO');
  if (enProgreso) return enProgreso.paso_numero;
  
  // Si no hay ninguno en progreso, buscar el primer pendiente
  const primerPendiente = pasos.find(p => p.estado === 'PENDIENTE');
  if (primerPendiente) return primerPendiente.paso_numero;
  
  // Si todos están completados, mostrar el último número
  const ultimoPaso = [...pasos].sort((a, b) => b.paso_numero - a.paso_numero)[0];
  return ultimoPaso ? ultimoPaso.paso_numero : 1;
};

// Añadir esta función para mostrar indicador de plazo
const renderPlazoPaso = (paso) => {
  // Solo mostrar para pasos en progreso o pendientes con fecha_inicio
  if (paso.estado !== 'EN_PROGRESO' && paso.estado !== 'PENDIENTE' || !paso.fecha_inicio) {
    return null;
  }
  
  // Verificar si tiene tiempo_estimado definido
  if (!paso.paso_detalle?.tiempo_estimado) {
    return null;
  }
  
  // Calcular fecha límite y días restantes
  const fechaInicio = new Date(paso.fecha_inicio);
  const tiempoEstimado = parseFloat(paso.paso_detalle.tiempo_estimado);
  const fechaLimite = new Date(fechaInicio);
  fechaLimite.setDate(fechaLimite.getDate() + tiempoEstimado);
  
  const hoy = new Date();
  const diasRestantes = Math.ceil((fechaLimite - hoy) / (1000 * 60 * 60 * 24));
  
  // Determinar color según días restantes
  let color = 'success';
  let mensaje = `${diasRestantes} días restantes`;
  
  if (diasRestantes <= 0) {
    color = 'error';
    mensaje = 'Plazo vencido';
  } else if (diasRestantes <= 1) {
    color = 'error';
    mensaje = diasRestantes === 1 ? 'Vence mañana' : 'Vence hoy';
  } else if (diasRestantes <= 2) {
    color = 'warning';
    mensaje = `${diasRestantes} días restantes`;
  }
  
  return (
    <Chip
      size="small"
      icon={<AccessTimeIcon />}
      label={mensaje}
      color={color}
      variant="outlined"
      sx={{ ml: 1 }}
    />
  );
};

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/dashboard/trabajos')}
          sx={{ mt: 2 }}
        >
          Volver a la lista
        </Button>
      </Box>
    );
  }

  if (!trabajo || !pasoActual) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No se encontró el trabajo solicitado o todos los pasos están completados.</Typography>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/dashboard/trabajos')}
          sx={{ mt: 2 }}
        >
          Volver a la lista
        </Button>
      </Box>
    );
  }

  if (trabajo.estado === 'COMPLETADO' || trabajo.estado === 'CANCELADO') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity={trabajo.estado === 'COMPLETADO' ? 'success' : 'warning'} sx={{ mb: 3 }}>
          <AlertTitle>
            {trabajo.estado === 'COMPLETADO' ? 'Trabajo completado' : 'Trabajo cancelado'}
          </AlertTitle>
          Este trabajo ya ha sido {trabajo.estado === 'COMPLETADO' ? 'completado' : 'cancelado'} y no se puede seguir ejecutando.
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBack}
          variant="outlined"
        >
          Ver detalles del trabajo
        </Button>
      </Box>
    );
  }

  if (trabajo.estado === 'PAUSADO') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>Trabajo en pausa</AlertTitle>
          Este trabajo está actualmente pausado. Para continuar, reanude el trabajo desde la página de detalles.
        </Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBack}
          variant="outlined"
        >
          Ir a detalles del trabajo
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
          Volver a detalles
        </Button>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Progreso: {progreso}% (Paso {obtenerNumeroPasoActual()} de {pasos.length})
          </Typography>
          <Box sx={{ width: 200 }}>
            <LinearProgress variant="determinate" value={progreso} />
          </Box>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              {trabajo.titulo}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Procedimiento: {trabajo.procedimiento_detalle.nombre}
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1, mb: 2 }}>
              <Chip 
                icon={<PersonIcon />}
                label={`Usuario: ${trabajo.usuario_creador_nombre}`}
                variant="outlined"
                size="small"
              />
              <Chip 
                icon={<CalendarTodayIcon />}
                label={`Inicio: ${format(new Date(trabajo.fecha_inicio), 'dd/MM/yyyy', { locale: es })}`}
                variant="outlined"
                size="small"
              />
              {trabajo.procedimiento_detalle.tiempo_maximo && (
                <Chip 
                  icon={<AccessTimeIcon />}
                  label={`Tiempo máx: ${trabajo.procedimiento_detalle.tiempo_maximo} días`}
                  variant="outlined"
                  size="small"
                  color="secondary"
                />
              )}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mt: 3 }}>
              <Stepper activeStep={activeStep} orientation="vertical">
                {pasos.map((paso, index) => (
                  <Step key={paso.id} completed={paso.estado === 'COMPLETADO'}>
                    <StepLabel 
                      StepIconComponent={() => getStepIcon(paso)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1">
                          {paso.paso_detalle && paso.paso_detalle.titulo ? 
                            paso.paso_detalle.titulo : 
                            `Paso ${paso.paso_numero}`}
                        </Typography>
                        
                        {renderPlazoPaso(paso)}
                        
                        {paso.paso_detalle && paso.paso_detalle.requiere_envio && (
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
                    
                    {activeStep === index && (
                      <StepContent>
                        <Card 
                          elevation={0} 
                          sx={{ 
                            mb: 2, 
                            bgcolor: 'background.paper',
                            p: 2,
                            border: '1px solid #e0e0e0',
                            borderLeft: '4px solid #2196f3',
                            borderRadius: 2
                          }}
                        >
                          <CardContent sx={{ pb: '16px !important' }}>
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                              {paso.paso_detalle?.descripcion || 'No hay descripción disponible'}
                            </Typography>
                            
                            <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                              {paso.paso_detalle?.tiempo_estimado && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <AccessTimeIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Tiempo estimado:</strong> {paso.paso_detalle.tiempo_estimado} {parseFloat(paso.paso_detalle.tiempo_estimado) === 1 ? 'día' : 'días'}
                                  </Typography>
                                </Box>
                              )}
                              
                              {paso.paso_detalle?.responsable && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <PersonIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Responsable:</strong> {paso.paso_detalle.responsable}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                            
                            {paso.paso_detalle?.requiere_envio && (
                              <Alert 
                                severity="info" 
                                icon={<SendIcon />}
                                sx={{ mt: 2 }}
                              >
                                <AlertTitle>Este paso requiere envío</AlertTitle>
                                Para completar este paso, deberá realizar un envío y registrar el número de salida
                                junto con la documentación adjunta.
                              </Alert>
                            )}
                          </CardContent>
                        </Card>
                        
                        {/* Documentos asociados al paso */}
                        {paso.paso_detalle?.documentos && paso.paso_detalle.documentos.length > 0 && (
                          <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                              <DescriptionIcon fontSize="small" sx={{ mr: 1 }} />
                              Documentos asociados:
                            </Typography>
                            
                            <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: '6px' }}>
                              <List disablePadding>
                                {paso.paso_detalle.documentos.map((docPaso, index) => (
                                  <React.Fragment key={docPaso.id}>
                                    {index > 0 && <Divider />}
                                    <ListItem 
                                      sx={{
                                        py: 1.5,
                                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' }
                                      }}
                                    >
                                      <ListItemIcon>
                                        {getDocumentoIcon(docPaso.documento_detalle)}
                                      </ListItemIcon>
                                      <ListItemText
                                        primary={
                                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                              {docPaso.documento_detalle?.nombre || "Documento sin nombre"}
                                            </Typography>
                                            {docPaso.documento_detalle?.extension && (
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
                                        ) || docPaso.documento_detalle?.descripcion}
                                      />
                                      <Box sx={{ display: 'flex' }}>
                                        {docPaso.documento_detalle?.archivo_url && (
                                          <>
                                            <Tooltip title="Visualizar">
                                              <IconButton
                                                size="small"
                                                onClick={() => handlePreviewDocument(docPaso.documento_detalle.archivo_url, docPaso.documento_detalle.nombre || 'Documento')}
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
                                        {docPaso.documento_detalle?.url && (
                                          <Tooltip title="Abrir enlace externo">
                                            <IconButton
                                              size="small"
                                              onClick={() => window.open(docPaso.documento_detalle.url, '_blank')}
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
                        
                        {/* Opciones para bifurcaciones */}
                        {paso.estado === 'EN_PROGRESO' && 
                         paso.paso_detalle?.bifurcaciones && 
                         Array.isArray(paso.paso_detalle.bifurcaciones) && 
                         // Solo mostrar si hay más de una bifurcación
                         paso.paso_detalle.bifurcaciones.length > 1 && (
                          <Box sx={{ mt: 3 }}>
                            <FormControl component="fieldset" required>
                              <FormLabel component="legend">Seleccione el siguiente paso:</FormLabel>
                              <RadioGroup 
                                name="bifurcacion" 
                                value={respuestaCondicion}
                                onChange={(e) => {
                                  const selectedValue = e.target.value;
                                  console.log("Bifurcación seleccionada (original):", selectedValue);
                                  setRespuestaCondicion(selectedValue);
                                }}
                              >
                                {paso.paso_detalle.bifurcaciones.map((bifurcacion, index) => {
                                  // Verificar la estructura de los datos
                                  console.log(`Bifurcación ${index}:`, bifurcacion);
                                  
                                  // IMPORTANTE: Usar paso_destino cuando paso_destino_id es nulo
                                  let valueToUse;
                                  
                                  if (bifurcacion.paso_destino_id !== undefined && bifurcacion.paso_destino_id !== null) {
                                    // Si hay un ID válido, usarlo
                                    valueToUse = String(bifurcacion.paso_destino_id);
                                  } else if (bifurcacion.paso_destino !== undefined && bifurcacion.paso_destino !== null) {
                                    // Usar paso_destino si está disponible
                                    valueToUse = String(bifurcacion.paso_destino);
                                  } else {
                                    // Si no hay ID ni paso_destino, usar un fallback
                                    console.warn(`Bifurcación ${index} no tiene IDs válidos:`, bifurcacion);
                                    valueToUse = `fallback-${index}`;
                                  }
                                  
                                  return (
                                    <FormControlLabel 
                                      key={`bifurc-${index}`} 
                                      value={valueToUse}
                                      control={<Radio color="primary" />} 
                                      label={
                                        <Typography variant="body2">
                                          {bifurcacion.descripcion || `Ir al paso ${bifurcacion.paso_destino_numero || '?'}`}
                                        </Typography>
                                      }
                                    />
                                  );
                                })}
                              </RadioGroup>
                            </FormControl>
                          </Box>
                        )}

                        {/* Agregar mensaje informativo para bifurcación única */}
                        {paso.estado === 'EN_PROGRESO' && 
                         paso.paso_detalle?.bifurcaciones && 
                         Array.isArray(paso.paso_detalle.bifurcaciones) && 
                         paso.paso_detalle.bifurcaciones.length === 1 && (
                          <Box sx={{ mt: 3 }}>
                            <Alert severity="info" icon={<SendIcon />}>
                              <AlertTitle>Paso con ruta predefinida</AlertTitle>
                              Este paso tiene una única ruta posible: 
                              <strong>{paso.paso_detalle.bifurcaciones[0].descripcion || 
                                `Ir al paso ${paso.paso_detalle.bifurcaciones[0].paso_destino_numero || '?'}`}</strong>
                            </Alert>
                          </Box>
                        )}
                        
                        {/* Formulario para envío */}
                        {paso.estado === 'EN_PROGRESO' && paso.paso_detalle?.requiere_envio && (
                          <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              <SendIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                              Registrar información de envío
                            </Typography>
                            <TextField
                              label="Número de salida"
                              name="numero_salida"
                              value={envioData.numero_salida}
                              onChange={handleEnvioChange}
                              fullWidth
                              margin="normal"
                              required
                              error={Boolean(envioErrors.numero_salida)}
                              helperText={envioErrors.numero_salida}
                            />
                            <TextField
                              label="Notas adicionales (opcional)"
                              name="notas_adicionales"
                              value={envioData.notas_adicionales}
                              onChange={handleEnvioChange}
                              fullWidth
                              multiline
                              rows={3}
                              margin="normal"
                            />
                            <Box sx={{ mt: 2 }}>
                              <Button
                                component="label"
                                variant="outlined"
                                startIcon={<UploadFileIcon />}
                              >
                                Adjuntar documentación (ZIP)
                                <input
                                  type="file"
                                  accept=".zip"
                                  hidden
                                  onChange={handleFileChange}
                                />
                              </Button>
                              {envioFile && (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  Archivo seleccionado: {envioFile.name}
                                </Typography>
                              )}
                              {envioErrors.documentacion && (
                                <Typography color="error" variant="caption" sx={{ display: 'block', mt: 1 }}>
                                  {envioErrors.documentacion}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        )}
                        
                        {/* Notas para completar el paso */}
                        {paso.estado === 'EN_PROGRESO' && (
                          <TextField
                            label="Notas de completado (opcional)"
                            value={notasCompletado}
                            onChange={(e) => setNotasCompletado(e.target.value)}
                            fullWidth
                            multiline
                            rows={3}
                            margin="normal"
                            sx={{ mt: 3 }}
                          />
                        )}
                        
                        {/* Acciones del paso */}
                        <Box sx={{ mt: 3 }}>
                          {paso.estado === 'PENDIENTE' && (
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={handlePasoInicio}
                              disabled={submitting}
                            >
                              {submitting ? <CircularProgress size={24} /> : 'Iniciar paso'}
                            </Button>
                          )}
                          
                          {paso.estado === 'EN_PROGRESO' && (
                            <Button
                              variant="contained"
                              color="success"
                              onClick={handlePasoCompletado}
                              disabled={
                                submitting || 
                                (paso.paso_detalle && paso.paso_detalle.bifurcaciones?.length > 0 && !respuestaCondicion)
                              }
                            >
                              {submitting ? <CircularProgress size={24} /> : 'Completar paso'}
                            </Button>
                          )}
                          
                          {paso.estado === 'BLOQUEADO' && (
                            <Typography color="textSecondary">
                              Este paso está bloqueado. Complete los pasos anteriores para desbloquearlo.
                            </Typography>
                          )}
                          
                          {paso.estado === 'COMPLETADO' && (
                            <Typography color="success.main">
                              Este paso ya ha sido completado por {paso.usuario_completado_nombre || 'un usuario'}.
                            </Typography>
                          )}
                        </Box>
                      </StepContent>
                    )}
                  </Step>
                ))}
              </Stepper>
            </Box>

            <Divider sx={{ mt: 4, mb: 3 }} />


          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Resumen del Trabajo
            </Typography>
            <List dense>
              {/* Usuario creador */}
              <ListItem>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Creado por" 
                  secondary={trabajo.usuario_creador_nombre || "No especificado"} 
                />
              </ListItem>
              
              {/* Usuario que inició el trabajo */}
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
              
              {/* El resto de los elementos... */}
              <ListItem>
                <ListItemIcon>
                  <CalendarTodayIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Fecha de inicio" 
                  secondary={format(new Date(trabajo.fecha_inicio), 'dd/MM/yyyy', { locale: es })} 
                />
              </ListItem>
              
              {/* Si existe fecha de actualización, mostrarla */}
              {trabajo.fecha_actualizacion && (
                <ListItem>
                  <ListItemIcon>
                    <CalendarTodayIcon color="secondary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Última actualización" 
                    secondary={format(new Date(trabajo.fecha_actualizacion), 'dd/MM/yyyy', { locale: es })} 
                />
                </ListItem>
              )}
              
              <ListItem>
                <ListItemIcon>
                  <AccessTimeIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Tiempo transcurrido" 
                  secondary={`${trabajo.tiempo_transcurrido_dias} días`} 
                />
              </ListItem>
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
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Progreso del trabajo
              </Typography>
              <LinearProgress variant="determinate" value={progreso} sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary" align="center">
                {progreso}% completado
              </Typography>
            </Box>
          </Paper>

          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <DescriptionIcon sx={{ mr: 1 }} />
              Documentos por paso
            </Typography>
            
            {pasos.some(paso => paso.paso_detalle?.documentos?.length > 0) ? (
              <List dense disablePadding>
                {pasos.filter(paso => paso.paso_detalle?.documentos?.length > 0).map(paso => (
                  <React.Fragment key={paso.id}>
                    <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                      <FolderIcon fontSize="small" sx={{ mr: 0.5, color: paso.estado === 'COMPLETADO' ? 'success.main' : 'primary.main' }} />
                      Paso {paso.paso_numero}: {paso.paso_detalle?.titulo || ''}
                    </Typography>
                    
                    <Box sx={{ ml: 2 }}>
                      {paso.paso_detalle?.documentos?.map(doc => (
                        <ListItem 
                          key={doc.id} 
                          sx={{ 
                            bgcolor: 'background.paper',
                            borderRadius: 1,
                            mb: 0.5,
                            border: '1px solid #eee',
                            py: 0.5,
                            px: 1,
                            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' }
                          }}
                          dense
                        >
                          <ListItemIcon sx={{ minWidth: '30px' }}>
                            {getDocumentoIcon(doc.documento_detalle || doc)}
                          </ListItemIcon>
                          <ListItemText 
                            primary={
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {doc.documento_detalle?.nombre || doc.nombre || "Documento sin nombre"}
                              </Typography>
                            }
                          />
                          <IconButton 
                            size="small"
                            onClick={() => handlePreviewDocument(
                              doc.documento_detalle?.archivo_url || doc.archivo_url, 
                              doc.documento_detalle?.nombre || doc.nombre || 'Documento'
                            )}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </ListItem>
                      ))}
                    </Box>
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No hay documentos asociados a los pasos del trabajo.
              </Typography>
            )}
          </Paper>

          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <DescriptionIcon sx={{ mr: 1, color: 'primary.main' }} />
              Documentación General del Procedimiento
            </Typography>
            
            {trabajo.procedimiento_detalle?.documentos && trabajo.procedimiento_detalle.documentos.length > 0 ? (
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
                              onClick={() => handlePreviewDocument(doc.archivo_url, doc.nombre || 'Documento')}
                              sx={{ mr: 0.5 }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Descargar">
                            <IconButton
                              size="small"
                              onClick={(e) => handleDirectDownload(e, doc.archivo_url)}
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
                            onClick={() => window.open(doc.url, '_blank')}
                          >
                            <LaunchIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center">
                No hay documentos generales asociados a este procedimiento.
              </Typography>
            )}
          </Paper>

          {/* Información de depuración */}
          <Box sx={{ mt: 3, display: 'none' }}> {/* Cambia a display: 'block' para depuración */}
            <Typography variant="subtitle2" gutterBottom>
              Información de depuración
            </Typography>
            <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                {JSON.stringify({
                  hayPasos: pasos.length > 0,
                  pasoActualTieneDetalle: pasoActual?.paso_detalle ? true : false,
                  pasoActualTieneDocumentos: pasoActual?.paso_detalle?.documentos?.length > 0,
                  hayDocumentosEnAlgunPaso: hayDocumentosVisibles()
                }, null, 2)}
              </pre>
            </Paper>
          </Box>
        </Grid>
      </Grid>
      
      {/* Vista previa de documentos */}
      <DocumentPreview 
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        documentUrl={previewDocument.url}
        documentName={previewDocument.name}
      />
    </Box>
  );
};



export default TrabajoEjecutor;