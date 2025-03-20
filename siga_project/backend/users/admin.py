from django.contrib import admin
from .models import Usuario

class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'apellido1', 'apellido2', 'email', 'telefono', 'unidad', 'empleo', 'tipo_usuario', 'estado')
    search_fields = ('nombre', 'apellido1', 'apellido2', 'email', 'tip')
    list_filter = ('unidad', 'empleo', 'tipo_usuario', 'estado')

admin.site.register(Usuario, UsuarioAdmin)