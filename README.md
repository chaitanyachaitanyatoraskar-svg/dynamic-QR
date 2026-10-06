# Dynamic NFC + QR Business Platform

An enterprise platform for managing permanent NFC/QR physical cards with dynamic digital destinations.

## Core Product Principle
**The physical QR code / NFC tag is printed ONLY ONCE and remains permanent. The destination behind it is completely dynamic.**

```
PHYSICAL CARD / NFC
        ↓
PERMANENT QR / URL: https://YOURDOMAIN.com/go/A7K92X
        ↓
DYNAMIC ROUTING SYSTEM
        ↓
CONFIGURED DESTINATION (Digital Menu, Business Profile, Google Review, External URL)
```

## Technology Stack
- **Backend**: Python 3.14 / Django 6.1, Django REST Framework, PyMySQL, qrcode, Pillow.
- **Frontend**: React 19, Vite, JavaScript, Material UI (MUI), React Router 7, Axios.
- **Database**: MySQL 8.0 (UTF-8 mb4).
- **Architecture**: Decoupled RESTful API with tenant boundary enforcement.

## Project Structure
```
dynamic-QR/
├── backend/                  # Django project root
│   ├── config/               # Settings, URLs, WSGI/ASGI
│   ├── apps/
│   │   ├── authentication/   # User model, roles & token auth
│   │   ├── businesses/       # Business profiles, isolation logic
│   │   ├── cards/            # Card management, QR generation & routing
│   │   ├── destinations/     # Safe destination resolution
│   │   ├── menus/            # Digital menu, categories & items
│   │   ├── analytics/        # Telemetry & scan event tracking
│   │   └── audit/            # Audit logging system
│   ├── requirements.txt      # Python dependencies
│   └── manage.py
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Public, Admin & Business pages
│   │   ├── layouts/          # Dashboard & Public layouts
│   │   ├── services/         # API client & services
│   │   ├── context/          # Auth & App state contexts
│   │   └── theme/            # Material UI custom theme
│   └── package.json
└── docs/                     # Specifications & technical documentation
    ├── PRD.md
    ├── ARCHITECTURE.md
    ├── DATABASE.md
    ├── API.md
    ├── SECURITY.md
    ├── SETUP.md
    ├── TESTING.md
    └── DEPLOYMENT.md
```

## Quick Start

### 1. Database
```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS dynamic_qr_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 2. Backend
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
python backend/manage.py migrate
python backend/manage.py seed_demo_data
python backend/manage.py runserver 8000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Sample Permanent Card Redirect: `http://localhost:5173/go/A7K92X`
