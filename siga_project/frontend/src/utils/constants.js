// URLs
export const API_BASE_URL = 'http://localhost:8000/api';

// Roles de usuario
export const USER_ROLES = {
  SUPER_ADMIN: 'SuperAdmin',
  ADMIN: 'Admin',
  GESTOR: 'Gestor',
  USER: 'User'
};

// Estado de usuarios
export const USER_STATUS = {
  ACTIVE: true,
  INACTIVE: false
};

// Mensajes de error
export const ERROR_MESSAGES = {
  LOGIN_FAILED: 'Error al iniciar sesión. Verifica tus credenciales.',
  REGISTER_FAILED: 'Error al registrarse. Intenta nuevamente.',
  NETWORK_ERROR: 'Error de conexión. Verifica tu conexión a internet.',
  SERVER_ERROR: 'Error en el servidor. Intenta más tarde.',
  UNAUTHORIZED: 'No tienes permiso para realizar esta acción.',
  VALIDATION_ERROR: 'Por favor, verifica los datos ingresados.'
};

// Mensajes de éxito
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Sesión iniciada correctamente.',
  REGISTER_SUCCESS: 'Registro completado con éxito.',
  UPDATE_SUCCESS: 'Actualización completada con éxito.',
  DELETE_SUCCESS: 'Eliminación completada con éxito.'
};

// Configuración de paginación
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 25, 50]
};