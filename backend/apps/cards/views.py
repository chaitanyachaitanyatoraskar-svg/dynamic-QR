import io
import zipfile
from datetime import datetime
from django.utils import timezone
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.db.models import F
from django.conf import settings
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import Card, CardAssignment, generate_random_card_id
from .serializers import (
    CardSerializer, CardActivationSerializer, CardReassignSerializer,
    BulkCardGenerationSerializer
)
from .qr_utils import generate_qr_png_bytes, generate_qr_svg_bytes, attach_qr_to_card
from apps.businesses.models import Business
from apps.analytics.models import ScanEvent
from apps.audit.models import AuditLog

def resolve_card_destination(card):
    """
    Resolves the final URL destination for a given active card.
    Prevents open redirects by using internal routes or validated external schemes.
    """
    domain = settings.PUBLIC_DOMAIN.rstrip('/')
    if not card.business:
        return f"{domain}/inactive?reason=no_business"

    slug = card.business.slug
    dest_type = card.destination_type

    if dest_type == Card.DEST_DIGITAL_MENU:
        return f"{domain}/business/{slug}/menu"
    elif dest_type == Card.DEST_BUSINESS_PROFILE:
        return f"{domain}/business/{slug}"
    elif dest_type == Card.DEST_REVIEW_PAGE:
        return f"{domain}/business/{slug}/reviews"
    elif dest_type == Card.DEST_EXTERNAL_URL:
        target = card.destination_url.strip()
        if target.startswith(('http://', 'https://')):
            return target
        return f"https://{target}"
    elif dest_type == Card.DEST_SOCIAL_PROFILE:
        target = card.destination_url.strip()
        if target.startswith(('http://', 'https://')):
            return target
        return f"{domain}/business/{slug}"
    elif dest_type == Card.DEST_CONTACT_PAGE:
        return f"{domain}/business/{slug}#contact"
    elif dest_type == Card.DEST_BOOKING_PAGE:
        if card.destination_url and card.destination_url.startswith(('http://', 'https://')):
            return card.destination_url
        return f"{domain}/business/{slug}#booking"

    return f"{domain}/business/{slug}"


class DynamicRedirectView(APIView):
    """
    GET /go/{token}
    The high-performance dynamic routing engine.
    Supports both browser redirects and JSON resolutions.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        # 1. Lookup card by card_id or public_token
        try:
            card = Card.objects.select_related('business').get(
                models_q := (Card.objects.filter(card_id__iexact=token) | Card.objects.filter(public_token=token))
            )
        except Card.DoesNotExist:
            return self._handle_not_found(request, token)
        except Exception:
            # Fallback direct lookup
            card = Card.objects.filter(card_id__iexact=token).first() or Card.objects.filter(public_token=token).first()
            if not card:
                return self._handle_not_found(request, token)

        # Telemetry capture
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        referrer = request.META.get('HTTP_REFERER', '')
        ip = request.META.get('REMOTE_ADDR', '')

        # Device categorization
        ua_lower = user_agent.lower()
        if 'mobile' in ua_lower or 'android' in ua_lower or 'iphone' in ua_lower:
            device_type = 'MOBILE'
        elif 'tablet' in ua_lower or 'ipad' in ua_lower:
            device_type = 'TABLET'
        else:
            device_type = 'DESKTOP'

        # Record scan telemetry asynchronously / non-blocking
        try:
            ScanEvent.objects.create(
                card=card,
                business=card.business,
                event_type=ScanEvent.EVENT_CARD_VISIT,
                destination=card.destination_type,
                user_agent=user_agent[:500],
                device_type=device_type,
                referrer=referrer[:500],
                ip_address=ip if ip else None
            )
            # Increment atomic scan count
            Card.objects.filter(pk=card.pk).update(
                scan_count=F('scan_count') + 1,
                last_scanned_at=timezone.now()
            )
        except Exception:
            pass

        # 2. Status verification
        domain = settings.PUBLIC_DOMAIN.rstrip('/')
        if card.status == Card.STATUS_SUSPENDED:
            if request.headers.get('Accept') == 'application/json':
                return Response({
                    'status': 'SUSPENDED',
                    'card_id': card.card_id,
                    'message': 'This card is temporarily suspended.'
                }, status=status.HTTP_403_FORBIDDEN)
            return HttpResponseRedirect(f"{domain}/card-status?status=SUSPENDED&card_id={card.card_id}")

        if card.status == Card.STATUS_DEACTIVATED:
            if request.headers.get('Accept') == 'application/json':
                return Response({
                    'status': 'DEACTIVATED',
                    'card_id': card.card_id,
                    'message': 'This card has been deactivated.'
                }, status=status.HTTP_403_FORBIDDEN)
            return HttpResponseRedirect(f"{domain}/card-status?status=DEACTIVATED&card_id={card.card_id}")

        if card.status != Card.STATUS_ACTIVE:
            if request.headers.get('Accept') == 'application/json':
                return Response({
                    'status': card.status,
                    'card_id': card.card_id,
                    'message': f"This card is currently {card.status.lower()}."
                }, status=status.HTTP_400_BAD_REQUEST)
            return HttpResponseRedirect(f"{domain}/card-status?status={card.status}&card_id={card.card_id}")

        # 3. Active resolution
        target_destination = resolve_card_destination(card)

        if request.headers.get('Accept') == 'application/json' or request.query_params.get('format') == 'json':
            return Response({
                'status': 'ACTIVE',
                'card_id': card.card_id,
                'destination_type': card.destination_type,
                'target_url': target_destination,
                'business': {
                    'name': card.business.name if card.business else None,
                    'slug': card.business.slug if card.business else None,
                }
            }, status=status.HTTP_200_OK)

        return HttpResponseRedirect(target_destination)

    def _handle_not_found(self, request, token):
        domain = settings.PUBLIC_DOMAIN.rstrip('/')
        if request.headers.get('Accept') == 'application/json':
            return Response({
                'status': 'NOT_FOUND',
                'error': 'Sorry, this card does not exist.'
            }, status=status.HTTP_404_NOT_FOUND)
        return HttpResponseRedirect(f"{domain}/card-status?status=NOT_FOUND&card_id={token}")


class CardViewSet(viewsets.ModelViewSet):
    serializer_class = CardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_super_admin:
            return Card.objects.all().select_related('business')
        # Tenant isolation
        return Card.objects.filter(business__members__user=user).select_related('business')

    def perform_create(self, serializer):
        if not self.request.user.is_super_admin:
            raise PermissionDenied("Only super administrators can provision new cards.")
        card = serializer.save()
        attach_qr_to_card(card)
        card.save()

        AuditLog.objects.create(
            user=self.request.user,
            action=AuditLog.ACTION_CARD_CREATED,
            card=card,
            business=card.business,
            details={'card_id': card.card_id, 'status': card.status}
        )

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        card = self.get_object()
        serializer = CardActivationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        business = get_object_or_404(Business, pk=serializer.validated_data['business_id'])
        
        # Check permission for business assignment
        if not request.user.is_super_admin:
            if not business.members.filter(user=request.user).exists():
                raise PermissionDenied("You do not have permission to assign cards to this business.")

        # Update card state
        card.business = business
        card.purpose = serializer.validated_data.get('purpose', 'Digital Menu')
        card.destination_type = serializer.validated_data.get('destination_type', Card.DEST_DIGITAL_MENU)
        card.destination_url = serializer.validated_data.get('destination_url', '')
        card.status = Card.STATUS_ACTIVE
        card.activation_date = timezone.now()
        card.deactivation_date = None
        if serializer.validated_data.get('notes'):
            card.notes = serializer.validated_data.get('notes')

        if not card.qr_image:
            attach_qr_to_card(card)
        card.save()

        # Log assignment
        CardAssignment.objects.create(
            card=card,
            business=business,
            assigned_by=request.user,
            notes=f"Card activated for {business.name}"
        )

        AuditLog.objects.create(
            user=request.user,
            action=AuditLog.ACTION_CARD_ACTIVATED,
            card=card,
            business=business,
            details={'destination_type': card.destination_type, 'purpose': card.purpose}
        )

        return Response(CardSerializer(card).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        card = self.get_object()
        card.status = Card.STATUS_SUSPENDED
        card.save()

        AuditLog.objects.create(
            user=request.user,
            action=AuditLog.ACTION_CARD_SUSPENDED,
            card=card,
            business=card.business,
            details={'reason': request.data.get('reason', 'Administrative suspension')}
        )
        return Response(CardSerializer(card).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        card = self.get_object()
        card.status = Card.STATUS_DEACTIVATED
        card.deactivation_date = timezone.now()
        card.save()

        AuditLog.objects.create(
            user=request.user,
            action=AuditLog.ACTION_CARD_DEACTIVATED,
            card=card,
            business=card.business,
            details={'reason': request.data.get('reason', 'Card deactivated')}
        )
        return Response(CardSerializer(card).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def reassign(self, request, pk=None):
        """
        Reassign card to a new business.
        Preserves internal audit history while scrubbing previous business data from public view.
        """
        if not request.user.is_super_admin:
            raise PermissionDenied("Only super administrators can reassign cards.")

        card = self.get_object()
        serializer = CardReassignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_business = get_object_or_404(Business, pk=serializer.validated_data['business_id'])
        old_business = card.business

        # Close out previous assignment record
        if old_business:
            CardAssignment.objects.filter(card=card, business=old_business, unassigned_at__isnull=True).update(
                unassigned_at=timezone.now()
            )

        card.business = new_business
        card.purpose = serializer.validated_data.get('purpose', 'Digital Menu')
        card.destination_type = serializer.validated_data.get('destination_type', Card.DEST_DIGITAL_MENU)
        card.destination_url = serializer.validated_data.get('destination_url', '')
        card.status = Card.STATUS_ACTIVE
        card.activation_date = timezone.now()
        card.notes = serializer.validated_data.get('notes', '')
        card.save()

        # Create new assignment record
        CardAssignment.objects.create(
            card=card,
            business=new_business,
            assigned_by=request.user,
            notes=f"Reassigned from {old_business.name if old_business else 'Inventory'} to {new_business.name}"
        )

        AuditLog.objects.create(
            user=request.user,
            action=AuditLog.ACTION_CARD_REASSIGNED,
            card=card,
            business=new_business,
            details={
                'from_business': old_business.name if old_business else None,
                'to_business': new_business.name
            }
        )

        return Response(CardSerializer(card).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def download_qr(self, request, pk=None):
        card = self.get_object()
        fmt = request.query_params.get('format', 'png').lower()

        if fmt == 'svg':
            svg_data = generate_qr_svg_bytes(card.card_id)
            response = HttpResponse(svg_data, content_type='image/svg+xml')
            response['Content-Disposition'] = f'attachment; filename="qr_{card.card_id}.svg"'
            return response

        png_data = generate_qr_png_bytes(card.card_id)
        response = HttpResponse(png_data, content_type='image/png')
        response['Content-Disposition'] = f'attachment; filename="qr_{card.card_id}.png"'
        return response

    @action(detail=False, methods=['post'], url_path='bulk-generate')
    def bulk_generate(self, request):
        if not request.user.is_super_admin:
            raise PermissionDenied("Only super administrators can generate bulk cards.")

        serializer = BulkCardGenerationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        count = serializer.validated_data['count']
        prefix = serializer.validated_data.get('prefix', 'A').upper()
        notes = serializer.validated_data.get('notes', 'Bulk generated inventory batch')

        created_cards = []
        for _ in range(count):
            card_id = f"{prefix}{generate_random_card_id(5)}"
            while Card.objects.filter(card_id=card_id).exists():
                card_id = f"{prefix}{generate_random_card_id(5)}"
            
            card = Card(
                card_id=card_id,
                public_token=card_id,
                status=Card.STATUS_AVAILABLE,
                notes=notes
            )
            attach_qr_to_card(card)
            card.save()
            created_cards.append(card)

        AuditLog.objects.create(
            user=request.user,
            action=AuditLog.ACTION_CARD_CREATED,
            details={'count': count, 'prefix': prefix, 'notes': notes}
        )

        return Response({
            'message': f"Successfully generated {count} cards.",
            'cards': CardSerializer(created_cards, many=True).data
        }, status=status.HTTP_201_CREATED)
