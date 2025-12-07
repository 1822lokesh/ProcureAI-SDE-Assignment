import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

# 1. Load environment variables
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY not found in .env file")

# 2. Configure Gemini with the key
genai.configure(api_key=api_key)

# 3. Initialize the Model
# 'gemini-1.5-flash' is the best balance of speed and free tier limits
model = genai.GenerativeModel('gemini-2.5-flash')

def clean_json_string(text: str):
    """
    Helper function: Gemini often wraps JSON in markdown like ```json ... ```.
    This removes those wrappers so Python can read it as a dictionary.
    """
    text = text.replace("```json", "").replace("```", "")
    return text.strip()

def generate_rfp_schema(user_prompt: str):
    """
    Step 1: User says 'I need laptops' -> AI creates a Data Structure.
    """
    system_instruction = """
    You are a procurement expert. Analyze the user's request and generate a JSON Schema 
    that defines the data we need to extract from vendor proposals.
    
    You MUST return ONLY a valid JSON object. Do not include any explanation text.
    
    The JSON structure must look like this:
    {
        "fields": [
            {"key": "total_price", "type": "number", "description": "Total cost in USD"},
            {"key": "delivery_timeline", "type": "string", "description": "Delivery time estimation"},
            ... add specific fields based on user request (e.g., ram, warranty) ...
        ]
    }
    """
    
    try:
        response = model.generate_content(
            f"{system_instruction}\n\nUSER REQUEST: {user_prompt}",
            generation_config={"response_mime_type": "application/json"}
        )
        
        # Parse the text into a Python Dictionary
        return json.loads(clean_json_string(response.text))
        
    except Exception as e:
        print(f"AI Generation Error: {e}")
        # Return a fallback schema so the app doesn't crash
        return {
            "fields": [
                {"key": "price", "type": "number", "description": "Total Price"},
                {"key": "summary", "type": "string", "description": "Proposal Summary"}
            ]
        }

def extract_data_from_text(pdf_text: str, json_schema: dict):
    """
    Step 2: PDF Text + Schema -> AI extracts specific values.
    """
    system_instruction = f"""
    You are a data extraction engine.
    1. Read the SOURCE TEXT provided below.
    2. Extract data to match this EXACT JSON Schema: {json.dumps(json_schema)}
    3. Return ONLY a valid JSON object.
    4. If a field is missing in the text, set the value to null.
    5. Normalize all currency values to numbers (e.g., "$10,000" -> 10000).
    """
    
    try:
        response = model.generate_content(
            f"{system_instruction}\n\nSOURCE TEXT:\n{pdf_text}",
            generation_config={"response_mime_type": "application/json"}
        )
        
        return json.loads(clean_json_string(response.text))
        
    except Exception as e:
        print(f"AI Extraction Error: {e}")
        return {"error": "Failed to extract data"}
    
def evaluate_proposal(user_request: str, vendor_data: dict):
    """
    Step 3: The Judge.
    Compares the User's Request (RFP) vs Vendor's Offer (Data).
    Returns a Score (0-100) and a short Reason.
    """
    system_instruction = """
    You are a procurement procurement officer. 
    Compare the "User Request" against the "Vendor Offer".
    
    Task:
    1. Assign a "fit_score" from 0 to 100.
       - 100 = Perfect match (Price is good, specs match, warranty matches).
       - 0 = Complete mismatch.
    2. Provide a "recommendation" (1 short sentence explaining the score).
    
    Return JSON ONLY:
    {
        "score": 85,
        "reason": "Price is slightly over budget, but warranty is excellent."
    }
    """
    
    try:
        response = model.generate_content(
            f"{system_instruction}\n\nUSER REQUEST: {user_request}\nVENDOR OFFER: {json.dumps(vendor_data)}",
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(clean_json_string(response.text))
    except Exception as e:
        print(f"Scoring Error: {e}")
        return {"score": 0, "reason": "AI could not evaluate."}