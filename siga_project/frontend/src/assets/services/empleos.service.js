import api from './api';

const getAll = async (page = 1, pageSize = 10) => {
  try {
    const response = await api.get(`/empleos/?page=${page}&page_size=${pageSize}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al obtener empleos');
  }
};

const getById = async (id) => {
  try {
    const response = await api.get(`/empleos/${id}/`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al obtener el empleo');
  }
};

const create = async (empleoData) => {
  try {
    const response = await api.post('/empleos/', empleoData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al crear empleo');
  }
};

const update = async (id, empleoData) => {
  try {
    const response = await api.put(`/empleos/${id}/`, empleoData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al actualizar empleo');
  }
};

const remove = async (id) => {
  try {
    const response = await api.delete(`/empleos/${id}/`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al eliminar empleo');
  }
};

const empleosService = {
  getAll,
  getById,
  create,
  update,
  remove
};

export default empleosService;