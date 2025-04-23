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
    Permiso personalizado para permitir:
    1. Acceso a superadmin y admin
    2. A un usuario ver/editar sus propios trabajos
    3. A un usuario ver/editar trabajos de su unidad
    """
    
    def has_permission(self, request, view):
        # Todos los usuarios autenticados pueden listar y crear
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Verificar si el usuario es superadmin o admin
        # Cambiar request.user.role por request.user.tipo_usuario
        if request.user.is_superuser or request.user.tipo_usuario == 'ADMIN':
            return True
        
        # Verificar si el objeto tiene usuario_creador
        if hasattr(obj, 'usuario_creador'):
            # Permitir al creador del trabajo
            if obj.usuario_creador == request.user:
                return True
            
            # Permitir a usuarios de la misma unidad
            if hasattr(request.user, 'unidad_destino') and request.user.unidad_destino:
                return obj.unidad == request.user.unidad_destino
        
        # Para PasoTrabajo, verificar por trabajo
        if hasattr(obj, 'trabajo'):
            # Permitir al creador del trabajo
            if obj.trabajo.usuario_creador == request.user:
                return True
            
            # Permitir a usuarios de la misma unidad
            if hasattr(request.user, 'unidad_destino') and request.user.unidad_destino:
                return obj.trabajo.unidad == request.user.unidad_destino
        
        return False