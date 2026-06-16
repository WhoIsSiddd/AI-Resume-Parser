/**
 * Synonym dictionary for semantic matching
 */
const skillSynonyms = {
  javascript: ['js', 'ecmascript', 'es6'],
  typescript: ['ts'],
  python: ['py'],
  react: ['react.js', 'reactjs'],
  node: ['node.js', 'nodejs'],
  express: ['express.js', 'expressjs'],
  machinelearning: ['ml', 'machine learning'],
  artificialintelligence: ['ai', 'artificial intelligence'],
  deeplearning: ['dl', 'deep learning'],
  aws: ['amazon web services'],
  gcp: ['google cloud platform'],
  postgres: ['postgresql', 'psql'],
  mongodb: ['mongo', 'mongoose'],
  ux: ['user experience', 'ux design'],
  ui: ['user interface', 'ui design'],
  html: ['html5'],
  css: ['css3']
};

/**
 * Action verbs to boost formatting score
 */
const strongActionVerbs = [
  'built', 'developed', 'designed', 'implemented', 'created', 'led', 
  'managed', 'optimized', 'improved', 'increased', 'decreased', 
  'spearheaded', 'orchestrated', 'architected', 'resolved', 'launched'
];

/**
 * Normalizes a skill string for comparison
 */
function normalizeSkill(skill) {
  const normalized = skill.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Check if it matches a known synonym
  for (const [canonical, synonyms] of Object.entries(skillSynonyms)) {
    if (normalized === canonical || synonyms.some(s => s.replace(/[^a-z0-9]/g, '') === normalized)) {
      return canonical;
    }
  }
  return normalized;
}

/**
 * Extract total years of experience from experience strings.
 * E.g. "3 Years and 4 months" -> 3.3
 */
export function extractYearsOfExperience(expStr) {
  if (!expStr) return 0;
  
  let years = 0;
  const yearMatch = expStr.match(/(\d+(?:\.\d+)?)\s*(?:year|yr)/i);
  if (yearMatch) years += parseFloat(yearMatch[1]);
  
  const monthMatch = expStr.match(/(\d+)\s*(?:month|mo)/i);
  if (monthMatch && !yearMatch) {
    years += parseInt(monthMatch[1]) / 12; // If only format like "6 months"
  } else if (monthMatch) {
    years += parseInt(monthMatch[1]) / 12; 
  }

  // fallback if just a plain number
  if (years === 0 && !isNaN(parseFloat(expStr))) {
    years = parseFloat(expStr);
  }
  
  return years;
}

/**
 * Analyze Resume against Job Description
 */
export function calculateATSScore(resumeData, jdData) {
  // 1. Skill Match (40%)
  const requiredSkills = (jdData.requiredSkills || []).map(normalizeSkill);
  const preferredSkills = (jdData.preferredSkills || []).map(normalizeSkill);
  const candidateSkills = (resumeData.skills || []).map(normalizeSkill);

  let matchedRequired = [];
  let missingRequired = [];
  
  requiredSkills.forEach(reqSkill => {
    if (candidateSkills.includes(reqSkill)) {
      matchedRequired.push(reqSkill);
    } else {
      missingRequired.push(reqSkill);
    }
  });

  let skillScore = 0;
  if (requiredSkills.length > 0) {
    skillScore = (matchedRequired.length / requiredSkills.length) * 100;
  } else {
    skillScore = candidateSkills.length > 0 ? 100 : 50; // default if JD has no skills
  }
  
  // Bonus points for preferred skills
  preferredSkills.forEach(pref => {
    if (candidateSkills.includes(pref) && skillScore < 100) {
      skillScore = Math.min(100, skillScore + 5);
    }
  });

  // 2. Experience Match (20%)
  const candidateExp = extractYearsOfExperience(resumeData.experience);
  const requiredExp = jdData.minExperience || 0;
  let expScore = 0;
  let experienceMatch = false;

  if (requiredExp === 0) {
    expScore = 100;
    experienceMatch = true;
  } else if (candidateExp >= requiredExp) {
    expScore = 100;
    experienceMatch = true;
  } else if (candidateExp > 0) {
    expScore = (candidateExp / requiredExp) * 100;
  }

  // 3. Education Match (15%)
  let eduScore = 30; // default: different field
  const candidateEdus = (resumeData.education || []).map(e => `${e.degree} ${e.institution}`.toLowerCase());
  const reqEdus = (jdData.educationRequirements || []).map(e => e.toLowerCase());

  if (reqEdus.length === 0) {
    eduScore = 100; // No requirements
  } else {
    let exactMatch = false;
    let relatedMatch = false;

    reqEdus.forEach(req => {
      candidateEdus.forEach(can => {
        if (can.includes(req)) exactMatch = true;
        else if (req.includes('computer science') && (can.includes('cs') || can.includes('software'))) relatedMatch = true;
        // Basic heuristic for related fields
      });
    });

    if (exactMatch) eduScore = 100;
    else if (relatedMatch) eduScore = 70;
  }

  // 4. Project Relevance (10%)
  let projScore = 0;
  const projects = resumeData.projects || [];
  if (projects.length === 0) {
    projScore = 0;
  } else {
    // Check if project tech stack or description contains required skills
    let relevantProjects = 0;
    projects.forEach(p => {
      const projText = `${p.name} ${p.description} ${(p.technologies || []).join(' ')}`.toLowerCase();
      let hasReqSkill = false;
      requiredSkills.forEach(req => {
        if (projText.includes(req)) hasReqSkill = true;
      });
      if (hasReqSkill) relevantProjects++;
    });

    projScore = projects.length > 0 ? Math.min(100, (relevantProjects / projects.length) * 100 + 40) : 0;
    if (projScore > 100) projScore = 100;
  }

  // 5. Certification Matching (10%)
  let certScore = 0;
  const candidateCerts = (resumeData.certifications || []).map(c => c.toLowerCase());
  const reqCerts = (jdData.certifications || []).map(c => c.toLowerCase());

  if (reqCerts.length === 0) {
    certScore = candidateCerts.length > 0 ? 100 : 80;
  } else {
    let matchedCerts = 0;
    reqCerts.forEach(req => {
      if (candidateCerts.some(c => c.includes(req))) matchedCerts++;
    });
    certScore = (matchedCerts / reqCerts.length) * 100;
  }

  // 6. Formatting & Structure (5%)
  let formatScore = 50; 
  if (resumeData.skills && resumeData.skills.length > 0) formatScore += 10;
  if (resumeData.experience && resumeData.experience.length > 3) formatScore += 10;
  if (resumeData.education && resumeData.education.length > 0) formatScore += 10;
  
  // Action verbs check (bonus)
  const fullText = [
    resumeData.summary || '',
    ...(resumeData.projects || []).map(p => p.description || ''),
    resumeData.experience || '' // Assuming we get full exp text. If not, maybe pass raw text here
  ].join(' ').toLowerCase();

  let verbsCount = 0;
  strongActionVerbs.forEach(verb => {
    if (fullText.includes(verb)) verbsCount++;
  });
  
  if (verbsCount > 0) formatScore += 10;
  if (verbsCount >= 3) formatScore += 10;

  formatScore = Math.min(100, formatScore);

  // --- FINAL CALCULATION ---
  const finalScore = Math.round(
    0.40 * skillScore +
    0.20 * expScore +
    0.15 * eduScore +
    0.10 * projScore +
    0.10 * certScore +
    0.05 * formatScore
  );

  // Recommendations Generation
  const recommendations = [];
  if (missingRequired.length > 0) {
    recommendations.push(`Missing critical required skills: ${missingRequired.slice(0, 3).join(', ')}.`);
  }
  if (!experienceMatch) {
    recommendations.push(`Your experience (${candidateExp} years) is below the requirement (${requiredExp} years). Focus on showcasing intensive projects.`);
  }
  if (projScore < 60) {
    recommendations.push(`Your projects don't strongly highlight the required job skills. Try detailing how you used them.`);
  }
  if (verbsCount === 0) {
    recommendations.push(`Use strong action verbs like 'Built', 'Managed', or 'Optimized' in your experience descriptions.`);
  }
  if (eduScore < 70) {
    recommendations.push(`Consider adding relevant certifications if your degree doesn't exactly match the job requirements.`);
  }

  // Optional generic recommendation if they did really well
  if (recommendations.length === 0) {
    recommendations.push(`Great resume! Make sure to tailor your cover letter to the company core values.`);
  }

  return {
    atsScore: finalScore,
    atsBreakdown: {
      skillScore: Math.round(skillScore),
      experienceScore: Math.round(expScore),
      educationScore: Math.round(eduScore),
      projectScore: Math.round(projScore),
      certificationScore: Math.round(certScore),
      formattingScore: Math.round(formatScore),
    },
    feedback: {
      matchedSkills: matchedRequired,
      // Pass back original names of missing skills for display, not normalized
      missingSkills: requiredSkills
        .filter(r => missingRequired.includes(r))
        .map(req => jdData.requiredSkills.find(orig => normalizeSkill(orig) === req) || req),
      experienceMatch,
      recommendations
    },
    experienceYears: candidateExp
  };
}
