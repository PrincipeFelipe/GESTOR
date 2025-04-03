// Servicio para gestionar unidades

import api from './api';

const BASE_URL = '/unidades';

// Obtener todas las unidades
const getAll = async () => {
  try {
    const response = await api.get(BASE_URL);
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
const update = async (id, unidad) => {
  try {
    // Eliminar el campo cod_unidad si existe para evitar conflictos
    const { cod_unidad, ...unidadData } = unidad;
    
    const response = await api.put(`${BASE_URL}/${id}/`, unidadData);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar unidad ${id}:`, error);
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