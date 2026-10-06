from rest_framework import serializers
from .models import Card, CardAssignment
from apps.businesses.models import Business

class CardSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source='business.name', read_only=True)
    business_slug = serializers.CharField(source='business.slug', read_only=True)
    permanent_url = serializers.SerializerMethodField()
    qr_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Card
        fields = [
            'id', 'card_id', 'public_token', 'status', 'business', 'business_name',
            'business_slug', 'purpose', 'destination_type', 'destination_url',
            'permanent_url', 'qr_image_url', 'activation_date', 'deactivation_date',
            'last_scanned_at', 'scan_count', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'card_id', 'public_token', 'permanent_url', 'qr_image_url',
            'last_scanned_at', 'scan_count', 'created_at', 'updated_at'
        ]

    def get_permanent_url(self, obj):
        return obj.get_permanent_url()

    def get_qr_image_url(self, obj):
        if obj.qr_image:
            return obj.qr_image.url
        return None

class CardActivationSerializer(serializers.Serializer):
    business_id = serializers.IntegerField(required=True)
    purpose = serializers.CharField(max_length=64, default='Digital Menu')
    destination_type = serializers.ChoiceField(choices=Card.DESTINATION_TYPE_CHOICES, default=Card.DEST_DIGITAL_MENU)
    destination_url = serializers.CharField(max_length=500, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)

class CardReassignSerializer(serializers.Serializer):
    business_id = serializers.IntegerField(required=True)
    purpose = serializers.CharField(max_length=64, default='Digital Menu')
    destination_type = serializers.ChoiceField(choices=Card.DESTINATION_TYPE_CHOICES, default=Card.DEST_DIGITAL_MENU)
    destination_url = serializers.CharField(max_length=500, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)

class BulkCardGenerationSerializer(serializers.Serializer):
    count = serializers.IntegerField(min_value=1, max_value=500, default=10)
    prefix = serializers.CharField(max_length=4, default='A', allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
