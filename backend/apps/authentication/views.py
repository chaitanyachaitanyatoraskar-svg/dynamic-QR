from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from .models import User
from .serializers import LoginSerializer, UserSerializer

class SetupStatusView(APIView):
    """Checks whether the system requires initial administrator creation."""
    permission_classes = [AllowAny]

    def get(self, request):
        has_admin = User.objects.filter(role=User.ROLE_SUPER_ADMIN).exists()
        return Response({'needs_setup': not has_admin}, status=status.HTTP_200_OK)


class SetupAdminView(APIView):
    """
    Secure initial setup endpoint for the project owner to create
    the first Super Administrator without hard-coded credentials.
    Disabled once any super administrator exists.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        if User.objects.filter(role=User.ROLE_SUPER_ADMIN).exists():
            return Response(
                {'error': 'Initial administrator has already been created. Setup is closed.'},
                status=status.HTTP_403_FORBIDDEN
            )

        username = request.data.get('username', '').strip()
        password = request.data.get('password', '').strip()
        email = request.data.get('email', '').strip()

        if not username or not password:
            return Response({'error': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(password) < 6:
            return Response({'error': 'Password must be at least 6 characters long.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_superuser(
            username=username,
            email=email or f"{username}@local",
            password=password,
            role=User.ROLE_SUPER_ADMIN
        )

        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'message': 'Super Administrator created successfully.',
            'token': token.key,
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        user_data = UserSerializer(user).data
        return Response({
            'token': token.key,
            'user': user_data
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
        except Exception:
            pass
        return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
