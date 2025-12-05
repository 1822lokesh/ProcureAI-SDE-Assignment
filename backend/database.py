from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load the password from the .env file
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Create the engine (The connection to the cloud)
engine = create_engine(DATABASE_URL)

# Create a SessionLocal class (To talk to the DB)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for our models
Base = declarative_base()

# Dependency to get the database session in endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()