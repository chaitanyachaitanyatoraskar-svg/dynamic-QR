from rest_framework import serializers
from .models import Menu, MenuCategory, MenuItem

class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = [
            'id', 'category', 'name', 'description', 'price',
            'image_url', 'is_vegetarian', 'is_spicy', 'is_available', 'display_order'
        ]

class MenuCategorySerializer(serializers.ModelSerializer):
    items = MenuItemSerializer(many=True, read_only=True)

    class Meta:
        model = MenuCategory
        fields = ['id', 'menu', 'name', 'description', 'display_order', 'is_active', 'items']

class MenuSerializer(serializers.ModelSerializer):
    categories = MenuCategorySerializer(many=True, read_only=True)
    business_name = serializers.CharField(source='business.name', read_only=True)

    class Meta:
        model = Menu
        fields = ['id', 'business', 'business_name', 'title', 'description', 'is_active', 'categories', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class PublicMenuSerializer(serializers.ModelSerializer):
    categories = serializers.SerializerMethodField()
    business_name = serializers.CharField(source='business.name', read_only=True)
    business_slug = serializers.CharField(source='business.slug', read_only=True)

    class Meta:
        model = Menu
        fields = ['id', 'business_name', 'business_slug', 'title', 'description', 'categories']

    def get_categories(self, obj):
        active_categories = obj.categories.filter(is_active=True).prefetch_related('items')
        return MenuCategorySerializer(active_categories, many=True).data
