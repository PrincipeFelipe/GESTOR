from django.shortcuts import render
from rest_framework import viewsets, status, filters, renderers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import TipoProcedimiento, Procedimiento, Paso, Documento, HistorialProcedimiento
from .serializers import (
    TipoProcedimientoSerializer,
    ProcedimientoListSerializer,
    ProcedimientoDetailSerializer,
    PasoSerializer,
    DocumentoSerializer,
    HistorialProcedimientoSerializer
)
from .permissions import IsAdminOrSuperAdmin, IsAdminOrSuperAdminOrReadOnly

class TipoProcedimientoViewSet(viewsets.ModelViewSet):
    queryset = TipoProcedimiento.objects.all()
    serializer_class = TipoProcedimientoSerializer
    permission_classes = [IsAdminOrSuperAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre']

class DocumentoViewSet(viewsets.ModelViewSet):
    queryset = Documento.objects.all()
    serializer_class = DocumentoSerializer
    permission_classes = [IsAdminOrSuperAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'fecha_creacion', 'fecha_actualizacion']
    filterset_fields = ['nombre']

class ProcedimientoViewSet(viewsets.ModelViewSet):
    queryset = Procedimiento.objects.all()
    permission_classes = [IsAdminOrSuperAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'tipo__nombre', 'estado', 'fecha_actualizacion']
    filterset_fields = ['tipo', 'estado', 'creado_por']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProcedimientoListSerializer
        return ProcedimientoDetailSerializer
    
    def perform_create(self, serializer):
        serializer.save(
            creado_por=self.request.user,
            actualizado_por=self.request.user
        )
        
        # Crear entrada en el historial
        procedimiento = serializer.instance
        HistorialProcedimiento.objects.create(
            procedimiento=procedimiento,
            version=procedimiento.version,
            usuario=self.request.user,
            descripcion_cambio="Creación inicial del procedimiento"
        )
    
    def perform_update(self, serializer):
        # Registrar la versión anterior antes de actualizar
        procedimiento = self.get_object()
        version_anterior = procedimiento.version
        
        # Actualizar el procedimiento
        serializer.save(actualizado_por=self.request.user)
        
        # Si la versión cambió, registrar en el historial
        if procedimiento.version != version_anterior or 'version' in serializer.validated_data:
            HistorialProcedimiento.objects.create(
                procedimiento=procedimiento,
                version=procedimiento.version,
                usuario=self.request.user,
                descripcion_cambio=serializer.validated_data.get('descripcion_cambio', 'Actualización del procedimiento')
            )
    
    @action(detail=True, methods=['post'])
    def nueva_version(self, request, pk=None):
        procedimiento = self.get_object()
        
        # Incrementar versión
        partes = procedimiento.version.split('.')
        if len(partes) >= 2:
            nueva_version = f"{partes[0]}.{int(partes[1]) + 1}"
        else:
            nueva_version = f"{procedimiento.version}.1"
        
        descripcion = request.data.get('descripcion', 'Nueva versión del procedimiento')
        
        # Actualizar procedimiento
        procedimiento.version = nueva_version
        procedimiento.actualizado_por = request.user
        procedimiento.save()
        
        # Registrar en historial
        HistorialProcedimiento.objects.create(
            procedimiento=procedimiento,
            version=nueva_version,
            usuario=request.user,
            descripcion_cambio=descripcion
        )
        
        serializer = self.get_serializer(procedimiento)
        return Response(serializer.data)

# Modificar la clase PasoViewSet para evitar el error de plantilla

class PasoViewSet(viewsets.ModelViewSet):
    queryset = Paso.objects.all()
    serializer_class = PasoSerializer
    permission_classes = [IsAdminOrSuperAdmin]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['procedimiento']
    ordering_fields = ['numero']
    # Corregir la línea que causa el error
    renderer_classes = [renderers.JSONRenderer]
    
    # El resto del código se mantiene igual
    def get_queryset(self):
        queryset = super().get_queryset()
        procedimiento_id = self.request.query_params.get('procedimiento')
        if (procedimiento_id):
            queryset = queryset.filter(procedimiento_id=procedimiento_id)
        return queryset
    
    def perform_create(self, serializer):
        paso = serializer.save()
        
        # Actualizar fecha de modificación del procedimiento
        procedimiento = paso.procedimiento
        procedimiento.actualizado_por = self.request.user
        procedimiento.save()
    
    def perform_update(self, serializer):
        paso = serializer.save()
        
        # Actualizar fecha de modificación del procedimiento
        procedimiento = paso.procedimiento
        procedimiento.actualizado_por = self.request.user
        procedimiento.save()
    
    def perform_destroy(self, instance):
        procedimiento = instance.procedimiento
        instance.delete()
        
        # Reordenar los pasos restantes
        pasos = Paso.objects.filter(procedimiento=procedimiento).order_by('numero')
        for idx, paso in enumerate(pasos, 1):
            if paso.numero != idx:
                paso.numero = idx
                paso.save()
        
        # Actualizar fecha de modificación del procedimiento
        procedimiento.actualizado_por = self.request.user
        procedimiento.save()

class HistorialProcedimientoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = HistorialProcedimiento.objects.all()
    serializer_class = HistorialProcedimientoSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['procedimiento']
    ordering_fields = ['fecha_cambio']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        procedimiento_id = self.request.query_params.get('procedimiento')
        if procedimiento_id:
            queryset = queryset.filter(procedimiento_id=procedimiento_id)
        return queryset

# Añadir esta vista para manejo de descargas

from django.http import FileResponse, HttpResponse
from django.conf import settings
import os
import mimetypes

def download_document(request, path):
    """
    Vista que sirve archivos con Content-Disposition: attachment para forzar descarga
    """
    # Sanitizar el path para evitar vulnerabilidades
    path = path.replace('..', '').replace('\\', '/').lstrip('/')
    
    # Construir path completo
    full_path = os.path.join(settings.MEDIA_ROOT, path)
    
    # Verificar que el archivo existe
    if not os.path.exists(full_path) or not os.path.isfile(full_path):
        return HttpResponse("Archivo no encontrado", status=404)
    
    # Determinar tipo MIME
    content_type, _ = mimetypes.guess_type(full_path)
    if not content_type:
        content_type = 'application/octet-stream'
    
    # Obtener nombre del archivo
    filename = os.path.basename(full_path)
    
    # Abrir y servir el archivo
    file = open(full_path, 'rb')
    response = FileResponse(file, content_type=content_type)
    
    # Importante: establecer Content-Disposition como attachment para forzar descarga
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    return response
