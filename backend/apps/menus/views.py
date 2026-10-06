from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, NotFound
from .models import Menu, MenuCategory, MenuItem
from .serializers import MenuSerializer, MenuCategorySerializer, MenuItemSerializer, PublicMenuSerializer
from apps.businesses.models import Business

class MenuViewSet(viewsets.ModelViewSet):
    serializer_class = MenuSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_super_admin:
            return Menu.objects.all().prefetch_related('categories__items')
        return Menu.objects.filter(business__members__user=user).prefetch_related('categories__items')

    def perform_create(self, serializer):
        business_id = self.request.data.get('business')
        try:
            business = Business.objects.get(pk=business_id)
        except Business.DoesNotExist:
            raise NotFound("Business not found.")

        if not self.request.user.is_super_admin and not business.members.filter(user=self.request.user).exists():
            raise PermissionDenied("You cannot create a menu for this business.")
        serializer.save(business=business)


class MenuCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = MenuCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_super_admin:
            return MenuCategory.objects.all().prefetch_related('items')
        return MenuCategory.objects.filter(menu__business__members__user=user).prefetch_related('items')


class MenuItemViewSet(viewsets.ModelViewSet):
    serializer_class = MenuItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_super_admin:
            return MenuItem.objects.all()
        return MenuItem.objects.filter(category__menu__business__members__user=user)


class PublicMenuView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        try:
            business = Business.objects.get(slug=slug)
        except Business.DoesNotExist:
            raise NotFound("Business not found.")

        menu = business.menus.filter(is_active=True).first()
        if not menu:
            return Response({
                'business_name': business.name,
                'business_slug': business.slug,
                'title': 'No Active Menu',
                'description': 'The menu is currently being updated.',
                'categories': []
            }, status=status.HTTP_200_OK)

        serializer = PublicMenuSerializer(menu)
        return Response(serializer.data, status=status.HTTP_200_OK)
