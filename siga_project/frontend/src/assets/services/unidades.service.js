import api from './api';

const getAll = async (page = 1, pageSize = 10) => {
  try {
    const response = await api.get(`/unidades/?page=${page}&page_size=${pageSize}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al obtener unidades');
  }
};

const getById = async (id) => {
  try {
    const response = await api.get(`/unidades/${id}/`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al obtener la unidad');
  }
};

const create = async (unidadData) => {
  try {
    const response = await api.post('/unidades/', unidadData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al crear unidad');
  }
};

const update = async (id, unidadData) => {
  try {
    const response = await api.put(`/unidades/${id}/`, unidadData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al actualizar unidad');
  }
};

const remove = async (id) => {
  try {
    const response = await api.delete(`/unidades/${id}/`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al eliminar unidad');
  }
};

const unidadesService = {
  getAll,
  getById,
  create,
  update,
  remove
};

export default unidadesService;