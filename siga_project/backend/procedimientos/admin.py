from django.contrib import admin
from .models import TipoProcedimiento, Procedimiento, Paso, Documento, DocumentoPaso, HistorialProcedimiento, Trabajo, PasoTrabajo, EnvioPaso

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

class PasoTrabajoInline(admin.TabularInline):
    model = PasoTrabajo
    extra = 0
    readonly_fields = ['paso', 'estado', 'fecha_inicio', 'fecha_fin', 'usuario_completado']
    
class EnvioPasoInline(admin.TabularInline):
    model = EnvioPaso
    extra = 0
    readonly_fields = ['fecha_envio']

@admin.register(TipoProcedimiento)
class TipoProcedimientoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'descripcion')
    search_fields = ('nombre', 'descripcion')

@admin.register(Procedimiento)
class ProcedimientoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'tipo', 'nivel', 'estado', 'version', 'tiempo_maximo', 'fecha_actualizacion', 'creado_por')
    list_filter = ('tipo', 'nivel', 'estado', 'creado_por')
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
    list_display = ('procedimiento', 'numero', 'titulo', 'responsable', 'tiempo_estimado', 'es_final', 'requiere_envio')
    list_filter = ('procedimiento', 'es_final', 'requiere_envio')
    search_fields = ('titulo', 'descripcion', 'responsable')
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

@admin.register(Trabajo)
class TrabajoAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'procedimiento', 'usuario_creador', 'unidad', 'fecha_inicio', 'estado']
    list_filter = ['estado', 'unidad', 'procedimiento']
    search_fields = ['titulo', 'descripcion', 'usuario_creador__username']
    inlines = [PasoTrabajoInline]

@admin.register(PasoTrabajo)
class PasoTrabajoAdmin(admin.ModelAdmin):
    list_display = ['trabajo', 'paso', 'estado', 'fecha_inicio', 'fecha_fin', 'usuario_completado']
    list_filter = ['estado', 'trabajo__procedimiento']
    search_fields = ['trabajo__titulo', 'paso__titulo']
    inlines = [EnvioPasoInline]

@admin.register(EnvioPaso)
class EnvioPasoAdmin(admin.ModelAdmin):
    list_display = ['paso_trabajo', 'numero_salida', 'fecha_envio']
    search_fields = ['numero_salida', 'paso_trabajo__trabajo__titulo']
