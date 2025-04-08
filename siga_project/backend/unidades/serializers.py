from rest_framework import serializers
from .models import Unidad

class UnidadSerializer(serializers.ModelSerializer):
    padre_nombre = serializers.SerializerMethodField()
    tipo_unidad_display = serializers.CharField(read_only=True)
    
    class Meta:
        model = Unidad
        fields = [
            'id', 'cod_unidad', 'nombre', 'id_padre', 'padre_nombre', 
            'nivel', 'tipo_unidad', 'tipo_unidad_display', 'descripcion', 
            'fecha_creacion', 'fecha_actualizacion'
        ]
        read_only_fields = ['cod_unidad', 'id'] 
    
    def get_padre_nombre(self, obj):
        return obj.id_padre.nombre if obj.id_padre else None