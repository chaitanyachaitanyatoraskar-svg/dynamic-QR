import secrets
import string
from django.db import models
from django.conf import settings
from apps.businesses.models import Business

def generate_random_card_id(length=6):
    chars = string.ascii_uppercase + string.digits
    # Avoid ambiguous characters if needed, or standard uppercase + digits
    return ''.join(secrets.choice(chars) for _ in range(length))

def generate_routing_token(length=12):
    chars = string.ascii_letters + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))

class Card(models.Model):
    STATUS_AVAILABLE = 'AVAILABLE'
    STATUS_RESERVED = 'RESERVED'
    STATUS_ACTIVE = 'ACTIVE'
    STATUS_SUSPENDED = 'SUSPENDED'
    STATUS_DEACTIVATED = 'DEACTIVATED'
    STATUS_LOST = 'LOST'
    STATUS_RETIRED = 'RETIRED'

    STATUS_CHOICES = [
        (STATUS_AVAILABLE, 'Available'),
        (STATUS_RESERVED, 'Reserved'),
        (STATUS_ACTIVE, 'Active'),
        (STATUS_SUSPENDED, 'Suspended'),
        (STATUS_DEACTIVATED, 'Deactivated'),
        (STATUS_LOST, 'Lost'),
        (STATUS_RETIRED, 'Retired'),
    ]

    DEST_BUSINESS_PROFILE = 'BUSINESS_PROFILE'
    DEST_DIGITAL_MENU = 'DIGITAL_MENU'
    DEST_REVIEW_PAGE = 'REVIEW_PAGE'
    DEST_EXTERNAL_URL = 'EXTERNAL_URL'
    DEST_SOCIAL_PROFILE = 'SOCIAL_PROFILE'
    DEST_CONTACT_PAGE = 'CONTACT_PAGE'
    DEST_BOOKING_PAGE = 'BOOKING_PAGE'

    DESTINATION_TYPE_CHOICES = [
        (DEST_BUSINESS_PROFILE, 'Business Profile'),
        (DEST_DIGITAL_MENU, 'Digital Menu'),
        (DEST_REVIEW_PAGE, 'Review Page'),
        (DEST_EXTERNAL_URL, 'External URL'),
        (DEST_SOCIAL_PROFILE, 'Social Profile'),
        (DEST_CONTACT_PAGE, 'Contact Page'),
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
        default=STATUS_AVAILABLE,
        db_index=True
    )
    business = models.ForeignKey(
        Business,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='cards'
    )
    purpose = models.CharField(max_length=64, default='Digital Menu', blank=True)
    destination_type = models.CharField(
        max_length=32,
        choices=DESTINATION_TYPE_CHOICES,
        default=DEST_DIGITAL_MENU
    )
    destination_url = models.CharField(
        max_length=500,
        blank=True,
        default='',
        help_text="Validated target URL if external or custom"
    )
    qr_image = models.ImageField(upload_to='qr_codes/', blank=True, null=True)

    activation_date = models.DateTimeField(null=True, blank=True)
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
        return f"{domain.rstrip('/')}/go/{self.card_id}"

    def __str__(self):
        biz_name = self.business.name if self.business else "Unassigned"
        return f"Card {self.card_id} [{self.status}] -> {biz_name}"


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
