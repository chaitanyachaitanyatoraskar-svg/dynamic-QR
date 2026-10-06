from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_SUPER_ADMIN = 'SUPER_ADMIN'
    ROLE_BUSINESS_OWNER = 'BUSINESS_OWNER'
    ROLE_STAFF = 'STAFF'

    ROLE_CHOICES = [
        (ROLE_SUPER_ADMIN, 'Super Admin'),
        (ROLE_BUSINESS_OWNER, 'Business Owner'),
        (ROLE_STAFF, 'Staff Member'),
    ]

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default=ROLE_BUSINESS_OWNER,
        help_text='User authorization role.'
    )
    phone = models.CharField(max_length=32, blank=True, null=True)

    @property
    def is_super_admin(self):
        return self.role == self.ROLE_SUPER_ADMIN or self.is_superuser

    @property
    def is_business_owner(self):
        return self.role == self.ROLE_BUSINESS_OWNER

    def __str__(self):
        return f"{self.username} ({self.role})"
