import io
from django.utils import timezone
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.db.models import F
from django.conf import settings
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError, NotFound

from .models import Card, ActivationSession, CardAssignment, generate_random_card_id
from .serializers import (
    CardSerializer, ActivationSessionSerializer, VerifyScanSerializer,
    CompleteActivationSerializer, BulkCardGenerationSerializer
)
from .qr_utils import generate_qr_png_bytes, generate_qr_svg_bytes, attach_qr_to_card
from apps.businesses.models import Business, BusinessUser
from apps.analytics.models import ScanEvent
from apps.audit.models import AuditLog

def sanitize_destination_url(url):
    """Ensures destination URL has a valid scheme."""
    url = (url or '').strip()
    if not url:
        return ''
    if url.startswith(('http://', 'https://')):
        return url
    return f"https://{url}"


def wants_json(request):
    """Determines whether the client expects a JSON response."""
    accept = request.headers.get('Accept', '')
    return ('application/json' in accept) or (request.query_params.get('format') == 'json')


class DynamicRedirectView(APIView):
    """
    GET /q/{token} and GET /go/{token}
    The permanent QR / NFC dynamic routing engine.
    - If ACTIVE: immediate direct HTTP 302 to client destination.
    - If UNACTIVATED and scanned by authenticated admin: completes first-scan verification.
    - If UNACTIVATED and scanned by anonymous user: displays "QR NOT ACTIVATED".
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, token):
        # 1. Lookup card by card_id or public_token
        card = Card.objects.select_related('business').filter(card_id__iexact=token).first() or \
               Card.objects.select_related('business').filter(public_token=token).first()

        if not card:
            return self._handle_not_found(request, token)

        # Telemetry capture
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

        domain = settings.PUBLIC_DOMAIN.rstrip('/')

        # 2. If ACTIVE: immediate redirect to client destination
        if card.status == Card.STATUS_ACTIVE:
            try:
                ScanEvent.objects.create(
                    card=card,
                    business=card.business,
                    event_type=ScanEvent.EVENT_CARD_VISIT,
                    destination=card.destination_url,
                    user_agent=user_agent[:500],
                    device_type=device_type,
                    referrer=referrer[:500],
                    ip_address=ip if ip else None
                )
                Card.objects.filter(pk=card.pk).update(
                    scan_count=F('scan_count') + 1,
                    last_scanned_at=timezone.now()
                )
            except Exception:
                pass

            target = sanitize_destination_url(card.destination_url)
            if not target:
                target = f"{domain}/business/{card.business.slug}" if card.business else f"{domain}/"

            if wants_json(request):
                return Response({
                    'status': 'ACTIVE',
                    'card_id': card.card_id,
                    'destination_url': target,
                    'client': card.business.name if card.business else None,
                }, status=status.HTTP_200_OK)

            return HttpResponseRedirect(target)

        # 3. If UNACTIVATED: check for authenticated admin activation session
        if card.status == Card.STATUS_UNACTIVATED:
            # Check if user is authenticated admin or has active session token in query params
            is_admin = bool(request.user and request.user.is_authenticated and (request.user.role == 'SUPER_ADMIN' or request.user.is_superuser))
            session_token = request.query_params.get('session_token')

            active_session = None
            if session_token:
                active_session = ActivationSession.objects.filter(
                    session_token=session_token,
                    status=ActivationSession.STATUS_WAITING_FOR_SCAN,
                    expires_at__gt=timezone.now()
                ).first()
            elif is_admin:
                # Find recent waiting session for this admin
                active_session = ActivationSession.objects.filter(
                    admin_user=request.user,
                    status=ActivationSession.STATUS_WAITING_FOR_SCAN,
                    expires_at__gt=timezone.now()
                ).first()

            if active_session:
                # MARK SCAN VERIFIED!
                active_session.status = ActivationSession.STATUS_SCAN_VERIFIED
                active_session.card = card
                active_session.scanned_at = timezone.now()
                active_session.first_scan_ip = ip
                active_session.first_scan_user_agent = user_agent[:500]
                active_session.save()

                # Record first scan on card
                card.first_scanned_at = timezone.now()
                card.first_scanned_by = active_session.admin_user
                card.first_scan_ip = ip
                card.first_scan_user_agent = user_agent[:500]
                card.save()

                if wants_json(request):
                    return Response({
                        'status': 'SCAN_VERIFIED',
                        'card_id': card.card_id,
                        'session_id': active_session.id,
                        'session_token': active_session.session_token,
                        'message': 'Physical scan verified successfully by authorized admin session.'
                    }, status=status.HTTP_200_OK)

                return HttpResponseRedirect(f"{domain}/admin/activate?session_id={active_session.id}&card_id={card.card_id}")

            # ANONYMOUS PUBLIC SCAN: DO NOT ACTIVATE. Render polite "QR NOT ACTIVATED" page.
            if wants_json(request):
                return Response({
                    'status': 'UNACTIVATED',
                    'card_id': card.card_id,
                    'message': 'This QR code has not been activated yet.'
                }, status=status.HTTP_403_FORBIDDEN)

            return HttpResponseRedirect(f"{domain}/card-status?status=UNACTIVATED&card_id={card.card_id}")

        # 4. If SUSPENDED or DEACTIVATED
        if card.status == Card.STATUS_SUSPENDED:
            if wants_json(request):
                return Response({
                    'status': 'SUSPENDED',
                    'card_id': card.card_id,
                    'message': 'This QR code is temporarily unavailable.'
                }, status=status.HTTP_403_FORBIDDEN)
            return HttpResponseRedirect(f"{domain}/card-status?status=SUSPENDED&card_id={card.card_id}")

        if card.status == Card.STATUS_DEACTIVATED:
            if wants_json(request):
                return Response({
                    'status': 'DEACTIVATED',
                    'card_id': card.card_id,
                    'message': 'This QR code is currently inactive.'
                }, status=status.HTTP_403_FORBIDDEN)
            return HttpResponseRedirect(f"{domain}/card-status?status=DEACTIVATED&card_id={card.card_id}")

        return HttpResponseRedirect(f"{domain}/card-status?status={card.status}&card_id={card.card_id}")

    def _handle_not_found(self, request, token):
        domain = settings.PUBLIC_DOMAIN.rstrip('/')
        if wants_json(request):
            return Response({
                'status': 'NOT_FOUND',
                'error': 'Sorry, this card does not exist.'
            }, status=status.HTTP_404_NOT_FOUND)
        return HttpResponseRedirect(f"{domain}/card-status?status=NOT_FOUND&card_id={token}")


class ActivationSessionViewSet(viewsets.ModelViewSet):
    """
    Manages temporary Admin Activation Sessions.
    Enforces that physical scan verification is mandatory before activation.
    """
    serializer_class = ActivationSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_super_admin:
            return ActivationSession.objects.all().select_related('card', 'admin_user')
        return ActivationSession.objects.filter(admin_user=user).select_related('card', 'admin_user')

    @action(detail=False, methods=['post'], url_path='start')
    def start_session(self, request):
        if not request.user.is_super_admin:
            raise PermissionDenied("Only administrators can initiate activation sessions.")

        # Clean up any stale waiting sessions
        ActivationSession.objects.filter(
            admin_user=request.user,
            status=ActivationSession.STATUS_WAITING_FOR_SCAN
        ).update(status=ActivationSession.STATUS_CANCELLED)

        session = ActivationSession.objects.create(
            admin_user=request.user,
            status=ActivationSession.STATUS_WAITING_FOR_SCAN
        )
        return Response(ActivationSessionSerializer(session).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='status')
    def check_status(self, request, pk=None):
        session = self.get_object()
        if session.is_expired and session.status == ActivationSession.STATUS_WAITING_FOR_SCAN:
            session.status = ActivationSession.STATUS_EXPIRED
            session.save()
        return Response(ActivationSessionSerializer(session).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='verify-scan')
    def verify_physical_scan(self, request, pk=None):
        """
        Called when physical card QR is scanned during an active session (via camera scanner or scanner input).
        """
        session = self.get_object()
        if session.status != ActivationSession.STATUS_WAITING_FOR_SCAN:
            return Response({'error': f"Session is in {session.status} state, not WAITING_FOR_SCAN."}, status=status.HTTP_400_BAD_REQUEST)

        if session.is_expired:
            session.status = ActivationSession.STATUS_EXPIRED
            session.save()
            return Response({'error': 'Activation session has expired.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = VerifyScanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        raw_card_id = serializer.validated_data['card_id'].strip()

        # Handle full scanned URL if camera scanned https://.../q/A7K92X
        if '/q/' in raw_card_id:
            raw_card_id = raw_card_id.split('/q/')[-1].split('/')[0].split('?')[0]
        elif '/go/' in raw_card_id:
            raw_card_id = raw_card_id.split('/go/')[-1].split('/')[0].split('?')[0]

        card = Card.objects.filter(card_id__iexact=raw_card_id).first() or \
               Card.objects.filter(public_token__iexact=raw_card_id).first()

        if not card:
            return Response({'error': f"Card '{raw_card_id}' does not exist in inventory."}, status=status.HTTP_404_NOT_FOUND)

        if card.status == Card.STATUS_ACTIVE:
            return Response({'error': f"Card '{card.card_id}' is already active and routing to {card.destination_url}."}, status=status.HTTP_400_BAD_REQUEST)

        ip = request.META.get('REMOTE_ADDR', '')
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        # Record physical scan
        session.status = ActivationSession.STATUS_SCAN_VERIFIED
        session.card = card
        session.scanned_at = timezone.now()
        session.first_scan_ip = ip
        session.first_scan_user_agent = user_agent[:500]
        session.save()

        card.first_scanned_at = timezone.now()
        card.first_scanned_by = request.user
        card.first_scan_ip = ip
        card.first_scan_user_agent = user_agent[:500]
        card.save()

        return Response({
            'message': 'Physical scan verified successfully.',
            'session': ActivationSessionSerializer(session).data,
            'card': CardSerializer(card).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='complete')
    def complete_activation(self, request, pk=None):
        """
        Activates the card once physical scan is verified.
        Sets client and destination URL.
        """
        session = self.get_object()
        if session.status != ActivationSession.STATUS_SCAN_VERIFIED or not session.card:
            return Response(
                {'error': 'Physical scan has not been verified yet. Admin must physically scan card first.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CompleteActivationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        card = session.card

        # Client / Business resolution
        business = None
        if data.get('business_id'):
            business = get_object_or_404(Business, pk=data['business_id'])
        elif data.get('client_name'):
            client_name = data['client_name'].strip()
            business, _ = Business.objects.get_or_create(
                name=client_name,
                defaults={'status': Business.STATUS_ACTIVE}
            )

        clean_url = sanitize_destination_url(data['destination_url'])
        if not clean_url:
            raise ValidationError("Valid destination URL is required.")

        card.business = business
        card.destination_url = clean_url
        card.purpose = data.get('purpose', 'Client Website')
        card.status = Card.STATUS_ACTIVE
        card.activated_at = timezone.now()
        card.activated_by = request.user
        card.deactivation_date = None
        if data.get('notes'):
            card.notes = data['notes']
        card.save()

        session.status = ActivationSession.STATUS_COMPLETED
        session.completed_at = timezone.now()
        session.save()

        if business:
            CardAssignment.objects.create(
                card=card,
                business=business,
                assigned_by=request.user,
                notes=f"Physical scan verified and activated for {business.name}"
            )

        AuditLog.objects.create(
            user=request.user,
            action=AuditLog.ACTION_CARD_ACTIVATED,
            card=card,
            business=business,
            details={
                'card_id': card.card_id,
                'destination_url': card.destination_url,
                'client': business.name if business else 'Direct URL',
                'session_token': session.session_token
            }
        )

        return Response({
            'message': 'Card activated successfully.',
            'card': CardSerializer(card).data
        }, status=status.HTTP_200_OK)


from rest_framework.renderers import BaseRenderer

class PassthroughRenderer(BaseRenderer):
    media_type = '*/*'
    format = ''
    def render(self, data, accepted_media_type=None, renderer_context=None):
        return data

class PNGRenderer(BaseRenderer):
    media_type = 'image/png'
    format = 'png'
    def render(self, data, accepted_media_type=None, renderer_context=None):
        return data

class SVGRenderer(BaseRenderer):
    media_type = 'image/svg+xml'
    format = 'svg'
    def render(self, data, accepted_media_type=None, renderer_context=None):
        return data


class CardViewSet(viewsets.ModelViewSet):
    serializer_class = CardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if getattr(self, 'action', None) == 'download_qr':
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_renderers(self):
        if getattr(self, 'action', None) == 'download_qr':
            return [PNGRenderer(), SVGRenderer(), PassthroughRenderer()]
        return super().get_renderers()

    def get_queryset(self):
        if getattr(self, 'action', None) == 'download_qr':
            return Card.objects.all()

        user = self.request.user
        if getattr(user, 'is_authenticated', False) and getattr(user, 'is_super_admin', False):
            return Card.objects.all().select_related('business', 'activated_by', 'first_scanned_by')
        elif getattr(user, 'is_authenticated', False):
            return Card.objects.filter(business__members__user=user).select_related('business')
        return Card.objects.none()

    def perform_create(self, serializer):
        if not self.request.user.is_super_admin:
            raise PermissionDenied("Only super administrators can provision new cards.")
        card = serializer.save(status=Card.STATUS_UNACTIVATED)
        attach_qr_to_card(card)
        card.save()

        AuditLog.objects.create(
            user=self.request.user,
            action=AuditLog.ACTION_CARD_CREATED,
            card=card,
            details={'card_id': card.card_id, 'status': card.status}
        )

    @action(detail=True, methods=['post'], url_path='update-destination')
    def update_destination(self, request, pk=None):
        """
        Allows admin to update destination URL for an active card without re-scanning.
        """
        if not request.user.is_super_admin:
            raise PermissionDenied("Only administrators can update destinations.")

        card = self.get_object()
        new_url = sanitize_destination_url(request.data.get('destination_url', ''))
        if not new_url:
            raise ValidationError("Valid destination URL is required.")

        old_url = card.destination_url
        card.destination_url = new_url
        card.save()

        AuditLog.objects.create(
            user=request.user,
            action=AuditLog.ACTION_DESTINATION_CHANGED,
            card=card,
            business=card.business,
            details={'old_destination': old_url, 'new_destination': new_url}
        )
        return Response(CardSerializer(card).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='activate')
    def activate(self, request, pk=None):
        """
        Directly activates an unactivated card with a redirection destination URL.
        Allows instant activation from the dashboard.
        """
        if not request.user.is_super_admin:
            raise PermissionDenied("Only administrators can activate cards.")

        card = self.get_object()
        destination_url = sanitize_destination_url(request.data.get('destination_url', ''))
        if not destination_url:
            return Response({'error': 'Valid destination URL is required.'}, status=status.HTTP_400_BAD_REQUEST)

        business = None
        if request.data.get('business_id'):
            business = get_object_or_404(Business, pk=request.data['business_id'])
        elif request.data.get('client_name'):
            client_name = request.data['client_name'].strip()
            if client_name:
                business, _ = Business.objects.get_or_create(
                    name=client_name,
                    defaults={'status': Business.STATUS_ACTIVE}
                )

        ip = request.META.get('REMOTE_ADDR', '')
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        card.business = business
        card.destination_url = destination_url
        card.purpose = request.data.get('purpose', 'Client Website')
        card.status = Card.STATUS_ACTIVE
        card.activated_at = timezone.now()
        card.activated_by = request.user
        if not card.first_scanned_at:
            card.first_scanned_at = timezone.now()
            card.first_scanned_by = request.user
            card.first_scan_ip = ip
            card.first_scan_user_agent = user_agent[:500]
        if request.data.get('notes'):
            card.notes = request.data['notes']
        card.save()

        AuditLog.objects.create(
            user=request.user,
            action=AuditLog.ACTION_CARD_ACTIVATED,
            card=card,
            business=business,
            details={'destination_url': destination_url, 'direct_activation': True}
        )

        return Response({
            'message': f"Card {card.card_id} activated successfully.",
            'card': CardSerializer(card).data
        }, status=status.HTTP_200_OK)

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

    @action(
        detail=True,
        methods=['get'],
        permission_classes=[permissions.AllowAny],
        renderer_classes=[PNGRenderer, SVGRenderer, PassthroughRenderer]
    )
    def download_qr(self, request, pk=None):
        if str(pk).isdigit():
            card = get_object_or_404(Card, id=pk)
        else:
            card = get_object_or_404(Card, card_id=pk)

        fmt = request.query_params.get('format', 'png').lower()
        as_download = request.query_params.get('download', '').lower() in ['1', 'true', 'yes']
        disposition = 'attachment' if as_download else 'inline'
        custom_domain = request.query_params.get('domain')

        if fmt == 'svg':
            svg_data = generate_qr_svg_bytes(card.card_id, domain=custom_domain)
            response = HttpResponse(svg_data, content_type='image/svg+xml')
            response['Content-Disposition'] = f'{disposition}; filename="qr_{card.card_id}.svg"'
            return response

        png_data = generate_qr_png_bytes(card.card_id, domain=custom_domain)
        response = HttpResponse(png_data, content_type='image/png')
        response['Content-Disposition'] = f'{disposition}; filename="qr_{card.card_id}.png"'
        return response

    @action(detail=False, methods=['post'], url_path='bulk-generate')
    def bulk_generate(self, request):
        if not request.user.is_super_admin:
            raise PermissionDenied("Only super administrators can generate bulk cards.")

        serializer = BulkCardGenerationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        count = serializer.validated_data['count']
        prefix = serializer.validated_data.get('prefix', 'A').upper()
        notes = serializer.validated_data.get('notes', 'Physical inventory batch')

        created_cards = []
        for _ in range(count):
            card_id = f"{prefix}{generate_random_card_id(5)}"
            while Card.objects.filter(card_id=card_id).exists():
                card_id = f"{prefix}{generate_random_card_id(5)}"

            card = Card(
                card_id=card_id,
                public_token=card_id,
                status=Card.STATUS_UNACTIVATED,
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
            'message': f"Successfully generated {count} unactivated cards.",
            'cards': CardSerializer(created_cards, many=True).data
        }, status=status.HTTP_201_CREATED)
