import { ResumeData } from '../types';

const API_BASE = '/api';

/**
 * Upload files and parse resumes via the backend API
 */
export async function parseResumes(files: File[], jobDescription?: string): Promise<{
  resumes: ResumeData[];
  errors?: { fileName: string; error: string }[];
  message: string;
}> {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('resumes', file);
  });
  if (jobDescription) {
    formData.append('jobDescription', jobDescription);
  }

  const response = await fetch(`${API_BASE}/resumes/parse`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Upload failed with status ${response.status}`);
  }

  const data = await response.json();

  // Convert uploadedAt strings to Date objects
  const resumes: ResumeData[] = data.resumes.map((r: ResumeData & { uploadedAt: string }) => ({
    ...r,
    uploadedAt: new Date(r.uploadedAt),
  }));

  return {
    resumes,
    errors: data.errors,
    message: data.message,
  };
}

/**
 * Fetch all previously parsed resumes
 */
export async function fetchResumes(): Promise<ResumeData[]> {
  const response = await fetch(`${API_BASE}/resumes`);

  if (!response.ok) {
    throw new Error('Failed to fetch resumes');
  }

  const data = await response.json();

  return data.resumes.map((r: ResumeData & { uploadedAt: string }) => ({
    ...r,
    uploadedAt: new Date(r.uploadedAt),
  }));
}
