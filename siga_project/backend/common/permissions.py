from rest_framework.permissions import BasePermission

class IsOwner(BasePermission):
    """
    Permiso personalizado que permite a los usuarios acceder a sus propios recursos.
    """
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user

class IsAdmin(BasePermission):
    """
    Permiso personalizado que permite el acceso solo a los usuarios administradores.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_admin

class IsSuperAdmin(BasePermission):
    """
    Permiso personalizado que permite el acceso solo a los super administradores.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_superadmin

class IsGestor(BasePermission):
    """
    Permiso personalizado que permite el acceso solo a los gestores o roles superiores.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_gestor

class IsActiveUser(BasePermission):
    """
    Permiso personalizado que permite el acceso solo a los usuarios activos.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_active and request.user.estado