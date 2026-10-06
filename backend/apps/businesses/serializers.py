from rest_framework import serializers
from .models import Business, BusinessUser

class BusinessSerializer(serializers.ModelSerializer):
    card_count = serializers.IntegerField(source='cards.count', read_only=True)
    menu_count = serializers.IntegerField(source='menus.count', read_only=True)

    class Meta:
        model = Business
        fields = [
            'id', 'name', 'slug', 'logo', 'logo_url', 'cover_image_url', 'description',
            'phone', 'email', 'whatsapp', 'address', 'city', 'state', 'country',
            'latitude', 'longitude', 'website', 'instagram', 'facebook',
            'google_maps_url', 'google_review_url', 'opening_hours',
            'status', 'card_count', 'menu_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class PublicBusinessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = [
            'id', 'name', 'slug', 'logo_url', 'cover_image_url', 'description',
            'phone', 'email', 'whatsapp', 'address', 'city', 'state', 'country',
            'website', 'instagram', 'facebook', 'google_maps_url', 'google_review_url',
            'opening_hours', 'status'
        ]
        read_only_fields = fields

class BusinessUserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = BusinessUser
        fields = ['id', 'user', 'username', 'email', 'business', 'role', 'created_at']
        read_only_fields = ['id', 'created_at']
