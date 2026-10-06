from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, NotFound
from .models import Business, BusinessUser
from .serializers import BusinessSerializer, PublicBusinessSerializer
from apps.authentication.permissions import IsSuperAdminUser, IsBusinessOwnerOrAdmin

class BusinessViewSet(viewsets.ModelViewSet):
    serializer_class = BusinessSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_super_admin:
            return Business.objects.all().prefetch_related('cards', 'menus')
        # Multi-tenant isolation: strict filter to businesses this user belongs to
        return Business.objects.filter(members__user=user).prefetch_related('cards', 'menus')

    def perform_create(self, serializer):
        if not self.request.user.is_super_admin:
            raise PermissionDenied("Only super administrators can create new businesses.")
        business = serializer.save()
        # Associate user as owner if specified or default to creator
        BusinessUser.objects.create(
            user=self.request.user,
            business=business,
            role=BusinessUser.ROLE_OWNER
        )

    def perform_destroy(self, instance):
        if not self.request.user.is_super_admin:
            raise PermissionDenied("Only super administrators can delete businesses.")
        instance.status = Business.STATUS_ARCHIVED
        instance.save()


class PublicBusinessDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        try:
            business = Business.objects.get(slug=slug)
        except Business.DoesNotExist:
            raise NotFound("Business not found.")
        
        if business.status != Business.STATUS_ACTIVE:
            return Response(
                {"error": "This business profile is currently unavailable.", "status": business.status},
                status=status.HTTP_403_FORBIDDEN
            )
            
        serializer = PublicBusinessSerializer(business)
        return Response(serializer.data, status=status.HTTP_200_OK)
