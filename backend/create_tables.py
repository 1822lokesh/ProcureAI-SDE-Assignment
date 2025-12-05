from database import engine, Base
from models import Vendor, RFP, Proposal

print("Connecting to Cloud Database...")
Base.metadata.create_all(bind=engine)
print("Success! Tables created.")
