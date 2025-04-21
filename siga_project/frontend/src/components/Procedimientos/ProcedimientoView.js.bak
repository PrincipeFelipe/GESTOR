import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const ProcedimientoView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard/procedimientos')}
            sx={{ mr: 2 }}
          >
            Volver
          </Button>
          <Typography variant="h5" component="h1">
            Detalle de Procedimiento
          </Typography>
        </Box>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Esta página está en desarrollo. Pronto podrás ver los detalles del procedimiento con ID: {id}.
        </Typography>
      </Paper>
    </Box>
  );
};

export default ProcedimientoView;