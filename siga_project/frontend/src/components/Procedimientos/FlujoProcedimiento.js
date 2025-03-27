import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText,
  Divider,
  Button,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Timeline, 
  TimelineItem, 
  TimelineSeparator, 
  TimelineConnector, 
  TimelineContent, 
  TimelineDot, 
  TimelineOppositeContent 
} from '@mui/lab';
import { 
  ArrowForward as ArrowForwardIcon,
  CallSplit as CallSplitIcon 
} from '@mui/icons-material';

const FlujoProcedimiento = ({ pasos }) => {
  const [tabIndex, setTabIndex] = React.useState(0);
  
  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    <Paper sx={{ p: 3, mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Visualización del flujo del procedimiento
      </Typography>
      
      <Tabs 
        value={tabIndex} 
        onChange={handleTabChange} 
        sx={{ mb: 2 }}
      >
        <Tab label="Línea de tiempo" />
        <Tab label="Diagrama de flujo" />
      </Tabs>
      
      {tabIndex === 0 && (
        <Timeline position="alternate">
          {pasos.map((paso, index) => (
            <TimelineItem key={paso.id}>
              <TimelineOppositeContent color="text.secondary">
                Paso {paso.numero}
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot color={paso.bifurcaciones?.length ? "secondary" : "primary"} />
                {index < pasos.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent>
                <Paper elevation={3} sx={{ p: 2, bgcolor: paso.bifurcaciones?.length ? 'rgba(156, 39, 176, 0.05)' : 'white' }}>
                  <Typography variant="h6" component="span">
                    {paso.titulo}
                  </Typography>
                  <Typography>{paso.responsable}</Typography>
                  
                  {paso.bifurcaciones && paso.bifurcaciones.length > 0 && (
                    <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed rgba(0,0,0,0.1)' }}>
                      <Typography variant="body2" color="textSecondary">
                        <CallSplitIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                        Este paso tiene {paso.bifurcaciones.length} {paso.bifurcaciones.length === 1 ? 'bifurcación' : 'bifurcaciones'}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      )}
      
      {tabIndex === 1 && (
        <Box sx={{ overflowX: 'auto', p: 2 }}>
          {/* Aquí podríamos implementar una visualización más compleja tipo diagrama de flujo */}
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            La visualización de diagrama de flujo está en desarrollo...
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default FlujoProcedimiento;