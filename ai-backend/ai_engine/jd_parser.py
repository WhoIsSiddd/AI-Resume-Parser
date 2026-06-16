import json
from typing import Dict, Any, List
# Reusing the existing model from skill_extractor
from .skill_extractor import embedding_model, extract_skills

def parse_jd(jd_json_str: str) -> Dict[str, Any]:
    """
    Parses Job Description string (expected in JSON).
    Embeds the requirements for semantic matching.
    """
    try:
        jd_data = json.loads(jd_json_str)
        
        # We ensure we have these keys
        required_skills = jd_data.get('requiredSkills', [])
        preferred_skills = jd_data.get('preferredSkills', [])
        min_exp = jd_data.get('minExperience', 0)
        
        # Create embeddings for required skills for rapid scanning later
        req_embeddings = None
        if embedding_model and required_skills:
            req_embeddings = embedding_model.encode(required_skills, convert_to_tensor=True)
            
        jd_data['req_embeddings'] = req_embeddings
        return jd_data
        
    except json.JSONDecodeError:
        print("Warning: JD Data was not valid JSON.")
        return {
            "title": "Unknown Role",
            "requiredSkills": [],
            "preferredSkills": [],
            "minExperience": 0,
            "educationRequirements": [],
            "certifications": [],
            "req_embeddings": None
        }
