import secrets
import string
from datetime import timedelta
from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.businesses.models import Business

def generate_random_card_id(length=6):
    chars = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))

def generate_session_token(length=32):
    return secrets.token_urlsafe(length)

class Card(models.Model):
    STATUS_UNACTIVATED = 'UNACTIVATED'
    STATUS_ACTIVE = 'ACTIVE'
    STATUS_SUSPENDED = 'SUSPENDED'
    STATUS_DEACTIVATED = 'DEACTIVATED'

    STATUS_CHOICES = [
        (STATUS_UNACTIVATED, 'Unactivated'),
        (STATUS_ACTIVE, 'Active'),
        (STATUS_SUSPENDED, 'Suspended'),
        (STATUS_DEACTIVATED, 'Deactivated'),
    ]

    DEST_EXTERNAL_URL = 'EXTERNAL_URL'
    DEST_DIGITAL_MENU = 'DIGITAL_MENU'
    DEST_BUSINESS_PROFILE = 'BUSINESS_PROFILE'
    DEST_REVIEW_PAGE = 'REVIEW_PAGE'
    DEST_SOCIAL_PROFILE = 'SOCIAL_PROFILE'
    DEST_BOOKING_PAGE = 'BOOKING_PAGE'

    DESTINATION_TYPE_CHOICES = [
        (DEST_EXTERNAL_URL, 'External Website URL'),
        (DEST_DIGITAL_MENU, 'Digital Menu'),
        (DEST_BUSINESS_PROFILE, 'Business Profile'),
        (DEST_REVIEW_PAGE, 'Review Page'),
        (DEST_SOCIAL_PROFILE, 'Social Profile'),
        (DEST_BOOKING_PAGE, 'Booking Page'),
    ]

    card_id = models.CharField(
        max_length=32,
        unique=True,
        db_index=True,
        help_text="Permanent human-readable identifier printed on physical card (e.g. A7K92X)"
    )
    public_token = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        help_text="Secure public routing token"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_UNACTIVATED,
        db_index=True
    )
    business = models.ForeignKey(
        Business,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cards'
    )
    purpose = models.CharField(max_length=128, blank=True, default='')
    destination_type = models.CharField(
        max_length=32,
        choices=DESTINATION_TYPE_CHOICES,
        default=DEST_EXTERNAL_URL
    )
    destination_url = models.CharField(
        max_length=500,
        blank=True,
        default='',
        help_text="Validated target destination URL"
    )
    qr_image = models.ImageField(upload_to='qr_codes/', blank=True, null=True)

    # First physical scan audit attributes
    first_scanned_at = models.DateTimeField(null=True, blank=True)
    first_scanned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='first_scanned_cards'
    )
    first_scan_ip = models.GenericIPAddressField(null=True, blank=True)
    first_scan_user_agent = models.TextField(blank=True, default='')

    # Activation details
    activated_at = models.DateTimeField(null=True, blank=True)
    activated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='activated_cards'
    )
    deactivation_date = models.DateTimeField(null=True, blank=True)

    last_scanned_at = models.DateTimeField(null=True, blank=True)
    scan_count = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.card_id:
            candidate = generate_random_card_id()
            while Card.objects.filter(card_id=candidate).exists():
                candidate = generate_random_card_id()
            self.card_id = candidate
        if not self.public_token:
            self.public_token = self.card_id
        super().save(*args, **kwargs)

    def get_permanent_url(self, base_domain=None):
        domain = base_domain or settings.PUBLIC_DOMAIN
        return f"{domain.rstrip('/')}/q/{self.card_id}"

    def __str__(self):
        biz_name = self.business.name if self.business else "Unassigned"
        return f"Card {self.card_id} [{self.status}] -> {biz_name}"


class ActivationSession(models.Model):
    STATUS_WAITING_FOR_SCAN = 'WAITING_FOR_SCAN'
    STATUS_SCAN_VERIFIED = 'SCAN_VERIFIED'
    STATUS_COMPLETED = 'COMPLETED'
    STATUS_EXPIRED = 'EXPIRED'
    STATUS_CANCELLED = 'CANCELLED'

    STATUS_CHOICES = [
        (STATUS_WAITING_FOR_SCAN, 'Waiting for Physical Scan'),
        (STATUS_SCAN_VERIFIED, 'Physical Scan Verified'),
        (STATUS_COMPLETED, 'Activation Completed'),
        (STATUS_EXPIRED, 'Expired'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    session_token = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        default=generate_session_token
    )
    admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='activation_sessions'
    )
    card = models.ForeignKey(
        Card,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='activation_sessions'
    )
    status = models.CharField(
        max_length=32,
        choices=STATUS_CHOICES,
        default=STATUS_WAITING_FOR_SCAN,
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    scanned_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()
    completed_at = models.DateTimeField(null=True, blank=True)

    first_scan_ip = models.GenericIPAddressField(null=True, blank=True)
    first_scan_user_agent = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=15)
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        card_id = self.card.card_id if self.card else "No Card"
        return f"ActivationSession {self.session_token[:8]} [{self.status}] - {card_id}"


class CardAssignment(models.Model):
    card = models.ForeignKey(Card, on_delete=models.CASCADE, related_name='assignments')
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='card_assignments')
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    unassigned_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-assigned_at']

    def __str__(self):
        return f"Assignment: {self.card.card_id} to {self.business.name} at {self.assigned_at}"
