import api from './api';

const BASE_URL = '/api/procedimientos'; // Ajusta según tu API

const getNotificaciones = async () => {
  try {
    const response = await api.get(`${BASE_URL}/notificaciones/`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return [];
  }
};

const marcarComoLeida = async (notificacionId) => {
  try {
    const response = await api.put(`${BASE_URL}/notificaciones/${notificacionId}/leer/`);
    return response.data;
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    throw error;
  }
};

const marcarTodasComoLeidas = async () => {
  try {
    const response = await api.put(`${BASE_URL}/notificaciones/leer-todas/`);
    return response.data;
  } catch (error) {
    console.error('Error al marcar todas las notificaciones como leídas:', error);
    throw error;
  }
};

const notificacionesService = {
  getNotificaciones,
  marcarComoLeida,
  marcarTodasComoLeidas
};

export default notificacionesService;