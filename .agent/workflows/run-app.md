---
description: How to run the full-stack AI Resume Parser application
---

To run the complete application, you need to start three separate services. It is recommended to use three different terminal windows.

### 1. AI Backend (FastAPI)
This service handles the heavy lifting of PDF parsing and ATS scoring using spaCy and Sentence Transformers.

```powershell
# Navigate to the AI backend directory
cd ai-backend

# Activate the virtual environment
.\venv\Scripts\activate

# Start the Flask server
python main.py
```
*Accessible at: http://127.0.0.1:8000/docs (Swagger UI)*

### 2. Express Server (Node.js)
This service acts as the gateway, handling file uploads and communicating with the AI backend and Supabase.

```powershell
# Navigate to the server directory
cd server

# Install dependencies (if not already done)
npm install

# Start the Express server
npm start
```
*Accessible at: http://localhost:3001/api/health*

### 3. Frontend (React/Vite)
The user interface for uploading resumes and viewing results.

```powershell
# In the project root directory
npm install
npm run dev
```
*Accessible at: http://localhost:5173*

---
**Note:** Ensure your `.env` file in the root directory contains valid `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `GEMINI_API_KEY`.
