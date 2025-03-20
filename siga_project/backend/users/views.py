from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Usuario
from .serializers import UserSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all().order_by('id')  # Añadir ordenamiento por id
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()