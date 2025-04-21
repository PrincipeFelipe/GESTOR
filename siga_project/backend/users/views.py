from rest_framework import viewsets, status, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Usuario
from unidades.models import Unidad
from .serializers import (
    UserSerializer, 
    PasswordChangeSerializer, 
    ProfileSerializer, 
    UserCreateSerializer,
    UserUpdateSerializer
)
from .permissions import IsSuperAdminOrAdmin, IsSuperAdmin

class UserViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all().order_by('id')
    serializer_class = UserSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['nombre', 'apellido1', 'apellido2', 'email', 'tip', 'ref']
    filterset_fields = ['tipo_usuario', 'estado', 'unidad_destino', 'unidad_acceso', 'empleo']  # Eliminamos 'unidad'
    ordering_fields = ['nombre', 'apellido1', 'fecha_joined', 'tipo_usuario']
    
    def get_permissions(self):
        """
        Establece permisos según la acción:
        - Lista, detalle: Administrador o SuperAdmin
        - Crear, actualizar, eliminar: Solo SuperAdmin
        - Perfil, cambio de contraseña, me: Usuario autenticado
        """
        if self.action in ['list', 'retrieve']:
            return [IsSuperAdminOrAdmin()]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSuperAdmin()]
        # Para acciones como 'profile', 'me' y 'change_password'
        return [IsAuthenticated()]
    
    def get_serializer_class(self):
        """
        Utiliza diferentes serializadores según la acción
        """
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return self.serializer_class

    def perform_create(self, serializer):
        """Crea un nuevo usuario"""
        # Si no se proporcionó una contraseña, usar el TIP como contraseña por defecto
        password = serializer.validated_data.get('password')
        if not password:
            password = serializer.validated_data.get('tip')
            
        # Guardar usuario
        user = serializer.save()
        
        # Establecer contraseña si se proporcionó
        if password:
            user.set_password(password)
            user.save()

    def perform_update(self, serializer):
        """Actualizar usuario existente"""
        # Obtener los datos actuales del usuario
        instance = self.get_object()
        
        # Actualizar el usuario
        user = serializer.save()
        
        # Si se proporcionó una nueva contraseña, actualizarla
        if 'password' in self.request.data and self.request.data['password']:
            user.set_password(self.request.data['password'])
            user.save()

    def perform_destroy(self, instance):
        """
        En lugar de eliminar permanentemente, deactivar el usuario
        """
        instance.estado = False
        instance.save()
        
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def profile(self, request):
        """Obtener perfil del usuario autenticado"""
        serializer = ProfileSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """Cambiar contraseña del usuario autenticado"""
        user = request.user
        serializer = PasswordChangeSerializer(data=request.data)
        
        if serializer.is_valid():
            # Verificar contraseña actual
            if not user.check_password(serializer.data.get('current_password')):
                return Response({'current_password': ['Contraseña actual incorrecta.']}, 
                                status=status.HTTP_400_BAD_REQUEST)
            
            # Establecer nueva contraseña
            user.set_password(serializer.data.get('new_password'))
            user.save()
            
            # Respuesta con indicación para cerrar sesión
            return Response({
                'detail': 'Contraseña actualizada correctamente.',
                'logout_required': True
            }, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdmin])
    def reset_password(self, request, pk=None):
        """
        Permite a un SuperAdmin restablecer la contraseña de un usuario
        """
        user = self.get_object()
        new_password = request.data.get('new_password')
        
        if not new_password:
            return Response({'error': 'Se requiere una nueva contraseña'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        
        return Response({
            'detail': f'Contraseña de {user.nombre} {user.apellido1} restablecida correctamente'
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Endpoint para obtener información del usuario actual, incluyendo permisos y unidades accesibles
        """
        user = request.user
        
        # Si el usuario tiene unidad, obtener unidades accesibles
        unidades_accesibles = []
        if user.is_authenticated:
            # Obtener unidades accesibles para el usuario
            unidades_queryset = user.get_unidades_accesibles()
            
            # Convertir QuerySet a lista de diccionarios simplificada
            unidades_accesibles = list(unidades_queryset.values('id', 'nombre', 'cod_unidad', 'tipo_unidad'))
        
        # Obtener datos del usuario
        serializer = ProfileSerializer(user)
        data = serializer.data
        
        # Agregar datos adicionales
        data['unidades_accesibles'] = unidades_accesibles
        data['permisos'] = {
            'is_superadmin': user.is_superadmin,
            'is_admin': user.is_admin,
            'is_gestor': user.is_gestor,
        }
        
        return Response(data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdmin])
    def activate_deactivate(self, request, pk=None):
        """
        Activar o desactivar un usuario
        """
        user = self.get_object()
        action_type = request.data.get('action')
        
        if action_type == 'activate':
            user.estado = True
            message = f'Usuario {user.nombre} {user.apellido1} activado correctamente'
        elif action_type == 'deactivate':
            user.estado = False
            message = f'Usuario {user.nombre} {user.apellido1} desactivado correctamente'
        else:
            return Response({'error': 'Acción no válida. Use "activate" o "deactivate"'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        user.save()
        return Response({'detail': message}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdmin])
    def change_role(self, request, pk=None):
        """
        Cambiar el rol de un usuario
        """
        user = self.get_object()
        new_role = request.data.get('role')
        
        if not new_role or new_role not in [choice[0] for choice in Usuario.TIPO_USUARIO_CHOICES]:
            return Response({
                'error': 'Rol no válido. Opciones válidas: ' + 
                         ', '.join([choice[0] for choice in Usuario.TIPO_USUARIO_CHOICES])
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.tipo_usuario = new_role
        user.save()
        
        return Response({
            'detail': f'Rol de {user.nombre} {user.apellido1} actualizado a {new_role}'
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdmin])
    def assign_units(self, request, pk=None):
        """
        Asignar unidades a un usuario (destino y acceso)
        """
        user = self.get_object()
        
        # Obtener IDs de unidades del request
        unidad_destino_id = request.data.get('unidad_destino')
        unidad_acceso_id = request.data.get('unidad_acceso')
        
        # Validar y asignar unidad de destino
        if unidad_destino_id:
            try:
                user.unidad_destino = Unidad.objects.get(id=unidad_destino_id)
            except Unidad.DoesNotExist:
                return Response({'error': 'Unidad de destino no encontrada'}, 
                               status=status.HTTP_400_BAD_REQUEST)
        else:
            user.unidad_destino = None
        
        # Validar y asignar unidad de acceso
        if unidad_acceso_id:
            try:
                user.unidad_acceso = Unidad.objects.get(id=unidad_acceso_id)
            except Unidad.DoesNotExist:
                return Response({'error': 'Unidad de acceso no encontrada'}, 
                               status=status.HTTP_400_BAD_REQUEST)
        else:
            user.unidad_acceso = None
        
        # Guardar usuario
        user.save()
        
        return Response({
            'detail': f'Unidades asignadas correctamente a {user.nombre} {user.apellido1}',
            'unidad_destino': user.unidad_destino.nombre if user.unidad_destino else None,
            'unidad_acceso': user.unidad_acceso.nombre if user.unidad_acceso else None
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def available_units(self, request):
        """
        Devuelve las unidades disponibles para asignación,
        filtradas según el nivel de permisos del usuario solicitante
        """
        user = request.user
        
        # Si es SuperAdmin, devolver todas las unidades
        if user.is_superadmin:
            unidades = Unidad.objects.all()
        else:
            # De lo contrario, solo las unidades accesibles para ese usuario
            unidades = user.get_unidades_accesibles()
        
        # Aplicar filtros adicionales si se proporcionan
        tipo = request.query_params.get('tipo')
        nombre = request.query_params.get('nombre')
        
        if tipo:
            unidades = unidades.filter(tipo_unidad=tipo)
        if nombre:
            unidades = unidades.filter(Q(nombre__icontains=nombre) | Q(cod_unidad__icontains=nombre))
        
        # Serializar datos básicos
        data = list(unidades.values('id', 'nombre', 'cod_unidad', 'tipo_unidad'))
        
        return Response(data)

# Puedes agregar aquí otras vistas relacionadas con la autenticación si las necesitas