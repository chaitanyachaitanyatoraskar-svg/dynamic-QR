from datetime import timedelta
from django.utils import timezone
from django.db.models import Count
from django.db.models.functions import TruncDate
from rest_framework import permissions, status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import ScanEvent
from .serializers import ScanEventSerializer, TrackEventSerializer
from apps.businesses.models import Business
from apps.cards.models import Card

class TrackEventView(APIView):
    """
    Public telemetry intake for client-side events:
    MENU_VIEW, REVIEW_CLICK, CALL_CLICK, WHATSAPP_CLICK, DIRECTIONS_CLICK
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = TrackEventSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        business = Business.objects.filter(slug=data['business_slug']).first()
        if not business:
            return Response({'error': 'Business not found'}, status=status.HTTP_404_NOT_FOUND)

        card = None
        if data.get('card_id'):
            card = Card.objects.filter(card_id=data['card_id']).first()

        user_agent = request.META.get('HTTP_USER_AGENT', '')
        referrer = request.META.get('HTTP_REFERER', '')
        ip = request.META.get('REMOTE_ADDR', '')

        ua_lower = user_agent.lower()
        if 'mobile' in ua_lower or 'android' in ua_lower or 'iphone' in ua_lower:
            device_type = 'MOBILE'
        elif 'tablet' in ua_lower or 'ipad' in ua_lower:
            device_type = 'TABLET'
        else:
            device_type = 'DESKTOP'

        event = ScanEvent.objects.create(
            card=card,
            business=business,
            event_type=data['event_type'],
            destination=data.get('destination', ''),
            user_agent=user_agent[:500],
            device_type=device_type,
            referrer=referrer[:500],
            ip_address=ip if ip else None
        )

        return Response({'success': True, 'id': event.id}, status=status.HTTP_201_CREATED)


class AnalyticsSummaryView(APIView):
    """
    Summary metrics and charts for business owner or admin dashboard.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        business_id = request.query_params.get('business_id')

        # Scope query based on role & permissions
        qs = ScanEvent.objects.all()
        if user.is_super_admin:
            if business_id:
                qs = qs.filter(business_id=business_id)
        else:
            # Multi-tenant isolation: only businesses this user is member of
            user_businesses = Business.objects.filter(members__user=user)
            if business_id:
                if not user_businesses.filter(id=business_id).exists():
                    return Response({'error': 'Unauthorized business access'}, status=status.HTTP_403_FORBIDDEN)
                qs = qs.filter(business_id=business_id)
            else:
                qs = qs.filter(business__in=user_businesses)

        total_scans = qs.count()
        today = timezone.now().date()
        today_scans = qs.filter(timestamp__date=today).count()

        menu_views = qs.filter(event_type=ScanEvent.EVENT_MENU_VIEW).count()
        review_clicks = qs.filter(event_type=ScanEvent.EVENT_REVIEW_CLICK).count()
        whatsapp_clicks = qs.filter(event_type=ScanEvent.EVENT_WHATSAPP_CLICK).count()
        call_clicks = qs.filter(event_type=ScanEvent.EVENT_CALL_CLICK).count()
        directions_clicks = qs.filter(event_type=ScanEvent.EVENT_DIRECTIONS_CLICK).count()

        # Last 7 days breakdown
        seven_days_ago = timezone.now() - timedelta(days=7)
        daily_breakdown = (
            qs.filter(timestamp__gte=seven_days_ago)
            .annotate(date=TruncDate('timestamp'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )

        # Device breakdown
        device_breakdown = (
            qs.values('device_type')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        return Response({
            'total_scans': total_scans,
            'today_scans': today_scans,
            'menu_views': menu_views,
            'review_clicks': review_clicks,
            'whatsapp_clicks': whatsapp_clicks,
            'call_clicks': call_clicks,
            'directions_clicks': directions_clicks,
            'daily_breakdown': daily_breakdown,
            'device_breakdown': device_breakdown,
        }, status=status.HTTP_200_OK)


class ScanEventListView(generics.ListAPIView):
    serializer_class = ScanEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = ScanEvent.objects.all().select_related('card', 'business')
        if not user.is_super_admin:
            qs = qs.filter(business__members__user=user)
        return qs[:100]
