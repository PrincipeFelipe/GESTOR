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

class IsOwnerOrSameUnit(permissions.BasePermission):
    """
    Permite acceso solo si el usuario es el creador del objeto o pertenece a la misma unidad.
    """
    
    def has_object_permission(self, request, view, obj):
        # Verificar si el usuario es superuser o admin
        if request.user.is_superuser or request.user.role == 'ADMIN':
            return True
            
        # Verificar si el objeto tiene usuario_creador o trabajo.usuario_creador
        if hasattr(obj, 'usuario_creador'):
            if obj.usuario_creador == request.user:
                return True
            return obj.unidad == request.user.unidad
        
        # Para PasoTrabajo que tiene relación a través de trabajo
        if hasattr(obj, 'trabajo'):
            if obj.trabajo.usuario_creador == request.user:
                return True
            return obj.trabajo.unidad == request.user.unidad
        
        return False