# API Documentation

## 1. Authentication Endpoints
- `POST /api/auth/login/`: Authenticate user credentials, returns auth token, user details, role, and business associations.
- `POST /api/auth/logout/`: Invalidate authentication token.
- `GET /api/auth/me/`: Retrieve profile of currently authenticated user.

## 2. Dynamic Routing Engine
- `GET /go/{token}/`: The high-performance dynamic routing endpoint.
  - Resolves `Card` by `card_id` or `public_token`.
  - Increments scan counter and logs telemetry.
  - Returns redirect instruction or HTTP 302 to the configured destination.
  - If card is suspended or deactivated, returns status envelope or redirects to appropriate status page.

## 3. Business Management
- `GET /api/businesses/`: List businesses (Admin sees all; Business Owner sees only their owned business).
- `POST /api/businesses/`: Create new business (Super Admin only).
- `GET /api/businesses/{id}/`: Retrieve business profile.
- `PATCH /api/businesses/{id}/`: Update business information.
- `DELETE /api/businesses/{id}/`: Archive or soft-delete business.

## 4. Card Management
- `GET /api/cards/`: List cards (Tenant-filtered).
- `POST /api/cards/`: Provision new card (Super Admin).
- `POST /api/cards/bulk-generate/`: Batch generate cards with sequential/random IDs and QR codes.
- `GET /api/cards/{id}/`: Retrieve card details.
- `POST /api/cards/{id}/activate/`: Activate card, configure purpose, destination type, and destination.
- `POST /api/cards/{id}/suspend/`: Temporarily suspend card without deassociating business.
- `POST /api/cards/{id}/deactivate/`: Deactivate card.
- `POST /api/cards/{id}/reassign/`: Return card to `AVAILABLE` status and reassign to another business.
- `GET /api/cards/{id}/qr/`: Download high-resolution print-ready QR code (PNG / SVG).

## 5. Digital Menus
- `GET /api/menus/`: List menus for business.
- `POST /api/menus/`: Create menu.
- `GET /api/menus/{id}/`: Get full menu with categories and items.
- `POST /api/menus/{id}/categories/`: Add category.
- `POST /api/menus/categories/{cat_id}/items/`: Add item to category.
- `PATCH /api/menus/items/{item_id}/`: Update menu item details, dietary flags, or availability.

## 6. Scan Telemetry & Analytics
- `POST /api/analytics/track/`: Log client-side user interactions (e.g. `MENU_VIEW`, `REVIEW_CLICK`, `CALL_CLICK`).
- `GET /api/analytics/summary/`: Summary metrics (Total scans, unique visitors, action clicks).
- `GET /api/analytics/timeseries/`: Daily/weekly scan aggregation charts.

## 7. Audit Logs
- `GET /api/audit/logs/`: Super Admin audit trail of all operations.
