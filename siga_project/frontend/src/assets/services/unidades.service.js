// Servicio para gestionar unidades

import api from './api';

const BASE_URL = '/unidades';

// Obtener todas las unidades
const getAll = async (page = 1, pageSize = 10, disablePagination = false) => {
  try {
    const params = {
      page: page,
      page_size: pageSize
    };
    
    // Si queremos deshabilitar la paginación completamente
    if (disablePagination) {
      params.pagination = 'false';  // Enviar como string para que Django lo interprete correctamente
      params.page_size = 1000;      // Un número grande para obtener todas las unidades
    }
    
    console.log("Solicitud a la API de unidades con params:", params);
    
    const response = await api.get(`${BASE_URL}/`, { params });
    console.log("Respuesta de la API de unidades:", response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error al obtener unidades:', error);
    throw new Error('Error al cargar unidades');
  }
};

// Obtener una unidad por su ID
const getById = async (id) => {
  try {
    const response = await api.get(`${BASE_URL}/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener unidad ${id}:`, error);
    throw new Error(`Error al cargar la unidad con ID ${id}`);
  }
};

// Crear una nueva unidad
const create = async (unidad) => {
  try {
    // Eliminar el campo cod_unidad si existe para evitar conflictos
    const { cod_unidad, ...unidadData } = unidad;
    
    const response = await api.post(`${BASE_URL}/`, unidadData);
    return response.data;
  } catch (error) {
    console.error('Error al crear unidad:', error);
    
    // Propagar el error original para manejarlo en el componente
    if (error.response && error.response.data) {
      const errorDetails = error.response.data.detail || 'Error al crear unidad';
      throw new Error(errorDetails);
    }
    throw new Error('Error al crear unidad');
  }
};

// Actualizar una unidad existente
const update = async (id, data) => {
  try {
    console.log("Actualizando unidad con datos:", data);
    
    // Asegurarnos de que el cod_unidad esté presente en la petición
    // Si no existe, hacemos primero una petición GET para obtenerlo
    let datosCompletos = { ...data };
    
    if (!datosCompletos.cod_unidad || datosCompletos.cod_unidad === '') {
      try {
        // Obtener la unidad actual para extraer su código
        const unidadActual = await getById(id);
        datosCompletos.cod_unidad = unidadActual.cod_unidad;
        console.log("Código recuperado para actualización:", datosCompletos.cod_unidad);
      } catch (err) {
        console.error("Error al recuperar el código de unidad:", err);
        // Usar un valor temporal solo para que la petición no falle
        datosCompletos.cod_unidad = "temp_code";
      }
    }
    
    // Usar la misma estructura de URL que en las otras funciones
    const response = await api.put(`${BASE_URL}/${id}/`, datosCompletos);
    
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar unidad ${id}:`, error);
    
    // Mejorar el manejo de errores
    if (error.response && error.response.data) {
      const errorDetail = error.response.data.detail || JSON.stringify(error.response.data);
      throw new Error(`Error al actualizar la unidad: ${errorDetail}`);
    }
    
    throw new Error(`Error al actualizar la unidad con ID ${id}`);
  }
};

// Eliminar una unidad
const remove = async (id) => {
  try {
    await api.delete(`${BASE_URL}/${id}/`);
    return true;
  } catch (error) {
    console.error(`Error al eliminar unidad ${id}:`, error);
    throw new Error(`Error al eliminar la unidad con ID ${id}`);
  }
};

export default {
  getAll,
  getById,
  create,
  update,
  remove
};