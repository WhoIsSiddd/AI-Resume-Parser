import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase credentials not found in .env — persistence will be disabled');
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

/**
 * Save a parsed resume to the Supabase `resumes` table
 */
export async function saveResume(resumeData) {
  if (!supabase) {
    console.warn('Supabase not configured, skipping save');
    return resumeData;
  }

  try {
    const { data, error } = await supabase
      .from('resumes')
      .insert({
        id: resumeData.id,
        file_name: resumeData.fileName,
        name: resumeData.name,
        email: resumeData.email,
        phone: resumeData.phone,
        location: resumeData.location,
        linkedin: resumeData.linkedin,
        github: resumeData.github,
        summary: resumeData.summary,
        skills: resumeData.skills,
        experience: resumeData.experience,
        experience_years: resumeData.experienceYears,
        education: resumeData.education,
        projects: resumeData.projects,
        certifications: resumeData.certifications,
        predicted_role: resumeData.predictedRole,
        ats_score: resumeData.atsScore,
        ats_breakdown: resumeData.atsBreakdown,
        feedback: resumeData.feedback,
        confidence: resumeData.confidence,
        entities: resumeData.entities,
        uploaded_at: resumeData.uploadedAt
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error.message);
      return resumeData; 
    }

    return resumeData;
  } catch (error) {
    console.error('Supabase save error:', error.message);
    return resumeData;
  }
}

/**
 * Fetch all resumes from Supabase
 */
export async function getResumes() {
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error.message);
      return [];
    }

    // Map DB columns back to frontend camelCase format
    return data.map(row => ({
      id: row.id,
      fileName: row.file_name,
      name: row.name,
      email: row.email,
      phone: row.phone,
      location: row.location,
      linkedin: row.linkedin,
      github: row.github,
      summary: row.summary,
      skills: row.skills,
      experience: row.experience,
      experienceYears: row.experience_years,
      education: row.education,
      projects: row.projects,
      certifications: row.certifications,
      predictedRole: row.predicted_role,
      atsScore: row.ats_score,
      atsBreakdown: row.ats_breakdown,
      feedback: row.feedback,
      confidence: row.confidence,
      entities: row.entities,
      uploadedAt: new Date(row.uploaded_at)
    }));
  } catch (error) {
    console.error('Supabase fetch error:', error.message);
    return [];
  }
}
