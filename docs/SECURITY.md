# Security Architecture & Policies

## 1. Multi-Tenant Isolation
- Tenant boundary enforcement occurs at the database query set level.
- `BusinessUser` relationship strictly scopes every query when accessed by a `BUSINESS_OWNER`.
- Business owners cannot query, manipulate, or receive card IDs, menus, or analytics belonging to another tenant.

## 2. Open Redirect Prevention
- Public routing URLs (`/go/{card_id}`) do **not** accept open query parameters such as `?url=https://attacker.com`.
- Destinations are strictly pulled from database records configured by authenticated users.
- External URLs (`EXTERNAL_URL`) are sanitized against strict scheme whitelists (`http://`, `https://`) and validated upon creation.

## 3. Opaque Public Identifiers
- Internal auto-increment database primary keys (`id: 1, 2, 3`) are never exposed in routing URLs.
- Routing relies solely on immutable alphanumeric `card_id` and random cryptographic `public_token` values.

## 4. Authentication & Password Security
- Passwords hashed using standard Django PBKDF2 with SHA256 (or Argon2).
- API authentication tokens are stored securely and invalidated upon logout.
- Super Admin rights are guarded via custom permissions.

## 5. Audit Logging
- All state-altering administrative actions (`CARD_ACTIVATED`, `CARD_SUSPENDED`, `CARD_DEACTIVATED`, `CARD_REASSIGNED`) are recorded in an append-only `AuditLog` table with user attribution, IP, and timestamp.
