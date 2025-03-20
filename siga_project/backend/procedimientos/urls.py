from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TipoProcedimientoViewSet,
    ProcedimientoViewSet,
    PasoViewSet,
    DocumentoViewSet,
    HistorialProcedimientoViewSet,
)

router = DefaultRouter()
router.register(r'tipos', TipoProcedimientoViewSet)
router.register(r'procedimientos', ProcedimientoViewSet)
router.register(r'pasos', PasoViewSet)
router.register(r'documentos', DocumentoViewSet)
router.register(r'historial', HistorialProcedimientoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]