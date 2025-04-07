from django.db import models
from users.models import Usuario

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
    
    class Meta:
        verbose_name = "Procedimiento"
        verbose_name_plural = "Procedimientos"
        ordering = ['-fecha_actualizacion']
        # Añadir restricción única para nombre+tipo+nivel
        unique_together = ['nombre', 'tipo', 'nivel']

class Paso(models.Model):
    procedimiento = models.ForeignKey(Procedimiento, on_delete=models.CASCADE, related_name='pasos')
    numero = models.IntegerField()
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    tiempo_estimado = models.CharField(max_length=100, blank=True, null=True)
    responsable = models.CharField(max_length=100, blank=True, null=True)
    bifurcaciones = models.JSONField(default=list, blank=True)  # Añadir este campo
    
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

def documento_upload_path(instance, filename):
    """
    Determina la ruta de almacenamiento para los documentos, organizándolos en estructura:
    documentos/procedimiento_X/paso_Y/nombrearchivo
    """
    # Obtener procedimiento_id
    procedimiento_id = None
    
    # Si es un documento directamente asociado a un procedimiento
    if hasattr(instance, 'procedimiento_id') and instance.procedimiento_id:
        procedimiento_id = instance.procedimiento_id
    
    # Si el documento está asociado a un paso
    paso_id = None
    if hasattr(instance, 'paso_set'):
        # Buscar el primer paso que tenga este documento (mediante la relación M2M)
        pasos = instance.paso_set.all()
        if pasos.exists():
            paso = pasos.first()
            paso_id = paso.id
            procedimiento_id = paso.procedimiento_id
    
    # Limpiar el nombre del archivo
    name, ext = os.path.splitext(filename)
    safe_name = slugify(name)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    safe_filename = f"{safe_name}_{timestamp}{ext}"
    
    # Determinar la ruta según los IDs disponibles
    if procedimiento_id and paso_id:
        return os.path.join('documentos', f'procedimiento_{procedimiento_id}', f'paso_{paso_id}', safe_filename)
    elif procedimiento_id:
        return os.path.join('documentos', f'procedimiento_{procedimiento_id}', safe_filename)
    else:
        return os.path.join('documentos', 'general', safe_filename)

class Documento(models.Model):
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True, null=True)
    archivo = models.FileField(upload_to=documento_upload_path, blank=True, null=True) # Usar la función personalizada
    url = models.URLField(blank=True, null=True)
    procedimiento = models.ForeignKey(Procedimiento, on_delete=models.CASCADE, blank=True, null=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Documento"
        verbose_name_plural = "Documentos"
        ordering = ['-fecha_actualizacion']
    
    def __str__(self):
        return self.nombre
    
    @property
    def extension(self):
        if self.archivo and hasattr(self.archivo, 'name'):
            return os.path.splitext(self.archivo.name)[1].lstrip('.').upper()
        return None
    
    @property
    def archivo_url(self):
        if self.archivo and hasattr(self.archivo, 'url'):
            return self.archivo.url
        return None

class DocumentoPaso(models.Model):
    paso = models.ForeignKey(Paso, on_delete=models.CASCADE, related_name='documentos')
    documento = models.ForeignKey(Documento, on_delete=models.CASCADE, related_name='pasos')
    orden = models.PositiveIntegerField(default=1)
    notas = models.TextField(blank=True, null=True, help_text="Notas adicionales sobre este documento en el contexto de este paso")
    
    def __str__(self):
        return f"{self.paso} - {self.documento.nombre}"
    
    class Meta:
        verbose_name = "Documento de Paso"
        verbose_name_plural = "Documentos de Pasos"
        ordering = ['paso', 'orden']
        unique_together = ['paso', 'documento']

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
