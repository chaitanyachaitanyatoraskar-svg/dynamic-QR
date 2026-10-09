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

    def test_auto_login(self):
        admin = User.objects.create_superuser(
            username='superadmin',
            password='adminpassword',
            email='admin@example.com',
            role=User.ROLE_SUPER_ADMIN
        )
        response = self.client.post('/api/auth/auto-login/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['username'], 'superadmin')

    def test_security_question_flow(self):
        self.user.security_question = "What is your favorite city?"
        self.user.set_security_answer("Mumbai")
        self.user.save()

        # Step 1: Retrieve question
        res_q = self.client.post('/api/auth/forgot-password/get-question/', {'username': 'johndoe'}, format='json')
        self.assertEqual(res_q.status_code, 200)
        self.assertEqual(res_q.data['question'], "What is your favorite city?")

        # Step 2: Failed reset with wrong answer
        res_wrong = self.client.post('/api/auth/forgot-password/reset/', {
            'username': 'johndoe',
            'answer': 'London',
            'new_password': 'NewPassword456'
        }, format='json')
        self.assertEqual(res_wrong.status_code, 400)
        self.assertIn('error', res_wrong.data)

        # Step 3: Successful reset with correct answer (case-insensitive)
        res_success = self.client.post('/api/auth/forgot-password/reset/', {
            'username': 'johndoe',
            'answer': 'mumbai',
            'new_password': 'NewPassword456'
        }, format='json')
        self.assertEqual(res_success.status_code, 200)
        self.assertIn('token', res_success.data)

        # Step 4: Login with new password
        res_login = self.client.post('/api/auth/login/', {
            'username': 'johndoe',
            'password': 'NewPassword456'
        }, format='json')
        self.assertEqual(res_login.status_code, 200)


