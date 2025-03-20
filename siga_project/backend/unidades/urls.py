from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UnidadViewSet

router = DefaultRouter()
router.register(r'', UnidadViewSet)

urlpatterns = [
    path('', include(router.urls)),
]