from rest_framework import generics, permissions
from .models import AuditLog
from .serializers import AuditLogSerializer
from apps.authentication.permissions import IsSuperAdminUser

class AuditLogListView(generics.ListAPIView):
    """
    Super Admin endpoint for inspecting system-wide audit events.
    """
    serializer_class = AuditLogSerializer
    permission_classes = [IsSuperAdminUser]

    def get_queryset(self):
        return AuditLog.objects.all().select_related('user', 'business', 'card')[:200]
