from sentence_transformers import util
from typing import Dict, Any, List, Tuple
from ai_engine.skill_extractor import embedding_model, MASTER_SKILLS

def score_skills_semantic(candidate_skills: List[str], required_skills: List[str]) -> Tuple[float, List[str], List[str]]:
    """
    Compute how well the candidate skills match the requested skills.
    Returns (score, matched_list, missing_list).
    """
    if not required_skills:
        return 100.0, [], []
    if not candidate_skills:
        return 0.0, [], required_skills

    if not embedding_model:
        matched = [sk for sk in required_skills if any(sk.lower() == c.lower() for c in candidate_skills)]
        missing = [sk for sk in required_skills if sk not in matched]
        score = (len(matched) / len(required_skills)) * 100
        return score, matched, missing

    req_embeds = embedding_model.encode(required_skills, convert_to_tensor=True)
    can_embeds = embedding_model.encode(candidate_skills, convert_to_tensor=True)

    cos_scores = util.cos_sim(can_embeds, req_embeds)

    matched = []
    missing = []
    total_score = 0.0
    threshold = 0.65 

    for j, req_skill in enumerate(required_skills):
        best_score = float(cos_scores[:, j].max())
        if best_score > threshold:
            matched.append(req_skill)
            total_score += 1.0 
        else:
            missing.append(req_skill)
            total_score += max(0.0, (best_score - 0.4) * 0.8) # Adjusted partial credit

    final_score = (total_score / len(required_skills)) * 100
    return min(100.0, final_score), matched, missing

def calculate_ats_score(resume_data: Dict[str, Any], jd_data: Dict[str, Any]) -> Dict[str, Any]:
    # 1. Required Skill Match (35%)
    req_skills = jd_data.get('requiredSkills', [])
    can_skills = resume_data.get('skills', [])
    skill_score, matched_skills, missing_skills = score_skills_semantic(can_skills, req_skills)

    # 2. Preferred Skill Match (10%)
    pref_skills = jd_data.get('preferredSkills', [])
    pref_score = 100.0
    matched_pref = []
    if pref_skills:
        pref_score, matched_pref, _ = score_skills_semantic(can_skills, pref_skills)

    # 3. Experience Match (20%)
    req_exp = float(jd_data.get('minExperience', 0))
    can_exp = resume_data.get('experienceYears', 0.0)
    
    if req_exp == 0:
        exp_score = 100.0
        exp_match = True
    elif can_exp >= req_exp:
        # Bonus for extra experience (up to 110%)
        exp_score = min(110.0, 100.0 + (can_exp - req_exp) * 2)
        exp_match = True
    else:
        exp_score = (can_exp / req_exp) * 100 if can_exp > 0 else 10.0 # Base 10 for having some text
        exp_match = False

    # 4. Education Match (15%)
    req_edu = jd_data.get('educationRequirements', [])
    can_edu_text = str(resume_data.get('education', ""))
    edu_score = 70.0 # Baseline
    if not req_edu:
        edu_score = 100.0
    else:
        for edu in req_edu:
            if edu.lower() in can_edu_text.lower():
                edu_score = 100.0
                break

    # 5. Project Relevance (10%)
    can_projects = resume_data.get('projects', [])
    if isinstance(can_projects, list):
         proj_count = len([p for p in can_projects if p])
         proj_score = min(100.0, proj_count * 33.3) # 3+ projects for full score
    else:
         proj_score = 50.0 if can_projects else 0.0
    
    # 6. Certifications (5%)
    req_certs = jd_data.get('certifications', [])
    can_certs = resume_data.get('certifications', [])
    if not req_certs:
        cert_score = 100.0
    else:
        matched_certs = [c for c in req_certs if any(c.lower() in str(cc).lower() for cc in can_certs)]
        cert_score = (len(matched_certs) / len(req_certs)) * 100 if req_certs else 100.0

    # 7. Formatting / Verbs / Profile (5%)
    format_score = 90.0 if resume_data.get('summary') else 70.0

    final_score = (
        (skill_score * 0.35) +
        (pref_score * 0.10) +
        (exp_score * 0.20) +
        (edu_score * 0.15) +
        (proj_score * 0.10) +
        (cert_score * 0.05) +
        (format_score * 0.05)
    )

    return {
        "atsScore": int(final_score),
        "atsBreakdown": {
            "skillScore": int(skill_score),
            "preferredSkillScore": int(pref_score),
            "experienceScore": int(exp_score),
            "educationScore": int(edu_score),
            "projectScore": int(proj_score),
            "certificationScore": int(cert_score),
            "formattingScore": int(format_score)
        },
        "feedback": {
            "matchedSkills": matched_skills,
            "matchedPreferredSkills": matched_pref,
            "missingSkills": missing_skills,
            "experienceMatch": exp_match,
            "recommendations": [] 
        }
    }

