import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const DocumentosList = () => {
  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" component="h1">
          Documentos
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Esta página está en desarrollo. Pronto podrás gestionar los documentos de los procedimientos.
        </Typography>
      </Paper>
    </Box>
  );
};

export default DocumentosList;