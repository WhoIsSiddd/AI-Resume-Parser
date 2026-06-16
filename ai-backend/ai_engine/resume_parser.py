from __future__ import annotations
import fitz  # PyMuPDF
import docx
import io
import re
import datetime
import spacy
from typing import Dict, Any, List, Optional

# Load spaCy model for entity extraction
try:
    nlp = spacy.load("en_core_web_sm")
except Exception as e:
    print(f"Warning: Could not load spacy model in resume_parser. Run 'python -m spacy download en_core_web_sm'. {e}")
    nlp = None

# Basic Name finding via robust regex
def extract_name(text: str) -> str:
    lines = text.split('\n')
    lines_to_check: List[str] = lines[:10]
    for line in lines_to_check: # Check top 10 lines
        line = line.strip()
        if not line:
            continue
        # Strict exact rules
        if len(line.split()) > 4 or len(line) < 2:
            continue
        if re.search(r'[^a-zA-Z\s\-\'.À-ÖØ-öø-ÿ]', line):
            continue
        
        lower = line.lower()
        invalid_keywords = ['resume', 'cv', 'contact', 'email', 'phone', 'profile', 'summary', 'street']
        if any(kw in lower for kw in invalid_keywords):
            continue
            
        return line
    return "Applicant Name"

def extract_contact_info(text: str) -> Dict[str, str]:
    email_match = re.search(r'[\w.+-]+@[\w-]+\.[a-zA-Z0-9-.]+', text)
    phone_match = re.search(r'(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?', text)
    linkedin_match = re.search(r'linkedin\.com\/in\/[\w\-:]+', text, re.IGNORECASE)
    github_match = re.search(r'github\.com\/[\w\-]+', text, re.IGNORECASE)
    
    return {
        "email": email_match.group(0) if email_match else "",
        "phone": phone_match.group(0).strip() if phone_match else "",
        "linkedin": f"https://www.{linkedin_match.group(0)}" if linkedin_match else "",
        "github": f"https://{github_match.group(0)}" if github_match else ""
    }

def extract_location(text: str) -> str:
    """
    Extracts location (City, Country) using spaCy GPE entities.
    """
    if not nlp:
        return ""
    
    prefix: str = text[:2000]
    if nlp is None:
        return ""
    doc = nlp(prefix) # Check beginning of resume
    if not doc:
        return ""
    locations = [ent.text for ent in doc.ents if ent.label_ == "GPE"]
    
    if locations:
        return locations[0]
    
    return ""

def split_into_sections(text: str) -> Dict[str, str]:
    """
    Splits resume text into logical sections based on common headers.
    """
    sections = {
        "summary": "",
        "experience": "",
        "education": "",
        "skills": "",
        "projects": "",
        "certifications": ""
    }
    
    header_patterns = {
        "experience": r'\b(experience|employment|work history|professional background|work experience)\b',
        "education": r'\b(education|academic|qualifications)\b',
        "skills": r'\b(skills|technologies|technical skills|competencies)\b',
        "projects": r'\b(projects|personal projects|portfolio)\b',
        "certifications": r'\b(certifications|certificates|awards|achievements)\b',
        "summary": r'\b(summary|profile|objective|about me)\b'
    }
    
    current_section = "summary"
    lines = text.split('\n')
    for line in lines:
        clean_line = line.strip()
        if not clean_line: continue
        lower_line = clean_line.lower()
        
        is_header = False
        if len(clean_line) < 40:
            for section, pattern in header_patterns.items():
                if re.search(pattern, lower_line):
                    current_section = section
                    is_header = True
                    break
        
        if not is_header:
            sections[current_section] += clean_line + "\n"
            
    return sections

def extract_years_experience(text: str) -> float:
    """
    Improved extraction of years of experience.
    """
    exp_mentions = re.findall(r'(\d+(?:\.\d+)?)\+?\s*(?:year|yr)', text, re.IGNORECASE)
    if exp_mentions:
        return max([float(x) for x in exp_mentions])
    
    years = re.findall(r'\b(19\d{2}|20\d{2})\b', text)
    if years:
        years = [int(y) for y in years]
        oldest = min(years)
        current_year = datetime.datetime.now().year
        if oldest > 1980:
             return float(current_year - oldest)
    return 0.0

def parse_pdf(file_bytes: bytes) -> str:
    text = ""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        for page in doc:
            text += page.get_text()
    except Exception as e:
        print(f"Error parsing PDF: {e}")
    return text

def parse_docx(file_bytes: bytes) -> str:
    text = ""
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
        for para in doc.paragraphs:
            text += para.text + "\n"
    except Exception as e:
        print(f"Error parsing DOCX: {e}")
    return text

