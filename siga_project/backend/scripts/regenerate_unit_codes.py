from unidades.models import Unidad
import logging

logger = logging.getLogger(__name__)

def generar_codigos_unidades():
    """
    Función para generar códigos jerárquicos para unidades existentes
    """
    try:
        logger.info("Iniciando generación de códigos para unidades")
        
        # Desactivar temporalmente la señal post_save para evitar actualizaciones en cascada
        from django.db.models.signals import post_save
        from unidades.models import actualizar_codigos_hijos
        post_save.disconnect(actualizar_codigos_hijos, sender=Unidad)
        
        # Primero procesar unidades raíz
        unidades_raiz = Unidad.objects.filter(id_padre__isnull=True)
        logger.info(f"Procesando {unidades_raiz.count()} unidades raíz")
        
        for unidad in unidades_raiz:
            unidad.cod_unidad = f"{unidad.id}"
            unidad.save(update_fields=['cod_unidad'])
            logger.info(f"Unidad raíz {unidad.id} - {unidad.nombre}: código {unidad.cod_unidad}")
        
        # Ahora procesar el resto de unidades en orden de nivel jerárquico
        def procesar_hijos(unidad_padre):
            hijos = Unidad.objects.filter(id_padre=unidad_padre)
            for hijo in hijos:
                hijo.cod_unidad = f"{unidad_padre.cod_unidad}.{hijo.id}"
                hijo.save(update_fields=['cod_unidad'])
                logger.info(f"Unidad hija {hijo.id} - {hijo.nombre}: código {hijo.cod_unidad}")
                # Recursivamente procesar los hijos de este hijo
                procesar_hijos(hijo)
        
        # Iniciar el procesamiento desde las unidades raíz
        for unidad in unidades_raiz:
            procesar_hijos(unidad)
            
        # Reconectar la señal post_save
        post_save.connect(actualizar_codigos_hijos, sender=Unidad)
        
        logger.info("Generación de códigos para unidades completada con éxito")
        return True, "Códigos generados con éxito"
    except Exception as e:
        logger.error(f"Error al generar códigos para unidades: {str(e)}")
        return False, f"Error: {str(e)}"

if __name__ == "__main__":
    success, message = generar_codigos_unidades()
    print(message)