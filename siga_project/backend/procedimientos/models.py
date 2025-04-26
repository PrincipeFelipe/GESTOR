from django.db import models
from users.models import Usuario
from django.conf import settings
from django.utils import timezone
import os
from django.core.files.base import ContentFile
from unidades.models import Unidad

class TipoProcedimiento(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return self.nombre
    
    class Meta:
        verbose_name = "Tipo de Procedimiento"
        verbose_name_plural = "Tipos de Procedimientos"
        ordering = ['nombre']

class Procedimiento(models.Model):
    ESTADO_CHOICES = [
        ('BORRADOR', 'Borrador'),
        ('VIGENTE', 'Vigente'),
        ('OBSOLETO', 'Obsoleto'),
    ]
    
    NIVEL_CHOICES = [
        ('PUESTO', 'Puesto'),
        ('COMPANIA', 'Compañía'),
        ('COMANDANCIA', 'Comandancia'),
        ('ZONA', 'Zona'),
        ('DIRECCION', 'Dirección General'),
        ('GENERAL', 'General'),  # Para procedimientos que aplican a todos los niveles
    ]
    
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField()
    tipo = models.ForeignKey(TipoProcedimiento, on_delete=models.CASCADE, related_name='procedimientos')
    nivel = models.CharField(max_length=20, choices=NIVEL_CHOICES, default='GENERAL')
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='BORRADOR')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    version = models.CharField(max_length=10, default='1.0')
    creado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='procedimientos_creados')
    actualizado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='procedimientos_actualizados')
    
    # Nuevo campo para relacionar procedimientos de distintos niveles
    procedimiento_relacionado = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL,
        null=True, 
        blank=True,
        related_name='procedimientos_derivados',
        help_text="Procedimiento de nivel superior al que se envía este procedimiento"
    )
    
    # Nuevo campo para tiempo máximo de completado en días
    tiempo_maximo = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Número de días máximo para completar el procedimiento"
    )
    
    def __str__(self):
        return f"{self.nombre} (v{self.version}, {self.get_nivel_display()})"
    
    # Método para obtener la cadena completa de procedimientos relacionados
    def get_cadena_procedimientos(self):
        """Devuelve la cadena completa de procedimientos relacionados de menor a mayor nivel"""
        cadena = [self]
        proc_actual = self
        
        # Buscar hacia arriba (niveles superiores)
        while proc_actual.procedimiento_relacionado:
            proc_actual = proc_actual.procedimiento_relacionado
            cadena.append(proc_actual)
        
        return cadena
    
    # Método para verificar si este procedimiento es el inicio de un proceso
    @property
    def es_inicio_proceso(self):
        """Determina si este procedimiento es el inicio de un proceso (no tiene predecesores)"""
        return not Procedimiento.objects.filter(procedimiento_relacionado=self).exists()
    
    # Método para verificar si este procedimiento es el final de un proceso
    @property
    def es_fin_proceso(self):
        """Determina si este procedimiento es el final de un proceso (no tiene procedimiento relacionado)"""
        return self.procedimiento_relacionado is None
    
    # Método para verificar aplicabilidad
    def es_aplicable_a_unidad(self, unidad):
        """
        Determina si este procedimiento es aplicable a una unidad específica,
        teniendo en cuenta los casos especiales de unidades híbridas.
        """
        # Si el procedimiento es para ZONA
        if (self.nivel == 'ZONA'):
            return unidad.tipo_unidad in ['ZONA', 'ZONA_COMANDANCIA']
            
        # Si el procedimiento es para COMANDANCIA
        if (self.nivel == 'COMANDANCIA'):
            return unidad.tipo_unidad in ['COMANDANCIA', 'ZONA_COMANDANCIA']
            
        # Para otros niveles, comparación directa
        return self.nivel == unidad.tipo_unidad
    
    class Meta:
        verbose_name = "Procedimiento"
        verbose_name_plural = "Procedimientos"
        ordering = ['-fecha_actualizacion']
        # Añadir restricción única para nombre+tipo+nivel
        unique_together = ['nombre', 'tipo', 'nivel']

class Paso(models.Model):
    procedimiento = models.ForeignKey(Procedimiento, on_delete=models.CASCADE, related_name='pasos')
    # Cambiar la definición del campo numero para que no permita nulos y tenga un valor por defecto
    numero = models.IntegerField(null=False, default=1)  # Asegurar que nunca sea nulo
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    tiempo_estimado = models.CharField(max_length=10, blank=True, null=True)
    responsable = models.CharField(max_length=100, blank=True, null=True)
    bifurcaciones = models.JSONField(default=list, blank=True)  
    es_final = models.BooleanField(default=False, help_text="Indica si este paso finaliza el procedimiento")
    # Nuevo campo para indicar si el paso requiere envío y respuesta
    requiere_envio = models.BooleanField(
        default=False, 
        help_text="Indica si este paso requiere un envío que necesita respuesta para continuar"
    )
    
    def __str__(self):
        return f"{self.procedimiento.nombre} - Paso {self.numero}: {self.titulo}"
    
    class Meta:
        verbose_name = "Paso"
        verbose_name_plural = "Pasos"
        ordering = ['numero']
        unique_together = ['procedimiento', 'numero']

import os
from django.utils.text import slugify
from datetime import datetime
from django.conf import settings

def documento_upload_path(instance, filename):
    """Define la ruta donde se guardarán los documentos"""
    import os
    from django.conf import settings
    
    # Sanitizar el nombre del archivo para evitar problemas
    filename = os.path.basename(filename)
    
    if hasattr(instance, '_para_paso') and instance._para_paso:
        # Ruta para documentos de pasos (ahora usando una carpeta común)
        relative_path = f'procedimientos/{instance._procedimiento_id}/pasos'
        full_path = os.path.join(settings.MEDIA_ROOT, relative_path)
        
        # Crear las carpetas si no existen
        os.makedirs(full_path, exist_ok=True)
        
        # Si tenemos información adicional del paso, añadirla al nombre del archivo
        if hasattr(instance, '_paso_id') and instance._paso_id:
            # Añadir prefijo al nombre del archivo con el ID del paso
            nombre_base, extension = os.path.splitext(filename)
            filename = f"{nombre_base}{extension}"
        
        return f'{relative_path}/{filename}'
    
    elif instance.procedimiento:
        # Ruta para documentos generales
        relative_path = f'procedimientos/{instance.procedimiento.id}/general'
        full_path = os.path.join(settings.MEDIA_ROOT, relative_path)
        
        # Crear las carpetas si no existen
        os.makedirs(full_path, exist_ok=True)
        
        return f'{relative_path}/{filename}'
    
    # Caso para documentos sin procedimiento asociado
    other_path = 'procedimientos/otros'
    os.makedirs(os.path.join(settings.MEDIA_ROOT, other_path), exist_ok=True)
    return f'{other_path}/{filename}'

class Documento(models.Model):
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    procedimiento = models.ForeignKey(Procedimiento, on_delete=models.CASCADE, related_name='documentos', null=True)
    archivo = models.FileField(upload_to=documento_upload_path, null=True, blank=True)
    url = models.URLField(max_length=500, null=True, blank=True)
    
    # Nuevo campo para el tipo de documento
    TIPO_CHOICES = [
        ('GENERAL', 'Documento general'),
        ('PASO', 'Documento asociado a paso'),
    ]
    tipo_documento = models.CharField(
        max_length=10, 
        choices=TIPO_CHOICES, 
        default='GENERAL',
        help_text="Indica si el documento es general del procedimiento o está asociado a un paso específico"
    )
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    extension = models.CharField(max_length=10, blank=True, null=True)
    
    @property
    def archivo_url(self):
        if self.archivo:
            return self.archivo.url
        return None
    
    def save(self, *args, **kwargs):
        # Extraer la extensión del archivo
        if self.archivo and not self.extension:
            self.extension = self.archivo.name.split('.')[-1].lower() if '.' in self.archivo.name else ''
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # Si tiene archivo, eliminarlo del sistema de archivos
        if self.archivo:
            try:
                storage, path = self.archivo.storage, self.archivo.path
                storage.delete(path)
            except Exception as e:
                # Loguear el error pero continuar con la eliminación
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error al eliminar archivo: {str(e)}")
        
        super().delete(*args, **kwargs)

class DocumentoPaso(models.Model):
    """
    Relaciona un documento con un paso específico y permite añadir notas
    """
    paso = models.ForeignKey(Paso, on_delete=models.CASCADE, related_name='documento_paso')
    documento = models.ForeignKey(Documento, on_delete=models.CASCADE)
    orden = models.IntegerField(default=1)
    notas = models.TextField(blank=True, null=True)
    
    class Meta:
        verbose_name = "Documento de paso"
        verbose_name_plural = "Documentos de pasos"
        ordering = ['orden']
        unique_together = ['paso', 'documento']
        
    def save(self, *args, **kwargs):
        # Si se está creando un nuevo DocumentoPaso (no tiene id aún)
        if not self.pk:
            # Verificar si ya existe un documento físico
            original_doc = self.documento
            
            # Si hay archivo físico, crear un nuevo documento con ese archivo en la ubicación correcta
            if original_doc.archivo:
                from django.core.files.base import ContentFile
                import os
                
                # Crear un nuevo documento
                nuevo_doc = Documento()
                nuevo_doc.nombre = original_doc.nombre
                nuevo_doc.descripcion = original_doc.descripcion
                nuevo_doc.procedimiento = original_doc.procedimiento
                nuevo_doc.extension = original_doc.extension
                
                # Marcar el documento para que documento_upload_path sepa que va en carpeta de pasos
                nuevo_doc._para_paso = True
                nuevo_doc._paso_id = self.paso.numero
                nuevo_doc._procedimiento_id = self.paso.procedimiento.id
                
                # Guardar primero sin archivo para crear el registro
                nuevo_doc.save()
                
                # Abrir y copiar el contenido del archivo original
                original_doc.archivo.open()
                content = original_doc.archivo.read()
                original_doc.archivo.close()
                
                # Obtener el nombre del archivo original y añadir prefijo del paso
                nombre_base, extension = os.path.splitext(os.path.basename(original_doc.archivo.name))
                nuevo_nombre = f"{nombre_base}{extension}"
                
                # Guardar el archivo en la ubicación común para todos los pasos
                nuevo_doc.archivo.save(nuevo_nombre, ContentFile(content), save=True)
                
                # Reemplazar la referencia al documento original con el nuevo
                self.documento = nuevo_doc
                
                # En este punto, el archivo original en 'general' debería eliminarse en la vista
                
            elif original_doc.url:
                # Si es una URL, crear también una copia para mantener la organización
                nuevo_doc = Documento.objects.create(
                    nombre=original_doc.nombre,
                    descripcion=original_doc.descripcion,
                    procedimiento=original_doc.procedimiento,
                    url=original_doc.url,
                    extension=original_doc.extension
                )
                self.documento = nuevo_doc
                
            # Marcar el documento como tipo PASO
            self.documento.tipo_documento = 'PASO'
            self.documento.save()
        
        super().save(*args, **kwargs)

class HistorialProcedimiento(models.Model):
    procedimiento = models.ForeignKey(Procedimiento, on_delete=models.CASCADE, related_name='historial')
    version = models.CharField(max_length=10)
    fecha_cambio = models.DateTimeField(auto_now_add=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True)
    descripcion_cambio = models.TextField()
    
    def __str__(self):
        return f"{self.procedimiento.nombre} - v{self.version} ({self.fecha_cambio.strftime('%d/%m/%Y')})"
    
    class Meta:
        verbose_name = "Historial de Procedimiento"
        verbose_name_plural = "Historial de Procedimientos"
        ordering = ['-fecha_cambio']

class Trabajo(models.Model):
    """
    Representa una instancia de un procedimiento que un usuario está ejecutando.
    Funciona como un registro de trabajo que contiene todos los pasos a completar.
    """
    STATUS_CHOICES = [
        ('INICIADO', 'Iniciado'),
        ('EN_PROGRESO', 'En progreso'),
        ('PAUSADO', 'Pausado'),
        ('COMPLETADO', 'Completado'),
        ('CANCELADO', 'Cancelado'),
    ]
    
    procedimiento = models.ForeignKey(Procedimiento, on_delete=models.PROTECT, related_name='trabajos')
    usuario_creador = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, 
                                       related_name='trabajos_creados', null=True)
    usuario_iniciado = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                        related_name='trabajos_iniciados', null=True, blank=True)
    unidad = models.ForeignKey(Unidad, on_delete=models.PROTECT, related_name='trabajos')
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    fecha_inicio = models.DateTimeField(auto_now_add=True)
    fecha_fin = models.DateTimeField(blank=True, null=True)
    estado = models.CharField(max_length=20, choices=STATUS_CHOICES, default='INICIADO')
    paso_actual = models.PositiveIntegerField(default=1)
    
    def __str__(self):
        return f"{self.titulo} - {self.procedimiento.nombre}"
    
    class Meta:
        verbose_name = "Trabajo"
        verbose_name_plural = "Trabajos"
        ordering = ['-fecha_inicio']

    def completar_trabajo(self):
        """Marca el trabajo como completado y establece la fecha de fin"""
        self.fecha_fin = timezone.now()
        self.estado = 'COMPLETADO'
        self.save()

    def cancelar_trabajo(self):
        """Marca el trabajo como cancelado"""
        self.fecha_fin = timezone.now()
        self.estado = 'CANCELADO'
        self.save()

    def pausar_trabajo(self):
        """Marca el trabajo como pausado"""
        self.estado = 'PAUSADO'
        self.save()

    def reanudar_trabajo(self):
        """Reanuda un trabajo pausado"""
        self.estado = 'EN_PROGRESO'
        self.save()
        
    def tiempo_transcurrido(self):
        """Calcula el tiempo transcurrido desde el inicio hasta ahora o hasta la finalización"""
        if self.fecha_fin:
            return self.fecha_fin - self.fecha_inicio
        return timezone.now() - self.fecha_inicio


class PasoTrabajo(models.Model):
    """
    Representa un paso específico dentro de un trabajo.
    Registra el estado de cada paso y quién lo completó.
    """
    STATUS_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('EN_PROGRESO', 'En progreso'),
        ('COMPLETADO', 'Completado'),
        ('BLOQUEADO', 'Bloqueado'),  # Para pasos que requieren que otros se completen primero
    ]
    
    trabajo = models.ForeignKey(Trabajo, on_delete=models.CASCADE, related_name='pasos_trabajo')
    paso = models.ForeignKey(Paso, on_delete=models.PROTECT, related_name='instancias_trabajo')
    estado = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDIENTE')
    fecha_inicio = models.DateTimeField(blank=True, null=True)
    fecha_fin = models.DateTimeField(blank=True, null=True)
    usuario_completado = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                         related_name='pasos_completados', blank=True, null=True)
    notas = models.TextField(blank=True, null=True)
    bifurcacion_elegida = models.IntegerField(blank=True, null=True) # ID del paso elegido en una bifurcación
    
    class Meta:
        verbose_name = "Paso de Trabajo"
        verbose_name_plural = "Pasos de Trabajo"
        ordering = ['paso__numero']
        
    def __str__(self):
        return f"Paso {self.paso.numero}: {self.paso.titulo} - {self.trabajo.titulo}"
    
    def iniciar_paso(self, usuario):
        """Marca el paso como iniciado"""
        self.estado = 'EN_PROGRESO'
        self.fecha_inicio = timezone.now()
        self.save()
        
    def completar_paso(self, usuario):
        """Marca el paso como completado"""
        self.estado = 'COMPLETADO'
        self.fecha_fin = timezone.now()
        self.usuario_completado = usuario
        self.save()
        
        # Verificar si es el último paso o si es un paso marcado como final
        if self.paso.es_final:
            self.trabajo.completar_trabajo()
        else:
            # Actualizar paso actual del trabajo
            self.trabajo.paso_actual = self.paso.numero + 1
            self.trabajo.estado = 'EN_PROGRESO'
            self.trabajo.save()
            
            # Si tiene bifurcaciones, no avanzar automáticamente
            if self.paso.bifurcaciones and len(self.paso.bifurcaciones) > 0:
                return
            
            # Desbloquear el siguiente paso si existe
            siguiente_paso = self.trabajo.pasos_trabajo.filter(
                paso__numero=self.paso.numero + 1
            ).first()
            
            if siguiente_paso:
                siguiente_paso.estado = 'PENDIENTE'
                siguiente_paso.save()

    @property
    def paso_numero(self):
        return self.paso.numero

    @property
    def fecha_limite(self):
        """Calcula la fecha límite basada en fecha_inicio y tiempo_estimado del paso"""
        if not self.fecha_inicio or not self.paso.tiempo_estimado:
            return None
            
        # Convertir tiempo_estimado a float y calcular días
        try:
            tiempo_estimado_dias = float(self.paso.tiempo_estimado)
            return self.fecha_inicio + timezone.timedelta(days=tiempo_estimado_dias)
        except (ValueError, TypeError):
            return None
    
    @property
    def proximo_a_vencer(self):
        """Determina si un paso está próximo a vencer (2 días o menos)"""
        if self.estado not in ['PENDIENTE', 'EN_PROGRESO'] or not self.fecha_inicio:
            return False
            
        fecha_limite = self.fecha_limite
        if not fecha_limite:
            return False
            
        dias_restantes = (fecha_limite - timezone.now()).days
        return 0 <= dias_restantes <= 2
        
    @property
    def dias_restantes(self):
        """Calcula los días restantes hasta la fecha límite"""
        if not self.fecha_limite:
            return None
            
        delta = self.fecha_limite - timezone.now()
        return max(0, delta.days)


def envio_upload_path(instance, filename):
    # Obtener el ID del trabajo a través de la relación paso_trabajo
    trabajo_id = instance.paso_trabajo.trabajo.id
    # Crear una estructura de carpetas: procedimientos/envios/trabajo_ID/archivo.ext
    return f'procedimientos/envios/trabajo_{trabajo_id}/{filename}'

class EnvioPaso(models.Model):
    paso_trabajo = models.OneToOneField(PasoTrabajo, on_delete=models.CASCADE, related_name='envio')
    numero_salida = models.CharField(max_length=100)
    fecha_envio = models.DateTimeField(auto_now_add=True)
    documentacion = models.FileField(upload_to=envio_upload_path)  # Usar la función personalizada
    notas_adicionales = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"Envío para {self.paso_trabajo}"
        
    class Meta:
        verbose_name = "Envío de Paso"
        verbose_name_plural = "Envíos de Pasos"