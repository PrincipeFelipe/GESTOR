from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import Usuario
from unidades.models import Unidad
from empleos.models import Empleo
from unidades.serializers import UnidadSerializer
from empleos.serializers import EmpleoSerializer

class UnidadMinSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unidad
        fields = ['id', 'nombre', 'cod_unidad', 'tipo_unidad', 'tipo_unidad_display']

class EmpleoMinSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empleo
        fields = ['id', 'nombre']

class UserCreateSerializer(serializers.ModelSerializer):
    """Serializador para la creación de usuarios"""
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Usuario
        fields = [
            'id', 'nombre', 'apellido1', 'apellido2', 'email', 'telefono', 'ref',
            'unidad_destino', 'unidad_acceso', 'empleo', 'tip', 'estado', 
            'tipo_usuario', 'password'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'ref': {'required': False}
        }
    
    def create(self, validated_data):
        # Si no viene 'ref', generarlo a partir del nombre y apellidos
        if 'ref' not in validated_data or not validated_data['ref']:
            nombre = validated_data.get('nombre', '')
            apellido1 = validated_data.get('apellido1', '')
            apellido2 = validated_data.get('apellido2', '')
            
            # Crear el ref usando la primera letra de cada campo
            ref = ''
            if nombre: ref += nombre[0]
            if apellido1: ref += apellido1[0]
            if apellido2: ref += apellido2[0]
            
            validated_data['ref'] = ref.upper()
        
        # Continuar con la creación normal
        return super().create(validated_data)

class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializador para la actualización de usuarios"""
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Usuario
        fields = [
            'id', 'nombre', 'apellido1', 'apellido2', 'email', 'telefono', 'ref',
            'unidad_destino', 'unidad_acceso', 'empleo', 'tip', 'estado', 
            'tipo_usuario', 'password'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'ref': {'required': False}
        }
        
    def update(self, instance, validated_data):
        # Si no viene 'ref' o está vacío, generarlo a partir del nombre y apellidos
        if ('ref' not in validated_data or not validated_data['ref']) and instance.ref == '':
            nombre = validated_data.get('nombre', instance.nombre)
            apellido1 = validated_data.get('apellido1', instance.apellido1) 
            apellido2 = validated_data.get('apellido2', instance.apellido2)
            
            # Crear el ref usando la primera letra de cada campo
            ref = ''
            if nombre: ref += nombre[0]
            if apellido1: ref += apellido1[0]
            if apellido2: ref += apellido2[0]
            
            validated_data['ref'] = ref.upper()
        
        # Continuar con la actualización normal
        return super().update(instance, validated_data)

class UserSerializer(serializers.ModelSerializer):
    """Serializador completo para usuarios con información de relaciones"""
    unidad_destino_nombre = serializers.CharField(source='unidad_destino.nombre', read_only=True, default='')
    unidad_acceso_nombre = serializers.CharField(source='unidad_acceso.nombre', read_only=True, default='')
    empleo_nombre = serializers.CharField(source='empleo.nombre', read_only=True, default='')
    
    class Meta:
        model = Usuario
        fields = [
            'id', 'nombre', 'apellido1', 'apellido2', 'ref', 'email', 'telefono',
            'unidad_destino', 'unidad_destino_nombre',
            'unidad_acceso', 'unidad_acceso_nombre', 'empleo', 'empleo_nombre',
            'tip', 'estado', 'tipo_usuario', 'date_joined', 'last_login'
        ]

class PasswordChangeSerializer(serializers.Serializer):
    """Serializador para el cambio de contraseña"""
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    
    def validate_new_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("La contraseña debe tener al menos 8 caracteres.")
        return value

class ProfileSerializer(serializers.ModelSerializer):
    """Serializador para ver el perfil del usuario"""
    unidad_destino_nombre = serializers.CharField(source='unidad_destino.nombre', read_only=True, default='')
    unidad_acceso_nombre = serializers.CharField(source='unidad_acceso.nombre', read_only=True, default='')
    unidad_destino_tipo = serializers.CharField(source='unidad_destino.tipo_unidad', read_only=True, default='')
    empleo_nombre = serializers.CharField(source='empleo.nombre', read_only=True, default='')
    
    class Meta:
        model = Usuario
        fields = [
            'id', 'nombre', 'apellido1', 'apellido2', 'ref', 'email', 'telefono',
            'unidad_destino', 'unidad_destino_nombre', 'unidad_destino_tipo', 
            'unidad_acceso', 'unidad_acceso_nombre',
            'empleo', 'empleo_nombre', 'tip', 'estado', 'tipo_usuario'
        ]