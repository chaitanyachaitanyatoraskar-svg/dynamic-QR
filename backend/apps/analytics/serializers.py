from rest_framework import serializers
from .models import ScanEvent

class ScanEventSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.name', read_only=True)
    card_id = serializers.CharField(source='card.card_id', read_only=True)

    class Meta:
        model = ScanEvent
        fields = [
            'id', 'card_id', 'business_name', 'timestamp', 'event_type',
            'destination', 'device_type', 'browser', 'operating_system', 'referrer'
        ]

class TrackEventSerializer(serializers.Serializer):
    business_slug = serializers.CharField(required=True)
    card_id = serializers.CharField(required=False, allow_blank=True, default='')
    event_type = serializers.ChoiceField(choices=ScanEvent.EVENT_CHOICES)
    destination = serializers.CharField(required=False, allow_blank=True, default='')
