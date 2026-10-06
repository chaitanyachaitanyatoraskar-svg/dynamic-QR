from django.db import models
from django.conf import settings
from django.utils.text import slugify

class Business(models.Model):
    STATUS_ACTIVE = 'ACTIVE'
    STATUS_SUSPENDED = 'SUSPENDED'
    STATUS_ARCHIVED = 'ARCHIVED'

    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_SUSPENDED, 'Suspended'),
        (STATUS_ARCHIVED, 'Archived'),
    ]

    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    logo = models.ImageField(upload_to='logos/', blank=True, null=True)
    logo_url = models.URLField(max_length=500, blank=True, null=True, help_text="Direct or CDN logo URL if uploaded externally")
    cover_image_url = models.URLField(max_length=500, blank=True, null=True)
    description = models.TextField(blank=True, default='')

    phone = models.CharField(max_length=32, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    whatsapp = models.CharField(max_length=32, blank=True, default='', help_text="Format with country code: e.g. 15551234567")

    address = models.TextField(blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    state = models.CharField(max_length=100, blank=True, default='')
    country = models.CharField(max_length=100, blank=True, default='')
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    website = models.URLField(blank=True, default='')
    instagram = models.CharField(max_length=100, blank=True, default='', help_text="Instagram handle or URL")
    facebook = models.CharField(max_length=255, blank=True, default='')
    google_maps_url = models.URLField(max_length=500, blank=True, default='')
    google_review_url = models.URLField(max_length=500, blank=True, default='', help_text="Legitimate Google review URL")

    opening_hours = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Businesses'

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Business.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.status})"


class BusinessUser(models.Model):
    ROLE_OWNER = 'OWNER'
    ROLE_MANAGER = 'MANAGER'
    ROLE_STAFF = 'STAFF'

    ROLE_CHOICES = [
        (ROLE_OWNER, 'Owner'),
        (ROLE_MANAGER, 'Manager'),
        (ROLE_STAFF, 'Staff'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='business_memberships'
    )
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name='members'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_OWNER)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'business')
        verbose_name = 'Business User'
        verbose_name_plural = 'Business Users'

    def __str__(self):
        return f"{self.user.username} -> {self.business.name} ({self.role})"
