from django.urls import path
from .views import TrackEventView, AnalyticsSummaryView, ScanEventListView

urlpatterns = [
    path('track/', TrackEventView.as_view(), name='analytics-track'),
    path('summary/', AnalyticsSummaryView.as_view(), name='analytics-summary'),
    path('events/', ScanEventListView.as_view(), name='analytics-events'),
]
