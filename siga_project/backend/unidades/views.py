from rest_framework import viewsets
from .models import Unidad
from .serializers import UnidadSerializer

class UnidadViewSet(viewsets.ModelViewSet):
    queryset = Unidad.objects.all().order_by('id')  # Añadir ordenamiento por id
    serializer_class = UnidadSerializer

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()