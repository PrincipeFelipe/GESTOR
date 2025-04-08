import api from './api';

const BASE_URL = '/users';

// Obtener listado de usuarios con paginación y filtros
const getAll = async (params = {}) => {
  try {
    const response = await api.get(BASE_URL, { params });
    return response.data;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
};

// Obtener un usuario por su ID
const getById = async (id) => {
  try {
    const response = await api.get(`${BASE_URL}/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener usuario ${id}:`, error);
    throw error;
  }
};

// Crear un nuevo usuario
const create = async (userData) => {
  try {
    const response = await api.post(`${BASE_URL}/`, userData);
    return response.data;
  } catch (error) {
    console.error('Error al crear usuario:', error);
    throw error;
  }
};

// Actualizar un usuario existente
const update = async (id, userData) => {
  try {
    const response = await api.put(`${BASE_URL}/${id}/`, userData);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar usuario ${id}:`, error);
    throw error;
  }
};

// Actualizar campos específicos de un usuario
const partialUpdate = async (id, userData) => {
  try {
    const response = await api.patch(`${BASE_URL}/${id}/`, userData);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar parcialmente usuario ${id}:`, error);
    throw error;
  }
};

// Cambiar el estado de un usuario (activar/desactivar)
const toggleStatus = async (id, isActive) => {
  try {
    const response = await api.patch(`${BASE_URL}/${id}/`, {
      estado: isActive
    });
    return response.data;
  } catch (error) {
    console.error(`Error al cambiar estado del usuario ${id}:`, error);
    throw error;
  }
};

// Cambiar la contraseña de un usuario
const changePassword = async (id, newPassword) => {
  try {
    const response = await api.post(`${BASE_URL}/${id}/change-password/`, {
      password: newPassword
    });
    return response.data;
  } catch (error) {
    console.error(`Error al cambiar contraseña del usuario ${id}:`, error);
    throw error;
  }
};

// Eliminar un usuario
const remove = async (id) => {
  try {
    const response = await api.delete(`${BASE_URL}/${id}/`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar usuario ${id}:`, error);
    throw error;
  }
};

// Obtener las unidades accesibles para un usuario
const getUnidadesAccesibles = async (id) => {
  try {
    const response = await api.get(`${BASE_URL}/${id}/unidades-accesibles/`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener unidades accesibles del usuario ${id}:`, error);
    throw error;
  }
};

// Verificar si un usuario puede acceder a una unidad específica
const puedeAccederUnidad = async (userId, unidadId) => {
  try {
    const response = await api.get(`${BASE_URL}/${userId}/puede-acceder-unidad/${unidadId}/`);
    return response.data.resultado;
  } catch (error) {
    console.error(`Error al verificar acceso a unidad para usuario ${userId}:`, error);
    return false;
  }
};

const usersService = {
  getAll,
  getById,
  create,
  update,
  partialUpdate,
  toggleStatus,
  changePassword,
  remove,
  getUnidadesAccesibles,
  puedeAccederUnidad
};

export default usersService;