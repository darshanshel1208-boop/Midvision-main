# MediVision AI — Complete Deployment Guide

This guide provides step-by-step instructions to deploy **MediVision AI** to production across cloud hosting platforms or containerized servers.

---

## 🏗 System Architecture Overview

```
 ┌───────────────────────────────────────┐
 │       Next.js Frontend (Vercel)       │
 └───────────────────┬───────────────────┘
                     │ HTTPS / REST
 ┌───────────────────▼───────────────────┐
 │     FastAPI Backend (Render / GCP)    │
 └───────────────────┬───────────────────┘
                     │ SQLAlchemy ORM
 ┌───────────────────▼───────────────────┐
 │   PostgreSQL Database (Supabase)      │
 └───────────────────────────────────────┘
```

---

## 🚀 Option 1: Cloud Deployment (Recommended)

### Step 1: Deploy PostgreSQL Database (Supabase or Render)

1. Create a free account on **[Supabase](https://supabase.com)** or **[Render](https://render.com)**.
2. Create a new **PostgreSQL Database**.
3. Copy your database connection string:
   ```env
   DATABASE_URL=postgresql://postgres:yourpassword@db.xxxx.supabase.co:5432/postgres
   ```

---

### Step 2: Deploy FastAPI Backend (Render / Railway)

1. Create a new **Web Service** on **[Render](https://render.com)** or **[Railway](https://railway.app)** linked to your GitHub repository.
2. Set the root directory to `backend`.
3. Set the build command:
   ```bash
   pip install -r requirements.txt
   ```
4. Set the start command:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
5. Configure Environment Variables:
   | Variable | Description / Value |
   |---|---|
   | `DATABASE_URL` | Your PostgreSQL Connection URL from Step 1 |
   | `GEMINI_API_KEY` | Your Google Gemini API Key |
   | `SECRET_KEY` | Secret string for JWT generation |
   | `ENVIRONMENT` | `production` |

6. Run initial database setup once deployed:
   ```bash
   python reset_db.py
   ```

---

### Step 3: Deploy Next.js Frontend (Vercel)

1. Import your project into **[Vercel](https://vercel.com)**.
2. Set Root Directory to `frontend`.
3. Set Environment Variable:
   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://your-backend-render-url.onrender.com` |
4. Click **Deploy**. Vercel will automatically build and host your Next.js application with global CDN SSL.

---

## 🐳 Option 2: Docker Compose Deployment (AWS EC2 / DigitalOcean / VPS)

If hosting on a single Linux server, use Docker Compose.

### Step 1: Create `docker-compose.yml` in Root Directory

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: medivision_db
    environment:
      POSTGRES_USER: medivision
      POSTGRES_PASSWORD: secretpassword
      POSTGRES_DB: medivision_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    container_name: medivision_backend
    environment:
      - DATABASE_URL=postgresql://medivision:secretpassword@postgres:5432/medivision_db
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - SECRET_KEY=supersecretkey_production
    ports:
      - "8000:8000"
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    container_name: medivision_frontend
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  pgdata:
```

### Step 2: Create `Dockerfile` in `backend/`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Step 3: Create `Dockerfile` in `frontend/`

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "start"]
```

### Step 4: Run Containers

```bash
docker-compose up -d --build
```

---

## 🔍 Pre-Deployment Checklist

- [x] All 21 Next.js routes pass `npm run build` without TypeScript errors.
- [x] Pytest backend suite passes 100%.
- [x] Environment variable `GEMINI_API_KEY` configured for vision analysis & AI chatbot.
- [x] CORS configuration in `backend/app/main.py` updated to accept your production domain.
- [x] PostgreSQL database initialized with `reset_db.py`.

---

## 🛠 Local Production Test Commands

To test your production builds locally before pushing to cloud servers:

**Backend:**
```bash
cd backend
.\venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8000
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```
