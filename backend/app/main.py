from fastapi import FastAPI, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database.database import engine, Base, get_db
from app.routes import auth, reports, appointments, doctors, notifications, presence
from app.models.core import User
from app.services.auth_service import get_current_user
import random

# Ensure all tables are created (useful if someone doesn't run reset_db.py)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MediVision AI Multi-Modal Medical Platform API",
    description="Backend API for MediVision AI Platform with SIH1383 Smart Appointment Allocation & Multi-Sensor Doctor Presence",
    version="2.0.0"
)

# Enable CORS for Frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(appointments.router)
app.include_router(doctors.router)
app.include_router(notifications.router)
app.include_router(presence.router)


# Standalone endpoints that don't need a full router yet
from app.services.gemini_service import chat_with_medical_ai

@app.post("/api/chatbot/message")
def chat_message(message: str = Form(...)):
    reply = chat_with_medical_ai(message)
    return {"reply": reply}

@app.get("/")
def read_root():
    return {
        "status": "ok",
        "message": "Welcome to MediVision AI Multi-Modal Medical Platform API (SIH1383)",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
