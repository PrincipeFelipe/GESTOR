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
    
    def get_permissions(self):
        """
        Modificación de permisos:
        - Listar y recuperar detalles: cualquier usuario autenticado
        - Crear, actualizar, eliminar: solo administradores
        """
        if self.action in ['list', 'retrieve']:
            # Permitir listado y consulta a cualquier usuario autenticado
            return [IsAuthenticated()]
        # Para otras acciones (crear, actualizar, eliminar), mantener restricción a admins
        return [IsSuperAdminOrAdmin()]

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
        """Retorna los documentos generales asociados al procedimiento"""
        try:
            procedimiento = self.get_object()
            
            # Usar el nuevo campo tipo_documento para filtrar
            documentos = Documento.objects.filter(
                procedimiento=procedimiento,
                tipo_documento='GENERAL'
            )
            
            serializer = DocumentoSerializer(documentos, many=True, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": f"Error al obtener documentos generales: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def debug(self, request, pk=None):
        """
        Endpoint de depuración para verificar que todos los campos están presentes
        """
        procedimiento = self.get_object()
        data = {
            'id': procedimiento.id,
            'nombre': procedimiento.nombre,
            'tipo': procedimiento.tipo.id if procedimiento.tipo else None,
            'nivel': procedimiento.nivel,
            'estado': procedimiento.estado,
            'tiempo_maximo': procedimiento.tiempo_maximo,  # Verificar este campo específicamente
            # Otros campos que quieras verificar
        }
        return Response(data)

# Modificar la clase PasoViewSet

class PasoViewSet(viewsets.ModelViewSet):
    queryset = Paso.objects.all()
    serializer_class = PasoSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['procedimiento']
    ordering_fields = ['numero']
    
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
                    if (documento_serializer.is_valid()):
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

from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from .models import Trabajo, PasoTrabajo, EnvioPaso
from .serializers import (
    TrabajoListSerializer, TrabajoDetailSerializer, TrabajoCreateSerializer,
    PasoTrabajoListSerializer, PasoTrabajoDetailSerializer, EnvioPasoSerializer
)
from .permissions import IsOwnerOrSameUnit

# Vistas existentes...

class TrabajoViewSet(viewsets.ModelViewSet):
    queryset = Trabajo.objects.all()
    permission_classes = [IsOwnerOrSameUnit]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return TrabajoCreateSerializer
        if self.action == 'list':
            return TrabajoListSerializer
        return TrabajoDetailSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = Trabajo.objects.all()
        
        # Si el usuario es superadmin o admin, mostrar todos los trabajos
        if user.is_superuser or user.tipo_usuario == 'ADMIN':  # Usar tipo_usuario en vez de role
            return queryset
        
        # Para usuarios normales, filtrar por usuario_creador y unidad_destino
        filters = Q(usuario_creador=user)
        
        if hasattr(user, 'unidad_destino') and user.unidad_destino is not None:
            filters |= Q(unidad=user.unidad_destino)
        
        return queryset.filter(filters)
    
    def perform_create(self, serializer):
        serializer.save(
            usuario_creador=self.request.user,
            unidad=self.request.user.unidad_destino  # Cambiar a unidad_destino
        )
    
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        trabajo = self.get_object()
        trabajo.cancelar_trabajo()
        return Response({"message": "Trabajo cancelado correctamente"})
    
    @action(detail=True, methods=['post'])
    def pausar(self, request, pk=None):
        trabajo = self.get_object()
        trabajo.pausar_trabajo()
        return Response({"message": "Trabajo pausado correctamente"})
    
    @action(detail=True, methods=['post'])
    def reanudar(self, request, pk=None):
        trabajo = self.get_object()
        trabajo.reanudar_trabajo()
        return Response({"message": "Trabajo reanudado correctamente"})


class PasoTrabajoViewSet(viewsets.GenericViewSet, 
                       mixins.RetrieveModelMixin, 
                       mixins.UpdateModelMixin):
    queryset = PasoTrabajo.objects.all()
    serializer_class = PasoTrabajoDetailSerializer
    permission_classes = [IsOwnerOrSameUnit]
    
    def get_queryset(self):
        user = self.request.user
        queryset = PasoTrabajo.objects.all()
        
        # Si el usuario es superadmin o admin, mostrar todos los pasos
        if user.is_superuser or user.tipo_usuario in ['SuperAdmin', 'Admin']:
            return queryset
        
        # Para usuarios normales, filtrar por usuario_creador del trabajo
        filters = Q(trabajo__usuario_creador=user)
        
        # Usar unidad_destino en lugar de unidad
        if hasattr(user, 'unidad_destino') and user.unidad_destino is not None:
            filters |= Q(trabajo__unidad=user.unidad_destino)
        
        return queryset.filter(filters)
    
    @action(detail=True, methods=['post'])
    def iniciar(self, request, pk=None):
        paso_trabajo = self.get_object()
        
        # Verificar si el paso ya ha sido iniciado
        if paso_trabajo.estado != 'PENDIENTE':
            return Response(
                {"error": "Este paso no está en estado PENDIENTE"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Iniciar el paso
        paso_trabajo.estado = 'EN_PROGRESO'
        paso_trabajo.fecha_inicio = timezone.now()
        paso_trabajo.save()
        
        # La fecha límite se calculará automáticamente a través del property
        
        return Response({"mensaje": "Paso iniciado correctamente"})
    
    @action(detail=True, methods=['post'])
    def completar(self, request, pk=None):
        paso_trabajo = self.get_object()
        
        # Verificar que el paso se puede completar
        if paso_trabajo.estado != 'EN_PROGRESO':
            return Response(
                {"error": "Solo se pueden completar pasos en progreso"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar si el paso requiere envío
        if paso_trabajo.paso.requiere_envio:
            # Aquí el backend espera numero_salida como campo directo, no dentro de un JSON 
            if not request.data.get('numero_salida') or 'documentacion' not in request.FILES:
                return Response(
                    {"error": "Se requiere número de salida y documentación"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Crear el registro de envío
            EnvioPaso.objects.create(
                paso_trabajo=paso_trabajo,
                numero_salida=request.data.get('numero_salida'),
                documentacion=request.FILES['documentacion'],
                notas_adicionales=request.data.get('notas_adicionales', '')
            )
        
        # Si hay bifurcaciones, verificar que se eligió una
        if paso_trabajo.paso.bifurcaciones and len(paso_trabajo.paso.bifurcaciones) > 0:
            if 'bifurcacion_elegida' not in request.data:
                return Response(
                    {"error": "Debe elegir una bifurcación para continuar"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            bifurcacion_id = request.data['bifurcacion_elegida']
            paso_trabajo.bifurcacion_elegida = bifurcacion_id
        
        # Guardar notas si se proporcionaron
        if 'notas' in request.data:
            paso_trabajo.notas = request.data['notas']
            
        paso_trabajo.completar_paso(request.user)
        
        # Si se eligió una bifurcación, actualizar el siguiente paso
        if paso_trabajo.bifurcacion_elegida:
            trabajo = paso_trabajo.trabajo
            trabajo.paso_actual = paso_trabajo.bifurcacion_elegida
            trabajo.save()
            
            # Desbloquear el paso de la bifurcación
            siguiente_paso = trabajo.pasos_trabajo.filter(
                paso__id=paso_trabajo.bifurcacion_elegida
            ).first()
            
            if siguiente_paso:
                siguiente_paso.estado = 'PENDIENTE'
                siguiente_paso.save()
        
        serializer = self.get_serializer(paso_trabajo)
        return Response(serializer.data)

from rest_framework.decorators import api_view, permission_classes

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def alertas_plazos(request):
    """Obtener alertas de pasos próximos a vencer o ya vencidos para el usuario y su unidad"""
    # Verificar si el usuario es SuperAdmin
    is_super_admin = request.user.is_superuser or (hasattr(request.user, 'tipo_usuario') and request.user.tipo_usuario == 'SUPERADMIN')
    
    # Verificar si se solicitan todas las alertas mediante parámetro de consulta
    show_all = request.query_params.get('all', '').lower() == 'true'
    
    # Obtener trabajos según el rol del usuario
    if is_super_admin and show_all:
        # SuperAdmin: Mostrar todos los trabajos activos del sistema
        trabajos = Trabajo.objects.filter(
            ~Q(estado__in=['COMPLETADO', 'CANCELADO'])
        )
    else:
        # Usuario regular: Solo mostrar trabajos de su unidad
        unidad_usuario = request.user.unidad_destino
        
        if not unidad_usuario:
            return Response([])  # Si el usuario no tiene unidad asignada, retornar lista vacía
        
        trabajos = Trabajo.objects.filter(
            # Trabajos de la misma unidad
            Q(unidad=unidad_usuario) &  
            # Excluir trabajos ya finalizados o cancelados
            ~Q(estado__in=['COMPLETADO', 'CANCELADO'])
        )
    
    # Lista para almacenar las alertas
    alertas = []
    
    # Fecha actual para comparar
    fecha_actual = timezone.now().date()
    
    for trabajo in trabajos:
        # Obtener pasos en progreso o pendientes que tengan fecha de inicio
        pasos = PasoTrabajo.objects.filter(
            trabajo=trabajo,
            estado__in=['PENDIENTE', 'EN_PROGRESO'],
            fecha_inicio__isnull=False
        )
        
        for paso in pasos:
            # Solo incluir pasos con tiempo_estimado definido
            if not paso.paso.tiempo_estimado:
                continue
            
            # Calcular si el paso ya venció o está próximo a vencer
            fecha_limite = paso.fecha_limite
            if not fecha_limite:  # Si no hay fecha límite, continuar con el siguiente paso
                continue
            
            # Convertir a fecha si es datetime
            if hasattr(fecha_limite, 'date'):
                fecha_limite = fecha_limite.date()
            
            # Calcular días restantes (pueden ser negativos si ya venció)
            dias_restantes = (fecha_limite - fecha_actual).days
            
            # Incluir si está próximo a vencer O YA VENCIÓ (días_restantes <= 0)
            if dias_restantes <= 3:  # Incluir vencidos y próximos a vencer (3 días)
                alertas.append({
                    'trabajo_id': trabajo.id,
                    'trabajo_titulo': trabajo.titulo,
                    'paso_id': paso.id,
                    'paso_numero': paso.paso_numero,
                    'paso_titulo': paso.paso.titulo or f"Paso {paso.paso_numero}",
                    'fecha_limite': fecha_limite,
                    'dias_restantes': dias_restantes,
                    'vencido': dias_restantes < 0,  # Agregar indicador de vencimiento
                    'estado': paso.estado,
                    'tiempo_estimado': paso.paso.tiempo_estimado,
                    # Añadir información del usuario asignado
                    'usuario_asignado': trabajo.usuario_iniciado.username if trabajo.usuario_iniciado else trabajo.usuario_creador.username,
                    # Añadir nombre completo del responsable para facilitar identificación
                    'responsable_nombre': (trabajo.usuario_iniciado.get_full_name() if trabajo.usuario_iniciado else 
                                         trabajo.usuario_creador.get_full_name()),
                    # Añadir información de la unidad
                    'unidad_nombre': trabajo.unidad.nombre if trabajo.unidad else None,
                    'unidad_id': trabajo.unidad.id if trabajo.unidad else None,
                    # Indicar si el trabajo pertenece al usuario actual o a otro miembro de la unidad
                    'es_propio': trabajo.usuario_iniciado == request.user or trabajo.usuario_creador == request.user
                })
    
    # Ordenar las alertas:
    # - Primero los vencidos (más grave)
    # - Luego por días restantes (ascendente)
    if is_super_admin and show_all:
        alertas = sorted(alertas, key=lambda x: (not x['vencido'], x['dias_restantes']))
    else:
        # Para usuarios normales, primero los propios, luego vencidos y finalmente por días restantes
        alertas = sorted(alertas, key=lambda x: (not x['es_propio'], not x['vencido'], x['dias_restantes']))
    
    return Response(alertas)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def crear_trabajo(request):
    # Obtener datos de la solicitud
    titulo = request.data.get('titulo')
    descripcion = request.data.get('descripcion', '')
    procedimiento_id = request.data.get('procedimiento')
    
    if not titulo or not procedimiento_id:
        return Response({"error": "Faltan campos requeridos"}, status=400)
    
    try:
        # Obtener el procedimiento
        procedimiento = Procedimiento.objects.get(id=procedimiento_id)
        
        # Crear el trabajo
        trabajo = Trabajo.objects.create(
            titulo=titulo,
            descripcion=descripcion,
            procedimiento=procedimiento,
            usuario_creador=request.user,
            unidad=request.user.unidad,
            estado='INICIADO'
        )
        
        # Obtener los pasos del procedimiento y crear los pasos del trabajo
        pasos_procedimiento = Paso.objects.filter(
            procedimiento=procedimiento
        ).order_by('numero')
        
        for paso_procedimiento in pasos_procedimiento:
            # IMPORTANTE: Asignar explícitamente el número del paso
            PasoTrabajo.objects.create(
                trabajo=trabajo,
                paso=paso_procedimiento,
                paso_numero=paso_procedimiento.numero,  # Asegurar que este campo no sea nulo
                estado='PENDIENTE'
            )
        
        serializer = TrabajoSerializer(trabajo)
        return Response(serializer.data, status=201)
        
    except Procedimiento.DoesNotExist:
        return Response({"error": "El procedimiento no existe"}, status=404)
    except Exception as e:
        # Agregar un log detallado para facilitar la depuración
        import traceback
        print(f"Error al crear trabajo: {str(e)}")
        print(traceback.format_exc())
        return Response({"error": "Error al crear el trabajo"}, status=500)
