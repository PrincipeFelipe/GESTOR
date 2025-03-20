import api from './api';

const getAll = async (page = 1, pageSize = 10) => {
  try {
    const response = await api.get(`/users/?page=${page}&page_size=${pageSize}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al obtener usuarios');
  }
};

const getById = async (id) => {
  try {
    const response = await api.get(`/users/${id}/`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al obtener el usuario');
  }
};

const create = async (userData) => {
  try {
    const response = await api.post('/users/', userData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al crear usuario');
  }
};

const update = async (id, userData) => {
  try {
    const response = await api.put(`/users/${id}/`, userData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al actualizar usuario');
  }
};

const remove = async (id) => {
  try {
    const response = await api.delete(`/users/${id}/`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al eliminar usuario');
  }
};

// Nuevos métodos
const getProfile = async () => {
  try {
    const response = await api.get('/users/profile/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

const changePassword = async (passwordData) => {
  try {
    const response = await api.post('/users/change_password/', passwordData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const usersService = {
  getAll,
  getById,
  create,
  update,
  remove,
  getProfile,
  changePassword
};

export default usersService;