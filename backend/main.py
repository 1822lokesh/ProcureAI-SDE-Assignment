from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from pydantic import EmailStr, BaseModel
import io
import pypdf # Library to read PDFs

# Import our local modules
import models
import schemas
import ai_service
import email_service
from database import engine, get_db

# Create the App
app = FastAPI(title="ProcureAI API")

# --- CORS SETUP (Crucial for React connection) ---
# This allows your Frontend (localhost:5173) to talk to this Backend (localhost:8000)
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

# --- VENDOR ROUTES ---

@app.post("/vendors/", response_model=schemas.VendorResponse)
def create_vendor(vendor: schemas.VendorCreate, db: Session = Depends(get_db)):
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
    return db.query(models.Vendor).all()

# --- RFP ROUTES (AI Powered) ---
@app.post("/rfps/", response_model=schemas.RFPResponse)
def create_rfp(rfp: schemas.RFPCreate, db: Session = Depends(get_db)):
    print(f"Creating RFP for prompt: {rfp.prompt_text}")
    
    # 1. AI STEP: Generate the JSON Schema from the user's text
    # The AI figures out we need "price", "ram", "warranty", etc.
    try:
        generated_schema = ai_service.generate_rfp_schema(rfp.prompt_text)
    except Exception as e:
        print(f"AI Error: {e}")
        # Fallback if AI fails
        generated_schema = {"fields": [{"key": "price", "type": "number", "description": "Cost"}]}

    # 2. Save to Database
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
    return db.query(models.RFP).all()

@app.get("/rfps/{rfp_id}", response_model=schemas.RFPResponse)
def read_rfp(rfp_id: str, db: Session = Depends(get_db)):
    rfp = db.query(models.RFP).filter(models.RFP.id == rfp_id).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")
    return rfp

# --- 4. PROPOSAL ROUTES (The Core Logic) ---
class EmailRequest(BaseModel):
    vendor_emails: List[EmailStr]

@app.post("/rfps/{rfp_id}/send/")
async def send_rfp_email_route(rfp_id: str, req: EmailRequest, db: Session = Depends(get_db)):
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
    
# ROUTE A: UPLOAD (POST)
@app.post("/rfps/{rfp_id}/proposals/")
async def upload_proposal(rfp_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
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
    
    # 3. AI Extraction Step
    print("DEBUG: Sending text to AI...")
    try:
        ai_extracted_data = ai_service.extract_data_from_text(extracted_text, rfp.json_schema)
    except Exception as e:
        print(f"DEBUG: AI Error: {e}")
        ai_extracted_data = {} # Fail gracefully
    
    # --- 4. NEW: AI Scoring (The Judge) ---
    print("AI Judging Proposal...")
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