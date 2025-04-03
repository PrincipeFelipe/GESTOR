from django.contrib import admin
from .models import Unidad

@admin.register(Unidad)
class UnidadAdmin(admin.ModelAdmin):
    list_display = ('id', 'cod_unidad', 'nombre', 'id_padre')
    search_fields = ('nombre', 'cod_unidad')
    list_filter = ('id_padre',)
    ordering = ('cod_unidad',)
    readonly_fields = ('cod_unidad',)  # El código es de solo lectura en el admin