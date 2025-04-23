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

// Añadir esta función al servicio
const getProcedimientoCadena = (id) => {
  return api.get(`${BASE_URL}/procedimientos/${id}/cadena_completa/`);
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
const getPasos = async (procedimientoId, extraParams = {}) => {
  if (extraParams.pagination === false) {
    // Si se solicita obtener todos los registros sin paginación
    let todosLosPasos = [];
    let pagina = 1;
    let hayMasPaginas = true;
    
    // Hacer peticiones iterativas hasta obtener todos los pasos
    while (hayMasPaginas) {
      const params = {
        procedimiento: procedimientoId,
        page: pagina,
        page_size: 50,
        ...extraParams
      };
      
      delete params.pagination; // Eliminar parámetro personalizado que no entiende la API
      
      try {
        const response = await api.get(`${BASE_URL}/pasos/`, { params });
        
        let pasosObtenidos = [];
        if (Array.isArray(response.data)) {
          pasosObtenidos = response.data;
          hayMasPaginas = false; // Si la API devuelve un array directamente, no hay paginación
        } else if (response.data.results && Array.isArray(response.data.results)) {
          pasosObtenidos = response.data.results;
          hayMasPaginas = !!response.data.next; // Hay más páginas si existe "next"
        } else {
          hayMasPaginas = false;
        }
        
        todosLosPasos = [...todosLosPasos, ...pasosObtenidos];
        pagina++;
        
        // Salida de seguridad si algo sale mal
        if (pagina > 10) break;
      } catch (error) {
        console.error("Error obteniendo pasos:", error);
        hayMasPaginas = false;
      }
    }
    
    // Crear una estructura similar a la respuesta paginada pero con todos los pasos
    return {
      data: {
        results: todosLosPasos,
        count: todosLosPasos.length
      }
    };
  } else {
    // Comportamiento original con paginación
    const params = {
      procedimiento: procedimientoId,
      page: extraParams.page || 1,
      page_size: extraParams.page_size || 10,
      ...extraParams
    };
    
    // Si pagination está definido pero no es false, eliminarlo
    if ('pagination' in params) {
      delete params.pagination;
    }
    
    return api.get(`${BASE_URL}/pasos/`, { params });
  }
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
const getDocumentos = async (procedimientoId) => {
  if (!procedimientoId) {
    throw new Error('ID de procedimiento no proporcionado');
  }
  
  try {
    // Elimina el '/api' adicional aquí
    const response = await api.get(`${BASE_URL}/documentos/?procedimiento=${procedimientoId}`);
    return response;
  } catch (error) {
    console.error('Error al obtener documentos del procedimiento:', error);
    throw error;
  }
};

const getDocumento = (id) => {
  return api.get(`${BASE_URL}/documentos/${id}/`);
};

// Modificar la función createDocumento para soportar carpetas
const createDocumento = (data) => {
  // Para manejar la subida de archivos con FormData
  const formData = new FormData();
  
  Object.keys(data).forEach(key => {
    if (key === 'archivo' && data[key] instanceof File) {
      // Al subir un archivo, el backend decidirá dónde guardarlo según el procedimiento y paso
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

// Añadir función para obtener documentos por paso
const getDocumentosPorPaso = (pasoId) => {
  return api.get(`${BASE_URL}/pasos/${pasoId}/documentos/`);
};

// Corrige esta función para evitar la duplicación de '/api/'
const getDocumentosGenerales = async (procedimientoId) => {
  if (!procedimientoId) {
    throw new Error('ID de procedimiento no proporcionado');
  }
  
  try {
    const response = await api.get(`${BASE_URL}/procedimientos/${procedimientoId}/documentos-generales/`);
    return response;
  } catch (error) {
    console.error(`Error al obtener documentos generales del procedimiento ${procedimientoId}:`, error);
    throw error;
  }
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

// Añadir esta función específica para cargar documentos a un paso
const addDocumentToPaso = (pasoId, data) => {
  // Para manejar la subida de archivos con FormData
  const formData = new FormData();
  
  Object.keys(data).forEach(key => {
    if (key === 'archivo' && data[key] instanceof File) {
      formData.append(key, data[key]);
    } else if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });
  
  return api.post(`${BASE_URL}/pasos/${pasoId}/documentos/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
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
  getDocumentosPorPaso,
  getDocumentosGenerales,
  
  getPasoDocumentos,
  addDocumentoPaso,
  removeDocumentoPaso,
  addDocumentToPaso,
  
  getHistorial,
  getNextAvailableNumber,
  getProcedimientoCadena
};

export default procedimientosService;