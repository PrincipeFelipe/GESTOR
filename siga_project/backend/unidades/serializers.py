from rest_framework import serializers
from .models import Unidad

class UnidadSerializer(serializers.ModelSerializer):
    nombre_padre = serializers.SerializerMethodField()
    nivel_jerarquico = serializers.IntegerField(source='nivel', read_only=True)
    
    class Meta:
        model = Unidad
        fields = ['id', 'nombre', 'id_padre', 'cod_unidad', 'nivel_jerarquico', 'nombre_padre']
        read_only_fields = ['cod_unidad', 'nivel_jerarquico']
    
    def get_nombre_padre(self, obj):
        """Obtiene el nombre de la unidad padre"""
        if obj.id_padre:
            return obj.id_padre.nombre
        return None