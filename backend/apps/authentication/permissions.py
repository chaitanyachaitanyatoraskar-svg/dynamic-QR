from rest_framework.permissions import BasePermission

class IsSuperAdminUser(BasePermission):
    """Allows access only to Super Admins."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role == 'SUPER_ADMIN' or request.user.is_superuser))

class IsBusinessOwnerOrAdmin(BasePermission):
    """Allows access to Super Admins or Business Owners."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (
            request.user.role in ['SUPER_ADMIN', 'BUSINESS_OWNER'] or request.user.is_superuser
        ))
