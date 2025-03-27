from django.shortcuts import render
from rest_framework import viewsets, status, filters, renderers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
import os  # Añadir esta importación
# Corregir nombre del modelo aquí
from .models import TipoProcedimiento, Procedimiento, Paso, Documento, HistorialProcedimiento, DocumentoPaso
from .serializers import (
    TipoProcedimientoSerializer,
    ProcedimientoListSerializer,
    ProcedimientoDetailSerializer,
    PasoSerializer,
    DocumentoSerializer,
    HistorialProcedimientoSerializer,
    DocumentoPasoSerializer  # Usar este nombre coherentemente
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

# Modificar la clase PasoViewSet

class PasoViewSet(viewsets.ModelViewSet):
    queryset = Paso.objects.all()
    serializer_class = PasoSerializer
    permission_classes = [IsAdminOrSuperAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['titulo', 'descripcion']
    ordering_fields = ['numero', 'titulo']
    filterset_fields = ['procedimiento']
    
    @action(detail=True, methods=['get', 'post', 'delete'], url_path='documentos')
    def documentos(self, request, pk=None):
        """
        GET: Listar documentos de un paso
        POST: Añadir un documento a un paso
        """
        paso = self.get_object()
        
        if request.method == 'GET':
            # Obtener documentos asociados al paso
            paso_documentos = DocumentoPaso.objects.filter(paso=paso)  # Cambiado a DocumentoPaso
            serializer = DocumentoPasoSerializer(paso_documentos, many=True)  # Cambiado a DocumentoPasoSerializer
            return Response(serializer.data)
        
        elif request.method == 'POST':
            # Validar que el documento existe
            try:
                documento_id = request.data.get('documento')
                documento = Documento.objects.get(pk=documento_id)
            except Documento.DoesNotExist:
                return Response(
                    {"error": "El documento especificado no existe"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Crear relación paso-documento
            data = {
                'paso': paso.id,
                'documento': documento.id,
                'orden': request.data.get('orden', 1),
                'notas': request.data.get('notas', '')
            }
            
            serializer = DocumentoPasoSerializer(data=data)  # Cambiado a DocumentoPasoSerializer
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'DELETE':
            # Eliminar todos los documentos del paso (raramente usado)
            paso_documentos = DocumentoPaso.objects.filter(paso=paso)  # Cambiado a DocumentoPaso
            paso_documentos.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['delete'], url_path='documentos/(?P<documento_id>[^/.]+)')
    def eliminar_documento(self, request, pk=None, documento_id=None):
        """Eliminar un documento específico de un paso"""
        try:
            # Obtener la relación paso-documento
            paso_documento = DocumentoPaso.objects.get(paso_id=pk, id=documento_id)
            
            # Obtener el documento asociado
            documento = paso_documento.documento
            
            # Verificar si debemos eliminar el archivo físico
            eliminar_archivo = request.query_params.get('eliminar_archivo', 'false').lower() == 'true'
            
            if eliminar_archivo and documento.archivo:
                # Si este documento solo está relacionado con este paso, eliminar el archivo físico
                if DocumentoPaso.objects.filter(documento=documento).count() <= 1:
                    try:
                        archivo_path = documento.archivo.path
                        if os.path.exists(archivo_path):
                            os.remove(archivo_path)
                    except Exception as e:
                        # Loguear el error pero continuar con la eliminación del registro
                        import logging
                        logger = logging.getLogger(__name__)
                        logger.error(f"Error al eliminar el archivo físico: {str(e)}")
                    
                    # Eliminar el documento del sistema después de eliminar el archivo
                    documento.delete()
                else:
                    # Solo eliminar la relación si hay otras relaciones
                    paso_documento.delete()
            else:
                # Solo eliminar la relación
                paso_documento.delete()
                
            return Response(status=status.HTTP_204_NO_CONTENT)
        except DocumentoPaso.DoesNotExist:
            return Response(
                {"error": "El documento no está asociado a este paso"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            # Añadir respuesta para otros errores
            import traceback
            return Response(
                {
                    "error": f"Error al eliminar el documento: {str(e)}",
                    "trace": traceback.format_exc()
                }, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

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

# Añadir al final del archivo:

from django.http import FileResponse, HttpResponse
from django.conf import settings
import os
import mimetypes

def download_document(request, path):
    """
    Función para descargar documentos
    """
    file_path = os.path.join(settings.MEDIA_ROOT, path)
    
    if os.path.exists(file_path):
        # Determinar el tipo MIME
        content_type, encoding = mimetypes.guess_type(file_path)
        if content_type is None:
            content_type = 'application/octet-stream'
        
        # Abrir el archivo
        file = open(file_path, 'rb')
        response = FileResponse(file, content_type=content_type)
        
        # Establecer cabeceras para forzar descarga
        filename = os.path.basename(file_path)
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
    else:
        return HttpResponse(status=404)
