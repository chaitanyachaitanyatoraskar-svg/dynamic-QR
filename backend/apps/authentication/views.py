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

        question = request.data.get('security_question', '').strip()
        answer = request.data.get('security_answer', '').strip()
        if question and answer:
            user.security_question = question
            user.set_security_answer(answer)
            user.save()

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


class AutoLoginView(APIView):
    """
    Direct auto-login endpoint returning the Super Administrator credentials
    and active token to bypass manual login forms.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        user = User.objects.filter(role=User.ROLE_SUPER_ADMIN).first()
        if not user:
            user = User.objects.filter(is_superuser=True).first()
        if not user:
            return Response({'error': 'No administrator account found.'}, status=status.HTTP_404_NOT_FOUND)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)


STANDARD_SECURITY_QUESTIONS = [
    "What was the name of your first school?",
    "What is your favorite city?",
    "What was your childhood nickname?",
    "What was the make of your first car?",
    "What was the name of your favorite teacher?",
]


class SecurityQuestionsListView(APIView):
    """Returns preset list of security questions for selection."""
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'questions': STANDARD_SECURITY_QUESTIONS}, status=status.HTTP_200_OK)


class ForgotPasswordGetQuestionView(APIView):
    """
    Step 1: Check if user exists and return their configured security question.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = str(request.data.get('username', '')).strip()
        if not identifier:
            return Response({'error': 'Please enter your username or email address.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(username__iexact=identifier).first() or \
               User.objects.filter(email__iexact=identifier).first()

        if not user:
            return Response({'error': 'No account found with this username or email.'}, status=status.HTTP_404_NOT_FOUND)

        if not user.security_question or not user.security_answer_hash:
            return Response({
                'error': 'No security question is configured for this account. Please contact system support.'
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'username': user.username,
            'question': user.security_question,
            'security_question': user.security_question
        }, status=status.HTTP_200_OK)


class ForgotPasswordResetView(APIView):
    """
    Step 2: Validate the answer to the security question and reset password.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        username = str(request.data.get('username', '')).strip()
        answer = str(request.data.get('answer', '')).strip()
        new_password = str(request.data.get('new_password', '')).strip()

        if not username or not answer or not new_password:
            return Response({'error': 'Username, security answer, and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 6:
            return Response({'error': 'Password must be at least 6 characters long.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(username__iexact=username).first() or \
               User.objects.filter(email__iexact=username).first()

        if not user:
            return Response({'error': 'Account not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not user.check_security_answer(answer):
            return Response({'error': 'Incorrect security answer. Please check and try again.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        # Invalidate old tokens & issue fresh one
        Token.objects.filter(user=user).delete()
        token = Token.objects.create(user=user)

        return Response({
            'message': 'Password has been successfully updated. You may now sign in.',
            'token': token.key,
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)


class SetSecurityQuestionView(APIView):
    """
    Allows an authenticated user to update their security question & answer.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        question = str(request.data.get('security_question', '')).strip()
        answer = str(request.data.get('security_answer', '')).strip()

        if not question or not answer:
            return Response({'error': 'Both question and answer are required.'}, status=status.HTTP_400_BAD_REQUEST)

        request.user.security_question = question
        request.user.set_security_answer(answer)
        request.user.save()

        return Response({'message': 'Security question updated successfully.'}, status=status.HTTP_200_OK)


