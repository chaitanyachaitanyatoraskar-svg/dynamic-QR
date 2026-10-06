# Local Development & Setup Guide

## Prerequisites
- Python 3.10+ (Tested on Python 3.14)
- Node.js 18+ & npm 9+
- MySQL 8.0+

## 1. Database Setup (MySQL)
Ensure MySQL is running on your machine:
```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS dynamic_qr_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

## 2. Backend Setup
1. Create and activate a Python virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate
```
2. Install Python dependencies:
```bash
pip install -r backend/requirements.txt
```
3. Configure environment variables in `backend/.env` (or copy from `backend/.env.example`).
4. Run database migrations:
```bash
python backend/manage.py migrate
```
5. Seed demo data (optional):
```bash
python backend/manage.py seed_demo_data
```
6. Start the Django development server:
```bash
python backend/manage.py runserver 8000
```

## 3. Frontend Setup
1. Navigate to frontend directory and install dependencies:
```bash
cd frontend
npm install
```
2. Start the Vite development server:
```bash
npm run dev
```
The frontend will be available at `http://localhost:5173`.
The backend API is hosted at `http://localhost:8000`.
