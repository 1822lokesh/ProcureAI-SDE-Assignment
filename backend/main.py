from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import engine, get_db

# Create the app
app = FastAPI(title="ProcureAI API")

# --- VENDOR ROUTES ---

@app.post("/vendors/", response_model=schemas.VendorResponse)
def create_vendor(vendor: schemas.VendorCreate, db: Session = Depends(get_db)):
    # 1. Check if email already exists
    existing_vendor = db.query(models.Vendor).filter(models.Vendor.email == vendor.email).first()
    if existing_vendor:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 2. Create new Vendor
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

# --- RFP ROUTES ---

@app.post("/rfps/", response_model=schemas.RFPResponse)
def create_rfp(rfp: schemas.RFPCreate, db: Session = Depends(get_db)):
    # NOTE: In Phase 4, we will call OpenAI here to generate the schema.
    # For now, we just save the text.
    
    new_rfp = models.RFP(
        title=rfp.title,
        prompt_text=rfp.prompt_text,
        json_schema={"note": "AI Generation Pending"} # Placeholder
    )
    db.add(new_rfp)
    db.commit()
    db.refresh(new_rfp)
    return new_rfp

@app.get("/rfps/", response_model=List[schemas.RFPResponse])
def read_rfps(db: Session = Depends(get_db)):
    return db.query(models.RFP).all()
