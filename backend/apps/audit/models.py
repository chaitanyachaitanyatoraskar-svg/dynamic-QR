from django.db import models
from django.conf import settings
from apps.businesses.models import Business
from apps.cards.models import Card

class AuditLog(models.Model):
    ACTION_CARD_CREATED = 'CARD_CREATED'
    ACTION_CARD_ACTIVATED = 'CARD_ACTIVATED'
    ACTION_CARD_SUSPENDED = 'CARD_SUSPENDED'
    ACTION_CARD_DEACTIVATED = 'CARD_DEACTIVATED'
    ACTION_CARD_REASSIGNED = 'CARD_REASSIGNED'
    ACTION_BUSINESS_CREATED = 'BUSINESS_CREATED'
    ACTION_BUSINESS_UPDATED = 'BUSINESS_UPDATED'
    ACTION_DESTINATION_CHANGED = 'DESTINATION_CHANGED'
    ACTION_MENU_CHANGED = 'MENU_CHANGED'
    ACTION_USER_CREATED = 'USER_CREATED'

    ACTION_CHOICES = [
        (ACTION_CARD_CREATED, 'Card Created'),
        (ACTION_CARD_ACTIVATED, 'Card Activated'),
        (ACTION_CARD_SUSPENDED, 'Card Suspended'),
        (ACTION_CARD_DEACTIVATED, 'Card Deactivated'),
        (ACTION_CARD_REASSIGNED, 'Card Reassigned'),
        (ACTION_BUSINESS_CREATED, 'Business Created'),
        (ACTION_BUSINESS_UPDATED, 'Business Updated'),
        (ACTION_DESTINATION_CHANGED, 'Destination Changed'),
        (ACTION_MENU_CHANGED, 'Menu Changed'),
        (ACTION_USER_CREATED, 'User Created'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=64, choices=ACTION_CHOICES)
    business = models.ForeignKey(Business, on_delete=models.SET_NULL, null=True, blank=True)
    card = models.ForeignKey(Card, on_delete=models.SET_NULL, null=True, blank=True)
    details = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        username = self.user.username if self.user else "System"
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M')}] {username} - {self.action}"
