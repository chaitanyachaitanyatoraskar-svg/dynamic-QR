from django.urls import path
from .views import (
    LoginView, LogoutView, MeView, SetupStatusView, SetupAdminView, AutoLoginView,
    SecurityQuestionsListView, ForgotPasswordGetQuestionView, ForgotPasswordResetView,
    SetSecurityQuestionView
)

urlpatterns = [
    path('setup-status/', SetupStatusView.as_view(), name='auth-setup-status'),
    path('setup-admin/', SetupAdminView.as_view(), name='auth-setup-admin'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('auto-login/', AutoLoginView.as_view(), name='auth-auto-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('security-questions/', SecurityQuestionsListView.as_view(), name='auth-security-questions'),
    path('forgot-password/get-question/', ForgotPasswordGetQuestionView.as_view(), name='auth-forgot-pw-get-question'),
    path('forgot-password/reset/', ForgotPasswordResetView.as_view(), name='auth-forgot-pw-reset'),
    path('set-security-question/', SetSecurityQuestionView.as_view(), name='auth-set-security-question'),
]


