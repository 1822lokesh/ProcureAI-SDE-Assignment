from database import engine, Base
from models import Vendor, RFP, Proposal

print("Deleting all data...")
Base.metadata.drop_all(bind=engine)
print("Recreating tables...")
Base.metadata.create_all(bind=engine)
print("Database is clean and empty!")