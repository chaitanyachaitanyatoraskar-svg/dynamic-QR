from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.authentication.models import User
from apps.businesses.models import Business, BusinessUser
from apps.cards.models import Card, CardAssignment
from apps.cards.qr_utils import attach_qr_to_card
from apps.menus.models import Menu, MenuCategory, MenuItem
from apps.analytics.models import ScanEvent
from apps.audit.models import AuditLog

class Command(BaseCommand):
    help = 'Seeds database with realistic demo businesses, cards, menus, and users'

    def handle(self, *args, **options):
        self.stdout.write("Seeding demo data into MySQL database...")

        # 1. Users
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@dynamicqr.local',
                'first_name': 'Platform',
                'last_name': 'Admin',
                'role': User.ROLE_SUPER_ADMIN,
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS("Created Super Admin: admin / admin123"))

        owner_user, created = User.objects.get_or_create(
            username='restaurant_owner',
            defaults={
                'email': 'owner@abcrestaurant.local',
                'first_name': 'Chaitanya',
                'last_name': 'Verma',
                'role': User.ROLE_BUSINESS_OWNER,
                'phone': '+15552345678'
            }
        )
        if created:
            owner_user.set_password('owner123')
            owner_user.save()
            self.stdout.write(self.style.SUCCESS("Created Business Owner: restaurant_owner / owner123"))

        # 2. Businesses
        abc_restaurant, _ = Business.objects.get_or_create(
            slug='abc-restaurant',
            defaults={
                'name': 'ABC Restaurant',
                'description': 'Authentic Indo-Chinese cuisine, sizzling starters, and artisanal beverages crafted with fresh ingredients.',
                'phone': '+1 (555) 234-5678',
                'email': 'contact@abcrestaurant.com',
                'whatsapp': '15552345678',
                'address': '742 Evergreen Terrace, Downtown culinary district',
                'city': 'San Francisco',
                'state': 'CA',
                'country': 'USA',
                'latitude': 37.7749,
                'longitude': -122.4194,
                'website': 'https://abcrestaurant.example.com',
                'instagram': 'abcrestaurant',
                'facebook': 'facebook.com/abcrestaurant',
                'google_maps_url': 'https://maps.google.com/?q=ABC+Restaurant',
                'google_review_url': 'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4',
                'opening_hours': {
                    'Monday - Thursday': '11:30 AM - 10:00 PM',
                    'Friday - Saturday': '11:30 AM - 11:30 PM',
                    'Sunday': '12:00 PM - 9:30 PM'
                },
                'status': Business.STATUS_ACTIVE
            }
        )

        BusinessUser.objects.get_or_create(
            user=owner_user,
            business=abc_restaurant,
            defaults={'role': BusinessUser.ROLE_OWNER}
        )

        xyz_cafe, _ = Business.objects.get_or_create(
            slug='xyz-cafe',
            defaults={
                'name': 'XYZ Café',
                'description': 'Specialty micro-roasted single-origin coffees and European pastries in a warm, relaxed atmosphere.',
                'phone': '+1 (555) 345-6789',
                'email': 'hello@xyzcafe.com',
                'whatsapp': '15553456789',
                'address': '108 Market Street',
                'city': 'San Francisco',
                'state': 'CA',
                'country': 'USA',
                'website': 'https://xyzcafe.example.com',
                'status': Business.STATUS_ACTIVE
            }
        )

        urban_salon, _ = Business.objects.get_or_create(
            slug='urban-salon',
            defaults={
                'name': 'Urban Salon & Spa',
                'description': 'Award-winning hair styling, organic color treatments, and restorative therapeutic spa rituals.',
                'phone': '+1 (555) 456-7890',
                'email': 'appointments@urbansalon.com',
                'whatsapp': '15554567890',
                'address': '450 Post Street, Suite 300',
                'city': 'San Francisco',
                'state': 'CA',
                'country': 'USA',
                'website': 'https://urbansalon.example.com',
                'status': Business.STATUS_ACTIVE
            }
        )

        # 3. Cards
        # Card 1: A7K92X -> ABC Restaurant -> Digital Menu
        card1, created = Card.objects.get_or_create(
            card_id='A7K92X',
            defaults={
                'public_token': 'A7K92X',
                'status': Card.STATUS_ACTIVE,
                'business': abc_restaurant,
                'purpose': 'Table QR Digital Menu',
                'destination_type': Card.DEST_DIGITAL_MENU,
                'activation_date': timezone.now(),
                'scan_count': 1284,
                'notes': 'Printed on matte brushed aluminum card deployed on Table 12'
            }
        )
        if not card1.qr_image:
            attach_qr_to_card(card1)
            card1.save()

        CardAssignment.objects.get_or_create(
            card=card1,
            business=abc_restaurant,
            defaults={'assigned_by': admin_user, 'notes': 'Initial deployment to ABC Restaurant'}
        )

        # Card 2: B81PQ4 -> Unassigned inventory
        card2, _ = Card.objects.get_or_create(
            card_id='B81PQ4',
            defaults={
                'public_token': 'B81PQ4',
                'status': Card.STATUS_AVAILABLE,
                'business': None,
                'purpose': 'Unassigned Inventory',
                'scan_count': 0,
                'notes': 'Ready in batch #104 warehouse inventory'
            }
        )
        if not card2.qr_image:
            attach_qr_to_card(card2)
            card2.save()

        # Card 3: C52LM8 -> Urban Salon -> Business Profile
        card3, _ = Card.objects.get_or_create(
            card_id='C52LM8',
            defaults={
                'public_token': 'C52LM8',
                'status': Card.STATUS_ACTIVE,
                'business': urban_salon,
                'purpose': 'Reception Desk Tap Card',
                'destination_type': Card.DEST_BUSINESS_PROFILE,
                'activation_date': timezone.now(),
                'scan_count': 342,
                'notes': 'Front desk NFC smart stand'
            }
        )
        if not card3.qr_image:
            attach_qr_to_card(card3)
            card3.save()

        # 4. Digital Menu for ABC Restaurant
        menu, _ = Menu.objects.get_or_create(
            business=abc_restaurant,
            title='Dine-in Menu',
            defaults={'description': 'Freshly prepared Indo-Chinese delicacies', 'is_active': True}
        )

        starters, _ = MenuCategory.objects.get_or_create(
            menu=menu,
            name='Starters',
            defaults={'display_order': 1}
        )
        MenuItem.objects.get_or_create(
            category=starters,
            name='Spring Rolls',
            defaults={'description': 'Crispy golden rolls filled with shredded seasonal vegetables and glass noodles.', 'price': 8.50, 'is_vegetarian': True, 'display_order': 1}
        )
        MenuItem.objects.get_or_create(
            category=starters,
            name='Paneer Chilli (Dry)',
            defaults={'description': 'Wok-tossed cottage cheese cubes with bell peppers, green chilies, and tangy soy glaze.', 'price': 11.00, 'is_vegetarian': True, 'is_spicy': True, 'display_order': 2}
        )
        MenuItem.objects.get_or_create(
            category=starters,
            name='Chicken Manchurian',
            defaults={'description': 'Tender fried chicken bites simmered in a scallion, ginger, and garlic coriander glaze.', 'price': 12.50, 'is_vegetarian': False, 'is_spicy': True, 'display_order': 3}
        )

        main_course, _ = MenuCategory.objects.get_or_create(
            menu=menu,
            name='Main Course',
            defaults={'display_order': 2}
        )
        MenuItem.objects.get_or_create(
            category=main_course,
            name='Veg Hakka Noodles',
            defaults={'description': 'Classic wok-tossed noodles with julienned vegetables and aromatic sesame chili oil.', 'price': 13.00, 'is_vegetarian': True, 'display_order': 1}
        )
        MenuItem.objects.get_or_create(
            category=main_course,
            name='Schezwan Fried Rice',
            defaults={'description': 'Fragrant basmati rice tossed with house-made fiery Sichuan pepper paste and spring onions.', 'price': 14.00, 'is_vegetarian': True, 'is_spicy': True, 'display_order': 2}
        )
        MenuItem.objects.get_or_create(
            category=main_course,
            name='Crispy Chilli Chicken Gravy',
            defaults={'description': 'Boneless chicken cubes in a rich dark soy gravy, garnished with toasted garlic.', 'price': 15.50, 'is_vegetarian': False, 'is_spicy': True, 'display_order': 3}
        )

        drinks, _ = MenuCategory.objects.get_or_create(
            menu=menu,
            name='Drinks & Beverages',
            defaults={'display_order': 3}
        )
        MenuItem.objects.get_or_create(
            category=drinks,
            name='Mexican Coke (Chilled)',
            defaults={'description': 'Classic glass bottle with real cane sugar.', 'price': 3.50, 'is_vegetarian': True, 'display_order': 1}
        )
        MenuItem.objects.get_or_create(
            category=drinks,
            name='Fresh Mint Lemon Soda',
            defaults={'description': 'Freshly squeezed lime juice, mint leaves, rock salt, and sparkling soda.', 'price': 4.50, 'is_vegetarian': True, 'display_order': 2}
        )
        MenuItem.objects.get_or_create(
            category=drinks,
            name='Cold Coffee with Vanilla Ice Cream',
            defaults={'description': 'Rich espresso blended with chilled milk and topped with artisanal vanilla bean scoop.', 'price': 6.00, 'is_vegetarian': True, 'display_order': 3}
        )

        # 5. Analytics & Audit entries
        ScanEvent.objects.get_or_create(
            card=card1,
            business=abc_restaurant,
            event_type=ScanEvent.EVENT_MENU_VIEW,
            defaults={'destination': Card.DEST_DIGITAL_MENU, 'device_type': 'MOBILE'}
        )
        ScanEvent.objects.get_or_create(
            card=card1,
            business=abc_restaurant,
            event_type=ScanEvent.EVENT_REVIEW_CLICK,
            defaults={'destination': Card.DEST_REVIEW_PAGE, 'device_type': 'MOBILE'}
        )

        AuditLog.objects.get_or_create(
            action=AuditLog.ACTION_CARD_ACTIVATED,
            card=card1,
            business=abc_restaurant,
            defaults={'user': admin_user, 'details': {'card_id': 'A7K92X', 'destination': 'DIGITAL_MENU'}}
        )

        self.stdout.write(self.style.SUCCESS("Demo data successfully loaded!"))
