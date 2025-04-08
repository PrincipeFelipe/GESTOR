from django.shortcuts import render
from rest_framework import viewsets, status, filters, renderers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
import os  # Añadir esta importación
from django.db import models, transaction  # Añadir esta importación
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
    filterset_fields = ['nombre', 'procedimiento']
    
    def perform_create(self, serializer):
        """
        Al crear un documento, asegurarse de que se guarda en la carpeta correcta.
        """
        procedimiento = serializer.validated_data.get('procedimiento')
        archivo = serializer.validated_data.get('archivo')
        
        # Guardar el documento
        documento = serializer.save()
        
        # Si hay archivo y procedimiento, verificar que esté en la carpeta correcta
        if archivo and procedimiento:
            # La función documento_upload_path se encargará de la ruta correcta
            pass

class ProcedimientoViewSet(viewsets.ModelViewSet):
    queryset = Procedimiento.objects.all()
    permission_classes = [IsAdminOrSuperAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'tipo__nombre', 'nivel', 'estado', 'fecha_actualizacion']
    filterset_fields = ['tipo', 'nivel', 'estado', 'creado_por']
    
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
    
    @action(detail=True, methods=['get'])
    def cadena_completa(self, request, pk=None):
        """Devuelve la cadena completa de procedimientos relacionados"""
        procedimiento = self.get_object()
        
        # Encontrar el procedimiento inicial (nivel más bajo)
        proc_inicial = procedimiento
        while Procedimiento.objects.filter(procedimiento_relacionado=proc_inicial).exists():
            proc_inicial = Procedimiento.objects.filter(procedimiento_relacionado=proc_inicial).first()
        
        # Construir la cadena completa desde el inicial
        cadena = [proc_inicial]
        proc_actual = proc_inicial
        
        while proc_actual.procedimiento_relacionado:
            proc_actual = proc_actual.procedimiento_relacionado
            cadena.append(proc_actual)
        
        # Serializar la cadena
        serializer = ProcedimientoListSerializer(cadena, many=True)
        
        return Response({
            'cadena_completa': serializer.data,
            'procedimiento_actual': int(pk),
            'total_niveles': len(cadena)
        })
    
    @action(detail=True, methods=['get'], url_path='documentos-generales')
    def documentos_generales(self, request, pk=None):
        """
        Retorna los documentos generales asociados al procedimiento (no vinculados a pasos)
        """
        try:
            procedimiento = self.get_object()
            
            # Buscar documentos que estén en la carpeta /general/ y excluir los que están asociados a pasos
            documentos = Documento.objects.filter(
                procedimiento=procedimiento
            ).exclude(
                # Excluir documentos que estén asociados a pasos
                id__in=DocumentoPaso.objects.values_list('documento_id', flat=True)
            ).exclude(
                # Excluir documentos con ruta en la carpeta de pasos
                archivo__contains='/pasos/'
            )
            
            serializer = DocumentoSerializer(documentos, many=True, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": f"Error al obtener documentos generales: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# Modificar la clase PasoViewSet

class PasoViewSet(viewsets.ModelViewSet):
    queryset = Paso.objects.all()
    serializer_class = PasoSerializer
    permission_classes = [IsAdminOrSuperAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['titulo', 'descripcion']
    ordering_fields = ['numero', 'titulo']
    filterset_fields = ['procedimiento']
    
    def perform_create(self, serializer):
        procedimiento_id = self.request.data.get('procedimiento')
        
        # Buscar el número más alto y sumar 1
        max_numero = Paso.objects.filter(procedimiento=procedimiento_id).aggregate(
            max_numero=models.Max('numero')
        )['max_numero'] or 0
        
        # Crear con número automático
        serializer.save(numero=max_numero + 1)
    
    def perform_destroy(self, instance):
        """
        Al eliminar un paso, actualizar la numeración de los pasos posteriores
        y limpiar las referencias en bifurcaciones
        """
        procedimiento_id = instance.procedimiento.id
        numero_eliminado = instance.numero
        
        # Comenzar una transacción para asegurar atomicidad
        with transaction.atomic():
            # 1. Encontrar pasos que necesitan actualización (número > al eliminado)
            pasos_a_actualizar = Paso.objects.filter(
                procedimiento=procedimiento_id, 
                numero__gt=numero_eliminado
            )
            
            # 2. Guardar IDs de pasos para actualizar referencias de bifurcaciones
            paso_ids_a_actualizar = list(pasos_a_actualizar.values_list('id', flat=True))
            paso_id_eliminado = instance.id
            
            # 3. Eliminar el paso primero
            instance.delete()
            
            # 4. Actualizar numeración de pasos posteriores
            for paso in pasos_a_actualizar:
                paso.numero -= 1
                paso.save()
            
            # 5. Buscar bifurcaciones que apuntan al paso eliminado o necesitan ajuste
            # Para cada paso, revisar sus bifurcaciones
            pasos_con_bifurcaciones = Paso.objects.filter(
                procedimiento=procedimiento_id, 
                bifurcaciones__isnull=False
            )
            
            for paso in pasos_con_bifurcaciones:
                bifurcaciones_modificadas = False
                nuevas_bifurcaciones = []
                
                for bifurcacion in paso.bifurcaciones:
                    # Si la bifurcación apunta al paso eliminado, omitirla
                    if str(bifurcacion.get('paso_destino')) == str(paso_id_eliminado):
                        bifurcaciones_modificadas = True
                        continue  # No incluir esta bifurcación
                        
                    nuevas_bifurcaciones.append(bifurcacion)
                
                if bifurcaciones_modificadas:
                    paso.bifurcaciones = nuevas_bifurcaciones
                    paso.save()
    
    @action(detail=True, methods=['get', 'post', 'delete'], url_path='documentos')
    def documentos(self, request, pk=None):
        """
        GET: Listar documentos de un paso
        POST: Añadir un documento a un paso
        """
        paso = self.get_object()
        
        if request.method == 'GET':
            # Obtener documentos asociados al paso
            paso_documentos = DocumentoPaso.objects.filter(paso=paso)
            serializer = DocumentoPasoSerializer(paso_documentos, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            # Si viene un archivo en la petición, crear un nuevo documento
            if request.FILES.get('archivo'):
                try:
                    import os
                    from django.conf import settings
                    
                    # Preparar los datos para crear un nuevo documento
                    documento_data = {
                        'nombre': request.data.get('nombre', 'Documento sin título'),
                        'descripcion': request.data.get('descripcion', ''),
                        'procedimiento': paso.procedimiento.id,
                        'archivo': request.FILES.get('archivo')
                    }
                    
                    # Crear el documento temporalmente en general
                    documento_serializer = DocumentoSerializer(data=documento_data)
                    if documento_serializer.is_valid():
                        documento_temp = documento_serializer.save()
                        
                        # Guardar la ruta del archivo original para eliminarlo después
                        ruta_original = None
                        if documento_temp.archivo and hasattr(documento_temp.archivo, 'path'):
                            ruta_original = documento_temp.archivo.path
                            
                        # Ahora crear la relación con el paso, lo que moverá el archivo a la carpeta de pasos
                        documento_paso = DocumentoPaso(
                            paso=paso,
                            documento=documento_temp,
                            orden=request.data.get('orden', 1),
                            notas=request.data.get('notas', '')
                        )
                        
                        # Al guardar DocumentoPaso, su método save() crea una copia en la carpeta de pasos
                        documento_paso.save()
                        
                        # Eliminar el archivo original si todavía existe y es diferente al nuevo
                        if ruta_original and os.path.exists(ruta_original):
                            # Verificar si la ruta contiene 'general' para confirmar que no es el archivo final
                            if '/general/' in ruta_original or '\\general\\' in ruta_original:
                                try:
                                    os.remove(ruta_original)
                                    print(f"Archivo original eliminado: {ruta_original}")
                                except Exception as e:
                                    print(f"Error al eliminar archivo original: {str(e)}")
                        
                        return Response(
                            DocumentoPasoSerializer(documento_paso).data, 
                            status=status.HTTP_201_CREATED
                        )
                    
                    return Response(documento_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                        
                except Exception as e:
                    # Si hay un error, asegurarse de limpiar cualquier documento creado
                    if 'documento_temp' in locals() and documento_temp:
                        documento_temp.delete()
                    import traceback
                    return Response({
                        'error': str(e),
                        'trace': traceback.format_exc()
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['delete'], url_path='documentos/(?P<documento_id>[^/.]+)')
    def eliminar_documento(self, request, pk=None, documento_id=None):
        """Eliminar un documento específico de un paso"""
        try:
            # Obtener la relación paso-documento
            paso_documento = DocumentoPaso.objects.get(paso_id=pk, id=documento_id)
            
            # Obtener el documento asociado
            documento = paso_documento.documento
            
            # Siempre eliminamos el documento físico ya que ahora cada paso tiene su propia copia
            archivo_path = documento.archivo.path if documento.archivo else None
            
            # Eliminar la relación y el documento
            paso_documento.delete()
            documento.delete()
            
            # Si había un archivo físico, eliminarlo
            if archivo_path and os.path.exists(archivo_path):
                os.remove(archivo_path)
                
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
