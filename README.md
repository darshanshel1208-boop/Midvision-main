# MediVision AI -- Multi-Modal Medical Report & Disease Detection Platform

**Tagline:** *One Platform. Multiple Reports. Faster Clinical Insights.*

## 📖 Executive Summary
MediVision AI is an AI-powered clinical decision support platform designed for hospitals, clinics, diagnostic centers, and rural healthcare facilities. It analyzes blood reports, medical PDFs, chest X-rays, MRI scans, CT scans, ECGs, pathology reports, and prescriptions using OCR, Computer Vision, NLP, and Machine Learning.

> **Purpose:** Assist healthcare professionals by highlighting suspicious findings, generating easy-to-understand summaries, prioritizing high-risk cases, and improving workflow efficiency. It is **not** intended to replace doctors or provide definitive diagnoses.

## 🚀 Features & Modules
- **Blood Report Analyzer:** CBC, LFT, KFT, Lipid Profile, etc.
- **Chest X-ray Analysis:** Pneumonia, Tuberculosis, Lung Opacity, etc.
- **MRI & CT Scan Analysis:** Brain Tumors, Hemorrhages, Spinal issues.
- **ECG Analysis:** Arrhythmia, Tachycardia, Bradycardia.
- **Prescription Reader:** OCR extraction for medicines, dosages, and interactions.
- **Medical PDF Analyzer:** Summarizes lengthy medical documents.

## 🛠️ Technology Stack

**Frontend:**
- [Next.js](https://nextjs.org/) (React, TypeScript)
- Tailwind CSS

**Backend:**
- [FastAPI](https://fastapi.tiangolo.com/) (Python)
- PostgreSQL (Database)

**AI & ML:**
- PyTorch / TensorFlow
- YOLOv8 / OpenCV
- PaddleOCR / EasyOCR
- LangChain / Llama 3

## 📦 Getting Started

### 1. Frontend Setup
Navigate to the `frontend` directory and install the dependencies:
```bash
cd frontend
npm install
npm run dev
```
The frontend will be available at `http://localhost:3000`.

### 2. Backend Setup
Navigate to the `backend` directory, activate the virtual environment, and run the server:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt # (if applicable)
uvicorn main:app --reload
```
The FastAPI backend will be available at `http://localhost:8000`.

## 🔒 Security
- JWT Authentication & Role-Based Access Control
- AES-256 Encryption
- Secure Cloud Storage

## ⚠️ Disclaimer
MediVision AI is designed as an **AI-assisted Clinical Decision Support System (CDSS)**. Final diagnosis and treatment decisions must always be made by qualified medical practitioners.