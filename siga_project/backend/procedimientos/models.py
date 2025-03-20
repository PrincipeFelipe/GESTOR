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
    
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField()
    tipo = models.ForeignKey(TipoProcedimiento, on_delete=models.CASCADE, related_name='procedimientos')
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='BORRADOR')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    version = models.CharField(max_length=10, default='1.0')
    creado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='procedimientos_creados')
    actualizado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='procedimientos_actualizados')
    
    def __str__(self):
        return f"{self.nombre} (v{self.version})"
    
    class Meta:
        verbose_name = "Procedimiento"
        verbose_name_plural = "Procedimientos"
        ordering = ['-fecha_actualizacion']

class Paso(models.Model):
    procedimiento = models.ForeignKey(Procedimiento, on_delete=models.CASCADE, related_name='pasos')
    numero = models.PositiveIntegerField()
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    tiempo_estimado = models.CharField(max_length=50, blank=True, null=True, help_text="Ejemplo: '30 minutos', '2 horas'")
    responsable = models.CharField(max_length=100, blank=True, null=True, help_text="Cargo o rol responsable de ejecutar este paso")
    
    def __str__(self):
        return f"{self.procedimiento.nombre} - Paso {self.numero}: {self.titulo}"
    
    class Meta:
        verbose_name = "Paso"
        verbose_name_plural = "Pasos"
        ordering = ['procedimiento', 'numero']
        unique_together = ['procedimiento', 'numero']

class Documento(models.Model):
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    archivo = models.FileField(upload_to='documentos/', blank=True, null=True)
    url = models.URLField(blank=True, null=True, help_text="URL externa si el documento no está alojado en el sistema")
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.nombre
    
    class Meta:
        verbose_name = "Documento"
        verbose_name_plural = "Documentos"
        ordering = ['nombre']

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
