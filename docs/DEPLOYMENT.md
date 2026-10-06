# Production Deployment Guide

## 1. Architecture Overview
- **Backend**: Gunicorn / Uvicorn with Django running behind Nginx.
- **Frontend**: Static production build (`npm run build`) served via CDN or Nginx.
- **Database**: Managed MySQL 8.0 cluster with read replicas for high-traffic redirects.
- **Media / Storage**: AWS S3 or Cloudflare R2 for storing generated QR code assets.

## 2. Environment Variables Checklist
- `DEBUG=False`
- `SECRET_KEY=<cryptographically-secure-key>`
- `ALLOWED_HOSTS=yourdomain.com,api.yourdomain.com`
- `DB_ENGINE=django.db.backends.mysql`
- `DB_NAME=dynamic_qr_db`
- `DB_USER=<mysql_user>`
- `DB_PASSWORD=<secure_password>`
- `DB_HOST=<db_endpoint>`
- `DB_PORT=3306`
- `PUBLIC_DOMAIN=https://yourdomain.com`

## 3. High-Performance Redirect Optimization
For maximum throughput on `/go/{card_id}`:
1. Cache resolved card destinations in Redis (with TTL = 300s, invalidated upon destination update).
2. Offload scan telemetry events (`ScanEvent`) to Celery worker / asynchronous queue.
3. Keep database indexes optimized on `card_id` and `public_token`.
