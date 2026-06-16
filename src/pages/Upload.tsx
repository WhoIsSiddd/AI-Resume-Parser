import { useState, useRef, DragEvent } from 'react';
import { Upload as UploadIcon, X, FileText, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { ResumeData } from '../types';
import { parseResumes } from '../services/api';

interface UploadProps {
  onNavigate: (page: 'home' | 'results') => void;
  onUploadComplete: (resumes: ResumeData[]) => void;
}

export function Upload({ onNavigate, onUploadComplete }: UploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const validateFile = (file: File): boolean => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      setError('Only PDF and DOCX files are supported');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return false;
    }
    return true;
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(null);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(validateFile);

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setSuccess(`${validFiles.length} file(s) added successfully`);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles = selectedFiles.filter(validateFile);

      if (validFiles.length > 0) {
        setFiles(prev => [...prev, ...validFiles]);
        setSuccess(`${validFiles.length} file(s) added successfully`);
        setTimeout(() => setSuccess(null), 3000);
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await parseResumes(files, jobDescription);

      if (result.errors && result.errors.length > 0) {
        const failedFiles = result.errors.map(e => e.fileName).join(', ');
        setError(`Some files could not be processed: ${failedFiles}`);
      }

      if (result.resumes.length > 0) {
        setIsProcessing(false);
        onUploadComplete(result.resumes);
        onNavigate('results');
      } else {
        setIsProcessing(false);
        setError('No resumes could be parsed. Please try different files.');
      }
    } catch (err) {
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : 'Failed to parse resumes. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500">
      <div className="container mx-auto px-6 py-12">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Upload Your Resume
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Upload one or multiple resumes for AI-powered analysis
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3 animate-slide-down">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-3 animate-slide-down">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-green-700 dark:text-green-300">{success}</p>
            </div>
          )}

          <div className="mb-8">
            <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2" htmlFor="jobDescription">
              Job Description (Optional but recommended for ATS Scoring)
            </label>
            <textarea
              id="jobDescription"
              className="w-full h-32 p-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all resize-y shadow-sm"
              placeholder="Paste the job description here to enable strict skill matching and weighted ATS scoring..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${isDragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
              } hover:border-blue-400 dark:hover:border-blue-500`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 animate-float">
                <UploadIcon className="w-10 h-10 text-white" />
              </div>

              <h3 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-white">
                {isDragging ? 'Drop files here' : 'Drag & Drop your files'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">or</p>

              <Button onClick={() => fileInputRef.current?.click()} variant="secondary">
                Choose Files
              </Button>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                Supported formats: PDF, DOCX (Max 10MB)
              </p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-8 space-y-3">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                Selected Files ({files.length})
              </h3>
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-300 animate-slide-in-left"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">{file.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {files.length > 0 && (
            <div className="mt-8 text-center">
              <Button onClick={handleSubmit} disabled={isProcessing}>
                {isProcessing ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Parsing Resumes...</span>
                  </div>
                ) : (
                  'Parse Resumes'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
