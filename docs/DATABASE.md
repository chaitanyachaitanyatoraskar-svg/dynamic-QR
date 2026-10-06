# Database Schema & Entity Relationships

## 1. Schema Overview

The database is built on MySQL using foreign key constraints and indexed lookup tokens.

```mermaid
erDiagram
    User ||--o{ BusinessUser : "belongs to"
    Business ||--o{ BusinessUser : "has users"
    Business ||--o{ Card : "assigned"
    Business ||--o{ Menu : "owns"
    Business ||--o{ ScanEvent : "tracks"
    Menu ||--o{ MenuCategory : "contains"
    MenuCategory ||--o{ MenuItem : "contains"
    Card ||--o{ CardAssignment : "history"
    Card ||--o{ ScanEvent : "logs"
    User ||--o{ AuditLog : "initiates"

    User {
        int id PK
        string username UK
        string email UK
        string role "SUPER_ADMIN | BUSINESS_OWNER | STAFF"
        string phone
        datetime date_joined
    }

    Business {
        int id PK
        string name
        string slug UK
        string status "ACTIVE | SUSPENDED | ARCHIVED"
        string phone
        string email
        string whatsapp
        text address
        string city
        string website
        string google_review_url
        json opening_hours
        datetime created_at
    }

    Card {
        int id PK
        string card_id UK
        string public_token UK
        string status "AVAILABLE | RESERVED | ACTIVE | SUSPENDED | DEACTIVATED | LOST | RETIRED"
        int business_id FK
        string purpose "MENU | PROFILE | REVIEWS | CUSTOM"
        string destination_type "BUSINESS_PROFILE | DIGITAL_MENU | REVIEW_PAGE | EXTERNAL_URL"
        string destination_url
        string qr_image
        datetime activation_date
        datetime deactivation_date
        int scan_count
        datetime last_scanned_at
    }

    CardAssignment {
        int id PK
        int card_id FK
        int business_id FK
        string assigned_by
        datetime assigned_at
        datetime unassigned_at
        text notes
    }

    ScanEvent {
        int id PK
        int card_id FK
        int business_id FK
        string event_type "CARD_VISIT | QR_SCAN | NFC_TAP | MENU_VIEW | REVIEW_CLICK | CALL_CLICK | WHATSAPP_CLICK | DIRECTIONS_CLICK"
        string destination
        text user_agent
        string device_type
        string browser
        string operating_system
        string referrer
        datetime timestamp
    }

    AuditLog {
        int id PK
        int user_id FK
        string action
        int business_id FK
        int card_id FK
        json details
        datetime timestamp
    }
```

## 2. Key Constraints & Data Integrity
1. **Uniqueness**:
   - `cards_card.card_id`: Unique alphanumeric ID printed on physical card.
   - `cards_card.public_token`: Unique routing token.
   - `businesses_business.slug`: Unique URL slug.
2. **Safe Card Reassignment**:
   - Card foreign key to `Business` is nullable (`on_delete=models.SET_NULL`).
   - When a card is reassigned, old assignments are recorded in `CardAssignment`, and previous business details are never exposed to future assignees.
3. **Auditing**:
   - `AuditLog` records state transitions (`CARD_ACTIVATED`, `CARD_SUSPENDED`, `CARD_REASSIGNED`).
