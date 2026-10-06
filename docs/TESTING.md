# Testing Guide & Quality Assurance

## 1. Automated Backend Test Suite
Run automated test coverage with:
```bash
python backend/manage.py test apps
```

## 2. Core Functional Test Scenarios Covered
1. **Card Lifecycle & Uniqueness**:
   - Unique alphanumeric `card_id` generation and prevention of duplicates.
   - Initial state validation (`AVAILABLE`).
2. **Card Activation & Dynamic Routing**:
   - Activate card `A7K92X` assigned to `ABC Restaurant` with destination `DIGITAL_MENU`.
   - Access `/go/A7K92X` -> verifies resolution to `/business/abc-restaurant/menu`.
3. **Card Reassignment Principle**:
   - Reassign card `A7K92X` from `ABC Restaurant` to `XYZ Café`.
   - Access `/go/A7K92X` -> verifies resolution to `XYZ Café` without changing physical QR identifier.
4. **Inactive & Suspended Card Guards**:
   - Accessing a `SUSPENDED` card displays appropriate suspension state without leaking tenant internals.
   - Accessing a non-existent card yields HTTP 404 / Card Not Found state.
5. **Multi-Tenant Isolation**:
   - Tenant A cannot query, update, or retrieve Tenant B's cards or menus.
6. **QR Generation Utility**:
   - Validates server-side QR generation output with error-correction parameters.
