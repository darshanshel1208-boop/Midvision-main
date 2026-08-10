from typing import Dict, List, Any

# Clinical Reference Ranges for Common Blood Panels
REFERENCE_RANGES = {
    # Complete Blood Count (CBC)
    "hemoglobin": {"min": 12.0, "max": 17.5, "unit": "g/dL", "low_flag": "Anemia / Low RBC", "high_flag": "Polycythemia / Dehydration"},
    "wbc": {"min": 4.5, "max": 11.0, "unit": "x10^3/µL", "low_flag": "Leukopenia / Immune suppression", "high_flag": "Leukocytosis / Active Infection"},
    "platelets": {"min": 150, "max": 450, "unit": "x10^3/µL", "low_flag": "Thrombocytopenia / Bleeding Risk", "high_flag": "Thrombocytosis / Inflammation"},
    "rbc": {"min": 4.0, "max": 5.9, "unit": "x10^6/µL", "low_flag": "Low RBC Count", "high_flag": "High RBC Count"},
    "hematocrit": {"min": 36.0, "max": 50.0, "unit": "%", "low_flag": "Low Hematocrit", "high_flag": "High Hematocrit"},
    
    # Liver Function Test (LFT)
    "alt": {"min": 7, "max": 56, "unit": "U/L", "low_flag": "Normal", "high_flag": "Elevated ALT (Liver Injury Indicator)"},
    "ast": {"min": 8, "max": 48, "unit": "U/L", "low_flag": "Normal", "high_flag": "Elevated AST (Liver/Heart Stress)"},
    "bilirubin_total": {"min": 0.1, "max": 1.2, "unit": "mg/dL", "low_flag": "Normal", "high_flag": "Hyperbilirubinemia / Jaundice Risk"},
    "alkaline_phosphatase": {"min": 44, "max": 147, "unit": "U/L", "low_flag": "Low ALP", "high_flag": "Elevated ALP (Biliary/Bone issue)"},
    
    # Kidney Function Test (KFT)
    "creatinine": {"min": 0.6, "max": 1.3, "unit": "mg/dL", "low_flag": "Low Creatinine", "high_flag": "Elevated Creatinine (Kidney Function Impairment Risk)"},
    "blood_urea": {"min": 7, "max": 20, "unit": "mg/dL", "low_flag": "Low BUN", "high_flag": "Elevated BUN (Azotemia / Dehydration)"},
    "uric_acid": {"min": 3.5, "max": 7.2, "unit": "mg/dL", "low_flag": "Low Uric Acid", "high_flag": "Hyperuricemia / Gout Risk"},

    # Diabetes / Glycemic
    "hba1c": {"min": 4.0, "max": 5.6, "unit": "%", "low_flag": "Low HbA1c", "high_flag": "Prediabetes (5.7-6.4) or Diabetes Risk (>=6.5)"},
    "fasting_glucose": {"min": 70, "max": 99, "unit": "mg/dL", "low_flag": "Hypoglycemia", "high_flag": "Impaired Fasting Glucose / Diabetes Risk"},
    
    # Lipid Profile
    "cholesterol_total": {"min": 125, "max": 200, "unit": "mg/dL", "low_flag": "Low Cholesterol", "high_flag": "Hypercholesterolemia"},
    "triglycerides": {"min": 40, "max": 150, "unit": "mg/dL", "low_flag": "Normal", "high_flag": "Elevated Triglycerides"},
    "hdl": {"min": 40, "max": 60, "unit": "mg/dL", "low_flag": "Low HDL (Cardiovascular Risk)", "high_flag": "Optimal HDL"},
    "ldl": {"min": 0, "max": 100, "unit": "mg/dL", "low_flag": "Optimal", "high_flag": "Elevated LDL (Atherosclerosis Risk)"},
    
    # Thyroid Profile
    "tsh": {"min": 0.4, "max": 4.0, "unit": "mIU/L", "low_flag": "Hyperthyroidism Risk", "high_flag": "Hypothyroidism Risk"},
    "t3": {"min": 80, "max": 200, "unit": "ng/dL", "low_flag": "Low T3", "high_flag": "High T3"},
    "t4": {"min": 5.0, "max": 12.0, "unit": "µg/dL", "low_flag": "Low T4", "high_flag": "High T4"},
    
    # Vitamins
    "vitamin_d": {"min": 30, "max": 100, "unit": "ng/mL", "low_flag": "Vitamin D Deficiency", "high_flag": "Vitamin D Toxicity"},
    "vitamin_b12": {"min": 200, "max": 900, "unit": "pg/mL", "low_flag": "Vitamin B12 Deficiency", "high_flag": "Elevated B12"}
}

def analyze_blood_parameters(parameters: Dict[str, float]) -> Dict[str, Any]:
    """
    Analyzes numerical blood parameters against clinical reference ranges.
    Returns findings, flagged values, risk score (0-100), and specialist suggestions.
    """
    abnormal_findings = []
    normal_count = 0
    total_analyzed = 0
    risk_points = 0
    
    for key, value in parameters.items():
        norm_key = key.lower().strip().replace(" ", "_")
        if norm_key in REFERENCE_RANGES:
            ref = REFERENCE_RANGES[norm_key]
            total_analyzed += 1
            val = float(value)
            
            if val < ref["min"]:
                risk_points += 15
                abnormal_findings.append({
                    "parameter": key,
                    "value": val,
                    "unit": ref["unit"],
                    "status": "LOW",
                    "normal_range": f"{ref['min']} - {ref['max']} {ref['unit']}",
                    "clinical_significance": ref["low_flag"]
                })
            elif val > ref["max"]:
                risk_points += 15
                abnormal_findings.append({
                    "parameter": key,
                    "value": val,
                    "unit": ref["unit"],
                    "status": "HIGH",
                    "normal_range": f"{ref['min']} - {ref['max']} {ref['unit']}",
                    "clinical_significance": ref["high_flag"]
                })
            else:
                normal_count += 1

    # Calculate overall risk score (0-100)
    risk_score = min(100, risk_points)
    
    if risk_score >= 60:
        risk_level = "HIGH"
        suggested_specialist = "General Physician / Specialist Consultation Recommended"
    elif risk_score >= 30:
        risk_level = "MODERATE"
        suggested_specialist = "Primary Care Physician"
    else:
        risk_level = "LOW"
        suggested_specialist = "Routine Follow-up"
        
    return {
        "total_parameters_analyzed": total_analyzed,
        "normal_parameters": normal_count,
        "abnormal_parameters": len(abnormal_findings),
        "risk_score": risk_score,
        "risk_level": risk_level,
        "suggested_specialist": suggested_specialist,
        "abnormal_findings": abnormal_findings,
        "summary": f"Analyzed {total_analyzed} parameters. Found {len(abnormal_findings)} values outside reference ranges."
    }
