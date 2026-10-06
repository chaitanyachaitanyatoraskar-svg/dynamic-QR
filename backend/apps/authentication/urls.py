from django.urls import path
from .views import LoginView, LogoutView, MeView, SetupStatusView, SetupAdminView

urlpatterns = [
    path('setup-status/', SetupStatusView.as_view(), name='auth-setup-status'),
    path('setup-admin/', SetupAdminView.as_view(), name='auth-setup-admin'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', MeView.as_view(), name='auth-me'),
]
