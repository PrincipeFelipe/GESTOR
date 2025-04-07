from rest_framework import serializers
from .models import Procedimiento, TipoProcedimiento, Paso, Documento, DocumentoPaso, HistorialProcedimiento
from users.serializers import UserSerializer

class TipoProcedimientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoProcedimiento
        fields = ['id', 'nombre', 'descripcion']

class DocumentoSerializer(serializers.ModelSerializer):
    archivo_url = serializers.SerializerMethodField()
    extension = serializers.SerializerMethodField()
    
    class Meta:
        model = Documento
        fields = '__all__'
    
    def get_archivo_url(self, obj):
        if obj.archivo:
            return obj.archivo.url
        return None
    
    def get_extension(self, obj):
        if obj.archivo and obj.archivo.name:
            import os
            return os.path.splitext(obj.archivo.name)[1].lstrip('.').upper()
        return None

class DocumentoPasoSerializer(serializers.ModelSerializer):
    documento_detalle = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = DocumentoPaso
        fields = ['id', 'paso', 'documento', 'documento_detalle', 'orden', 'notas']
        read_only_fields = ['id']
    
    def get_documento_detalle(self, obj):
        return DocumentoSerializer(obj.documento).data

class PasoSerializer(serializers.ModelSerializer):
    documentos = serializers.SerializerMethodField(read_only=True)
    documentos_ids = serializers.ListField(
        child=serializers.IntegerField(), 
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Paso
        fields = ['id', 'procedimiento', 'numero', 'titulo', 'descripcion', 
                 'tiempo_estimado', 'responsable', 'documentos', 'documentos_ids', 
                 'bifurcaciones', 'es_final']
    
    def get_documentos(self, obj):
        """
        Obtiene los documentos asociados al paso y los serializa.
        """
        from .models import DocumentoPaso
        documentos_paso = DocumentoPaso.objects.filter(paso=obj)
        return DocumentoPasoSerializer(documentos_paso, many=True).data

class HistorialProcedimientoSerializer(serializers.ModelSerializer):
    usuario_detalle = UserSerializer(source='usuario', read_only=True)
    
    class Meta:
        model = HistorialProcedimiento
        fields = ['id', 'procedimiento', 'version', 'fecha_cambio', 'usuario', 'usuario_detalle', 'descripcion_cambio']
        read_only_fields = ['fecha_cambio']

class ProcedimientoListSerializer(serializers.ModelSerializer):
    tipo_nombre = serializers.CharField(source='tipo.nombre', read_only=True)
    nivel_display = serializers.CharField(source='get_nivel_display', read_only=True)
    
    class Meta:
        model = Procedimiento
        fields = ['id', 'nombre', 'descripcion', 'tipo', 'tipo_nombre', 'nivel', 'nivel_display', 'estado', 'version', 'fecha_actualizacion']

class ProcedimientoDetailSerializer(serializers.ModelSerializer):
    tipo_nombre = serializers.CharField(source='tipo.nombre', read_only=True)
    nivel_display = serializers.CharField(source='get_nivel_display', read_only=True)
    pasos = PasoSerializer(many=True, read_only=True)
    procedimiento_relacionado_info = serializers.SerializerMethodField(read_only=True)
    procedimientos_derivados = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Procedimiento
        fields = ['id', 'nombre', 'descripcion', 'tipo', 'tipo_nombre', 'nivel', 'nivel_display', 
                  'estado', 'version', 'fecha_creacion', 'fecha_actualizacion', 
                  'creado_por', 'actualizado_por', 'pasos', 
                  'procedimiento_relacionado', 'procedimiento_relacionado_info',
                  'procedimientos_derivados']
    
    def get_procedimiento_relacionado_info(self, obj):
        if obj.procedimiento_relacionado:
            return {
                'id': obj.procedimiento_relacionado.id,
                'nombre': obj.procedimiento_relacionado.nombre,
                'nivel': obj.procedimiento_relacionado.nivel,
                'nivel_display': obj.procedimiento_relacionado.get_nivel_display()
            }
        return None
    
    def get_procedimientos_derivados(self, obj):
        derivados = Procedimiento.objects.filter(procedimiento_relacionado=obj)
        if derivados.exists():
            return [{
                'id': proc.id,
                'nombre': proc.nombre,
                'nivel': proc.nivel,
                'nivel_display': proc.get_nivel_display()
            } for proc in derivados]
        return []