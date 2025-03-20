// Servicio para manejar navegaciones desde fuera de componentes React
let navigate = null;

export const registerNavigate = (navigateFunction) => {
  navigate = navigateFunction;
};

export const navigateTo = (path, options) => {
  if (navigate) {
    navigate(path, options);
  } else {
    console.warn('Navigation service not initialized yet');
  }
};

export default {
  registerNavigate,
  navigateTo
};