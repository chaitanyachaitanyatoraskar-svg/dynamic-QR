from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MenuViewSet, MenuCategoryViewSet, MenuItemViewSet, PublicMenuView

router = DefaultRouter()
router.register(r'items', MenuItemViewSet, basename='menu-item')
router.register(r'categories', MenuCategoryViewSet, basename='menu-category')
router.register(r'', MenuViewSet, basename='menu')

urlpatterns = [
    path('public/<slug:slug>/', PublicMenuView.as_view(), name='public-menu'),
    path('', include(router.urls)),
]
