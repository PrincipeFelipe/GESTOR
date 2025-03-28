import api from './api';

// Corregir la URL base eliminando el prefijo '/api' duplicado
const BASE_URL = '/procedimientos';

const getProcedimientos = (params) => {
  return api.get(`${BASE_URL}/procedimientos/`, { params });
};

const getProcedimiento = (id) => {
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
const getPasos = (procedimientoId, extraParams = {}) => {
  const params = { 
    procedimiento: procedimientoId,
    page_size: 1000, // Asegurar que se carguen todos los pasos
    pagination: false, // Añadir esta línea para deshabilitar la paginación
    ...extraParams
  };
  
  return api.get(`${BASE_URL}/pasos/`, { params });
};

const getPaso = (id) => {
  return api.get(`${BASE_URL}/pasos/${id}/`);
};

const createPaso = async (data) => {
  try {
    console.log("Enviando datos para crear paso:", JSON.stringify(data));
    const response = await api.post(`${BASE_URL}/pasos/`, data);
    console.log("Respuesta al crear paso:", response.data);
    return response;
  } catch (error) {
    console.error("Error en createPaso:", 
      error.response?.data || error.message);
    throw error;
  }
};

const updatePaso = (id, data) => {
  return api.put(`${BASE_URL}/pasos/${id}/`, data);
};

// Revisar la función deletePaso
const deletePaso = (id) => {
  // Asegurarnos de que id es un valor primitivo, no un objeto
  if (typeof id === 'object' && id !== null) {
    console.error('Se recibió un objeto en lugar de un ID:', id);
    id = id.id; // Intentar extraer el ID si es un objeto
  }
  
  // Verificar que tenemos un ID válido
  if (!id) {
    return Promise.reject(new Error('ID de paso no válido'));
  }
  
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
  // Para manejar la subida de archivos con FormData
  const formData = new FormData();
  
  Object.keys(data).forEach(key => {
    if (key === 'archivo' && data[key] instanceof File) {
      formData.append(key, data[key]);
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
  // Similar a createDocumento, para manejar archivos
  const formData = new FormData();
  
  Object.keys(data).forEach(key => {
    if (key === 'archivo' && data[key] instanceof File) {
      formData.append(key, data[key]);
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
const getHistorial = (procedimientoId) => {
  return api.get(`${BASE_URL}/historial/`, {
    params: { procedimiento: procedimientoId }
  });
};

// Documentos de un paso específico
const getPasoDocumentos = (pasoId) => {
  return api.get(`${BASE_URL}/pasos/${pasoId}/`);
};

const addDocumentoPaso = (pasoId, documentoId, data = {}) => {
  return api.post(`${BASE_URL}/pasos/${pasoId}/documentos/`, {
    documento: documentoId,
    orden: data.orden || 1,
    notas: data.notas || ''
  });
};

// Modificar la función removeDocumentoPaso:
const removeDocumentoPaso = (pasoId, documentoPasoId, options = {}) => {
  // Si debemos eliminar el archivo físico, añadir el parámetro a la URL
  const params = options.eliminar_archivo ? '?eliminar_archivo=true' : '';
  return api.delete(`${BASE_URL}/pasos/${pasoId}/documentos/${documentoPasoId}/${params}`);
};

// Añadir la función getNextAvailableNumber
const getNextAvailableNumber = async (procedimientoId) => {
  try {
    // Obtener todos los pasos del procedimiento
    const response = await getPasos(procedimientoId);
    
    // Procesar la respuesta según su estructura
    let pasos = [];
    if (Array.isArray(response.data)) {
      pasos = response.data;
    } else if (response.data.results && Array.isArray(response.data.results)) {
      pasos = response.data.results;
    }
    
    // Filtrar por el procedimiento específico y ordenar por número
    const pasosFiltrados = pasos
      .filter(paso => parseInt(paso.procedimiento) === parseInt(procedimientoId))
      .map(paso => parseInt(paso.numero))
      .sort((a, b) => a - b);
    
    // Encontrar el primer número disponible
    let nextNumber = 1;
    for (const numero of pasosFiltrados) {
      if (numero > nextNumber) {
        // Encontramos un hueco
        break;
      }
      nextNumber = numero + 1;
    }
    
    return nextNumber;
  } catch (error) {
    console.error("Error al calcular el siguiente número disponible:", error);
    // En caso de error, intentar con un valor basado en timestamp
    return Math.floor((Date.now() / 1000) % 10000);
  }
};

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
  
  getPasoDocumentos,
  addDocumentoPaso,
  removeDocumentoPaso,
  
  getHistorial,
  getNextAvailableNumber
};

export default procedimientosService;