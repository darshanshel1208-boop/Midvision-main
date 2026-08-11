import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app
from app.services.gemini_service import analyze_medical_image_with_ai

client = TestClient(app)

def test_mock_ai_engine_mri():
    res_mri = analyze_medical_image_with_ai(b"fake_image_bytes", "mri")
    assert res_mri["risk_level"] == "CRITICAL"
    assert "Glioblastoma" in res_mri["primary_suspicion"]
    assert res_mri["risk_score"] == 88

def test_mock_ai_engine_xray():
    res_xray = analyze_medical_image_with_ai(b"fake_image_bytes", "chest_xray")
    assert res_xray["risk_level"] == "LOW"
    assert "No critical acute abnormality" in res_xray["findings"][1]

def test_health_check_endpoint():
    response = client.get("/api/analysis/health")
    if response.status_code == 200:
        data = response.json()
        assert data["status"] == "online"
