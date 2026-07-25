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

# Broad blocklist of terms that appear as section headers or skill names in resumes
_NAME_BLOCKLIST = [
    'resume', 'curriculum vitae', 'cv', 'contact', 'email', 'phone', 'profile',
    'summary', 'objective', 'about', 'street', 'address', 'technical', 'skills',
    'experience', 'education', 'employment', 'work history', 'projects', 'portfolio',
    'certifications', 'certificates', 'awards', 'achievements', 'languages',
    'references', 'publications', 'interests', 'hobbies', 'activities',
    'qualifications', 'competencies', 'technologies', 'tools', 'software',
    'professional', 'personal', 'details', 'information', 'overview',
    'python', 'java', 'javascript', 'react', 'node', 'sql', 'html', 'css',
    'management', 'engineering', 'development', 'design', 'analysis',
    'bachelor', 'master', 'degree', 'university', 'college', 'school'
]

def extract_name(text: str) -> str:
    # 1. Try spaCy PERSON NER in the header text (first 500 chars)
    if nlp:
        try:
            doc = nlp(text[:500])
            for ent in doc.ents:
                if ent.label_ == "PERSON":
                    clean_ent = ent.text.strip()
                    words = clean_ent.split()
                    if 1 <= len(words) <= 4 and len(clean_ent) >= 3:
                        if not re.search(r'[^a-zA-Z\s\-\'.À-ÖØ-öø-ÿ]', clean_ent):
                            if not any(kw in clean_ent.lower() for kw in _NAME_BLOCKLIST):
                                return clean_ent
        except Exception:
            pass

    # 2. Rule-based line scanning
    lines = text.split('\n')
    lines_to_check: List[str] = lines[:15]  # Check top 15 lines
    for line in lines_to_check:
        line = line.strip()
        if not line:
            continue
        # Split line by common header delimiters like |, •, tab
        candidate_parts = [p.strip() for p in re.split(r'[|•\t]', line) if p.strip()]
        for part in candidate_parts:
            words = part.split()
            if len(words) > 4 or len(part) < 3:
                continue
            if re.search(r'[^a-zA-Z\s\-\'.À-ÖØ-öø-ÿ]', part):
                continue
            # Reject all-uppercase single words (likely section headers)
            if len(words) == 1 and part.isupper():
                continue
            lower = part.lower()
            if any(kw in lower for kw in _NAME_BLOCKLIST):
                continue
            return part

    return "Applicant"

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

# Month name → number mapping for date-range parsing
_MONTH_MAP = {
    'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
    'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
}

def _parse_date(token: str) -> Optional[datetime.date]:
    """Try to parse a date token like 'Jan 2022', '2022', 'Present', 'Current'."""
    token = token.strip()
    now = datetime.date.today()
    if token.lower() in ('present', 'current', 'now', 'till date', 'to date'):
        return now
    # "Month YYYY"
    m = re.match(r'([a-zA-Z]+)\.?\s+(\d{4})', token)
    if m:
        mon = _MONTH_MAP.get(m.group(1).lower()[:3])
        if mon:
            return datetime.date(int(m.group(2)), mon, 1)
    # Plain year
    m = re.match(r'^(\d{4})$', token)
    if m:
        return datetime.date(int(m.group(1)), 1, 1)
    return None

def extract_years_experience(text: str) -> float:
    """
    Extracts total years of experience by:
    1. Summing actual employment date ranges (e.g. 'Jan 2020 – Mar 2023').
    2. Falling back to an explicit 'X years' mention.
    3. Last resort: oldest-to-current year span (only within experience text).
    """
    now = datetime.date.today()

    # --- Strategy 1: Explicit date-range intervals ---
    # Matches patterns like "Jan 2020 – Mar 2023" or "2019 - Present"
    range_pattern = re.compile(
        r'([A-Za-z]+\.?\s+\d{4}|\d{4})\s*[–\-—to]+\s*([A-Za-z]+\.?\s+\d{4}|\d{4}|[Pp]resent|[Cc]urrent|[Nn]ow)',
        re.IGNORECASE
    )
    total_days = 0
    found_ranges = False
    for match in range_pattern.finditer(text):
        start = _parse_date(match.group(1))
        end = _parse_date(match.group(2))
        if start and end and end >= start:
            total_days += (end - start).days
            found_ranges = True
    if found_ranges and total_days > 0:
        return round(total_days / 365.25, 1)

    # --- Strategy 2: Explicit "X years" mention ---
    exp_mentions = re.findall(r'(\d+(?:\.\d+)?)\+?\s*(?:year|yr)', text, re.IGNORECASE)
    if exp_mentions:
        return max(float(x) for x in exp_mentions)

    # --- Strategy 3: Year span only within the experience section ---
    years = [int(y) for y in re.findall(r'\b(19[89]\d|20[012]\d)\b', text)]
    if years:
        oldest = min(years)
        latest = max(years)
        span = latest - oldest
        if 1 <= span <= 50:  # sanity bounds
            return float(span)

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

