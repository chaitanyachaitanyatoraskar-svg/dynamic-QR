# Changelog

All notable changes to the Dynamic NFC + QR Business Platform project will be documented in this file.

## [Phase 1 Foundation] - 2026-10-06
### Added
- Comprehensive architecture and requirements documentation in `docs/` (`PRD.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `SECURITY.md`, `SETUP.md`, `TESTING.md`, `DEPLOYMENT.md`).
- Django project structure configured with MySQL support (`apps.authentication`, `apps.businesses`, `apps.cards`, `apps.destinations`, `apps.menus`, `apps.analytics`, `apps.audit`).
- Core data models: User, Business, BusinessUser, Card, CardAssignment, Menu, MenuCategory, MenuItem, ScanEvent, AuditLog.
- High-performance `/go/{token}` dynamic redirect engine supporting permanent physical cards with dynamic destination routing.
- Python QR generation utility with high error correction and print-ready downloads.
- React + Vite + Material UI frontend foundation with responsive layout, auth context, dashboard routing, and mobile-first customer pages.
- Demo data seeder (`seed_demo_data`) with ABC Restaurant, XYZ Café, Urban Salon, and sample permanent cards (`A7K92X`, `B81PQ4`, `C52LM8`).
- Automated test suite covering card uniqueness, activation, reassignment, multi-tenancy isolation, and dynamic routing resolution.
