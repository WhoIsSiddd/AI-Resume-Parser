import { calculateATSScore } from './atsEngine.js';

// Comprehensive dictionary for local skill extraction
const MASTER_SKILLS_DB = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Ruby', 'Go', 'Rust', 'PHP', 'Swift', 'Kotlin',
  'React', 'React Native', 'Angular', 'Vue', 'Svelte', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Jenkins', 'GitHub Actions',
  'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'GraphQL', 'REST API',
  'Machine Learning', 'AI', 'Data Science', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
  'HTML', 'CSS', 'Tailwind', 'SASS', 'Figma', 'UX/UI',
  'Agile', 'Scrum', 'Jira', 'Git', 'Linux'
];

/**
 * Parses JD locally using strictly regex and keyword arrays.
 */
export async function parseJDWithLocal(jdText) {
  if (!jdText || jdText.trim().length < 10) {
    return {
      title: 'Unknown Role',
      requiredSkills: [],
      preferredSkills: [],
      minExperience: 0,
      educationRequirements: [],
      certifications: []
    };
  }

  const textLower = jdText.toLowerCase();

  // 1. Title Heuristics
  let title = 'Software Engineer';
  const roleMatch = jdText.match(/(?:role|title|position)[\s:]*([a-zA-Z\s]+(?:developer|engineer|designer|manager|architect|analyst))/i);
  if (roleMatch) title = roleMatch[1].trim();

  // 2. Skill Extraction
  const extractedSkills = MASTER_SKILLS_DB.filter(skill => textLower.includes(skill.toLowerCase()));
  
  // 3. Experience
  let minExperience = 0;
  const expMatch = textLower.match(/(\d+)(?:\+|-|\s*to\s*\d+)?\s*(?:years|yrs)/);
  if (expMatch) minExperience = parseInt(expMatch[1], 10);

  // 4. Education Requirements
  const educationRequirements = [];
  if (/bachelor|bs|b\.s|b.a/i.test(textLower)) educationRequirements.push("Bachelor's Degree");
  if (/master|ms|m\.s|mba/i.test(textLower)) educationRequirements.push("Master's Degree");
  if (/phd|ph\.d/i.test(textLower)) educationRequirements.push("PhD");
  if (/computer science|cs\b|software engineering/i.test(textLower)) educationRequirements.push("Computer Science");

  // 5. Certifications
  const certs = ['AWS', 'Azure', 'GCP', 'Cisco', 'CompTIA', 'PMP', 'CISSP'];
  const certifications = certs.filter(c => textLower.includes(c.toLowerCase()));

  return {
    title,
    requiredSkills: extractedSkills.slice(0, Math.ceil(extractedSkills.length * 0.7)), // rough split
    preferredSkills: extractedSkills.slice(Math.ceil(extractedSkills.length * 0.7)),
    minExperience,
    educationRequirements,
    certifications
  };
}

/**
 * Extracts candidate data natively using REGEX to completely replace Gemini.
 */
export async function analyzeWithLocal(text, fileName, jdData) {
  const textLower = text.toLowerCase();
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Basic Info
  // Name heuristics (usually first line with no special chars and length 2-30)
  const invalidNameKeywords = [
    'contact', 'contact info', 'contact information', 'email', 'phone', 'address', 
    'resume', 'cv', 'curriculum vitae', 'profile', 'summary', 'personal profile', 
    'professional summary', 'executive summary', 'experience', 'work experience', 
    'employment history', 'education', 'academic background', 'skills', 'technical skills', 
    'core competencies', 'projects', 'certifications', 'portfolio', 'about', 'about me'
  ];

  const name = lines.find(l => {
    const trimmed = l.trim();
    if (trimmed.length < 2 || trimmed.length > 40) return false;
    // Must not contain @, numbers, or underscore
    if (/[@\d_]/.test(trimmed)) return false;
    
    const lower = trimmed.toLowerCase();
    // Exclude exact matches with common section headers
    if (invalidNameKeywords.includes(lower)) return false;
    
    // Exclude if it starts with header + colon/dash
    if (invalidNameKeywords.some(kw => lower.startsWith(kw + ':') || lower.startsWith(kw + '-'))) return false;
    
    // Exclude purely symbolic/punctuation lines
    if (/^[^\w\s]+$/.test(trimmed)) return false;

    // Reject if it contains characters almost never found in names (e.g., commas, colons, slashes)
    // This immediately filters out "City, State", dates, and emails.
    if (/[^a-zA-Z\s\-'.À-ÖØ-öø-ÿ]/.test(trimmed)) return false;

    // Exclude location-like keywords and common address terms
    if (/\b(?:street|st\.?|ave|avenue|blvd|boulevard|rd\.?|road|lane|ln\.?|drive|dr\.?|apt|apartment|suite|ste)\b/i.test(trimmed)) return false;
    
    // Exclude common job title words that might be mistaken for a name
    if (/\b(?:analyst|engineer|developer|manager|designer|architect|consultant|data|software|specialist|student|intern)\b/i.test(trimmed)) return false;

    // Exclude common city/state names that might lack a comma
    if (/\b(?:new york|san francisco|chicago|los angeles|boston|seattle|austin|texas|california|london|india|remote)\b/i.test(trimmed)) return false;

    // Exclude links or common technical words if they slipped by
    if (/(?:github|linkedin|http|www\.)/i.test(trimmed)) return false;

    // Exclude if it has too many words (names usually have 1 to 4 words)
    const wordCount = trimmed.split(/\s+/).length;
    if (wordCount > 4 || wordCount < 1) return false;

    return true;
  }) || 'Applicant Name';
  
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[a-zA-Z0-9-.]+/);
  const email = emailMatch ? emailMatch[0] : '';
  
  const phoneMatch = text.match(/(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?/i);
  const phone = phoneMatch ? phoneMatch[0].trim() : '';
  
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-:]+/i);
  const linkedin = linkedinMatch ? `https://www.${linkedinMatch[0]}` : '';
  
  const githubMatch = text.match(/github\.com\/[\w-]+/i);
  const github = githubMatch ? `https://${githubMatch[0]}` : '';

  // 2. Experience string builder
  const expMatch = textLower.match(/(\d+)\+?\s*(?:years?|yrs?)/i);
  const experience = expMatch ? `${expMatch[1]} Years` : 'Unknown';

  // 3. Project Parsing (very rough structure check)
  const projects = [];
  if (textLower.includes('project')) {
    projects.push({
      name: "Portfolio Project",
      description: "Extracted local project placeholder (Requires AI for deep context)",
      technologies: ["JavaScript", "HTML"]
    });
  }

  // 4. Education Parsing
  const education = [];
  if (textLower.includes('university') || textLower.includes('college') || textLower.includes('bachelor') || textLower.includes('degree')) {
    education.push({
      degree: textLower.match(/bachelor|master|phd/i) ? textLower.match(/bachelor|master|phd/i)[0] : "Degree",
      institution: "Local University",
      year: "Graduated"
    });
  }

  // 5. Calculate Skills
  const skills = MASTER_SKILLS_DB.filter(skill => textLower.includes(skill.toLowerCase()));

  // 6. Certifications
  const certKeywords = ['AWS Certified', 'Google Cloud Professional', 'Scrum Master', 'CISSP', 'Azure Fundamentals'];
  const certifications = certKeywords.filter(c => textLower.includes(c.toLowerCase()));

  const baseData = {
    name,
    email,
    phone,
    location: '',
    linkedin,
    github,
    summary: '',
    skills,
    experience,
    predictedRole: jdData.title || 'Candidate',
    education,
    projects,
    certifications,
    confidence: 1.0, 
    entities: []
  };

  // Run through ATS Engine internally
  const atsResult = calculateATSScore(baseData, jdData);

  return {
    ...baseData,
    atsScore: atsResult.atsScore,
    atsBreakdown: atsResult.atsBreakdown,
    feedback: atsResult.feedback,
    experienceYears: atsResult.experienceYears
  };
}
