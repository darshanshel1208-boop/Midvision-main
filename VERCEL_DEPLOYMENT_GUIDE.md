# Beginner-Friendly Vercel Deployment Roadmap for MediVision AI

Welcome! Deploying a full-stack project (Next.js Frontend + FastAPI Python Backend) is easy when broken down step by step.

---

## 🎯 Architecture Overview

- **Frontend (Next.js)** ➔ Deployed on **Vercel** (Free Tier).
- **Backend (FastAPI)** ➔ Deployed on **Render / Railway / Koyeb** (Free Tier).

---

## 🚀 Step-by-Step Deployment Roadmap

### Phase 1: Deploy Backend (FastAPI Python Service)

Since your backend is written in Python (FastAPI + SQLAlchemy + SQLite), deploying it on **Render.com** (Free) is the simplest approach:

1. **Sign Up / Log In to Render**:
   - Go to [render.com](https://render.com) and log in with your GitHub account.

2. **Create New Web Service**:
   - Click **New +** ➔ Select **Web Service**.
   - Connect your GitHub repository: `darshanshel1208-boop/Midvision-main`.

3. **Configure Service Settings**:
   - **Name**: `medivision-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt` (or `pip install fastapi uvicorn sqlalchemy bcrypt pyjwt python-dotenv python-multipart`)
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

4. **Add Environment Variables** (In Render Dashboard under *Environment*):
   - `GEMINI_API_KEY` = *Your Google Gemini API Key*
   - `HOST` = `0.0.0.0`
   - `PORT` = `10000`

5. **Deploy & Copy Backend URL**:
   - Click **Create Web Service**. Once built, Render will give you a live HTTPS URL, e.g.:
     `https://medivision-backend.onrender.com`

---

### Phase 2: Deploy Frontend (Next.js) on Vercel

1. **Log in to Vercel**:
   - Go to [vercel.com](https://vercel.com) and log in with your GitHub account.

2. **Import GitHub Project**:
   - Click **Add New...** ➔ **Project**.
   - Select your repository: `darshanshel1208-boop/Midvision-main`.

3. **Configure Project Settings**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click *Edit* ➔ Select `frontend` directory.

4. **Set Environment Variable**:
   - Under **Environment Variables**, add:
     - **Key**: `NEXT_PUBLIC_API_URL`
     - **Value**: `https://medivision-backend.onrender.com` *(Your live Render backend URL from Phase 1)*

5. **Click Deploy**:
   - Vercel will automatically build your Next.js application and generate your live website URL!
   - Example Live URL: `https://midvision-main.vercel.app`

---

### Phase 3: Verification & Health Check

1. Open your Vercel deployment URL (`https://midvision-main.vercel.app`).
2. Navigate to `/dashboard/presence` to verify doctor presence controls & waitlist allocator.
3. Test uploading a medical report to verify risk-based urgent booking & suggestions.

---

## 🛠️ Quick Troubleshooting Tips for Freshers

- **CORS Errors**: Your FastAPI backend already has `CORSMiddleware` configured with `allow_origins=["*"]` in `app/main.py`, so frontend-to-backend calls will connect seamlessly.
- **Database Persistence**: Render free tier keeps SQLite files active while running. For long-term production persistence, you can attach a free PostgreSQL database on Render with 1 click.
