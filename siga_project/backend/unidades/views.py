from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction, IntegrityError
from .models import Unidad
from .serializers import UnidadSerializer
import uuid

class UnidadViewSet(viewsets.ModelViewSet):
    queryset = Unidad.objects.all()
    serializer_class = UnidadSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Aplicar filtros si es necesario
        # ... tu código de filtrado existente ...
        
        return queryset
        
    def list(self, request, *args, **kwargs):
        # Verificar si se solicita sin paginación
        pagination_param = request.query_params.get('pagination', 'true')
        if pagination_param.lower() == 'false':
            # Desactivar paginación para esta solicitud
            self.pagination_class = None
        
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        try:
            # Eliminar cod_unidad si viene en la petición (lo generamos automáticamente)
            if 'cod_unidad' in request.data:
                mutable_data = request.data.copy()
                mutable_data.pop('cod_unidad', None)
                serializer = self.get_serializer(data=mutable_data)
            else:
                serializer = self.get_serializer(data=request.data)

            serializer.is_valid(raise_exception=True)
            
            # Crear la unidad en una transacción atómica
            with transaction.atomic():
                self.perform_create(serializer)
                
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except IntegrityError as e:
            # Errores específicos de integridad (como duplicados)
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error de integridad al crear unidad: {str(e)}")
            
            return Response(
                {'detail': f'Error: ya existe una unidad con esa configuración. {str(e)}'},
                status=status.HTTP_409_CONFLICT
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error al crear unidad: {str(e)}")
            
            # Devolver respuesta de error
            return Response(
                {'detail': f'Error al crear unidad: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def update(self, request, *args, **kwargs):
        try:
            # Obtener la instancia existente
            instance = self.get_object()
            
            # Preparar los datos para la actualización
            mutable_data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
            
            # Aquí está el cambio clave: NO removemos cod_unidad, sino que usamos el existente si no viene
            if 'cod_unidad' not in mutable_data or not mutable_data['cod_unidad']:
                mutable_data['cod_unidad'] = instance.cod_unidad
                    
            partial = kwargs.pop('partial', False)
            serializer = self.get_serializer(instance, data=mutable_data, partial=partial)
            serializer.is_valid(raise_exception=True)
            
            # Comprobar si ha cambiado el padre
            old_padre = instance.id_padre
            new_padre = serializer.validated_data.get('id_padre', old_padre)
            
            # Si cambia el padre, necesitamos recalcular código
            needs_recalc = (old_padre != new_padre)
            
            # Actualizar en transacción
            with transaction.atomic():
                # Si cambia el padre, resetear el código para forzar recálculo
                if needs_recalc:
                    instance.cod_unidad = f"temp_{uuid.uuid4()}"
                    instance.save(update_fields=['cod_unidad'])
                
                # Realizar la actualización
                self.perform_update(serializer)
            
            return Response(serializer.data)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error al actualizar unidad: {str(e)}")
            
            return Response(
                {'detail': f'Error al actualizar unidad: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()

    @action(detail=False, methods=['post'])
    def regenerate_codes(self, request):
        """Endpoint para regenerar todos los códigos jerárquicos"""
        try:
            with transaction.atomic():
                # 1. Resetear todos los códigos a valores temporales
                Unidad.objects.update(cod_unidad='temp_reset')
                
                # 2. Regenerar códigos empezando por las unidades raíz
                raices = Unidad.objects.filter(id_padre__isnull=True).order_by('id')
                
                for i, raiz in enumerate(raices, 1):
                    raiz.cod_unidad = str(i)
                    raiz.nivel = 1
                    raiz.save(update_fields=['cod_unidad', 'nivel'])
                    
                    # Los hijos se actualizarán mediante el signal
            
            return Response({'detail': 'Códigos regenerados con éxito'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'detail': f'Error al regenerar códigos: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )