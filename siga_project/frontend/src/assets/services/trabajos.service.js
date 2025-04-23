import api from './api';

const getTrabajos = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== '' && params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });
    
    const response = await api.get(`/procedimientos/trabajos/?${queryParams.toString()}`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al obtener trabajos');
  }
};

const getTrabajoById = async (id) => {
  try {
    const response = await api.get(`/procedimientos/trabajos/${id}/`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al obtener el trabajo');
  }
};

const createTrabajo = async (trabajoData) => {
  try {
    const response = await api.post('/procedimientos/trabajos/', trabajoData);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al crear el trabajo');
  }
};

const pausarTrabajo = async (id) => {
  try {
    const response = await api.post(`/procedimientos/trabajos/${id}/pausar/`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al pausar el trabajo');
  }
};

const reanudarTrabajo = async (id) => {
  try {
    const response = await api.post(`/procedimientos/trabajos/${id}/reanudar/`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al reanudar el trabajo');
  }
};

const cancelarTrabajo = async (id) => {
  try {
    const response = await api.post(`/procedimientos/trabajos/${id}/cancelar/`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al cancelar el trabajo');
  }
};

const getPasoTrabajo = async (id) => {
  try {
    const response = await api.get(`/procedimientos/pasos-trabajo/${id}/`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al obtener el paso');
  }
};

const iniciarPasoTrabajo = async (id) => {
  try {
    const response = await api.post(`/procedimientos/pasos-trabajo/${id}/iniciar/`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al iniciar el paso');
  }
};

const completarPasoTrabajo = async (id, formData) => {
  try {
    const response = await api.post(`/procedimientos/pasos-trabajo/${id}/completar/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al completar el paso');
  }
};

const trabajosService = {
  getTrabajos,
  getTrabajoById,
  createTrabajo,
  pausarTrabajo,
  reanudarTrabajo,
  cancelarTrabajo,
  getPasoTrabajo,
  iniciarPasoTrabajo,
  completarPasoTrabajo
};

export default trabajosService;