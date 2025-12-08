"""
ProcureAI Backend API
---------------------
This is the main entry point for the FastAPI application.
It handles all HTTP requests, routes them to the appropriate logic,
and manages the connection between the Frontend (React), Database (PostgreSQL),
and AI Services (Gemini).

Tech Stack: FastAPI, SQLAlchemy, Pydantic
"""

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from pydantic import EmailStr, BaseModel
import io
import pypdf 

# Import our local modules
import models
import schemas
import ai_service
import email_service
from database import engine, get_db

# 1. Initialize FastAPI App
app = FastAPI(
    title="ProcureAI API",
    description="AI-Powered RFP Management System Backend",
    version="1.0.0"   
)


# 3. Configure CORS (Cross-Origin Resource Sharing)
# This is CRITICAL. It allows our React Frontend (running on port 5173)
# to communicate with this Python Backend (running on port 8000).
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# MODULE 1: VENDOR MANAGEMENT
# ==========================================

@app.post("/vendors/", response_model=schemas.VendorResponse)
def create_vendor(vendor: schemas.VendorCreate, db: Session = Depends(get_db)):
    
    """
    Registers a new Vendor in the system.
    - Checks if email is unique.
    - Saves to PostgreSQL 'vendors' table.

    """ 
    # 1. Check if email exists
    existing_vendor = db.query(models.Vendor).filter(models.Vendor.email == vendor.email).first()
    if existing_vendor:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 2. Create Vendor
    new_vendor = models.Vendor(
        name=vendor.name,
        email=vendor.email,
        contact_person=vendor.contact_person
    )
    db.add(new_vendor)
    db.commit()
    db.refresh(new_vendor)
    return new_vendor

@app.get("/vendors/", response_model=List[schemas.VendorResponse])
def read_vendors(db: Session = Depends(get_db)):
    """
    Retrieves the master list of all registered vendors.
    Used by the Frontend to populate the "Invite Vendors" popup.

    """
    return db.query(models.Vendor).all()

# ==========================================
# MODULE 2: RFP CREATION (Generative AI)
# ==========================================

@app.post("/rfps/", response_model=schemas.RFPResponse)
def create_rfp(rfp: schemas.RFPCreate, db: Session = Depends(get_db)):
    """
    The 'Architect' Endpoint.
    1. Receives natural language (e.g. "I need 50 laptops").
    2. Calls Gemini AI to generate a structured JSON Schema (Columns).
    3. Saves the Request + Schema to the database.
    
    """
    print(f"Creating RFP for prompt: {rfp.prompt_text}")
    
    
    try:
        # Call the AI Service to design the database structure dynamically
        generated_schema = ai_service.generate_rfp_schema(rfp.prompt_text)
    except Exception as e:
        print(f"AI Error: {e}")
        # Graceful Fallback: Ensure the app doesn't crash if AI fails
        generated_schema = {"fields": [{"key": "price", "type": "number", "description": "Cost"}]}

    # Save to Database
    new_rfp = models.RFP(
        title=rfp.title,
        prompt_text=rfp.prompt_text,
        json_schema=generated_schema 
    )
    db.add(new_rfp)
    db.commit()
    db.refresh(new_rfp)
    return new_rfp

@app.get("/rfps/", response_model=List[schemas.RFPResponse])
def read_rfps(db: Session = Depends(get_db)):
    """ Fetches all RFPs for the Dashboard list."""
    return db.query(models.RFP).all()

@app.get("/rfps/{rfp_id}", response_model=schemas.RFPResponse)
def read_rfp(rfp_id: str, db: Session = Depends(get_db)):
    """ Fetches details for a single RFP, including its AI-generated schema."""
    rfp = db.query(models.RFP).filter(models.RFP.id == rfp_id).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")
    return rfp

# ==========================================
# MODULE 3: COMMUNICATION (Email)
# ==========================================

class EmailRequest(BaseModel):
    vendor_emails: List[EmailStr]

@app.post("/rfps/{rfp_id}/send/")
async def send_rfp_email_route(rfp_id: str, req: EmailRequest, db: Session = Depends(get_db)):
    """
     Triggers the Email Dispatcher.
    1. Validates the RFP exists.
    2. Uses FastAPI-Mail to send HTML invites to selected vendors.
    3. Updates RFP status to 'Sent'.
    """
    rfp = db.query(models.RFP).filter(models.RFP.id == rfp_id).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")
    
    print(f"Sending email to: {req.vendor_emails}")
    try:
        await email_service.send_rfp_email(req.vendor_emails, rfp.title, rfp.id)
        rfp.status = "Sent"
        db.commit()
        return {"message": "Emails sent successfully"}
    except Exception as e:
        print(f"Email Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
# ==========================================
# MODULE 4: PROPOSAL ANALYSIS (Analytical AI)
# ==========================================

@app.post("/rfps/{rfp_id}/proposals/")
async def upload_proposal(rfp_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    The Core 'Magic' Endpoint.
    1. Ingests a raw PDF file from the user (simulating vendor reply).
    2. Uses pypdf to strip text layer.
    3. Uses Gemini AI to:
       - Extract data matching the RFP Schema.
       - Normalize prices.
       - Assign a Fit Score (0-100).
    4. Saves the structured result to the database.
    """
    print(f"DEBUG: Starting upload for RFP ID: {rfp_id}")
    
    # 1. Check if RFP exists
    rfp = db.query(models.RFP).filter(models.RFP.id == rfp_id).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")

    # 2. Read PDF File
    try:
        content = await file.read()
        pdf_reader = pypdf.PdfReader(io.BytesIO(content))
        extracted_text = ""
        for page in pdf_reader.pages:
            text = page.extract_text()
            if text:
                extracted_text += text
        
        print(f"DEBUG: Extracted text length: {len(extracted_text)}")
    except Exception as e:
        print(f"DEBUG: PDF Read Error: {e}")
        raise HTTPException(status_code=400, detail="Invalid PDF file")
    
    # 3. AI Extraction & Scoring (Analysis)
    print("DEBUG: Sending text to AI...")
    try:
        # Extract fields (Price, Specs, etc.)
        ai_extracted_data = ai_service.extract_data_from_text(extracted_text, rfp.json_schema)
    except Exception as e:
        print(f"DEBUG: AI Error: {e}")
        ai_extracted_data = {} 
    
    print("AI Judging Proposal...")
    # Judge the proposal (Score 0-100)
    evaluation = ai_service.evaluate_proposal(rfp.prompt_text, ai_extracted_data)
    
    # We save the reason inside the extracted data so the frontend can see it
    ai_extracted_data["ai_recommendation"] = evaluation.get("reason", "No reason provided")


    # 5. Save to Database
    new_proposal = models.Proposal(
        rfp_id=rfp_id,
        vendor_id=None, 
        raw_response_text=extracted_text[:5000], # Store first 5000 chars only
        extracted_data=ai_extracted_data,
        fit_score=evaluation.get("score", 0)
    )
    db.add(new_proposal)
    db.commit()
    db.refresh(new_proposal)
    
    return new_proposal

# ROUTE B: LIST (GET) -- THIS WAS MISSING BEFORE --
@app.get("/rfps/{rfp_id}/proposals/")
def read_proposals(rfp_id: str, db: Session = Depends(get_db)):
    # Verify RFP exists first
    rfp = db.query(models.RFP).filter(models.RFP.id == rfp_id).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")
        
    # Return list of proposals
    return db.query(models.Proposal).filter(models.Proposal.rfp_id == rfp_id).all()