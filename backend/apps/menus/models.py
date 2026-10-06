from django.db import models
from apps.businesses.models import Business

class Menu(models.Model):
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='menus')
    title = models.CharField(max_length=255, default='Main Menu')
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_active', 'title']

    def __str__(self):
        return f"{self.business.name} - {self.title}"


class MenuCategory(models.Model):
    menu = models.ForeignKey(Menu, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=128)
    description = models.TextField(blank=True, default='')
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['display_order', 'id']
        verbose_name_plural = 'Menu Categories'

    def __str__(self):
        return f"{self.menu.title} -> {self.name}"


class MenuItem(models.Model):
    category = models.ForeignKey(MenuCategory, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image_url = models.URLField(max_length=500, blank=True, null=True)
    is_vegetarian = models.BooleanField(default=False)
    is_spicy = models.BooleanField(default=False)
    is_available = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['display_order', 'id']

    def __str__(self):
        return f"{self.name} (${self.price})"
