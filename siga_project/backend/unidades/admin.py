from django.contrib import admin
from .models import Unidad

@admin.register(Unidad)
class UnidadAdmin(admin.ModelAdmin):
    list_display = ('id', 'nombre', 'id_padre')
    search_fields = ('nombre',)
    list_filter = ('id_padre',)
    ordering = ('nombre',)