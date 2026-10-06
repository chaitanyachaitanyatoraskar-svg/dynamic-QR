from django.db import models
from apps.businesses.models import Business

class DestinationConfig(models.Model):
    """
    Extensible destination configurations for businesses.
    Allows pre-registering verified review links, booking endpoints, etc.
    """
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='destination_configs')
    destination_type = models.CharField(max_length=64)
    label = models.CharField(max_length=128)
    target_url = models.CharField(max_length=500)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.business.name} - {self.destination_type} ({self.label})"
