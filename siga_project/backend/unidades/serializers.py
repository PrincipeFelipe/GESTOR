from rest_framework import serializers
from .models import Unidad

class UnidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unidad
        fields = ['id', 'nombre', 'id_padre']  # Asegúrate de que estos campos existan en tu modelo
        read_only_fields = ['id']  # El campo 'id' es de solo lectura, ya que se genera automáticamente.