from django.db import models
from apps.businesses.models import Business
from apps.cards.models import Card

class ScanEvent(models.Model):
    EVENT_CARD_VISIT = 'CARD_VISIT'
    EVENT_QR_SCAN = 'QR_SCAN'
    EVENT_NFC_TAP = 'NFC_TAP'
    EVENT_PAGE_VIEW = 'PAGE_VIEW'
    EVENT_MENU_VIEW = 'MENU_VIEW'
    EVENT_REVIEW_CLICK = 'REVIEW_CLICK'
    EVENT_CALL_CLICK = 'CALL_CLICK'
    EVENT_WHATSAPP_CLICK = 'WHATSAPP_CLICK'
    EVENT_DIRECTIONS_CLICK = 'DIRECTIONS_CLICK'

    EVENT_CHOICES = [
        (EVENT_CARD_VISIT, 'Card Visit (General)'),
        (EVENT_QR_SCAN, 'QR Scan'),
        (EVENT_NFC_TAP, 'NFC Tap'),
        (EVENT_PAGE_VIEW, 'Page View'),
        (EVENT_MENU_VIEW, 'Menu View'),
        (EVENT_REVIEW_CLICK, 'Review Click'),
        (EVENT_CALL_CLICK, 'Phone Call Click'),
        (EVENT_WHATSAPP_CLICK, 'WhatsApp Click'),
        (EVENT_DIRECTIONS_CLICK, 'Directions Click'),
    ]

    card = models.ForeignKey(Card, on_delete=models.SET_NULL, null=True, blank=True, related_name='scan_events')
    business = models.ForeignKey(Business, on_delete=models.SET_NULL, null=True, blank=True, related_name='scan_events')
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    event_type = models.CharField(max_length=32, choices=EVENT_CHOICES, default=EVENT_CARD_VISIT, db_index=True)
    destination = models.CharField(max_length=128, blank=True, default='')

    user_agent = models.TextField(blank=True, default='')
    device_type = models.CharField(max_length=32, default='DESKTOP')
    browser = models.CharField(max_length=64, blank=True, default='')
    operating_system = models.CharField(max_length=64, blank=True, default='')
    referrer = models.CharField(max_length=500, blank=True, default='')
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['business', 'timestamp']),
            models.Index(fields=['card', 'timestamp']),
            models.Index(fields=['event_type', 'timestamp']),
        ]

    def __str__(self):
        biz = self.business.name if self.business else "System"
        return f"{self.event_type} - {biz} at {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
