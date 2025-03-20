import api from './api';

// Corregir la URL base - quitar el /api/ porque ya se incluye en api.js
const BASE_URL = '/procedimientos';  // Quitar el /api/

// Procedimientos
const getProcedimientos = (params) => {
  return api.get(`${BASE_URL}/procedimientos/`, { params });
};

const getProcedimiento = (id) => {
  console.log(`Solicitando procedimiento con ID: ${id}`);
  return api.get(`${BASE_URL}/procedimientos/${id}/`);
};

const createProcedimiento = (data) => {
  return api.post(`${BASE_URL}/procedimientos/`, data);
};

const updateProcedimiento = (id, data) => {
  return api.put(`${BASE_URL}/procedimientos/${id}/`, data);
};

const deleteProcedimiento = (id) => {
  return api.delete(`${BASE_URL}/procedimientos/${id}/`);
};

const crearNuevaVersion = (id, data) => {
  return api.post(`${BASE_URL}/procedimientos/${id}/nueva_version/`, data);
};

// Tipos de Procedimiento
const getTiposProcedimiento = () => {
  return api.get(`${BASE_URL}/tipos/`);
};

const getTipoProcedimiento = (id) => {
  return api.get(`${BASE_URL}/tipos/${id}/`);
};

const createTipoProcedimiento = (data) => {
  return api.post(`${BASE_URL}/tipos/`, data);
};

const updateTipoProcedimiento = (id, data) => {
  return api.put(`${BASE_URL}/tipos/${id}/`, data);
};

const deleteTipoProcedimiento = (id) => {
  return api.delete(`${BASE_URL}/tipos/${id}/`);
};

// Pasos
const getPasos = (procedimientoId) => {
  console.log("Obteniendo pasos para procedimiento:", procedimientoId);
  return api.get(`${BASE_URL}/pasos/`, { 
    params: { procedimiento: procedimientoId } 
  });
};

const getPaso = (id) => {
  return api.get(`${BASE_URL}/pasos/${id}/`);
};

const createPaso = (data) => {
  return api.post(`${BASE_URL}/pasos/`, data);
};

const updatePaso = (id, data) => {
  return api.put(`${BASE_URL}/pasos/${id}/`, data);
};

const deletePaso = (id) => {
  return api.delete(`${BASE_URL}/pasos/${id}/`);
};

// Documentos
const getDocumentos = (params) => {
  return api.get(`${BASE_URL}/documentos/`, { params });
};

const getDocumento = (id) => {
  return api.get(`${BASE_URL}/documentos/${id}/`);
};

const createDocumento = (data) => {
  // Para manejar archivos
  const formData = new FormData();
  
  Object.keys(data).forEach(key => {
    if (key === 'archivo' && data[key] !== null) {
      formData.append(key, data[key], data[key].name);
    } else if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });
  
  return api.post(`${BASE_URL}/documentos/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

const updateDocumento = (id, data) => {
  // Para manejar archivos
  const formData = new FormData();
  
  Object.keys(data).forEach(key => {
    if (key === 'archivo' && data[key] !== null && data[key] instanceof File) {
      formData.append(key, data[key], data[key].name);
    } else if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });
  
  return api.put(`${BASE_URL}/documentos/${id}/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

const deleteDocumento = (id) => {
  return api.delete(`${BASE_URL}/documentos/${id}/`);
};

// Historial
const getHistorialProcedimiento = (procedimientoId) => {
  return api.get(`${BASE_URL}/historial/`, {
    params: { procedimiento: procedimientoId }
  });
};

// En el servicio


const procedimientosService = {
  getProcedimientos,
  getProcedimiento,
  createProcedimiento,
  updateProcedimiento,
  deleteProcedimiento,
  crearNuevaVersion,
  getTiposProcedimiento,
  getTipoProcedimiento,
  createTipoProcedimiento,
  updateTipoProcedimiento,
  deleteTipoProcedimiento,
  getPasos,
  getPaso,
  createPaso,
  updatePaso,
  deletePaso,
  getDocumentos,
  getDocumento,
  createDocumento,
  updateDocumento,
  deleteDocumento,
  getHistorialProcedimiento
};



export default procedimientosService;