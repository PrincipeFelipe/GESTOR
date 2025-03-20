from rest_framework import viewsets
from .models import Empleo
from .serializers import EmpleoSerializer

class EmpleoViewSet(viewsets.ModelViewSet):
    queryset = Empleo.objects.all().order_by('id')  # Añadir ordenamiento por id
    serializer_class = EmpleoSerializer

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()