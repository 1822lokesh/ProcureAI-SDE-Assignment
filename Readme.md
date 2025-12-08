
````markdown
# ProcureAI – Intelligent RFP Management System

ProcureAI is a **full-stack, AI-powered procurement dashboard**.  
It streamlines the RFP lifecycle by using LLMs to:

- Automatically generate data schemas from natural language requests
- Extract structured data from unstructured vendor PDF proposals

---

## 🛠️ Project Setup

### Prerequisites

- Node.js (v18 or higher)
- Python (v3.10 or higher)
- PostgreSQL Database URL (e.g., Neon.tech or Supabase)
- Google Gemini API Key (Free tier via Google AI Studio)
- Ethereal Email Account (For testing SMTP)

---

## 1. Installation Steps

### Backend

```bash
cd backend
python -m venv venv
# Activate Venv:
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```
````

### Frontend

```bash
cd frontend
npm install
```

---

## 2. Configuration (.env)

Create a file named `.env` in the `backend/` folder with the following variables:

```env
# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# AI Provider (Google Gemini)
GEMINI_API_KEY="AIzaSy..."

# Email Settings (Ethereal.email)
MAIL_USERNAME="your_ethereal_email@ethereal.email"
MAIL_PASSWORD="your_ethereal_password"
MAIL_FROM="system@procureai.com"
MAIL_PORT=587
MAIL_SERVER="smtp.ethereal.email"
```

---

## 3. How to Run Locally

### Step 1: Start Backend

```bash
cd backend
python create_tables.py  # Run once to initialize DB
uvicorn main:app --reload
```

Server runs at: **http://127.0.0.1:8000**

### Step 2: Start Frontend

```bash
cd frontend
npm run dev
```

UI runs at: **http://localhost:5173**

---

## 4. Seed Data (Optional)

To quickly populate the database with test vendors for the demo:

```bash
cd backend
python seed_data.py
```

---

## 💻 Tech Stack

| Component   | Technology              | Reasoning                                                                           |
| ----------- | ----------------------- | ----------------------------------------------------------------------------------- |
| Frontend    | React + Vite            | Fast build times and component-based architecture                                   |
| UI Library  | Material UI (MUI)       | Enterprise-grade components (DataGrid, Cards) out of the box                        |
| Backend     | FastAPI (Python)        | High performance, async support, and native ecosystem for AI libraries              |
| Database    | PostgreSQL              | Reliability of SQL for Users/Vendors + Flexibility of JSONB for dynamic RFP schemas |
| AI Provider | Google Gemini 1.5 Flash | Fast inference, large context window for PDFs, and cost-effective (Free tier)       |
| PDF Parsing | pypdf                   | Lightweight library to extract raw text layers from PDF documents                   |
| Email       | FastAPI-Mail + Ethereal | Robust SMTP implementation with a safe testing sandbox                              |

---

## 📚 API Documentation

### 1. Create RFP (AI-Powered)

- **Endpoint:** `POST /rfps/`
- **Description:** Analyzes natural language prompt to generate a JSON Schema.
- **Body:**

  ```json
  {
    "title": "Laptops",
    "prompt_text": "I need 10 Macbooks..."
  }
  ```

- **Response:** Returns RFP object with AI-generated `json_schema`.

---

### 2. Upload Proposal (AI-Extraction)

- **Endpoint:** `POST /rfps/{id}/proposals/`
- **Description:** Ingests a PDF, extracts text, and uses AI to map data to the RFP schema.
- **Body:** `multipart/form-data (File)`
- **Response:** Returns extracted data JSON (Price, Specs, Warranty) + AI Fit Score.

---

### 3. Manage Vendors

- **Endpoint:** `GET /vendors/` | `POST /vendors/`
- **Description:** CRUD operations for vendor contact management.

---

### 4. Send Invites

- **Endpoint:** `POST /rfps/{id}/send/`
- **Description:** Triggers SMTP email dispatch to selected vendors.
- **Body:**
  ```json
  {
    "vendor_emails": ["vendor@test.com"]
  }
  ```

---

## 🧠 Decisions & Assumptions

### Key Design Decisions

- **Hybrid Database Schema:**  
  Instead of creating a new SQL table for every RFP type (which is impractical), a JSONB column (`extracted_data`) is used. This allows storing diverse fields like _Screen Size_ for monitors or _Catering Menu_ for events in the same table without migrations.
- **Schema-Guided Extraction:**  
  The LLM is guided by the specific JSON Schema generated during creation, ensuring strictly structured outputs that align with frontend table columns.
- **Scoring Logic:**  
  The AI acts as a "Judge," comparing semantic meaning of the User Request vs. Vendor Proposal to assign a **0–100 Fit Score**.

### Assumptions

- **PDF Format:** Assumes PDFs contain selectable text layers (not scanned images/OCR required).
- **Email Workflow:** For this MVP, proposals are uploaded manually. In production, this would be replaced by an **Inbound Email Webhook** (e.g., SendGrid Inbound Parse).
- **Single User:** Currently supports a single Procurement Manager workflow (authentication out of scope).

---

## 🤖 AI Tools Usage

**Tools Used:** Large Language Models (Gemini/ChatGPT) & Cursor/VS Code

1. **Boilerplate & Speed**

   - AI scaffolded initial FastAPI CRUD endpoints and React components, saving hours of manual typing.

2. **Debugging Complex Logic**

   - Resolved CORS errors between React (Port 5173) and FastAPI (Port 8000).
   - Fixed React Hook dependency warnings in `useEffect` by refactoring data loading logic.

3. **Advanced Prompt Engineering**

   - **Challenge:** Getting AI to reliably output clean JSON without markdown formatting.
   - **Solution:** Iterated on system prompts with strict instructions:  
     _"You are a data extraction engine... Normalize all numbers... Return JSON ONLY."_

4. **Learning Outcome**
   - Learned how to apply **Zero-Shot NER (Named Entity Recognition)** to extract specific entities (Price, Warranty) from unstructured text without training a custom model.

```

```
