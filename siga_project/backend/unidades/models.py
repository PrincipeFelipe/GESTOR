from django.db import models

class Unidad(models.Model):
    nombre = models.CharField(max_length=255)
    id_padre = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='sub_unidades')

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = 'Unidad'
        verbose_name_plural = 'Unidades'
        ordering = ['id']  # Añadir ordenamiento por defecto