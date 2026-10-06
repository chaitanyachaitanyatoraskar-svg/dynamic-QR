from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CardViewSet, ActivationSessionViewSet

router = DefaultRouter()
router.register(r'activation-sessions', ActivationSessionViewSet, basename='activation-session')
router.register(r'', CardViewSet, basename='card')

urlpatterns = [
    path('', include(router.urls)),
]
