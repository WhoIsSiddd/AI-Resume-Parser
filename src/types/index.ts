export interface Education {
  degree: string;
  institution: string;
  year?: string;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
}

export interface ATSBreakdown {
  skillScore: number;
  preferredSkillScore: number;
  experienceScore: number;
  educationScore: number;
  projectScore: number;
  certificationScore: number;
  formattingScore: number;
}

export interface ATSFeedback {
  matchedSkills: string[];
  matchedPreferredSkills?: string[];
  missingSkills: string[];
  experienceMatch: boolean;
  recommendations: string[];
}

export interface ResumeData {
  id: string;
  fileName: string;
  
  // Basic Info
  name: string;
  email: string;
  phone: string;
  location?: string;
  linkedin?: string;
  github?: string;
  summary?: string;
  
  // Extracted Data
  skills: string[];
  experience: string;
  experienceYears: number; // Parsed years for calculation
  education: Education[];
  projects: Project[];
  certifications: string[];
  
  // AI/ATS Results
  predictedRole: string;
  atsScore: number;
  atsBreakdown: ATSBreakdown;
  feedback: ATSFeedback;
  confidence: number;
  
  entities: {
    type: string;
    value: string;
  }[];
  uploadedAt: Date;
}

export interface JobDescription {
  id?: string;
  title: string;
  requiredSkills: string[];
  preferredSkills: string[];
  minExperience: number;
  educationRequirements: string[];
  certifications: string[];
}

export type Page = 'home' | 'upload' | 'results';
