import { useState } from 'react';
import { 
  ArrowLeft, Download, Trophy, Mail, Phone, 
  MapPin, Linkedin, Github, CheckCircle2, 
  XCircle, ChevronRight, FileText, Star, Zap, TrendingUp
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip
} from 'recharts';
import { ResumeData } from '../types';

interface ResultsProps {
  onNavigate: (page: 'home' | 'upload') => void;
  resumes: ResumeData[];
}

export function Results({ onNavigate, resumes }: ResultsProps) {
  const [selectedResume, setSelectedResume] = useState<ResumeData | null>(
    resumes.length > 0 ? resumes[0] : null
  );

  const sortedResumes = [...resumes].sort((a, b) => b.atsScore - a.atsScore);

  const handleDownloadCSV = () => {
    // Basic CSV generation
    const headers = ['Rank', 'Name', 'Email', 'ATS Score', 'Predicted Role', 'Experience'];
    const rows = sortedResumes.map((resume, index) => [
      index + 1,
      resume.name,
      resume.email,
      resume.atsScore,
      resume.predictedRole,
      resume.experience
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ats_rankings_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-500 dark:text-amber-400';
    return 'text-rose-500 dark:text-rose-400';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-500';
    if (score >= 60) return 'from-amber-500 to-orange-500 dark:from-amber-400 dark:to-orange-500';
    return 'from-rose-500 to-red-600 dark:from-rose-400 dark:to-red-500';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0f] text-slate-800 dark:text-slate-200 transition-colors duration-500 pb-12 overflow-x-hidden relative font-sans">
      
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-200/50 dark:bg-indigo-900/20 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-200/50 dark:bg-violet-900/20 blur-[120px] pointer-events-none"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 animate-fade-in">
        
        {/* Header Options */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => onNavigate('upload')}
            className="group flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all bg-white/50 dark:bg-white/5 px-4 py-2 rounded-full border border-slate-200 dark:border-white/5 hover:bg-white dark:hover:bg-white/10 shadow-sm dark:shadow-none backdrop-blur-md"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
          </button>
          
          <button 
            onClick={handleDownloadCSV} 
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4" /> Export Analytics
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* Candidates Sidebar */}
          <div className="xl:col-span-1 space-y-4">
            <div className="bg-white/80 dark:bg-[#13131a]/80 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/10 p-5 shadow-xl dark:shadow-2xl relative overflow-hidden h-auto xl:h-[calc(100vh-140px)] flex flex-col">
              
              <div className="relative z-10 mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 p-1.5 rounded-lg"><TrendingUp className="w-4 h-4" /></span>
                  Rankings
                </h2>
                <span className="bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200 dark:border-white/5">{resumes.length}</span>
              </div>
              
              <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10">
                {sortedResumes.map((resume, index) => {
                  const isSelected = selectedResume?.id === resume.id;
                  return (
                    <button
                      key={resume.id}
                      onClick={() => setSelectedResume(resume)}
                      className={`w-full text-left p-4 rounded-2xl transition-all duration-300 border relative overflow-hidden group hover:-translate-y-0.5 ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-gradient-to-br dark:from-indigo-500/10 dark:to-blue-500/5 border-blue-200 dark:border-indigo-500/30 shadow-md drop-shadow-sm'
                          : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/10 shadow-sm dark:shadow-none'
                      }`}
                    >
                      {/* Selection Indicater */}
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 dark:from-indigo-400 dark:to-blue-500 rounded-l-2xl"></div>
                      )}
                      
                      <div className="flex justify-between items-start mb-1.5 pl-1">
                        <span className={`font-semibold text-sm truncate pr-3 transition-colors ${isSelected ? 'text-blue-900 dark:text-white' : 'text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                          {index + 1}. {resume.name}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`font-extrabold text-sm ${getScoreColor(resume.atsScore)}`}>{resume.atsScore}</span>
                        </div>
                      </div>
                      <div className={`text-xs pl-1 truncate font-medium ${isSelected ? 'text-blue-600 dark:text-indigo-300' : 'text-slate-500'}`}>
                        {resume.predictedRole}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Dashboard Panel */}
          <div className="xl:col-span-3">
            {selectedResume ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in">
                
                {/* 1. HERO PROFILE CARD */}
                <div className="md:col-span-8 bg-white/80 dark:bg-[#13131a]/80 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/10 p-8 shadow-xl relative overflow-hidden group transition-all">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200 to-indigo-200 dark:from-blue-500/10 dark:to-indigo-500/10 rounded-full blur-3xl -z-10 opacity-30 dark:opacity-50 transition-opacity duration-700"></div>
                  
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-4 uppercase tracking-wider">
                        Best Fit Match
                      </div>
                      <h1 className="text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 mb-2 tracking-tight">
                        {selectedResume.name}
                      </h1>
                      <div className="flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <p className="text-xl text-indigo-600 dark:text-indigo-300 font-semibold">{selectedResume.predictedRole}</p>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl p-4 min-w-[140px] flex flex-col items-center justify-center shadow-sm dark:shadow-inner">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1">Experience</span>
                      <div className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-100 dark:to-slate-400">
                        {selectedResume.experience}
                      </div>
                    </div>
                  </div>

                  {/* Contact Links */}
                  <div className="flex flex-wrap gap-3 mt-8">
                    {selectedResume.email && (
                      <a href={`mailto:${selectedResume.email}`} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-sm font-medium text-slate-700 dark:text-slate-300 transition-all">
                        <Mail className="w-4 h-4 text-slate-500 dark:text-slate-400" /> {selectedResume.email}
                      </a>
                    )}
                    {selectedResume.phone && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-sm font-medium text-slate-700 dark:text-slate-300">
                        <Phone className="w-4 h-4 text-slate-500 dark:text-slate-400" /> {selectedResume.phone}
                      </div>
                    )}
                    {selectedResume.linkedin && (
                      <a href={selectedResume.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0077b5]/10 border border-[#0077b5]/20 hover:bg-[#0077b5]/20 text-sm font-medium text-[#0077b5] transition-all">
                        <Linkedin className="w-4 h-4" /> LinkedIn
                      </a>
                    )}
                    {selectedResume.github && (
                      <a href={selectedResume.github} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-sm font-medium text-slate-800 dark:text-slate-200 transition-all">
                        <Github className="w-4 h-4" /> GitHub
                      </a>
                    )}
                    {selectedResume.location && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-sm font-medium text-slate-700 dark:text-slate-300">
                        <MapPin className="w-4 h-4 text-slate-500 dark:text-slate-400" /> {selectedResume.location}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. ATS SCORE GAUGE CARD */}
                <div className="md:col-span-4 bg-white/80 dark:bg-[#13131a]/80 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/10 p-8 shadow-xl dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col items-center justify-center group">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/40 dark:from-white/[0.02] to-transparent pointer-events-none"></div>
                  
                  <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 z-10">ATS Match Level</h3>
                  
                  <div className="relative w-44 h-44 flex items-center justify-center z-10">
                    {/* Glowing outer ring */}
                    <div className={`absolute inset-0 rounded-full blur-[20px] opacity-10 dark:opacity-30 bg-gradient-to-r ${getScoreGradient(selectedResume.atsScore)} group-hover:opacity-40 dark:group-hover:opacity-60 transition-opacity duration-500`}></div>
                    
                    {/* Inner circle basis */}
                    <div className="absolute inset-2 bg-slate-50 dark:bg-[#0a0a0f] rounded-full shadow-inner z-0 border border-slate-200 dark:border-white/5"></div>
                    
                    {/* SVG Progress */}
                    <svg className="absolute w-full h-full -rotate-90 z-10" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="46" fill="none" className="stroke-slate-200 dark:stroke-white/5" strokeWidth="6" />
                      <circle 
                        cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="6" 
                        strokeDasharray={`${(selectedResume.atsScore / 100) * 289} 289`}
                        className={`${getScoreColor(selectedResume.atsScore)} transition-all duration-[1.5s] ease-out drop-shadow-md dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]`} 
                        strokeLinecap="round"
                      />
                    </svg>
                    
                    {/* Number block */}
                    <div className="relative z-20 text-center flex flex-col items-center justify-center mt-2">
                      <span className={`text-5xl font-black tabular-nums tracking-tighter bg-clip-text text-transparent bg-gradient-to-br ${getScoreGradient(selectedResume.atsScore)} drop-shadow-sm`}>
                        {selectedResume.atsScore}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 text-xs font-bold mt-1">/ 100</span>
                    </div>
                  </div>
                </div>

                {/* 3. RADAR / SCORE BREAKDOWN */}
                {selectedResume.atsBreakdown && (
                  <div className="md:col-span-12 bg-white/80 dark:bg-[#13131a]/80 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/10 p-8 shadow-xl">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-500 dark:text-amber-400" /> Metric Breakdown
                      </h2>
                      <div className="text-xs text-slate-600 dark:text-slate-500 font-bold tracking-wide bg-slate-100 dark:bg-black/40 px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/5">Weighted Algorithm</div>
                    </div>

                    {/* Two-column layout: radar left, bars right */}
                    <div className="flex flex-col lg:flex-row gap-10 items-center">

                      {/* Radar Chart */}
                      <div className="w-full lg:w-[380px] shrink-0">
                        <AtsRadarChart breakdown={selectedResume.atsBreakdown} />
                      </div>

                      {/* Score Bars */}
                      <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                        <BentoScoreBar label="Required Skills" weight="35%" score={selectedResume.atsBreakdown.skillScore} colorClass="bg-indigo-500" />
                        <BentoScoreBar label="Preferred Skills" weight="10%" score={selectedResume.atsBreakdown.preferredSkillScore} colorClass="bg-violet-400" />
                        <BentoScoreBar label="Experience Match" weight="20%" score={selectedResume.atsBreakdown.experienceScore} colorClass="bg-blue-500" />
                        <BentoScoreBar label="Education Match" weight="15%" score={selectedResume.atsBreakdown.educationScore} colorClass="bg-emerald-500" />
                        <BentoScoreBar label="Project Relevance" weight="10%" score={selectedResume.atsBreakdown.projectScore} colorClass="bg-violet-600" />
                        <BentoScoreBar label="Certifications" weight="5%" score={selectedResume.atsBreakdown.certificationScore} colorClass="bg-amber-500" />
                        <BentoScoreBar label="Format / Profile" weight="5%" score={selectedResume.atsBreakdown.formattingScore} colorClass="bg-rose-500" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. RECS */}
                <div className="md:col-span-7 bg-white/80 dark:bg-[#13131a]/80 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/10 p-8 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 dark:bg-orange-500/10 blur-3xl -z-10 rounded-full dark:group-hover:opacity-100 opacity-50 dark:opacity-0 transition-opacity"></div>
                  
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <Star className="w-5 h-5 text-orange-500 dark:text-orange-400" /> Actionable Insights
                  </h2>
                  
                  <div className="space-y-4">
                    {selectedResume.feedback?.recommendations?.length > 0 ? (
                       selectedResume.feedback.recommendations.map((rec, i) => (
                         <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-orange-50 dark:bg-orange-500/5 border border-orange-100 dark:border-orange-500/10 hover:bg-orange-100/50 dark:hover:bg-orange-500/10 transition-colors shadow-sm dark:shadow-none">
                           <div className="mt-0.5 p-1 bg-gradient-to-br from-orange-400 to-red-500 rounded-full shadow-sm dark:shadow-[0_0_10px_rgba(249,115,22,0.3)] shrink-0">
                             <ChevronRight className="w-3 h-3 text-white" />
                           </div>
                           <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                             {rec.includes('**') ? (
                               rec.split('**').map((part, i) => i % 2 === 1 ? <b key={i} className="text-orange-600 dark:text-orange-400">{part}</b> : part)
                             ) : rec}
                           </p>
                         </div>
                       ))
                    ) : (
                      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm font-bold flex items-center gap-2 shadow-sm dark:shadow-none">
                        <CheckCircle2 className="w-5 h-5" /> Perfect resume! No critical improvements needed.
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. MATCHED/MISSING SKILLS PANEL */}
                <div className="md:col-span-5 bg-white/80 dark:bg-[#13131a]/80 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/10 p-8 shadow-xl flex flex-col">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-emerald-500 dark:text-emerald-400" /> Keyword Alignment
                  </h2>

                  <div className="flex-1 space-y-5 overflow-y-auto pr-1 custom-scrollbar">
                    {/* Missing Skills */}
                    {selectedResume.feedback?.missingSkills?.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                          <XCircle className="w-3 h-3"/> Missing Requirements
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedResume.feedback.missingSkills.map((skill, i) => (
                            <span key={i} className="px-2.5 py-1 bg-white dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 text-[11px] font-bold rounded-lg border border-rose-200 dark:border-rose-500/20">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matched Preferred Skills */}
                    {selectedResume.feedback?.matchedPreferredSkills && selectedResume.feedback.matchedPreferredSkills.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                          <Star className="w-3 h-3"/> Bonus Matches
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedResume.feedback.matchedPreferredSkills.map((skill, i) => (
                            <span key={i} className="px-2.5 py-1 bg-white dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 text-[11px] font-bold rounded-lg border border-violet-200 dark:border-violet-500/20">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matched Skills */}
                    <div className="mt-auto">
                      <h3 className="text-[10px] font-black text-emerald-600 dark:text-emerald-300 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-3 h-3"/> Aligned Skills
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedResume.feedback?.matchedSkills?.length > 0 ? (
                          selectedResume.feedback.matchedSkills.map((skill, i) => (
                            <span key={i} className="px-2.5 py-1 bg-white dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-500/20 shadow-sm">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-lg">Requires Job Description</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white/80 dark:bg-[#13131a]/80 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/10 p-12 text-center h-[calc(100vh-140px)] flex flex-col items-center justify-center relative overflow-hidden shadow-xl">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMSkiLz48L3N2Zz4=')]"></div>
                
                <div className="relative z-10 p-6 bg-slate-100 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/10 mb-6 shadow-sm dark:shadow-[0_0_30px_rgba(255,255,255,0.05)] animate-float">
                  <FileText className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 relative z-10">Select a Candidate</h2>
                <p className="text-slate-500 max-w-sm relative z-10 font-medium">Click on an applicant in the sidebar to view their detailed ATS scoring format.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Premium Bento Score Bar Helper
function BentoScoreBar({ label, weight, score, colorClass }: { label: string, weight: string, score: number, colorClass: string }) {
  return (
    <div className="group">
      <div className="flex justify-between items-end mb-2">
        <div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{label}</span>
          <span className="ml-2 text-[10px] font-black text-slate-500 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/5">{weight}</span>
        </div>
        <span className="text-sm font-black text-slate-800 dark:text-white">{score}<span className="text-slate-400 dark:text-slate-500 font-bold text-xs ml-0.5">/100</span></span>
      </div>
      
      {/* Light / Dark Track */}
      <div className="h-2 w-full bg-slate-200 dark:bg-black/60 rounded-full overflow-hidden border border-slate-300/50 dark:border-white/5 shadow-inner">
        {/* Glow Fill */}
        <div 
          className={`h-full rounded-full ${colorClass} transition-all duration-1000 ease-out relative`}
          style={{ width: `${score}%` }}
        >
          {/* Internal gradient shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
        </div>
      </div>
    </div>
  );
}

// ATS Radar Chart Component
interface AtsBreakdown {
  skillScore: number;
  preferredSkillScore: number;
  experienceScore: number;
  educationScore: number;
  projectScore: number;
  certificationScore: number;
  formattingScore: number;
}

function AtsRadarChart({ breakdown }: { breakdown: AtsBreakdown }) {
  const data = [
    { metric: 'Skills',      score: breakdown.skillScore },
    { metric: 'Preferred',   score: breakdown.preferredSkillScore },
    { metric: 'Experience',  score: breakdown.experienceScore },
    { metric: 'Education',   score: breakdown.educationScore },
    { metric: 'Projects',    score: breakdown.projectScore },
    { metric: 'Certs',       score: breakdown.certificationScore },
    { metric: 'Format',      score: breakdown.formattingScore },
  ];

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { metric: string; score: number } }[] }) => {
    if (active && payload && payload.length) {
      const { metric, score } = payload[0].payload;
      return (
        <div className="bg-white dark:bg-[#1a1a2e] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 shadow-xl text-sm">
          <p className="font-bold text-slate-800 dark:text-white">{metric}</p>
          <p className="text-indigo-500 dark:text-indigo-300 font-black">{score}<span className="text-slate-400 text-xs font-normal"> / 100</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">Skill Radar</p>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid
            stroke="rgba(148,163,184,0.2)"
            strokeDasharray="3 3"
          />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
          />
          <Radar
            name="ATS Score"
            dataKey="score"
            stroke="#6366f1"
            strokeWidth={2}
            fill="#6366f1"
            fillOpacity={0.25}
            dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
