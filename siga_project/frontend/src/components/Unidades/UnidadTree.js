import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccountBalance as AccountBalanceIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import unidadesService from '../../assets/services/unidades.service';

const UnidadTree = () => {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    fetchUnidades();
  }, []);

  const fetchUnidades = async () => {
    try {
      setLoading(true);
      const response = await unidadesService.getAll(1, 1000);
      const unidadesData = response.results || response;
      setUnidades(unidadesData);
    } catch (error) {
      console.error("Error al cargar unidades:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (unidadId) => {
    setExpanded(prev => ({
      ...prev,
      [unidadId]: !prev[unidadId]
    }));
  };

  // Función recursiva para construir el árbol
  const buildTree = (unidadesArray, parentId = null) => {
    return unidadesArray
      .filter(unidad => {
        // Si parentId es null, mostrar sólo las unidades raíz (sin padre)
        if (parentId === null) return unidad.id_padre === null;
        // De lo contrario, mostrar las unidades hijas de este padre
        return unidad.id_padre === parentId;
      })
      .map(unidad => {
        const hasChildren = unidades.some(u => u.id_padre === unidad.id);
        const isOpen = expanded[unidad.id] || false;
        
        return (
          <React.Fragment key={unidad.id}>
            <ListItem
              button
              onClick={() => hasChildren && handleToggle(unidad.id)}
              sx={{ 
                pl: parentId ? 4 : 2, 
                borderLeft: parentId ? '1px dashed rgba(0,0,0,0.1)' : 'none',
                ml: parentId ? 2 : 0
              }}
            >
              <ListItemIcon>
                {parentId ? <BusinessIcon /> : <AccountBalanceIcon />}
              </ListItemIcon>
              <ListItemText 
                primary={unidad.nombre}
                primaryTypographyProps={{
                  fontWeight: !parentId ? 600 : 400
                }}
              />
              {hasChildren && (
                isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />
              )}
            </ListItem>
            {hasChildren && (
              <Collapse in={isOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {buildTree(unidadesArray, unidad.id)}
                </List>
              </Collapse>
            )}
            {!parentId && <Divider />}
          </React.Fragment>
        );
      });
  };

  const renderTree = () => {
    const rootUnidades = buildTree(unidades);
    
    if (rootUnidades.length === 0) {
      return (
        <Typography variant="body1" sx={{ textAlign: 'center', mt: 2, color: 'text.secondary' }}>
          No hay unidades disponibles
        </Typography>
      );
    }
    
    return (
      <List>
        {rootUnidades}
      </List>
    );
  };

  return (
    <Paper sx={{ width: '100%', mt: 3, p: 2 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Estructura Jerárquica
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        renderTree()
      )}
    </Paper>
  );
};

export default UnidadTree;