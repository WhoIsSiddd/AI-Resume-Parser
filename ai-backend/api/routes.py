from flask import Blueprint, request, jsonify, abort
from typing import Optional
import json
from api.schemas import ParseResult, JDData

api_bp = Blueprint('api', __name__)

@api_bp.route("/health", methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"})

@api_bp.route("/parse", methods=['POST'])
def parse_resume():
    """
    Parses a resume and optionally evaluates it against a Job Description.
    """
    try:
        # Parse JD data if provided
        jd_data = request.form.get('jd_data')
        file = request.files.get('file')
        
        if not file:
            return jsonify({"detail": "No file provided"}), 400
        if jd_data:
            from ai_engine.jd_parser import parse_jd
            parsed_jd = parse_jd(jd_data)
        else:
            parsed_jd = {
                "title": "Unknown Role",
                "requiredSkills": [],
                "preferredSkills": [],
                "minExperience": 0,
                "educationRequirements": [],
                "certifications": [],
                "req_embeddings": None
            }
        
        # Read file contents
        contents = file.read()
        filename = file.filename

        # 1. Extract text
        from ai_engine.resume_parser import parse_pdf, parse_docx, extract_name, extract_contact_info, extract_location, split_into_sections, extract_years_experience
        
        if not filename.lower().endswith(('.pdf', '.docx')):
            return jsonify({"detail": "Unsupported file format"}), 400
        
        if filename.lower().endswith('.pdf'):
            raw_text = parse_pdf(contents)
        else:
            raw_text = parse_docx(contents)

        if not raw_text.strip():
            return jsonify({"detail": "Could not extract text from file"}), 400

        # 2. Extract sections & entities
        sections = split_into_sections(raw_text)
        name = extract_name(raw_text)
        contact_info = extract_contact_info(raw_text)
        location = extract_location(raw_text)
        experience_years = extract_years_experience(sections["experience"]) or extract_years_experience(raw_text)

        # 3. Extract Skills using Semantic Search
        from ai_engine.skill_extractor import extract_skills
        extracted_skills = extract_skills(raw_text)

        # Build Candidate Data object
        base_data = {
            "name": name,
            "email": contact_info["email"],
            "phone": contact_info["phone"],
            "location": location,
            "linkedin": contact_info["linkedin"],
            "github": contact_info["github"],
            "summary": sections["summary"].strip(),
            "skills": extracted_skills,
            "experience": f"{experience_years:g} Years" if experience_years else "Unknown",
            "experienceYears": experience_years,
            "education": [{"institution": "Extracted from resume", "degree": "Detected"}] if sections["education"].strip() else [],
            "projects": [{"name": "Key Project", "description": sections["projects"].strip()}] if sections["projects"].strip() else [],
            "certifications": [c.strip() for c in sections["certifications"].split('\n') if c.strip()]
        }

        # 4. Calculate ATS Score using Semantic Embeddings
        from ai_engine.ats_scoring import calculate_ats_score
        from ai_engine.feedback_generator import generate_feedback
        
        ats_result = calculate_ats_score(base_data, parsed_jd)
        
        # 5. Generate NLP Feedback
        generate_feedback(ats_result, base_data, parsed_jd)

        return jsonify(base_data | {
            "atsScore": ats_result['atsScore'],
            "atsBreakdown": ats_result['atsBreakdown'],
            "feedback": ats_result['feedback']
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"detail": str(e)}), 500
