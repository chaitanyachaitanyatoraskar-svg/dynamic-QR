from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from apps.cards.views import DynamicRedirectView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Core Dynamic Redirect Engine (Permanent QR/NFC routing)
    path('q/<str:token>', DynamicRedirectView.as_view()),
    path('q/<str:token>/', DynamicRedirectView.as_view(), name='qr-redirect'),
    path('go/<str:token>', DynamicRedirectView.as_view()),
    path('go/<str:token>/', DynamicRedirectView.as_view(), name='dynamic-redirect'),

    # REST APIs
    path('api/auth/', include('apps.authentication.urls')),
    path('api/businesses/', include('apps.businesses.urls')),
    path('api/cards/', include('apps.cards.urls')),
    path('api/menus/', include('apps.menus.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/audit/', include('apps.audit.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
