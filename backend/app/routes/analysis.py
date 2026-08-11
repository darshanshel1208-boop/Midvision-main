from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Body
from typing import Dict, Any, Optional
from pydantic import BaseModel

from app.config import settings
from app.services.blood_report_service import analyze_blood_parameters
from app.services.gemini_service import (
    verify_gemini_api_key,
    analyze_medical_image_with_ai,
    analyze_prescription_with_ai,
    summarize_medical_pdf_or_text
)
from app.models.model_loader import model_registry

router = APIRouter()

class BloodReportRequest(BaseModel):
    parameters: Dict[str, float]

class KeyVerifyRequest(BaseModel):
    api_key: Optional[str] = None

class TextSummaryRequest(BaseModel):
    text: str

@router.get("/health")
def health_check():
    """
    Health check endpoint returning system status, API key verification, and pre-trained model status.
    """
    key_status = verify_gemini_api_key()
    models_status = model_registry.get_status()
    
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "api_key_status": key_status,
        "pretrained_models": models_status
    }

@router.post("/verify-key")
def verify_key_endpoint(req: KeyVerifyRequest = Body(...)):
    """
    Verifies a Gemini API key.
    """
    return verify_gemini_api_key(req.api_key)

@router.post("/analyze/blood-report")
def analyze_blood_report(req: BloodReportRequest):
    """
    Analyzes numerical blood parameters (CBC, LFT, KFT, Lipid Profile, HbA1c, Thyroid)
    against reference ranges, returning abnormal flags, risk scores, and specialist recommendations.
    """
    if not req.parameters:
        raise HTTPException(status_code=400, detail="No blood parameters provided.")
    return analyze_blood_parameters(req.parameters)

@router.post("/analyze/imaging")
async def analyze_medical_imaging(
    file: UploadFile = File(...),
    image_type: str = Form("chest_xray") # chest_xray, brain_mri, ct_scan, ecg
):
    """
    Analyzes medical imaging (Chest X-ray, MRI scan, CT scan, ECG) for abnormalities,
    suspicious regions, risk level, and clinical recommendations.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be a valid image format (JPEG/PNG/DICOM convert).")
        
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image file received.")
        
    return analyze_medical_image_with_ai(image_bytes, image_type)

@router.post("/analyze/prescription")
async def analyze_prescription(
    file: UploadFile = File(...)
):
    """
    Extracts prescription details (OCR, medications, dosage, frequency, warnings) from prescription image.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Prescription file must be an image.")
        
    image_bytes = await file.read()
    return analyze_prescription_with_ai(image_bytes)

@router.post("/analyze/pdf-summary")
def summarize_pdf_text(req: TextSummaryRequest):
    """
    Summarizes medical report text / medical PDF contents.
    """
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text content cannot be empty.")
    return summarize_medical_pdf_or_text(req.text)
