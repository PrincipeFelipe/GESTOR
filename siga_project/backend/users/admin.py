from django.contrib import admin
from .models import Usuario
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _

class UsuarioAdmin(UserAdmin):
    list_display = ('id', 'nombre', 'apellido1', 'apellido2', 'ref', 
                    'unidad_destino', 'empleo', 'tip', 'estado', 'tipo_usuario')
    list_filter = ('unidad_destino', 'estado', 'tipo_usuario')
    search_fields = ('nombre', 'apellido1', 'apellido2', 'email', 'tip', 'ref')
    ordering = ('id', 'nombre')
    
    # Personalizar los fieldsets
    fieldsets = (
        (None, {'fields': ('tip', 'password')}),
        (_('Información personal'), {'fields': ('nombre', 'apellido1', 'apellido2', 'email', 'telefono', 'ref')}),
        (_('Información institucional'), {
            'fields': ('unidad_destino', 'unidad_acceso', 'empleo', 'tipo_usuario')
        }),
        (_('Permisos'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Fechas importantes'), {'fields': ('last_login', 'date_joined')}),
    )
    
    # Personalizar el formulario de agregar usuario
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('nombre', 'apellido1', 'apellido2', 'email', 'tip', 'ref', 
                      'unidad_destino', 'unidad_acceso', 'empleo', 'tipo_usuario', 
                      'password1', 'password2'),
        }),
    )

admin.site.register(Usuario, UsuarioAdmin)