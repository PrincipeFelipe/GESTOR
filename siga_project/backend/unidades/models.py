from django.db import models
from django.dispatch import receiver
from django.db.models.signals import post_save
import uuid

class Unidad(models.Model):
    nombre = models.CharField(max_length=255)
    id_padre = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subunidades')
    cod_unidad = models.CharField(max_length=50, unique=True, help_text="Código jerárquico correlativo")
    nivel = models.IntegerField(default=1, help_text="Nivel jerárquico (calculado automáticamente)")
    
    def save(self, *args, **kwargs):
        is_new = self.pk is None  # Verificar si es un objeto nuevo
        old_parent = None
        
        # Si ya existe, guardar el padre anterior
        if not is_new:
            try:
                old_unidad = Unidad.objects.get(pk=self.pk)
                old_parent = old_unidad.id_padre
            except Unidad.DoesNotExist:
                pass
        
        # Si es nueva o ha cambiado de padre, regenerar código
        needs_code = is_new or not self.cod_unidad or self.cod_unidad.startswith('temp_') or old_parent != self.id_padre
        
        # Si es nueva o necesita un código, asignar un código temporal primero
        if needs_code:
            self.cod_unidad = f"temp_{uuid.uuid4()}"
            
        # Guardar primero para obtener un ID (importante para objetos nuevos)
        super().save(*args, **kwargs)
        
        # Si necesita un código definitivo
        if needs_code:
            # Si es raíz (primer nivel)
            if not self.id_padre:
                # Encontrar el mayor número usado en unidades de primer nivel
                max_codigo = Unidad.objects.filter(
                    id_padre__isnull=True
                ).exclude(id=self.id).exclude(
                    cod_unidad__startswith='temp_'
                ).values_list('cod_unidad', flat=True)
                
                # Si hay códigos, tomar el máximo y sumar 1
                if max_codigo:
                    try:
                        # Filtrar solo los códigos numéricos válidos
                        valid_codes = [int(c) for c in max_codigo if c.isdigit()]
                        if valid_codes:
                            next_num = max(valid_codes) + 1
                        else:
                            next_num = 1
                    except (ValueError, TypeError):
                        next_num = 1
                else:
                    next_num = 1
                
                # Asignar código y nivel
                self.cod_unidad = str(next_num)
                self.nivel = 1
            
            # Si tiene padre (niveles 2+)
            else:
                # Calcular nivel basado en el padre
                self.nivel = self.id_padre.nivel + 1
                
                # Obtener el código del padre como base
                codigo_base = self.id_padre.cod_unidad
                
                # Buscar el mayor número usado entre hermanos (unidades con mismo padre)
                hermanos_codigos = Unidad.objects.filter(
                    id_padre=self.id_padre
                ).exclude(id=self.id).exclude(
                    cod_unidad__startswith='temp_'
                ).values_list('cod_unidad', flat=True)
                
                if hermanos_codigos:
                    # Extraer solo el último componente de cada código hermano
                    ultimo_componentes = []
                    for codigo in hermanos_codigos:
                        partes = codigo.split('.')
                        if len(partes) > 0:
                            try:
                                ultimo_componentes.append(int(partes[-1]))
                            except (ValueError, TypeError):
                                pass
                    
                    # Encontrar el siguiente número disponible
                    if ultimo_componentes:
                        siguiente_componente = max(ultimo_componentes) + 1
                    else:
                        siguiente_componente = 1
                else:
                    siguiente_componente = 1
                
                # Formar el nuevo código basado en el código del padre
                self.cod_unidad = f"{codigo_base}.{siguiente_componente}"
            
            # Guardar con el código definitivo
            super().save(update_fields=['cod_unidad', 'nivel'])
    
    def __str__(self):
        return f"{self.nombre} ({self.cod_unidad})"
    
    class Meta:
        verbose_name = 'Unidad'
        verbose_name_plural = 'Unidades'
        ordering = ['nivel', 'cod_unidad']  # Ordenar por nivel y luego por código


@receiver(post_save, sender=Unidad)
def actualizar_codigos_hijos(sender, instance, created, **kwargs):
    """
    Cuando una unidad cambia su código, actualizar los códigos de todas sus unidades hijas
    """
    # No actualizar si el código es temporal
    if instance.cod_unidad.startswith('temp_'):
        return
        
    # Solo continuar si ha habido un cambio en el código (no en cada guardado)
    # Obtener las subunidades directas
    subunidades = Unidad.objects.filter(id_padre=instance)
    
    # Si no hay subunidades, no hay nada que hacer
    if not subunidades.exists():
        return
    
    # Para cada subunidad, regenerar su código basado en el nuevo código del padre
    for i, subunidad in enumerate(subunidades, 1):
        # Obtener solo el último componente del código actual
        partes_codigo = subunidad.cod_unidad.split('.')
        if len(partes_codigo) > 0:
            try:
                ultimo_componente = int(partes_codigo[-1])
            except (ValueError, TypeError):
                # Si no es un número, usar el índice
                ultimo_componente = i
        else:
            ultimo_componente = i
        
        # Formar el nuevo código
        nuevo_codigo = f"{instance.cod_unidad}.{ultimo_componente}"
        
        # Si el código ha cambiado, actualizar
        if nuevo_codigo != subunidad.cod_unidad:
            # Actualizar el código y nivel
            Unidad.objects.filter(id=subunidad.id).update(
                cod_unidad=nuevo_codigo,
                nivel=instance.nivel + 1
            )
            
            # Actualizar la instancia para que los cambios estén disponibles
            subunidad.refresh_from_db()
            
            # Procesar recursivamente
            actualizar_codigos_hijos(sender, subunidad, False, **kwargs)