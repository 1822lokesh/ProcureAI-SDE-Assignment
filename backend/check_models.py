import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("❌ Error: GEMINI_API_KEY not found in .env")
else:
    print(f"✅ API Key found: {api_key[:5]}...*******")
    
    genai.configure(api_key=api_key)
    
    print("\n🔍 Listing available models for this key...")
    try:
        count = 0
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f" - Found: {m.name}")
                count += 1
        
        if count == 0:
            print("⚠️ No models found. Your API key might be invalid or has no access.")
    except Exception as e:
        print(f"❌ Error listing models: {e}")
