import api from './api';

// Definir la BASE_URL al principio del archivo
const BASE_URL = '/procedimientos';

const getTrabajos = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== '' && params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });
    
    const response = await api.get(`${BASE_URL}/trabajos/?${queryParams.toString()}`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al obtener trabajos');
  }
};

// Actualizar todas las otras funciones para usar BASE_URL también
const getTrabajoById = async (id) => {
  try {
    const response = await api.get(`${BASE_URL}/trabajos/${id}/`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al obtener el trabajo');
  }
};

const createTrabajo = async (trabajoData) => {
  try {
    const response = await api.post(`${BASE_URL}/trabajos/`, trabajoData);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al crear el trabajo');
  }
};

const pausarTrabajo = async (id) => {
  try {
    const response = await api.post(`${BASE_URL}/trabajos/${id}/pausar/`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al pausar el trabajo');
  }
};

const reanudarTrabajo = async (id) => {
  try {
    const response = await api.post(`${BASE_URL}/trabajos/${id}/reanudar/`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al reanudar el trabajo');
  }
};

const cancelarTrabajo = async (id) => {
  try {
    const response = await api.post(`${BASE_URL}/trabajos/${id}/cancelar/`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al cancelar el trabajo');
  }
};

const getPasoTrabajo = async (id) => {
  try {
    const response = await api.get(`${BASE_URL}/pasos-trabajo/${id}/`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al obtener el paso');
  }
};

const iniciarPasoTrabajo = async (id) => {
  try {
    const response = await api.post(`${BASE_URL}/pasos-trabajo/${id}/iniciar/`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Error al iniciar el paso');
  }
};

// Mejora la función completarPasoTrabajo para manejar mejor los diferentes formatos de datos
const completarPasoTrabajo = async (pasoId, data) => {
  try {
    let config = {};
    
    // Determinar si estamos usando FormData o un objeto JSON
    if (data instanceof FormData) {
      config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
    } else {
      // Si es un objeto JSON normal, puede que necesitemos explícitamente especificar el tipo de contenido
      config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
    }
    
    const response = await api.post(`${BASE_URL}/pasos-trabajo/${pasoId}/completar/`, data, config);
    return response.data;
  } catch (error) {
    console.error("Error al completar el paso:", error.response?.data || error);
    throw new Error("Error al completar el paso");
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