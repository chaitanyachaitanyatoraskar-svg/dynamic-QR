# System Architecture Document

## 1. High-Level Architecture

The Dynamic NFC + QR Business Platform follows a decoupled modern architecture with a high-throughput Python / Django REST Framework backend and a modern React Vite frontend.

```
+------------------------------------------------------------------------+
|                          Physical Layer                                |
|   - NFC Tag (URL encoded: https://domain.com/go/{card_id})             |
|   - QR Code (High error-correction, printed once)                      |
+-----------------------------------+------------------------------------+
                                    |
                                    v
+------------------------------------------------------------------------+
|                       Dynamic Routing Engine                           |
|                       GET /go/{card_id}                                |
|   1. Token Validation & Sanitization                                   |
|   2. Database Index Lookup (Card.public_token / card_id)               |
|   3. State Machine Check (ACTIVE vs SUSPENDED vs DEACTIVATED)          |
|   4. Asynchronous / Non-blocking Scan Event Telemetry Recording        |
|   5. Destination Resolution (Internal vs Validated External)          |
+-----------------------------------+------------------------------------+
                                    |
            +-----------------------+-----------------------+
            |                                               |
            v                                               v
+-----------------------+                       +-----------------------+
|  Internal Destination |                       | External Destination  |
|  - Digital Menu       |                       | - Validated URL       |
|  - Business Profile   |                       | - Google Review Link  |
|  - Review Landing     |                       | - Booking URL         |
+-----------------------+                       +-----------------------+
```

## 2. Component Breakdown

### Backend (Django + Django REST Framework)
- `apps.authentication`: Custom user model, token-based authentication, and role authorization policies (`SuperAdminPermission`, `IsBusinessOwnerOrAdmin`).
- `apps.businesses`: Business entity, profile configuration, operating hours, geolocation, and multi-tenant isolation handlers.
- `apps.cards`: Card lifecycle engine, state transitions (`AVAILABLE`, `RESERVED`, `ACTIVE`, `SUSPENDED`, `DEACTIVATED`, `LOST`, `RETIRED`), QR code generation utility with Python `qrcode` and `Pillow`.
- `apps.destinations`: Destination resolution logic, validation schemas to eliminate open redirect vectors.
- `apps.menus`: Hierarchical digital menu system (Menus -> Categories -> Items) with dietary flags and ordering.
- `apps.analytics`: Device, browser, and event telemetry recorder (`CARD_VISIT`, `MENU_VIEW`, `REVIEW_CLICK`, `CALL_CLICK`, `WHATSAPP_CLICK`, `DIRECTIONS_CLICK`).
- `apps.audit`: Append-only audit logger capturing admin and tenant modifications.

### Frontend (React + Vite + Material UI)
- **Public Dynamic Redirection & Customer Experience**: Mobile-first views for `/go/:cardId`, `/business/:slug`, `/business/:slug/menu`, and `/business/:slug/reviews`.
- **Admin Dashboard**: Card inventory management, business provisioning, bulk card generator with ZIP export, system-wide analytics, and audit logs.
- **Business Dashboard**: Tenant-scoped dashboard for menu management, profile details, card tracking, and scan analytics.
- **Responsive Theme System**: Cohesive typography, dark/light palette support, and mobile optimization.

## 3. Database Layer
- Storage: MySQL with `utf8mb4_unicode_ci` encoding.
- Critical Indexing:
  - `cards_card.card_id` (Unique, B-Tree index)
  - `cards_card.public_token` (Unique, B-Tree index)
  - `cards_card.status` (Index)
  - `businesses_business.slug` (Unique, B-Tree index)
  - `analytics_scanevent.timestamp` (Index)
  - `analytics_scanevent.business_id` (Foreign key index)
