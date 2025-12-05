ProcureAI – Intelligent RFP Management System

ProcureAI is an AI-powered web application designed to streamline the procurement process. It automates the creation of Requests for Proposals (RFPs), ingests unstructured vendor responses (PDFs/Emails), and uses LLMs to extract data for side-by-side comparison.

Current Status: Phase 3 Complete (Backend API, Database, and Frontend Skeleton setup).

🚀 Features Implemented (Phases 1-3)

1. Backend Architecture (FastAPI)

Framework: Set up FastAPI for high-performance, asynchronous API handling.

Database ORM: Integrated SQLAlchemy for database management.

Validation: Implemented Pydantic models for strict data validation (Schemas).

Endpoints: Created foundational REST API endpoints:

POST /vendors/ - Register new vendors.

GET /vendors/ - Retrieve vendor lists.

POST /rfps/ - Create a new RFP entry.

GET /rfps/ - Retrieve active RFPs.

2. Database (Cloud PostgreSQL)

Connection: Successfully connected to a live Cloud PostgreSQL database (Neon.tech/Supabase).

Schema Design: Designed and migrated the core relational tables:

vendors: Stores vendor contact info.

rfps: Stores request details and JSONB schemas.

proposals: Stores vendor responses and AI-extracted data.

3. Frontend Skeleton (React + Material UI)

Framework: Initialized Vite + React project.

UI Library: Integrated Material UI (MUI) for pre-built components (Cards, Buttons, Tables).

State: Verified frontend build pipeline and basic rendering.

🛠️ Tech Stack

Backend: Python 3.10+, FastAPI, Uvicorn, SQLAlchemy.

Frontend: React.js, Material UI (@mui/material).

Database: PostgreSQL (Cloud-hosted).

Tools: Git, python-dotenv.

⚙️ How to Run Locally

Prerequisites

Node.js & npm

Python 3.10+

A PostgreSQL Database URL

1. Backend Setup

cd backend
# Create virtual environment
python -m venv venv
# Activate venv (Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate)

# Install dependencies
pip install fastapi uvicorn sqlalchemy psycopg2-binary python-dotenv openai python-multipart

# Setup Environment Variables
# Create a .env file in /backend and add:
# DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Run the Server
uvicorn main:app --reload


API is now running at http://127.0.0.1:8000
Swagger Docs available at http://127.0.0.1:8000/docs

2. Frontend Setup

cd frontend
# Install dependencies
npm install

# Run the Development Server
npm run dev


Frontend is now running at http://localhost:5173

🔜 Next Steps (Phase 4-6)

AI Integration: Connect OpenAI API to generate RFP schemas and extract data from PDFs.

Email Service: Integrate Nodemailer/SMTP to send real emails to vendors.

Dashboard UI: Build the React components to display the Comparison Matrix.