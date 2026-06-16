from typing import Dict, Any, List

def generate_feedback(ats_result: Dict[str, Any], resume_data: Dict[str, Any], jd_data: Dict[str, Any]) -> List[str]:
    """
    Generates actionable feedback based on the ATS score breakdown and resume content.
    """
    recommendations = []
    breakdown = ats_result['atsBreakdown']
    feedback_data = ats_result['feedback']
    
    # 1. Skills Feedback
    missing_skills = feedback_data['missingSkills']
    if missing_skills:
        skill_ref = ", ".join(missing_skills[:3])
        if len(missing_skills) > 3:
            skill_ref += f" and {len(missing_skills) - 3} more"
        recommendations.append(f"🔍 **Skill Gap:** We couldn't find strong semantic matches for: {skill_ref}. Consider adding these if you have experience with them.")
    
    matched_pref = feedback_data.get('matchedPreferredSkills', [])
    if jd_data.get('preferredSkills') and not matched_pref:
        recommendations.append("💡 **Bonus Opportunity:** You haven't matched any 'Preferred Skills'. Adding these could give you a competitive edge.")

    # 2. Experience Feedback
    if not feedback_data['experienceMatch']:
        req_exp = jd_data.get('minExperience', 0)
        can_exp = resume_data.get('experienceYears', 0)
        recommendations.append(f"⏳ **Experience:** You have ~{can_exp} years, but the role asks for {req_exp}. Focus on quantifying your impact in your current roles to bridge this gap.")
    elif breakdown['experienceScore'] > 100:
        recommendations.append("🌟 **Seniority:** Your experience exceeds the requirements. Ensure your summary reflects leadership and strategic contributions.")

    # 3. Education Feedback
    if breakdown['educationScore'] < 100 and jd_data.get('educationRequirements'):
        recommendations.append("🎓 **Education:** The job description mentions specific degrees. If you have a different background, emphasize relevant certifications or specialized training.")

    # 4. Projects Feedback
    if breakdown['projectScore'] < 70:
        recommendations.append("🚀 **Projects:** Your project section is light. Adding 1-2 detailed projects with links to GitHub or demos can significantly boost your credibility.")
    
    # 5. Formatting & Summary
    if breakdown['formattingScore'] < 80:
        recommendations.append("📝 **Formatting:** Your resume lacks a professional summary. A 3-line punchy intro can help ATS and recruiters quickly understand your value proposition.")

    # 6. Overall Sentiment
    score = ats_result['atsScore']
    if score >= 80:
        recommendations.insert(0, "✅ **Strong Match:** Your profile aligns very well with this role!")
    elif score >= 60:
        recommendations.insert(0, "🟡 **Good Potential:** You have the core foundation. A few tweaks to your skills and project sections could make you a top candidate.")
    else:
        recommendations.insert(0, "🚩 **Attention Needed:** There are significant gaps between your resume and this JD. Consider tailoring your experience more closely.")

    # Update the result directly
    ats_result['feedback']['recommendations'] = recommendations
    return recommendations

