from rest_framework import serializers
from .models import Procedimiento, TipoProcedimiento, Paso, Documento, DocumentoPaso, HistorialProcedimiento, Trabajo, PasoTrabajo, EnvioPaso
from users.serializers import UserSerializer

class TipoProcedimientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoProcedimiento
        fields = ['id', 'nombre', 'descripcion']

class DocumentoSerializer(serializers.ModelSerializer):
    procedimiento_id = serializers.IntegerField(source='procedimiento.id', read_only=True, allow_null=True)
    archivo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Documento
        fields = ['id', 'nombre', 'descripcion', 'procedimiento', 'procedimiento_id', 'archivo', 'archivo_url', 'url', 'extension', 'fecha_creacion', 'fecha_actualizacion']
        extra_kwargs = {
            'archivo': {'write_only': True, 'required': False},
        }
    
    def get_archivo_url(self, obj):
        if obj.archivo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.archivo.url)
            return obj.archivo.url
        return None

    def create(self, validated_data):
        archivo = validated_data.get('archivo')
        if archivo:
            # Extraer la extensión del archivo
            nombre_archivo = archivo.name
            extension = nombre_archivo.split('.')[-1].lower() if '.' in nombre_archivo else ''
            validated_data['extension'] = extension
        
        return super().create(validated_data)

    def update(self, instance, validated_data):
        archivo = validated_data.get('archivo')
        if archivo:
            # Si se actualiza el archivo, actualizar también la extensión
            nombre_archivo = archivo.name
            extension = nombre_archivo.split('.')[-1].lower() if '.' in nombre_archivo else ''
            validated_data['extension'] = extension
            
            # Si cambia el procedimiento o es un documento de paso, actualizar la ubicación del archivo
            if 'procedimiento' in validated_data or hasattr(instance, 'documento_paso'):
                # La función save del modelo se encargará de mover el archivo a la ubicación correcta
                pass
        
        return super().update(instance, validated_data)

class DocumentoPasoSerializer(serializers.ModelSerializer):
    documento_detalle = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = DocumentoPaso
        fields = ['id', 'paso', 'documento', 'documento_detalle', 'orden', 'notas']
        read_only_fields = ['id']
    
    def get_documento_detalle(self, obj):
        return DocumentoSerializer(obj.documento).data

class PasoSerializer(serializers.ModelSerializer):
    documentos = serializers.SerializerMethodField(read_only=True)
    documentos_ids = serializers.ListField(
        child=serializers.IntegerField(), 
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Paso
        fields = ['id', 'procedimiento', 'numero', 'titulo', 'descripcion', 
                 'tiempo_estimado', 'responsable', 'documentos', 'documentos_ids', 
                 'bifurcaciones', 'es_final', 'requiere_envio']
    
    def get_documentos(self, obj):
        """
        Obtiene los documentos asociados al paso y los serializa.
        """
        from .models import DocumentoPaso
        documentos_paso = DocumentoPaso.objects.filter(paso=obj)
        return DocumentoPasoSerializer(documentos_paso, many=True).data

class HistorialProcedimientoSerializer(serializers.ModelSerializer):
    usuario_detalle = UserSerializer(source='usuario', read_only=True)
    
    class Meta:
        model = HistorialProcedimiento
        fields = ['id', 'procedimiento', 'version', 'fecha_cambio', 'usuario', 'usuario_detalle', 'descripcion_cambio']
        read_only_fields = ['fecha_cambio']

class ProcedimientoListSerializer(serializers.ModelSerializer):
    tipo_nombre = serializers.CharField(source='tipo.nombre', read_only=True)
    nivel_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Procedimiento
        fields = [
            'id', 'nombre', 'descripcion', 'tipo', 'nivel', 'estado',
            'fecha_actualizacion', 'version', 'tipo_nombre', 'nivel_display',
            'procedimiento_relacionado', 'tiempo_maximo'  # Añadir tiempo_maximo aquí
        ]
    
    def get_nivel_display(self, obj):
        return dict(Procedimiento.NIVEL_CHOICES).get(obj.nivel, obj.nivel)

class ProcedimientoDetailSerializer(serializers.ModelSerializer):
    tipo_nombre = serializers.CharField(source='tipo.nombre', read_only=True)
    nivel_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Procedimiento
        fields = [
            'id', 'nombre', 'descripcion', 'tipo', 'nivel', 'estado',
            'fecha_creacion', 'fecha_actualizacion', 'version',
            'creado_por', 'actualizado_por', 'procedimiento_relacionado',
            'tipo_nombre', 'nivel_display', 'tiempo_maximo'  # Añadir tiempo_maximo aquí
        ]
        read_only_fields = ['fecha_creacion', 'fecha_actualizacion', 'creado_por', 'actualizado_por']
    
    def get_nivel_display(self, obj):
        return dict(Procedimiento.NIVEL_CHOICES).get(obj.nivel, obj.nivel)

class ProcedimientoDetailSerializer(serializers.ModelSerializer):
    tipo_nombre = serializers.CharField(source='tipo.nombre', read_only=True)
    nivel_display = serializers.CharField(source='get_nivel_display', read_only=True)
    pasos = PasoSerializer(many=True, read_only=True)
    procedimiento_relacionado_info = serializers.SerializerMethodField(read_only=True)
    procedimientos_derivados = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Procedimiento
        fields = ['id', 'nombre', 'descripcion', 'tipo', 'tipo_nombre', 'nivel', 'nivel_display', 
                  'estado', 'version', 'fecha_creacion', 'fecha_actualizacion', 
                  'creado_por', 'actualizado_por', 'pasos', 
                  'procedimiento_relacionado', 'procedimiento_relacionado_info',
                  'procedimientos_derivados', 'tiempo_maximo']
    
    def get_procedimiento_relacionado_info(self, obj):
        if (obj.procedimiento_relacionado):
            return {
                'id': obj.procedimiento_relacionado.id,
                'nombre': obj.procedimiento_relacionado.nombre,
                'nivel': obj.procedimiento_relacionado.nivel,
                'nivel_display': obj.procedimiento_relacionado.get_nivel_display()
            }
        return None
    
    def get_procedimientos_derivados(self, obj):
        derivados = Procedimiento.objects.filter(procedimiento_relacionado=obj)
        if derivados.exists():
            return [{
                'id': proc.id,
                'nombre': proc.nombre,
                'nivel': proc.nivel,
                'nivel_display': proc.get_nivel_display()
            } for proc in derivados]
        return []

class ProcedimientoSerializer(serializers.ModelSerializer):
    # Campos existentes
    tipo_nombre = serializers.CharField(source='tipo.nombre', read_only=True)
    nivel_display = serializers.SerializerMethodField()

    class Meta:
        model = Procedimiento
        fields = [
            'id', 'nombre', 'descripcion', 'tipo', 'nivel', 'estado',
            'fecha_creacion', 'fecha_actualizacion', 'version',
            'creado_por', 'actualizado_por', 'procedimiento_relacionado',
            'tipo_nombre', 'nivel_display', 'tiempo_maximo'  # Asegurarse de incluir tiempo_maximo
        ]
        read_only_fields = ['fecha_creacion', 'fecha_actualizacion', 'creado_por', 'actualizado_por']
    
    def get_nivel_display(self, obj):
        return dict(Procedimiento.NIVEL_CHOICES).get(obj.nivel, obj.nivel)

class EnvioPasoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EnvioPaso
        fields = ['id', 'numero_salida', 'fecha_envio', 'documentacion', 'notas_adicionales']


class PasoTrabajoListSerializer(serializers.ModelSerializer):
    paso_numero = serializers.IntegerField(source='paso.numero')
    paso_titulo = serializers.CharField(source='paso.titulo')
    
    class Meta:
        model = PasoTrabajo
        fields = ['id', 'paso_numero', 'paso_titulo', 'estado', 'fecha_inicio', 'fecha_fin']


class PasoTrabajoDetailSerializer(serializers.ModelSerializer):
    paso_detalle = PasoSerializer(source='paso', read_only=True)
    envio = EnvioPasoSerializer(read_only=True)
    usuario_completado_nombre = serializers.SerializerMethodField()
    
    class Meta:
        model = PasoTrabajo
        fields = [
            'id', 'estado', 'fecha_inicio', 'fecha_fin', 
            'usuario_completado', 'usuario_completado_nombre', 'notas',
            'bifurcacion_elegida', 'paso_detalle', 'envio'
        ]
    
    def get_usuario_completado_nombre(self, obj):
        if obj.usuario_completado:
            return obj.usuario_completado.get_full_name() or obj.usuario_completado.username
        return None


class TrabajoListSerializer(serializers.ModelSerializer):
    procedimiento_nombre = serializers.CharField(source='procedimiento.nombre')
    usuario_creador_nombre = serializers.SerializerMethodField()
    unidad_nombre = serializers.CharField(source='unidad.nombre')
    tiempo_estimado_total = serializers.SerializerMethodField()
    progreso = serializers.SerializerMethodField()
    
    class Meta:
        model = Trabajo
        fields = [
            'id', 'titulo', 'procedimiento', 'procedimiento_nombre', 
            'usuario_creador', 'usuario_creador_nombre', 'unidad', 'unidad_nombre',
            'fecha_inicio', 'fecha_fin', 'estado', 'paso_actual',
            'tiempo_estimado_total', 'progreso'
        ]
    
    def get_usuario_creador_nombre(self, obj):
        return obj.usuario_creador.get_full_name() or obj.usuario_creador.username
    
    def get_tiempo_estimado_total(self, obj):
        # Suma de todos los tiempos estimados de los pasos asociados al procedimiento
        tiempo_total = sum(
            float(paso.tiempo_estimado) if paso.tiempo_estimado else 0 
            for paso in obj.procedimiento.pasos.all()
        )
        return tiempo_total
    
    def get_progreso(self, obj):
        total_pasos = obj.pasos_trabajo.count()
        if total_pasos == 0:
            return 0
        
        pasos_completados = obj.pasos_trabajo.filter(estado='COMPLETADO').count()
        return int((pasos_completados / total_pasos) * 100)


class TrabajoDetailSerializer(serializers.ModelSerializer):
    procedimiento_detalle = ProcedimientoSerializer(source='procedimiento', read_only=True)
    pasos = PasoTrabajoListSerializer(source='pasos_trabajo', many=True, read_only=True)
    usuario_creador_nombre = serializers.SerializerMethodField()
    unidad_nombre = serializers.CharField(source='unidad.nombre')
    tiempo_transcurrido_dias = serializers.SerializerMethodField()
    
    class Meta:
        model = Trabajo
        fields = [
            'id', 'titulo', 'descripcion', 'procedimiento', 'procedimiento_detalle',
            'usuario_creador', 'usuario_creador_nombre', 'unidad', 'unidad_nombre',
            'fecha_inicio', 'fecha_fin', 'estado', 'paso_actual',
            'tiempo_transcurrido_dias', 'pasos'
        ]
    
    def get_usuario_creador_nombre(self, obj):
        return obj.usuario_creador.get_full_name() or obj.usuario_creador.username
    
    def get_tiempo_transcurrido_dias(self, obj):
        tiempo = obj.tiempo_transcurrido()
        return round(tiempo.total_seconds() / (60 * 60 * 24), 1)  # Convertir a días con un decimal


class TrabajoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trabajo
        fields = ['procedimiento', 'titulo', 'descripcion']
    
    def create(self, validated_data):
        usuario = self.context['request'].user
        unidad = usuario.unidad
        
        # Crear el trabajo
        trabajo = Trabajo.objects.create(
            procedimiento=validated_data['procedimiento'],
            titulo=validated_data['titulo'],
            descripcion=validated_data.get('descripcion', ''),
            usuario_creador=usuario,
            unidad=unidad,
            estado='INICIADO'
        )
        
        # Crear instancias de pasos para este trabajo
        procedimiento = validated_data['procedimiento']
        pasos = procedimiento.pasos.all().order_by('numero')
        
        for paso in pasos:
            estado_inicial = 'PENDIENTE' if paso.numero == 1 else 'BLOQUEADO'
            PasoTrabajo.objects.create(
                trabajo=trabajo,
                paso=paso,
                estado=estado_inicial
            )
        
        return trabajo