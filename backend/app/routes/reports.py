from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.core import User, MedicalReport, Prediction
from app.services.auth_service import get_current_user
import json

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.post("/upload")
async def upload_report(
    file: UploadFile = File(...), 
    report_type: str = Form(...),
    description: str = Form(""),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Mock AI Processing based on type (would normally call app/ai_models/)
    result_data = {}
    specialty = "General Physician"
    
    if report_type == "blood":
        result_data = {"risk": "Low", "findings": ["Hemoglobin normal", "WBC normal"], "score": 92}
    elif report_type == "xray":
        result_data = {"risk": "Medium", "findings": ["Mild pleural effusion detected", "No consolidation"], "score": 75}
        specialty = "Pulmonologist"
    elif report_type == "mri":
        result_data = {"risk": "Critical", "findings": ["Hyperintense lesion in temporal lobe", "Mass effect with midline shift", "High probability of Glioblastoma"], "score": 12}
        specialty = "Neurologist"
    elif report_type == "ct":
        result_data = {"risk": "High", "findings": ["Pulmonary nodule detected", "Requires immediate review"], "score": 45}
        specialty = "Oncologist"
    elif report_type == "ecg":
        result_data = {"risk": "Medium", "findings": ["Sinus Tachycardia", "Minor ST elevation"], "score": 70}
        specialty = "Cardiologist"
    else:
        result_data = {"risk": "Unknown", "findings": ["Analysis completed"], "score": 80}
        
    report = MedicalReport(
        user_id=current_user.id,
        report_type=report_type,
        filename=file.filename,
        result_data=json.dumps(result_data)
    )
    db.add(report)
    db.flush()
    
    prediction = Prediction(
        report_id=report.id,
        ai_model=f"mock_{report_type}_model_v1",
        confidence_score=0.92,
        findings=json.dumps(result_data["findings"]),
        risk_level=result_data["risk"],
        recommended_specialty=specialty
    )
    db.add(prediction)
    db.commit()
    db.refresh(report)
    
    return {"message": "Report analyzed successfully", "report_id": report.id, "result": result_data, "recommended_specialty": specialty}

@router.get("/")
def get_reports(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reports = db.query(MedicalReport).filter(MedicalReport.user_id == current_user.id).order_by(MedicalReport.created_at.desc()).all()
    return [{"id": r.id, "type": r.report_type, "filename": r.filename, "date": r.created_at.isoformat(), "result": json.loads(r.result_data) if r.result_data else {}} for r in reports]

@router.post("/ocr")
async def extract_prescription(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.models.core import Prescription, Medicine
    
    # Mock OCR Extraction
    extracted_medicines = [
        {"name": "Amoxicillin 500mg", "dosage": "1 tablet", "schedule": "1-0-1 (Morning & Night)", "duration": "5 Days"},
        {"name": "Paracetamol 650mg", "dosage": "1 tablet", "schedule": "1-1-1 (After meals)", "duration": "3 Days"},
        {"name": "Cetirizine 10mg", "dosage": "1 tablet", "schedule": "0-0-1 (Night)", "duration": "5 Days"}
    ]
    
    # Save to DB
    prescription = Prescription(user_id=current_user.id, filename=file.filename)
    db.add(prescription)
    db.flush()
    
    for med in extracted_medicines:
        medicine = Medicine(
            prescription_id=prescription.id,
            name=med["name"],
            dosage=med["dosage"],
            schedule=med["schedule"],
            duration=med["duration"]
        )
        db.add(medicine)
        
    db.commit()
    db.refresh(prescription)
    
    return {
        "message": "Prescription extracted successfully",
        "prescription_id": prescription.id,
        "medicines": extracted_medicines
    }
