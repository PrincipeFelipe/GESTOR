from rest_framework import permissions

class IsAdminOrSuperAdmin(permissions.BasePermission):
    """
    Permiso que solo permite acceso a usuarios con roles de Admin o SuperAdmin.
    """
    
    def has_permission(self, request, view):
        return request.user and (request.user.tipo_usuario in ['Admin', 'SuperAdmin'])

class IsAdminOrSuperAdminOrReadOnly(permissions.BasePermission):
    """
    Permiso que permite a todos los usuarios autenticados ver,
    pero solo Admin y SuperAdmin pueden crear, editar o eliminar.
    """
    
    def has_permission(self, request, view):
        # Permitir solicitudes de lectura (GET, HEAD, OPTIONS) a cualquier usuario autenticado
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Verificar si el usuario es Admin o SuperAdmin para operaciones de escritura
        return request.user and (request.user.tipo_usuario in ['Admin', 'SuperAdmin'])