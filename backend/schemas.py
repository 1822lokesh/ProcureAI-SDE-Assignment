from pydantic import BaseModel
from typing import List, Optional, Any, Dict

# --- Vendor Schemas ---
# What the user sends to us
class VendorCreate(BaseModel):
    name: str
    email: str
    contact_person: Optional[str] = None

# What we send back to the user (includes the ID)
class VendorResponse(VendorCreate):
    id: str
    class Config:
        from_attributes = True

# --- RFP Schemas ---
class RFPCreate(BaseModel):
    title: str
    prompt_text: str # "I need 50 laptops..."

class RFPResponse(BaseModel):
    id: str
    title: str
    status: str
    prompt_text: str
    json_schema: Optional[Dict] = None
    class Config:
        from_attributes = True