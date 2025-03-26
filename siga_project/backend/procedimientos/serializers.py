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
    documento_detalle = DocumentoSerializer(source='documento', read_only=True)
    
    class Meta:
        model = DocumentoPaso
        fields = ['id', 'paso', 'documento', 'documento_detalle', 'orden', 'notas']
        read_only_fields = ['id']

class PasoSerializer(serializers.ModelSerializer):
    documentos = DocumentoPasoSerializer(many=True, read_only=True)
    documentos_ids = serializers.PrimaryKeyRelatedField(
        many=True, 
        write_only=True, 
        queryset=Documento.objects.all(),
        required=False,
        source='documentos_list'
    )
    
    class Meta:
        model = Paso
        fields = ['id', 'procedimiento', 'numero', 'titulo', 'descripcion', 'tiempo_estimado', 'responsable', 'documentos', 'documentos_ids']
    
    def create(self, validated_data):
        documentos_data = validated_data.pop('documentos_list', [])
        paso = Paso.objects.create(**validated_data)
        
        # Crear relaciones con documentos
        for idx, documento in enumerate(documentos_data, 1):
            DocumentoPaso.objects.create(
                paso=paso,
                documento=documento,
                orden=idx
            )
        
        return paso
    
    def update(self, instance, validated_data):
        documentos_data = validated_data.pop('documentos_list', None)
        
        # Actualizar campos del paso
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        
        # Actualizar documentos si se proporcionaron
        if documentos_data is not None:
            # Eliminar relaciones existentes
            instance.documentos.all().delete()
            
            # Crear nuevas relaciones
            for idx, documento in enumerate(documentos_data, 1):
                DocumentoPaso.objects.create(
                    paso=instance,
                    documento=documento,
                    orden=idx
                )
        
        return instance

class HistorialProcedimientoSerializer(serializers.ModelSerializer):
    usuario_detalle = UserSerializer(source='usuario', read_only=True)
    
    class Meta:
        model = HistorialProcedimiento
        fields = ['id', 'procedimiento', 'version', 'fecha_cambio', 'usuario', 'usuario_detalle', 'descripcion_cambio']
        read_only_fields = ['fecha_cambio']

class ProcedimientoListSerializer(serializers.ModelSerializer):
    tipo_nombre = serializers.ReadOnlyField(source='tipo.nombre')
    creado_por_nombre = serializers.SerializerMethodField()
    
    class Meta:
        model = Procedimiento
        fields = ['id', 'nombre', 'tipo', 'tipo_nombre', 'estado', 'version', 'fecha_actualizacion', 'creado_por', 'creado_por_nombre']
    
    def get_creado_por_nombre(self, obj):
        if obj.creado_por:
            return f"{obj.creado_por.nombre} {obj.creado_por.apellido1}"
        return None

class ProcedimientoDetailSerializer(serializers.ModelSerializer):
    tipo_detalle = TipoProcedimientoSerializer(source='tipo', read_only=True)
    creado_por_detalle = UserSerializer(source='creado_por', read_only=True)
    actualizado_por_detalle = UserSerializer(source='actualizado_por', read_only=True)
    pasos = PasoSerializer(many=True, read_only=True)
    historial = HistorialProcedimientoSerializer(many=True, read_only=True)
    
    class Meta:
        model = Procedimiento
        fields = [
            'id', 'nombre', 'descripcion', 'tipo', 'tipo_detalle', 
            'estado', 'fecha_creacion', 'fecha_actualizacion', 
            'version', 'creado_por', 'creado_por_detalle', 
            'actualizado_por', 'actualizado_por_detalle',
            'pasos', 'historial'
        ]
        read_only_fields = ['fecha_creacion', 'fecha_actualizacion']