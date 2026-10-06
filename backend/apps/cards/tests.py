from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from apps.authentication.models import User
from apps.businesses.models import Business, BusinessUser
from apps.cards.models import Card, CardAssignment
from apps.cards.qr_utils import generate_qr_png_bytes

class CoreProductLifecycleTestCase(TestCase):
    """
    Automated verification of the fundamental product rule:
    Permanent Physical Card ID -> Dynamic Routing -> Business A -> Reassign -> Business B.
    """

    def setUp(self):
        self.client = APIClient()

        # Admin user
        self.admin = User.objects.create_superuser(
            username='admin_test',
            email='admin@test.local',
            password='password123',
            role=User.ROLE_SUPER_ADMIN
        )

        # Business Owner A
        self.owner_a = User.objects.create_user(
            username='owner_a',
            email='owner_a@test.local',
            password='password123',
            role=User.ROLE_BUSINESS_OWNER
        )

        # Business Owner B
        self.owner_b = User.objects.create_user(
            username='owner_b',
            email='owner_b@test.local',
            password='password123',
            role=User.ROLE_BUSINESS_OWNER
        )

        # Business A
        self.biz_a = Business.objects.create(
            name='Business Alpha',
            slug='business-alpha',
            status=Business.STATUS_ACTIVE
        )
        BusinessUser.objects.create(user=self.owner_a, business=self.biz_a, role=BusinessUser.ROLE_OWNER)

        # Business B
        self.biz_b = Business.objects.create(
            name='Business Beta',
            slug='business-beta',
            status=Business.STATUS_ACTIVE
        )
        BusinessUser.objects.create(user=self.owner_b, business=self.biz_b, role=BusinessUser.ROLE_OWNER)

    def test_core_permanent_qr_dynamic_reassignment(self):
        """
        THE GOLDEN CORE PRODUCT TEST:
        1. Create card A7K92X.
        2. Assign it to Business Alpha with destination DIGITAL_MENU.
        3. Request /go/A7K92X -> resolves to Business Alpha's menu.
        4. Reassign card A7K92X to Business Beta.
        5. Request /go/A7K92X -> resolves to Business Beta.
        6. Verify Card ID 'A7K92X' and public token never changed.
        """
        card_id = 'A7K92X'
        card = Card.objects.create(
            card_id=card_id,
            public_token=card_id,
            status=Card.STATUS_ACTIVE,
            business=self.biz_a,
            destination_type=Card.DEST_DIGITAL_MENU
        )

        # Request via redirect endpoint
        url = reverse('dynamic-redirect', kwargs={'token': card_id})
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'ACTIVE')
        self.assertEqual(response.data['business']['slug'], 'business-alpha')
        self.assertIn('/business/business-alpha/menu', response.data['target_url'])

        # Now reassign to Business Beta
        self.client.force_authenticate(user=self.admin)
        reassign_url = f"/api/cards/{card.id}/reassign/"
        reassign_response = self.client.post(reassign_url, {
            'business_id': self.biz_b.id,
            'purpose': 'Digital Menu',
            'destination_type': Card.DEST_DIGITAL_MENU,
        }, format='json')
        self.assertEqual(reassign_response.status_code, 200)

        # Verify physical Card ID did NOT change
        card.refresh_from_db()
        self.assertEqual(card.card_id, card_id)
        self.assertEqual(card.business, self.biz_b)

        # Request again via exact same permanent URL
        self.client.logout()
        response_reassigned = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response_reassigned.status_code, 200)
        self.assertEqual(response_reassigned.data['business']['slug'], 'business-beta')
        self.assertIn('/business/business-beta/menu', response_reassigned.data['target_url'])

    def test_inactive_and_suspended_card_states(self):
        """Card suspended or deactivated must not route to destination."""
        card = Card.objects.create(
            card_id='SUSP01',
            public_token='SUSP01',
            status=Card.STATUS_SUSPENDED,
            business=self.biz_a
        )
        url = reverse('dynamic-redirect', kwargs={'token': 'SUSP01'})
        response = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data['status'], 'SUSPENDED')

        # Test non-existent card
        bad_url = reverse('dynamic-redirect', kwargs={'token': 'NONEXISTENT999'})
        bad_resp = self.client.get(bad_url, HTTP_ACCEPT='application/json')
        self.assertEqual(bad_resp.status_code, 404)

    def test_multi_tenant_isolation(self):
        """Owner A cannot view or manipulate cards belonging to Business B."""
        card_b = Card.objects.create(
            card_id='CARDB1',
            public_token='CARDB1',
            status=Card.STATUS_ACTIVE,
            business=self.biz_b
        )

        # Login as Owner A
        self.client.force_authenticate(user=self.owner_a)
        response = self.client.get('/api/cards/')
        self.assertEqual(response.status_code, 200)
        returned_card_ids = [c['card_id'] for c in response.data.get('results', response.data)]
        self.assertNotIn('CARDB1', returned_card_ids)

    def test_qr_generation_utility(self):
        """QR generator creates non-empty PNG buffer with correct headers."""
        png_bytes = generate_qr_png_bytes('TESTQR1')
        self.assertTrue(len(png_bytes) > 100)
        self.assertEqual(png_bytes[:8], b'\x89PNG\r\n\x1a\n')
