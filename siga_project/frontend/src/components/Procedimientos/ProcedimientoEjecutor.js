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
  Alert
} from '@mui/material';
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

  if (loading) {
    return <Box sx={{ p: 3, textAlign: 'center' }}>Cargando procedimiento...</Box>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!procedimiento || pasos.length === 0) {
    return <Alert severity="info">No se encontró el procedimiento o no tiene pasos definidos.</Alert>;
  }

  return (
    <Box sx={{ maxWidth: '800px', mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {procedimiento.nombre}
      </Typography>
      
      <Typography variant="subtitle1" gutterBottom color="text.secondary">
        {procedimiento.tipo_nombre} • Versión {procedimiento.version || '1.0'}
      </Typography>
      
      <Stepper activeStep={pasoActual.numero - 1} alternativeLabel sx={{ my: 4 }}>
        {pasos.map((paso) => (
          <Step key={paso.id} completed={paso.numero < pasoActual.numero}>
            <StepLabel>{paso.titulo}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom color="primary">
          Paso {pasoActual.numero}: {pasoActual.titulo}
        </Typography>
        
        {pasoActual.responsable && (
          <Typography variant="subtitle2" gutterBottom color="text.secondary">
            Responsable: {pasoActual.responsable}
          </Typography>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="body1" paragraph>
          {pasoActual.descripcion}
        </Typography>
        
        {/* Documentos asociados */}
        {pasoActual.documentos && pasoActual.documentos.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Documentos necesarios:
            </Typography>
            <Box component="ul">
              {pasoActual.documentos.map((docPaso) => (
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
        {pasoActual.bifurcaciones && pasoActual.bifurcaciones.length > 0 && (
          <Box sx={{ mt: 3, mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend">Seleccione la situación aplicable:</FormLabel>
              <RadioGroup value={respuestaCondicion} onChange={handleRespuestaChange}>
                {pasoActual.bifurcaciones.map((bifurcacion, index) => (
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
      </Paper>
      
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
            pasoActual.numero === pasos.length
          }
        >
          {pasoActual.numero === pasos.length ? 'Finalizar' : 'Siguiente paso'}
        </Button>
      </Box>
    </Box>
  );
};

export default ProcedimientoEjecutor;