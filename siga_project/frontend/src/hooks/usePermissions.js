import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const usePermissions = () => {
  const { user } = useContext(AuthContext);
  
  return {
    isAuthenticated: !!user,
    isAdmin: user && (
      user.tipo_usuario === 'Admin' || 
      user.tipo_usuario === 'SuperAdmin' || 
      user.is_staff || 
      user.is_superuser
    ),
    isSuperAdmin: user && (
      user.tipo_usuario === 'SuperAdmin' || 
      user.is_superuser
    ),
    user
  };
};