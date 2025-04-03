from django.core.management.base import BaseCommand
from django.db import connection
from django.db.models.signals import post_save
from unidades.models import Unidad, actualizar_codigos_hijos

class Command(BaseCommand):
    help = 'Regenera los códigos de todas las unidades'

    def handle(self, *args, **options):
        self.stdout.write('Iniciando regeneración de códigos de unidades...')
        
        # Desconectar señal temporalmente para evitar actualizaciones en cascada durante el proceso
        post_save.disconnect(actualizar_codigos_hijos, sender=Unidad)
        
        # Resetear secuencia de autoincremento según el tipo de base de datos
        if connection.vendor == 'postgresql':
            with connection.cursor() as cursor:
                cursor.execute("SELECT setval(pg_get_serial_sequence('unidades_unidad', 'id'), (SELECT MAX(id) FROM unidades_unidad) + 1)")
        elif connection.vendor == 'mysql':
            with connection.cursor() as cursor:
                cursor.execute("ALTER TABLE unidades_unidad AUTO_INCREMENT = 1000;")
        
        # Para unidades raíz
        unidades_raiz = Unidad.objects.filter(id_padre__isnull=True)
        self.stdout.write(f'Procesando {unidades_raiz.count()} unidades raíz')
        
        for unidad in unidades_raiz:
            unidad.cod_unidad = f"{unidad.id}"
            unidad.save(update_fields=['cod_unidad'])
            self.stdout.write(f'Unidad raíz: {unidad.id} - {unidad.nombre} → {unidad.cod_unidad}')
        
        # Función recursiva para procesar hijos
        def procesar_hijos(unidad_padre):
            hijos = Unidad.objects.filter(id_padre=unidad_padre)
            for hijo in hijos:
                hijo.cod_unidad = f"{unidad_padre.cod_unidad}.{hijo.id}"
                hijo.save(update_fields=['cod_unidad'])
                self.stdout.write(f'Unidad hija: {hijo.id} - {hijo.nombre} → {hijo.cod_unidad}')
                # Procesar recursivamente sus hijos
                procesar_hijos(hijo)
        
        # Procesar todas las jerarquías
        for unidad in unidades_raiz:
            procesar_hijos(unidad)
        
        # Reconectar la señal
        post_save.connect(actualizar_codigos_hijos, sender=Unidad)
        
        self.stdout.write(self.style.SUCCESS('Regeneración de códigos completada con éxito'))