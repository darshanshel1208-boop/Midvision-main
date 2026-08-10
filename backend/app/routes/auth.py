from fastapi import APIRouter, Depends, HTTPException, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.core import User, Patient
from app.services.auth_service import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register")
def register(email: str = Form(...), password: str = Form(...), full_name: str = Form(""), db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(password)
    user = User(email=email, hashed_password=hashed_password, full_name=full_name)
    db.add(user)
    db.flush() # get user ID
    
    # Also create a patient profile by default for new registrations
    patient = Patient(user_id=user.id)
    db.add(patient)
    
    db.commit()
    db.refresh(user)
    
    token = create_access_token(user.email)
    return {"access_token": token, "token_type": "bearer", "user": {"email": user.email, "full_name": user.full_name}}

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    token = create_access_token(user.email)
    return {"access_token": token, "token_type": "bearer", "user": {"email": user.email, "full_name": user.full_name}}

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {"email": current_user.email, "full_name": current_user.full_name, "role": current_user.role}
