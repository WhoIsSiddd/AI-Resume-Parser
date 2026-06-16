import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { parseFile } from '../services/fileParser.js';
import { analyzeWithLocal, parseJDWithLocal } from '../services/localParser.js';
import { saveResume, getResumes } from '../services/supabaseClient.js';

const router = Router();

// Configure multer for memory storage (files stay in buffer, not saved to disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max per file
    files: 20 // Max 20 files at once
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.originalname}. Only PDF and DOCX files are allowed.`));
    }
  }
});

/**
 * POST /api/resumes/parse
 * Upload and parse resume files
 */
router.post('/parse', upload.array('resumes', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const jdText = req.body.jobDescription || '';
    
    console.log(`📄 Processing ${req.files.length} resume(s)...`);
    if (jdText) console.log(`💼 With Job Description (${jdText.length} chars)`);

    // Step 1: Parse the Job Description locally
    const jdData = await parseJDWithLocal(jdText);

    const results = [];
    const errors = [];

    for (const file of req.files) {
      try {
        console.log(`  → Parsing: ${file.originalname} (${(file.size / 1024).toFixed(1)} KB)`);

        let resumeData;

        try {
          // Send the raw file buffer directly to Python AI service (it handles parsing internally)
          const formData = new FormData();
          const blob = new Blob([file.buffer], { type: file.mimetype });
          formData.append('file', blob, file.originalname);
          
          if (jdData) {
            formData.append('jd_data', JSON.stringify(jdData));
          }

          // 30-second timeout to prevent hanging forever
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 90000);

          const aiResponse = await fetch('http://127.0.0.1:8000/api/parse', {
            method: 'POST',
            body: formData,
            signal: controller.signal
          });
          clearTimeout(timeout);

          if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            throw new Error(`AI Engine Error: ${errorText}`);
          }

          const analysis = await aiResponse.json();

          resumeData = {
            id: uuidv4(),
            fileName: file.originalname,
            name: analysis.name,
            email: analysis.email,
            phone: analysis.phone,
            location: analysis.location,
            linkedin: analysis.linkedin,
            github: analysis.github,
            summary: analysis.summary,
            skills: analysis.skills,
            experience: analysis.experience,
            experienceYears: analysis.experienceYears,
            education: analysis.education,
            projects: analysis.projects,
            certifications: analysis.certifications,
            predictedRole: analysis.predictedRole,
            atsScore: analysis.atsScore,
            atsBreakdown: analysis.atsBreakdown,
            feedback: analysis.feedback,
            confidence: analysis.confidence,
            entities: analysis.entities,
            uploadedAt: new Date().toISOString()
          };

        } catch (aiError) {
          // Fallback: if Python AI service is down or timed out, use local parsing
          console.warn(`  ⚠️ AI Engine unavailable (${aiError.message}), falling back to local parser...`);
          
          const text = await parseFile(file.buffer, file.mimetype);
          if (!text || text.trim().length < 20) {
            throw new Error('Could not extract sufficient text from this file');
          }
          
          const analysis = await analyzeWithLocal(text, file.originalname, jdData || {
            title: 'Unknown Role', requiredSkills: [], preferredSkills: [],
            minExperience: 0, educationRequirements: [], certifications: []
          });

          resumeData = {
            id: uuidv4(),
            fileName: file.originalname,
            ...analysis,
            uploadedAt: new Date().toISOString()
          };
        }

        // Save to Supabase
        await saveResume(resumeData);

        results.push(resumeData);
        console.log(`  ✅ Done: ${file.originalname} → ${resumeData.name} (ATS: ${resumeData.atsScore})`);
      } catch (fileError) {
        console.error(`  ❌ Error processing ${file.originalname}:`, fileError.message);
        errors.push({
          fileName: file.originalname,
          error: fileError.message
        });
      }
    }

    if (results.length === 0 && errors.length > 0) {
      return res.status(422).json({
        error: 'Failed to process all files',
        details: errors
      });
    }

    res.json({
      success: true,
      resumes: results,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully parsed ${results.length} of ${req.files.length} resume(s)`
    });
  } catch (error) {
    console.error('Parse route error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/resumes
 * Fetch all previously parsed resumes from Supabase
 */
router.get('/', async (req, res) => {
  try {
    const resumes = await getResumes();
    res.json({ success: true, resumes });
  } catch (error) {
    console.error('Fetch resumes error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle multer errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum is 20 files.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

export default router;
