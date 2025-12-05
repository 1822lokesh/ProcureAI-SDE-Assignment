from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from database import Base

# 1. Vendor Table
class Vendor(Base):
    __tablename__ = "vendors"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    contact_person = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

# 2. RFP Table (The Request)
class RFP(Base):
    __tablename__ = "rfps"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    prompt_text = Column(Text)  # "I need 50 laptops..."
    status = Column(String, default="Open") # Open, Closed
    
    # The Magic Column: Stores the AI-generated requirements schema
    # Example: {"fields": [{"name": "price", "type": "int"}]}
    json_schema = Column(JSON) 
    
    created_at = Column(DateTime, default=datetime.utcnow)

# 3. Proposal Table (The Vendor's Reply)
class Proposal(Base):
    __tablename__ = "proposals"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    rfp_id = Column(String, ForeignKey("rfps.id"))
    vendor_id = Column(String, ForeignKey("vendors.id"))
    
    raw_response_text = Column(Text) # Extracted text from PDF
    
    # The Magic Column: The extracted data that matches the RFP schema
    # Example: {"price": 50000, "delivery": "2 weeks"}
    extracted_data = Column(JSON) 
    
    fit_score = Column(Integer) # 0-100 score
    created_at = Column(DateTime, default=datetime.utcnow)