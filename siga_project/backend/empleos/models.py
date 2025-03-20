from django.db import models

class Empleo(models.Model):
    nombre = models.CharField(max_length=100)
    abreviatura = models.CharField(max_length=10)

    def __str__(self):
        return self.nombre

    class Meta:
        verbose_name = "Empleo"
        verbose_name_plural = "Empleos"
        ordering = ['id']  # Añadir ordenamiento por defecto