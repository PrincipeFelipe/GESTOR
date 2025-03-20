from rest_framework import viewsets, status, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Usuario
from .serializers import UserSerializer, PasswordChangeSerializer, ProfileSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all().order_by('id')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()
        
    # Endpoint para perfil de usuario actual
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def profile(self, request):
        serializer = ProfileSerializer(request.user)
        return Response(serializer.data)
    
    # Endpoint para cambio de contraseña
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
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