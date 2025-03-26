from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'tipos', views.TipoProcedimientoViewSet)
router.register(r'procedimientos', views.ProcedimientoViewSet)
router.register(r'pasos', views.PasoViewSet)
router.register(r'documentos', views.DocumentoViewSet)
router.register(r'historial', views.HistorialProcedimientoViewSet, basename='historial')

urlpatterns = [
    path('', include(router.urls)),
    # Añadir ruta para descarga de documentos
    path('media/documentos/<path:path>', views.download_document, name='document-download'),
]