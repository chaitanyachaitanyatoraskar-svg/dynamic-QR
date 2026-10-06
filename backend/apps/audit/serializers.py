from rest_framework import serializers
from .models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    business_name = serializers.CharField(source='business.name', read_only=True)
    card_id = serializers.CharField(source='card.card_id', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'username', 'action', 'business_name', 'card_id', 'details', 'timestamp'
        ]
