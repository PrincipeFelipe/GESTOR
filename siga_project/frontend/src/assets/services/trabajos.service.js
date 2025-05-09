import api from './api';

// Solo definir la ruta relativa, sin host
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

// Mejorar la función completarPasoTrabajo para manejar correctamente FormData
const completarPasoTrabajo = async (pasoId, data) => {
  try {
    let config = {};
    
    // Configurar headers según el tipo de datos a enviar
    if (data instanceof FormData) {
      config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
      
      // Log para depuración
      console.log("Enviando FormData para paso", pasoId);
      
      // Inspeccionar el FormData
      for (let pair of data.entries()) {
        console.log(pair[0], pair[1] instanceof File ? `[Archivo: ${pair[1].name}]` : pair[1]);
      }
    } else {
      config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      console.log("Enviando JSON para paso", pasoId, data);
    }
    
    const response = await api.post(`${BASE_URL}/pasos-trabajo/${pasoId}/completar/`, data, config);
    return response.data;
  } catch (error) {
    // Mejorar el manejo de errores para dar más información
    console.error("Error al completar el paso:", error);
    console.error("Detalles del error:", error.response?.data || error.message);
    throw error.response?.data || new Error("Error al completar el paso");
  }
};

// Modificar la función getAlertasPlazos para aceptar el parámetro isSuperAdmin
const getAlertasPlazos = async (isSuperAdmin = false) => {
  try {
    // Si es SuperAdmin, añadir un parámetro para obtener todas las alertas
    const params = isSuperAdmin ? { all: true } : {};
    const response = await api.get(`${BASE_URL}/alertas-plazos/`, { params });
    return response.data;
  } catch (error) {
    console.error('Error al obtener alertas de plazos:', error);
    return [];
  }
};

// Añadir esta función al objeto trabajosService
const getPasoTrabajoById = async (pasoId) => {
  try {
    const response = await api.get(`${BASE_URL}/pasos-trabajo/${pasoId}/`);
    return response;
  } catch (error) {
    console.error(`Error al obtener detalles del paso ${pasoId}:`, error);
    throw new Error(error.response?.data?.detail || 'Error al obtener detalles del paso');
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
  completarPasoTrabajo,
  getAlertasPlazos,
  getPasoTrabajoById // Añadir este método
};

export default trabajosService;