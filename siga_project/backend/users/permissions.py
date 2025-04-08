from rest_framework import permissions

class IsSuperAdmin(permissions.BasePermission):
    """
    Permite acceso solo a usuarios SuperAdmin
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_superadmin

class IsSuperAdminOrAdmin(permissions.BasePermission):
    """
    Permite acceso a usuarios Admin o SuperAdmin
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin

class IsGestorOrHigher(permissions.BasePermission):
    """
    Permite acceso a usuarios Gestor, Admin o SuperAdmin
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_gestor