from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import io
import pypdf # Library to read PDFs

# Import our local modules
import models
import schemas
import ai_service
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

# --- PROPOSAL ROUTES (PDF Handling + AI Extraction) ---

# @app.post("/rfps/{rfp_id}/proposals/")
# def upload_proposal(rfp_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    # 1. Find the RFP (to get the schema)
    rfp = db.query(models.RFP).filter(models.RFP.id == rfp_id).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")

    print(f"Processing upload for RFP: {rfp.title}")

    # 2. Read the PDF File
    try:
        pdf_content = file.file.read()
        pdf_reader = pypdf.PdfReader(io.BytesIO(pdf_content))
        extracted_text = ""
        for page in pdf_reader.pages:
            text = page.extract_text()
            if text:
                extracted_text += text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid PDF: {str(e)}")
    
    # 3. AI STEP: Extract structured data using the RFP's schema
    print("Sending text to AI for extraction...")
    ai_extracted_data = ai_service.extract_data_from_text(extracted_text, rfp.json_schema)
    
    # 4. Save the Proposal
    new_proposal = models.Proposal(
        rfp_id=rfp_id,
        # In a real app, we would link this to a specific vendor ID. 
        # For this MVP, we leave vendor_id null or hardcode it if needed.
        vendor_id=None, 
        raw_response_text=extracted_text[:5000], # Limit text size for DB
        extracted_data=ai_extracted_data,
        fit_score=0 
    )
    db.add(new_proposal)
    db.commit()
    db.refresh(new_proposal)
    
    return {
        "message": "Proposal processed successfully",
        "extracted_data": ai_extracted_data,
        "proposal_id": new_proposal.id
    }

# @app.get("/rfps/{rfp_id}/proposals/")
# def read_proposals(rfp_id: str, db: Session = Depends(get_db)):
#     # Get all proposals for a specific RFP
#     return db.query(models.Proposal).filter(models.Proposal.rfp_id == rfp_id).all()
@app.post("/rfps/{rfp_id}/proposals/")
async def upload_proposal(rfp_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    print(f"DEBUG: Starting upload for RFP ID: {rfp_id}")
    
    # 1. Check if RFP exists
    rfp = db.query(models.RFP).filter(models.RFP.id == rfp_id).first()
    if not rfp:
        print("DEBUG: RFP not found in DB")
        raise HTTPException(status_code=404, detail="RFP not found")
    
    print(f"DEBUG: Found RFP Title: {rfp.title}")

    # 2. Read PDF
    try:
        content = await file.read() # Async read
        print(f"DEBUG: File read successfully. Size: {len(content)} bytes")
        
        pdf_reader = pypdf.PdfReader(io.BytesIO(content))
        extracted_text = ""
        for page in pdf_reader.pages:
            extracted_text += page.extract_text()
            
        print(f"DEBUG: Extracted text length: {len(extracted_text)}")
        if len(extracted_text) < 10:
             print("DEBUG: Text is too short! PDF might be empty or scanned image.")
             
    except Exception as e:
        print(f"DEBUG: PDF Error: {e}")
        raise HTTPException(status_code=400, detail="Failed to read PDF")

    # 3. AI Extraction
    print("DEBUG: Sending to AI...")
    try:
        ai_data = ai_service.extract_data_from_text(extracted_text, rfp.json_schema)
        print(f"DEBUG: AI Success. Data keys: {ai_data.keys()}")
    except Exception as e:
        print(f"DEBUG: AI Service Failed: {e}")
        ai_data = {"error": "AI Extraction Failed"}

    # 4. Save to DB
    try:
        new_proposal = models.Proposal(
            rfp_id=rfp_id,
            raw_response_text=extracted_text[:5000],
            extracted_data=ai_data,
            fit_score=0
        )
        db.add(new_proposal)
        db.commit()
        db.refresh(new_proposal)
        print("DEBUG: Saved to DB successfully")
    except Exception as e:
        print(f"DEBUG: Database Save Error: {e}")
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")
    
    return new_proposal