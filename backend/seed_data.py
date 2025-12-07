import requests
import json

# The API URL
url = "http://127.0.0.1:8000/vendors/"

# The 3 Vendors you want to create
vendors = [
    {
        "name": "TechGiant Solutions", 
        "email": "sales@techgiant.com", 
        "contact_person": "Tom Tech"
    },
    {
        "name": "BestScreens Inc.", 
        "email": "b2b@bestscreens.com", 
        "contact_person": "Sarah Screen"
    },
    {
        "name": "BudgetDepot Wholesale", 
        "email": "info@budgetdepot.com", 
        "contact_person": "Bob Budget"
    }
]

print("🌱 Seeding Database with Vendors...")

for vendor in vendors:
    try:
        response = requests.post(url, json=vendor)
        if response.status_code == 200:
            print(f"✅ Created: {vendor['name']}")
        elif response.status_code == 400:
            print(f"⚠️  Skipped: {vendor['name']} (Email already exists)")
        else:
            print(f"❌ Error creating {vendor['name']}: {response.text}")
    except Exception as e:
        print(f"❌ Connection Error: Is the backend running? {e}")

print("\n✨ Done! You are ready for the demo.")