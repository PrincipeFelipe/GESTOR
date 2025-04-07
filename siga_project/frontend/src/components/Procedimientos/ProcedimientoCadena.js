import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Button, Stepper, Step, StepLabel, StepContent,
  CircularProgress, Divider
} from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import procedimientosService from '../../assets/services/procedimientos.service';

const ProcedimientoCadena = () => {
  const { procedimientoId } = useParams();
  const navigate = useNavigate();
  
  const [cadena, setCadena] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  
  useEffect(() => {
    const fetchCadena = async () => {
      try {
        setLoading(true);
        const response = await procedimientosService.getProcedimientoCadena(procedimientoId);
        
        setCadena(response.data.cadena_completa);
        // Encontrar el índice del procedimiento actual en la cadena
        const index = response.data.cadena_completa.findIndex(p => p.id === parseInt(procedimientoId));
        setActiveStep(index >= 0 ? index : 0);
      } catch (error) {
        console.error('Error al cargar la cadena de procedimientos:', error);
        setError('Error al cargar la cadena de procedimientos');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCadena();
  }, [procedimientoId]);
  
  const handleNavigateToProcedimiento = (id) => {
    navigate(`/dashboard/procedimientos/${id}/pasos`);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Paper sx={{ p: 3, mb: 3, color: 'error.main' }}>
        <Typography>{error}</Typography>
      </Paper>
    );
  }
  
  return (
    <Box>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(`/dashboard/procedimientos/${procedimientoId}/pasos`)}
        sx={{ mb: 2 }}
      >
        Volver al procedimiento
      </Button>
      
      <Typography variant="h5" gutterBottom>
        Cadena completa del procedimiento
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {cadena.map((proc, index) => (
            <Step key={proc.id} completed={index <= activeStep}>
              <StepLabel>
                <Typography variant="subtitle1">
                  {proc.nivel_display}: {proc.nombre}
                </Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {proc.descripcion}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Estado: {proc.estado} • Versión: {proc.version}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => handleNavigateToProcedimiento(proc.id)}
                    size="small"
                    endIcon={<ArrowForward />}
                  >
                    Ver detalles y pasos
                  </Button>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>
    </Box>
  );
};

export default ProcedimientoCadena;