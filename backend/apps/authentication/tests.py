from django.test import TestCase
from rest_framework.test import APIClient
from apps.authentication.models import User

class AuthenticationTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='johndoe',
            password='secretpassword',
            email='john@example.com',
            role=User.ROLE_BUSINESS_OWNER
        )

    def test_login_successful(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'johndoe',
            'password': 'secretpassword'
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['username'], 'johndoe')

    def test_login_invalid_credentials(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'johndoe',
            'password': 'wrongpassword'
        }, format='json')
        self.assertEqual(response.status_code, 400)
