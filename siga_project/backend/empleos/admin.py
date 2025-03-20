from django.contrib import admin
from .models import Empleo

@admin.register(Empleo)
class EmpleoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'abreviatura')
    search_fields = ('nombre', 'abreviatura')
    ordering = ('nombre',)