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
    bifurcaciones = models.JSONField(default=list, blank=True)  
    es_final = models.BooleanField(default=False, help_text="Indica si este paso finaliza el procedimiento")
    
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
