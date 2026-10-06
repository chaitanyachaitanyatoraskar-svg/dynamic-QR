from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BusinessViewSet, PublicBusinessDetailView

router = DefaultRouter()
router.register(r'', BusinessViewSet, basename='business')

urlpatterns = [
    path('public/<slug:slug>/', PublicBusinessDetailView.as_view(), name='public-business-detail'),
    path('', include(router.urls)),
]
