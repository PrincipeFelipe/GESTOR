from rest_framework import serializers
from .models import Empleo

class EmpleoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empleo
        fields = ['id', 'nombre', 'abreviatura']  # Asegúrate de que estos campos existan en tu modelo Empleo
        read_only_fields = ['id']  # El campo id es solo de lectura, ya que se genera automáticamente
