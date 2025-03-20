from django.contrib import admin
from .models import TipoProcedimiento, Procedimiento, Paso, Documento, DocumentoPaso, HistorialProcedimiento

class PasoInline(admin.TabularInline):
    model = Paso
    extra = 1
    ordering = ('numero',)

class DocumentoPasoInline(admin.TabularInline):
    model = DocumentoPaso
    extra = 1
    ordering = ('orden',)

class HistorialInline(admin.TabularInline):
    model = HistorialProcedimiento
    extra = 0
    readonly_fields = ('version', 'fecha_cambio', 'usuario', 'descripcion_cambio')
    ordering = ('-fecha_cambio',)
    can_delete = False
    max_num = 0

@admin.register(TipoProcedimiento)
class TipoProcedimientoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'descripcion')
    search_fields = ('nombre', 'descripcion')

@admin.register(Procedimiento)
class ProcedimientoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'tipo', 'estado', 'version', 'fecha_actualizacion', 'creado_por')
    list_filter = ('tipo', 'estado', 'creado_por')
    search_fields = ('nombre', 'descripcion')
    readonly_fields = ('fecha_creacion', 'fecha_actualizacion')
    inlines = [PasoInline, HistorialInline]
    
    def save_model(self, request, obj, form, change):
        if not change:  # Si es un nuevo procedimiento
            obj.creado_por = request.user
        obj.actualizado_por = request.user
        super().save_model(request, obj, form, change)
        
        # Si es un nuevo procedimiento, crear la primera entrada en el historial
        if not change:
            HistorialProcedimiento.objects.create(
                procedimiento=obj,
                version=obj.version,
                usuario=request.user,
                descripcion_cambio="Creación inicial del procedimiento"
            )

@admin.register(Paso)
class PasoAdmin(admin.ModelAdmin):
    list_display = ('procedimiento', 'numero', 'titulo', 'tiempo_estimado', 'responsable')
    list_filter = ('procedimiento',)
    search_fields = ('titulo', 'descripcion', 'procedimiento__nombre')
    ordering = ('procedimiento', 'numero')
    inlines = [DocumentoPasoInline]

@admin.register(Documento)
class DocumentoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'fecha_creacion', 'fecha_actualizacion')
    search_fields = ('nombre', 'descripcion')
    readonly_fields = ('fecha_creacion', 'fecha_actualizacion')

@admin.register(HistorialProcedimiento)
class HistorialProcedimientoAdmin(admin.ModelAdmin):
    list_display = ('procedimiento', 'version', 'fecha_cambio', 'usuario')
    list_filter = ('procedimiento', 'usuario')
    search_fields = ('procedimiento__nombre', 'descripcion_cambio')
    readonly_fields = ('fecha_cambio',)
