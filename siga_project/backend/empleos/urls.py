from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmpleoViewSet

router = DefaultRouter()
router.register(r'', EmpleoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]