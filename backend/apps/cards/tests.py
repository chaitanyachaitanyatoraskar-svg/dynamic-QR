from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from apps.authentication.models import User
from apps.businesses.models import Business
from apps.cards.models import Card, ActivationSession

class MergedAdminFirstScanActivationTestCase(TestCase):
    """
    Mandatory Acceptance Tests for Merged Admin Activation + First-Scan Activation Model.
    """

    def setUp(self):
        self.client = APIClient()

        # Admin user
        self.admin = User.objects.create_superuser(
            username='real_admin',
            email='admin@test.local',
            password='securepassword123',
            role=User.ROLE_SUPER_ADMIN
        )

        # Client / Business
        self.client_a = Business.objects.create(
            name='Client Alpha',
            slug='client-alpha',
            status=Business.STATUS_ACTIVE
        )

    def test_complete_merged_activation_lifecycle(self):
        """
        SECTION 20 ACCEPTANCE TEST:
        1. Create card A7K92X (UNACTIVATED).
        2. Anonymous scan -> QR NOT ACTIVATED (no destination, no activation).
        3. Admin logs in -> creates activation session (WAITING_FOR_SCAN).
        4. Admin physically scans /q/A7K92X -> SCAN_VERIFIED.
        5. Admin activates with destination https://client-a.com -> Card becomes ACTIVE.
        6. Person B scans /q/A7K92X -> HTTP 302 to https://client-a.com (no admin/activation UI).
        7. Person C scans /q/A7K92X -> HTTP 302 to https://client-a.com.
        8. Destination change to https://client-b.com without re-scan -> redirects to https://client-b.com.
        """
        card_id = 'A7K92X'
        card = Card.objects.create(
            card_id=card_id,
            public_token=card_id,
            status=Card.STATUS_UNACTIVATED
        )

        # Step 2: Anonymous scan of unactivated card
        url = reverse('qr-redirect', kwargs={'token': card_id})
        anon_resp = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(anon_resp.status_code, 403)
        self.assertEqual(anon_resp.data['status'], 'UNACTIVATED')
        self.assertEqual(anon_resp.data['message'], 'This QR code has not been activated yet.')

        # Step 3: Admin starts activation session
        self.client.force_authenticate(user=self.admin)
        start_session_resp = self.client.post('/api/cards/activation-sessions/start/')
        self.assertEqual(start_session_resp.status_code, 201)
        session_id = start_session_resp.data['id']
        session_token = start_session_resp.data['session_token']
        self.assertEqual(start_session_resp.data['status'], 'WAITING_FOR_SCAN')

        # Step 4: Admin scans physical QR (associated via active admin session)
        scan_resp = self.client.get(f"{url}?session_token={session_token}", HTTP_ACCEPT='application/json')
        self.assertEqual(scan_resp.status_code, 200)
        self.assertEqual(scan_resp.data['status'], 'SCAN_VERIFIED')
        self.assertEqual(scan_resp.data['card_id'], card_id)

        # Verify session state in DB
        session = ActivationSession.objects.get(pk=session_id)
        self.assertEqual(session.status, ActivationSession.STATUS_SCAN_VERIFIED)
        self.assertEqual(session.card, card)
        self.assertIsNotNone(session.scanned_at)

        # Step 5: Admin completes activation with destination
        complete_resp = self.client.post(f"/api/cards/activation-sessions/{session_id}/complete/", {
            'business_id': self.client_a.id,
            'destination_url': 'https://client-a.com',
            'purpose': 'Table NFC Tag'
        }, format='json')
        self.assertEqual(complete_resp.status_code, 200)

        card.refresh_from_db()
        self.assertEqual(card.status, Card.STATUS_ACTIVE)
        self.assertEqual(card.destination_url, 'https://client-a.com')
        self.assertEqual(card.activated_by, self.admin)
        self.assertIsNotNone(card.activated_at)

        # Step 6: Person B scans (anonymous user) -> direct HTTP 302 to https://client-a.com
        self.client.logout()
        person_b_resp = self.client.get(url)
        self.assertEqual(person_b_resp.status_code, 302)
        self.assertEqual(person_b_resp['Location'], 'https://client-a.com')

        # Step 7: Person C scans -> direct HTTP 302 to https://client-a.com
        person_c_resp = self.client.get(url)
        self.assertEqual(person_c_resp.status_code, 302)
        self.assertEqual(person_c_resp['Location'], 'https://client-a.com')

        # Step 8: Destination change by Admin without requiring re-scan
        self.client.force_authenticate(user=self.admin)
        dest_change_resp = self.client.post(f"/api/cards/{card.id}/update-destination/", {
            'destination_url': 'https://client-b.com'
        }, format='json')
        self.assertEqual(dest_change_resp.status_code, 200)

        card.refresh_from_db()
        self.assertEqual(card.destination_url, 'https://client-b.com')

        # Future scan redirects to updated destination
        self.client.logout()
        updated_scan = self.client.get(url)
        self.assertEqual(updated_scan.status_code, 302)
        self.assertEqual(updated_scan['Location'], 'https://client-b.com')

    def test_anonymous_user_cannot_activate_or_claim_qr(self):
        """
        SECTION 21 SECURITY ACCEPTANCE TEST:
        An anonymous user cannot activate, assign destination, or claim ownership.
        """
        card = Card.objects.create(
            card_id='B81PQ4',
            public_token='B81PQ4',
            status=Card.STATUS_UNACTIVATED
        )

        # Anonymous cannot complete any activation
        url = reverse('qr-redirect', kwargs={'token': 'B81PQ4'})
        resp = self.client.get(url, HTTP_ACCEPT='application/json')
        self.assertEqual(resp.status_code, 403)
        self.assertEqual(resp.data['status'], 'UNACTIVATED')

        card.refresh_from_db()
        self.assertEqual(card.status, Card.STATUS_UNACTIVATED)
        self.assertEqual(card.destination_url, '')
