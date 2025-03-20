from rest_framework import serializers
from .models import Usuario
from unidades.serializers import UnidadSerializer
from empleos.serializers import EmpleoSerializer

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = [
            'id', 
            'nombre', 
            'apellido1', 
            'apellido2', 
            'ref', 
            'telefono', 
            'email', 
            'unidad', 
            'empleo', 
            'tip', 
            'password', 
            'tipo_usuario',
            'estado'
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        user = Usuario(
            nombre=validated_data['nombre'],
            apellido1=validated_data['apellido1'],
            apellido2=validated_data.get('apellido2', ''),
            ref=validated_data.get('ref', ''),
            telefono=validated_data.get('telefono', ''),
            email=validated_data['email'],
            unidad=validated_data.get('unidad', None),
            empleo=validated_data.get('empleo', None),
            tip=validated_data['tip'],
            tipo_usuario=validated_data.get('tipo_usuario', Usuario.USER),
            estado=validated_data.get('estado', True)
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

    def update(self, instance, validated_data):
        instance.nombre = validated_data.get('nombre', instance.nombre)
        instance.apellido1 = validated_data.get('apellido1', instance.apellido1)
        instance.apellido2 = validated_data.get('apellido2', instance.apellido2)
        instance.ref = validated_data.get('ref', instance.ref)
        instance.telefono = validated_data.get('telefono', instance.telefono)
        instance.email = validated_data.get('email', instance.email)
        instance.unidad = validated_data.get('unidad', instance.unidad)
        instance.empleo = validated_data.get('empleo', instance.empleo)
        instance.tip = validated_data.get('tip', instance.tip)
        instance.tipo_usuario = validated_data.get('tipo_usuario', instance.tipo_usuario)
        instance.estado = validated_data.get('estado', instance.estado)

        password = validated_data.get('password', None)
        if password:
            instance.set_password(password)

        instance.save()
        return instance

# Nuevo serializador para perfil de usuario con detalles de unidad y empleo
class ProfileSerializer(serializers.ModelSerializer):
    unidad_details = UnidadSerializer(source='unidad', read_only=True)
    empleo_details = EmpleoSerializer(source='empleo', read_only=True)
    
    class Meta:
        model = Usuario
        fields = [
            'id', 
            'nombre', 
            'apellido1', 
            'apellido2', 
            'ref', 
            'telefono', 
            'email', 
            'unidad', 
            'unidad_details',
            'empleo',
            'empleo_details',
            'tip', 
            'tipo_usuario',
            'estado',
            'date_joined',
            'last_login'
        ]
        read_only_fields = ['id', 'tipo_usuario', 'date_joined', 'last_login']

# Serializador para cambio de contraseña
class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
    confirm_password = serializers.CharField(required=True)
    
    def validate(self, data):
        if data.get('new_password') != data.get('confirm_password'):
            raise serializers.ValidationError("Las contraseñas no coinciden.")
        return data