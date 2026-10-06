# Product Requirements Document (PRD)

## 1. Executive Summary & Vision
The **Dynamic NFC + QR Business Platform** is an enterprise-grade SaaS solution enabling businesses (restaurants, cafés, salons, hotels, clinics, and retail stores) to deploy permanent physical NFC cards and QR codes while managing their digital destinations dynamically in real time from a centralized backend.

The fundamental architectural principle is:
> **The physical QR code / NFC tag is printed ONLY ONCE and remains PERMANENT. The digital destination behind it is completely DYNAMIC.**

```
+------------------+         +-------------------------------+
|  Physical Card   |         |         Dynamic Backend       |
|  (NFC Tap / QR)  | ------> |  /go/{card_id} Routing Engine |
+------------------+         +---------------+---------------+
                                             |
                         +-------------------+-------------------+
                         |                   |                   |
                         v                   v                   v
                 +---------------+   +---------------+   +---------------+
                 |  Menu View    |   | Review Funnel |   | Business Page |
                 +---------------+   +---------------+   +---------------+
```

## 2. Core Concepts & Business Rules
1. **Permanent Physical Identifiers**:
   - Every physical card possesses a unique alphanumeric Card ID (e.g., `A7K92X`) and an unpredictable public routing token.
   - The QR code contains: `https://YOURDOMAIN.com/go/{card_id}` (or routing token).
   - The NFC chip stores the identical URL.
2. **Dynamic Routing Engine**:
   - When scanned or tapped, `/go/{card_id}` resolves the card, validates state, identifies the current destination configuration, captures analytics, and routes the visitor seamlessly.
3. **Card Reusability & Reassignment**:
   - If a card is returned or changes ownership, administrators can deactivate, scrub past association, return to inventory (`AVAILABLE`), and reassign it to a new business. No past business metadata is ever leaked.
4. **Multi-Tenancy Isolation**:
   - Strict tenant boundary enforcement at the backend API layer. Business owners can only view and manage their assigned businesses, cards, menus, and scan metrics.

## 3. User Roles & Permissions
- **SUPER ADMIN**: Full control over all system assets—business creation, card provisioning, bulk QR code generation, card assignment/reassignment, destination overrides, global analytics, and audit logs.
- **BUSINESS OWNER**: Access to their specific business dashboard—menu management, profile customization, card performance monitoring, and scan analytics.
- **PUBLIC VISITOR / CUSTOMER**: Frictionless, mobile-optimized experience accessing digital menus, reviews, or business landing pages via tap or scan.

## 4. Destination Types Supported
1. `DIGITAL_MENU`: Mobile-first interactive food/service menu categorized with vegetarian/spicy indicators and pricing.
2. `BUSINESS_PROFILE`: Comprehensive landing page featuring hours, contact actions (Call, WhatsApp, Maps), and social links.
3. `REVIEW_PAGE`: High-conversion review routing page pointing directly to verified Google Review destinations without manufacturing fake ratings.
4. `EXTERNAL_URL`: Validated, pre-screened external destination (e.g. customized booking engine, Shopify store).
5. `SOCIAL_PROFILE`: Direct link to Instagram, Facebook, or LinkedIn.
6. `CONTACT_PAGE`: Quick vCard/contact details.
7. `BOOKING_PAGE`: Direct appointment/reservation portal.

## 5. Non-Functional Requirements
- **Performance**: Dynamic redirect endpoint `/go/{card_id}` must respond under 100ms with low overhead.
- **Security**: Open redirect prevention, authenticated state changes, audit trails for administrative operations, and tenant isolation.
- **Reliability & Scalability**: Backed by MySQL indexing on card tokens, business slugs, and scan timestamps.
