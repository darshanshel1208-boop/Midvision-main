import io
import json
import logging
try:
    from PIL import Image
except ImportError:
    Image = None
from app.config import settings

logger = logging.getLogger("medivision.gemini")

def get_gemini_client():
    """
    Initializes and returns Google GenAI client if API key is available.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key or api_key == "your_gemini_api_key_here":
        return None
    try:
        from google import genai
        return genai.Client(api_key=api_key)
    except Exception as e:
        logger.error(f"Failed to initialize Gemini Client: {e}")
        return None

def verify_gemini_api_key(api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Verifies if a given or configured Gemini API key is valid.
    """
    key_to_test = api_key or settings.GEMINI_API_KEY
    if not key_to_test or key_to_test == "your_gemini_api_key_here":
        return {
            "valid": False,
            "status": "missing_api_key",
            "message": "No API key configured in backend/.env. Please set GEMINI_API_KEY."
        }
    try:
        from google import genai
        client = genai.Client(api_key=key_to_test)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents='Respond with ONLY the word OK if you receive this health check.'
        )
        if response and response.text:
            return {
                "valid": True,
                "status": "active",
                "model": "gemini-2.5-flash",
                "message": "API key verified successfully!"
            }
        return {"valid": False, "status": "invalid_response", "message": "API returned empty response."}
    except Exception as e:
        return {
            "valid": False,
            "status": "error",
            "message": f"API Key Verification Failed: {str(e)}"
        }

def analyze_medical_image_with_ai(image_bytes: bytes, image_type: str) -> Dict[str, Any]:
    """
    Analyzes medical imaging (Chest X-Ray, MRI, CT Scan, ECG) using Gemini Vision API.
    """
    client = get_gemini_client()
    
    if not client:
        return {
            "ai_engine": "Rule-Based Mock Engine (Set GEMINI_API_KEY in .env for Real AI)",
            "image_type": image_type,
            "findings": [
                f"Sample analysis for {image_type}",
                "No critical acute abnormality detected in baseline check."
            ],
            "risk_score": 15,
            "risk_level": "LOW",
            "confidence": 0.85,
            "recommendation": "Consult physician for definitive clinical correlation.",
            "note": "Configure GEMINI_API_KEY in backend/.env to activate live Gemini Vision AI analysis."
        }
        
    try:
        image = Image.open(io.BytesIO(image_bytes))
        prompt = f"""
You are MediVision AI, an expert Clinical Decision Support System.
Analyze this medical image (Type: {image_type}).
Provide your clinical analysis in valid JSON format with the following keys:
- "findings": array of strings listing key visual abnormalities or observations
- "suspicious_regions": array of descriptions of localized areas of interest
- "primary_suspicion": string describing potential diagnosis/screening flag
- "risk_score": integer between 0 and 100
- "risk_level": string ("LOW", "MODERATE", "HIGH", "CRITICAL")
- "confidence_score": float between 0.0 and 1.0
- "plain_language_summary": string explaining findings clearly for patient/doctor
- "suggested_followup": string describing recommended clinical next steps

Important: Return ONLY valid JSON.
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[image, prompt]
        )
        
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        parsed = json.loads(text)
        parsed["ai_engine"] = "Google Gemini 2.5 Vision AI"
        return parsed
    except Exception as e:
        logger.error(f"Gemini image analysis error: {e}")
        return {
            "ai_engine": "Fallback Analysis",
            "image_type": image_type,
            "error": str(e),
            "findings": ["Image processed, but AI model returned raw response."],
            "raw_response": getattr(response, "text", "") if 'response' in locals() else None
        }

def analyze_prescription_with_ai(image_bytes: bytes) -> Dict[str, Any]:
    """
    Parses hand-written or printed prescriptions for OCR, medication details, dosage, frequency, and drug safety warnings.
    """
    client = get_gemini_client()
    
    if not client:
        return {
            "ai_engine": "Prescription Reader (Set GEMINI_API_KEY for Live OCR)",
            "medications": [
                {"name": "Paracetamol", "dosage": "500mg", "frequency": "Twice daily after meals", "duration": "5 days"}
            ],
            "warnings": ["Ensure full course completion."],
            "note": "Configure GEMINI_API_KEY in backend/.env for real prescription OCR."
        }
        
    try:
        image = Image.open(io.BytesIO(image_bytes))
        prompt = """
You are MediVision AI Prescription Reader.
Extract all details from this medical prescription.
Return ONLY valid JSON with keys:
- "patient_name": string or "Not specified"
- "doctor_name": string or "Not specified"
- "date": string or "Not specified"
- "medications": array of objects, each containing:
  - "name": string
  - "dosage": string
  - "frequency": string
  - "duration": string
  - "instructions": string
- "potential_interactions_or_warnings": array of strings
- "plain_summary": string summarizing prescription clearly

Return ONLY valid JSON.
        """
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[image, prompt]
        )
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        parsed = json.loads(text)
        parsed["ai_engine"] = "Google Gemini 2.5 OCR & NLP"
        return parsed
    except Exception as e:
        return {
            "ai_engine": "Prescription Reader Error",
            "error": str(e)
        }

def summarize_medical_pdf_or_text(text_content: str) -> Dict[str, Any]:
    """
    Summarizes medical PDF text, medical histories, or pathology summaries.
    """
    client = get_gemini_client()
    
    if not client:
        return {
            "ai_engine": "Medical PDF Summarizer (Offline Mode)",
            "summary": "Medical document content received. Set GEMINI_API_KEY in backend/.env to activate live medical LLM summarization.",
            "key_takeaways": ["Document parsed successfully."]
        }
        
    try:
        prompt = f"""
You are MediVision AI Clinical Summarizer.
Summarize the following medical document text into concise clinical takeaways:

--- BEGIN DOCUMENT ---
{text_content[:8000]}
--- END DOCUMENT ---

Return ONLY valid JSON with keys:
- "patient_summary": concise plain-language summary for patient
- "clinical_summary": medical summary for doctors/specialists
- "key_diagnoses": array of strings
- "abnormalities_noted": array of strings
- "actionable_recommendations": array of strings

Return ONLY valid JSON.
        """
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        parsed = json.loads(text)
        parsed["ai_engine"] = "Google Gemini 2.5 Clinical NLP"
        return parsed
    except Exception as e:
        return {
            "ai_engine": "Medical Summarizer Error",
            "error": str(e)
        }

def chat_with_medical_ai(user_prompt: str) -> str:
    """
    Handles conversational interactions with MediVision AI assistant.
    Combines Gemini 2.5 Flash GenAI with clinical decision support rules.
    """
    client = get_gemini_client()
    if client:
        try:
            sys_instruction = "You are MediVision AI Clinical Assistant (SIH1383). Provide helpful, compassionate, structured medical info and guide patients to schedule appointments with appropriate specialists when symptoms or abnormal reports indicate a consultation is needed."
            res = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=f"{sys_instruction}\n\nUser Question: {user_prompt}"
            )
            if res and res.text:
                return res.text.strip()
        except Exception as e:
            logger.error(f"Gemini Chat error: {e}")

    # Rich clinical response fallback matrix
    prompt_lower = user_prompt.lower()
    if any(k in prompt_lower for k in ["book", "appointment", "schedule", "slot", "doctor"]):
        return "I can help you book an appointment with our top specialists using the SIH1383 Smart Allocation Engine! Navigate to the 'Smart Appointments' tab to see dynamically ranked doctors based on your required specialty and urgency level."
    elif any(k in prompt_lower for k in ["heart", "chest", "ecg", "cardio", "bp", "blood pressure"]):
        return "Chest discomfort or ECG abnormalities should be evaluated promptly. Based on clinical protocol, I recommend scheduling a consultation with a Cardiologist. Our SIH1383 allocation engine can find the earliest available slot for you."
    elif any(k in prompt_lower for k in ["cough", "breath", "lung", "xray", "x-ray", "respiratory", "asthma"]):
        return "Respiratory symptoms or abnormal chest imaging warrant a review by a Pulmonologist. You can upload your X-Ray report in the 'Upload Report' page to get automated findings and direct doctor recommendations."
    elif any(k in prompt_lower for k in ["headache", "mri", "brain", "neuro", "dizziness", "seizure"]):
        return "Neurological symptoms or brain MRI findings are best evaluated by a Neurologist. Please consider booking a consultation through our Smart Booking portal."
    elif any(k in prompt_lower for k in ["blood", "hemoglobin", "wbc", "rbc", "platelet", "glucose", "hba1c"]):
        return "Blood panel parameters reflect your systemic health score. If any flags like elevated HbA1c or low hemoglobin appear, a General Physician or Endocrinologist can review your test history."
    else:
        return "Thank you for reaching out to MediVision AI. I can assist you with report analysis, symptom screening, and finding top-ranked specialists. Feel free to ask about your health reports or head over to the Smart Appointments section to book a consultation."

