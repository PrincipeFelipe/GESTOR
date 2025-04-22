import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, 
  Paper, 
  Typography, 
  Stepper, 
  Step, 
  StepLabel, 
  Button, 
  FormControl, 
  FormLabel, 
  RadioGroup, 
  FormControlLabel, 
  Radio, 
  Divider,
  Alert,
  Chip,
  Checkbox
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import SendIcon from '@mui/icons-material/Send';
import procedimientosService from '../../assets/services/procedimientos.service';

const ProcedimientoEjecutor = () => {
  const { procedimientoId } = useParams();
  const [procedimiento, setProcedimiento] = useState(null);
  const [pasos, setPasos] = useState([]);
  const [pasoActual, setPasoActual] = useState(null);
  const [historialPasos, setHistorialPasos] = useState([]);
  const [indiceHistorial, setIndiceHistorial] = useState(0);
  const [respuestaCondicion, setRespuestaCondicion] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [finProcedimiento, setFinProcedimiento] = useState(false);
  const [respuestaRecibida, setRespuestaRecibida] = useState(false);

  useEffect(() => {
    const cargarProcedimiento = async () => {
      try {
        setLoading(true);
        const [procedimientoRes, pasosRes] = await Promise.all([
          procedimientosService.getProcedimiento(procedimientoId),
          procedimientosService.getPasos(procedimientoId)
        ]);
        
        setProcedimiento(procedimientoRes.data);
        
        // Procesar pasos
        let pasosData = [];
        if (Array.isArray(pasosRes.data)) {
          pasosData = pasosRes.data;
        } else if (pasosRes.data.results && Array.isArray(pasosRes.data.results)) {
          pasosData = pasosRes.data.results;
        }
        
        // Filtrar los pasos de este procedimiento y ordenarlos
        const pasosFiltrados = pasosData
          .filter(paso => parseInt(paso.procedimiento) === parseInt(procedimientoId))
          .sort((a, b) => a.numero - b.numero);
        
        setPasos(pasosFiltrados);
        
        // Iniciar con el primer paso
        if (pasosFiltrados.length > 0) {
          const primerPaso = pasosFiltrados[0];
          setPasoActual(primerPaso);
          setHistorialPasos([primerPaso]);
        }
      } catch (error) {
        console.error("Error al cargar el procedimiento:", error);
        setError("No se pudo cargar el procedimiento. Por favor, inténtelo de nuevo más tarde.");
      } finally {
        setLoading(false);
      }
    };
    
    cargarProcedimiento();
  }, [procedimientoId]);

  useEffect(() => {
    setRespuestaRecibida(false);
  }, [pasoActual]);

  const handleSiguiente = () => {
    // Si hay bifurcaciones y se seleccionó una condición
    if (pasoActual.bifurcaciones?.length > 0 && respuestaCondicion) {
      // Buscar la bifurcación seleccionada
      const bifurcacionSeleccionada = pasoActual.bifurcaciones.find(
        b => b.condicion === respuestaCondicion
      );
      
      if (bifurcacionSeleccionada) {
        // Encontrar el paso de destino
        const pasoDestino = pasos.find(p => p.id === parseInt(bifurcacionSeleccionada.paso_destino));
        
        if (pasoDestino) {
          setPasoActual(pasoDestino);
          
          // Actualizar el historial
          const nuevoHistorial = historialPasos.slice(0, indiceHistorial + 1);
          nuevoHistorial.push(pasoDestino);
          setHistorialPasos(nuevoHistorial);
          setIndiceHistorial(nuevoHistorial.length - 1);
          
          setRespuestaCondicion('');
          return;
        }
      }
    }
    
    // Verificar si el paso actual es final, y si es así, terminar el procedimiento
    if (pasoActual.es_final) {
      // Mostrar alguna indicación de que el procedimiento ha finalizado
      setFinProcedimiento(true);
      return;
    }
    
    // Si no hay bifurcación seleccionada o no se encontró el paso destino,
    // continuar con el siguiente paso secuencial
    const siguienteNumero = pasoActual.numero + 1;
    const siguientePaso = pasos.find(p => p.numero === siguienteNumero);
    
    if (siguientePaso) {
      setPasoActual(siguientePaso);
      
      // Actualizar el historial
      const nuevoHistorial = historialPasos.slice(0, indiceHistorial + 1);
      nuevoHistorial.push(siguientePaso);
      setHistorialPasos(nuevoHistorial);
      setIndiceHistorial(nuevoHistorial.length - 1);
    }
    
    setRespuestaCondicion('');
  };

  const handleAnterior = () => {
    if (indiceHistorial > 0) {
      setIndiceHistorial(indiceHistorial - 1);
      setPasoActual(historialPasos[indiceHistorial - 1]);
      setRespuestaCondicion('');
    }
  };

  const handleRespuestaChange = (e) => {
    setRespuestaCondicion(e.target.value);
  };

  const calcularTiempoTotal = (pasos) => {
    let total = 0;
    
    pasos.forEach(paso => {
      if (paso.tiempo_estimado) {
        const valor = parseFloat(paso.tiempo_estimado);
        if (!isNaN(valor)) {
          total += valor;
        }
      }
    });
    
    return total;
  };

  if (loading) {
    return <Box sx={{ p: 3, textAlign: 'center' }}>Cargando procedimiento...</Box>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!procedimiento || pasos.length === 0) {
    return <Alert severity="info">No se encontró el procedimiento o no tiene pasos definidos.</Alert>;
  }

  if (finProcedimiento) {
    return <Alert severity="success">El procedimiento ha finalizado.</Alert>;
  }

  return (
    <Box sx={{ maxWidth: '800px', mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {procedimiento.nombre}
      </Typography>
      
      <Typography variant="subtitle1" gutterBottom color="text.secondary">
        {procedimiento.tipo_nombre} • Versión {procedimiento.version || '1.0'}
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          {procedimiento.nombre}
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
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
          
          {procedimiento.tiempo_maximo && (
            <Chip 
              icon={<AccessTimeIcon />}
              label={`Tiempo límite: ${procedimiento.tiempo_maximo} días`}
              size="small"
              color="secondary"
              variant="outlined"
            />
          )}
          <Chip 
            icon={<AccessTimeIcon />}
            label={`Tiempo estimado total: ${calcularTiempoTotal(pasos).toFixed(1)} días`}
            color={calcularTiempoTotal(pasos) > (procedimiento.tiempo_maximo || Infinity) ? "error" : "success"}
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          {procedimiento.descripcion}
        </Typography>
      </Box>

      <Stepper activeStep={pasoActual.numero - 1} alternativeLabel sx={{ my: 4 }}>
        {pasos.map((paso) => (
          <Step key={paso.id} completed={paso.numero < pasoActual.numero}>
            <StepLabel>{paso.titulo}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      <PasoViewer paso={pasoActual} respuestaRecibida={respuestaRecibida} setRespuestaRecibida={setRespuestaRecibida} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button 
          onClick={handleAnterior}
          disabled={indiceHistorial === 0}
          variant="outlined"
        >
          Paso anterior
        </Button>
        
        <Button 
          onClick={handleSiguiente}
          variant="contained"
          color="primary"
          disabled={
            pasoActual.bifurcaciones?.length > 0 && !respuestaCondicion ||
            pasoActual.numero === pasos.length ||
            (pasoActual.requiere_envio && !respuestaRecibida) // Añadir esta condición
          }
        >
          {pasoActual.requiere_envio ? 'Confirmar envío y respuesta' : 'Siguiente paso'}
        </Button>
      </Box>
    </Box>
  );
};

const PasoViewer = ({ paso, respuestaRecibida, setRespuestaRecibida, ...props }) => {
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        mb: 3, 
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #e0e0e0',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: '36px', 
            height: '36px', 
            borderRadius: '50%', 
            bgcolor: 'rgba(33, 150, 243, 0.1)', 
            marginRight: '16px',
            color: 'primary.main',
            fontWeight: 'bold',
            fontSize: '1rem'
          }}>
            {paso.numero}
          </Box>
          <Typography variant="h6">{paso.titulo}</Typography>
        </Box>
        
        {/* Añadir sección para tiempo estimado y responsable */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          {/* Tiempo estimado */}
          {paso.tiempo_estimado && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              bgcolor: 'rgba(33, 150, 243, 0.08)',
              borderRadius: '16px',
              padding: '4px 12px'
            }}>
              <AccessTimeIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
              <Typography variant="body2">
                Tiempo estimado: {paso.tiempo_estimado} {parseFloat(paso.tiempo_estimado) === 1 ? 'día' : 'días'}
              </Typography>
            </Box>
          )}
          
          {/* Responsable (si existe) */}
          {paso.responsable && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              bgcolor: 'rgba(76, 175, 80, 0.08)',
              borderRadius: '16px',
              padding: '4px 12px'
            }}>
              <PersonIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
              <Typography variant="body2">
                Responsable: {paso.responsable}
              </Typography>
            </Box>
          )}
        </Box>
        
        {/* Descripción del paso */}
        <Typography 
          variant="body1" 
          sx={{ 
            mb: 2, 
            whiteSpace: 'pre-line',
            color: 'text.primary',
            lineHeight: 1.6,
            pl: 2,
            borderLeft: '4px solid rgba(33, 150, 243, 0.2)'
          }}
        >
          {paso.descripcion || 'Sin descripción'}
        </Typography>
        
        {/* Documentos asociados */}
        {paso.documentos && paso.documentos.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Documentos necesarios:
            </Typography>
            <Box component="ul">
              {paso.documentos.map((docPaso) => (
                <Box component="li" key={docPaso.id} sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    {docPaso.documento_detalle.nombre}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}
        
        {/* Bifurcaciones */}
        {paso.bifurcaciones && paso.bifurcaciones.length > 0 && (
          <Box sx={{ mt: 3, mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend">Seleccione la situación aplicable:</FormLabel>
              <RadioGroup value={respuestaCondicion} onChange={handleRespuestaChange}>
                {paso.bifurcaciones.map((bifurcacion, index) => (
                  <FormControlLabel
                    key={index}
                    value={bifurcacion.condicion}
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2">{bifurcacion.condicion}</Typography>
                        {bifurcacion.descripcion && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {bifurcacion.descripcion}
                          </Typography>
                        )}
                      </Box>
                    }
                    sx={{ mb: 1 }}
                  />
                ))}
                {/* Opción para seguir el flujo normal */}
                <FormControlLabel
                  value="flujo_normal"
                  control={<Radio />}
                  label="Ninguna de las anteriores (seguir flujo normal)"
                />
              </RadioGroup>
            </FormControl>
          </Box>
        )}

        {/* Añadir alerta especial para pasos que requieren envío */}
        {paso.requiere_envio && (
          <Alert 
            severity="info" 
            icon={<SendIcon fontSize="inherit" />}
            sx={{ mt: 2, mb: 2 }}
          >
            <AlertTitle>Este paso requiere envío</AlertTitle>
            Para continuar con el procedimiento, deberá realizar un envío y esperar la respuesta correspondiente.
          </Alert>
        )}
        
        {/* Añadir componente para confirmar la respuesta */}
        {paso.requiere_envio && !respuestaRecibida && (
          <Box sx={{ mt: 3, p: 2, border: '1px dashed rgba(156, 39, 176, 0.5)', borderRadius: '4px' }}>
            <Typography variant="subtitle2" gutterBottom>
              Confirmación de envío
            </Typography>
            <FormControlLabel
              control={
                <Checkbox
                  onChange={(e) => setRespuestaRecibida(e.target.checked)}
                />
              }
              label="Confirmo que he realizado el envío y he recibido la respuesta necesaria"
            />
          </Box>
        )}
        
      </Box>
    </Paper>
  );
};

export default ProcedimientoEjecutor;