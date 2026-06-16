from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any

class JDData(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    title: str
    requiredSkills: List[str]
    preferredSkills: List[str]
    minExperience: int
    educationRequirements: List[str]
    certifications: List[str]

class ParseRequest(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    jd_data: Optional[JDData] = None

class FeedbackPoint(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    type: str # 'missing_skill', 'weak_verb', 'general'
    message: str

class ATSBreakdown(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    skillScore: int
    preferredSkillScore: int
    experienceScore: int
    educationScore: int
    projectScore: int
    certificationScore: int
    formattingScore: int

class ATSFeedback(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    matchedSkills: List[str]
    matchedPreferredSkills: List[str]
    missingSkills: List[str]
    experienceMatch: bool
    recommendations: List[str]

class ParseResult(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    name: str
    email: str
    phone: str
    location: str
    linkedin: str
    github: str
    summary: str
    skills: List[str]
    experience: str
    experienceYears: float
    education: List[Dict[str, str]]
    projects: List[Dict[str, Any]]
    certifications: List[str]
    atsScore: int
    atsBreakdown: ATSBreakdown
    feedback: ATSFeedback
