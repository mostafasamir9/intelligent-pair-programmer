import React, { useState, useEffect, useRef } from 'react';
import { File, AnalysisIssue } from '../types';
import { analyzeCode } from '../services/geminiService';
import { AlertTriangle, CheckCircle, Loader2, X, Lightbulb } from 'lucide-react';

interface CodeEditorProps {
  file: File | null;
  onUpdateContent: (id: string, newContent: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ file, onUpdateContent }) => {
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [issues, setIssues] = useState<AnalysisIssue[]>([]);
  const [showIssues, setShowIssues] = useState(true);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    if (file) {
      setContent(file.content);
      setIssues([]); // Clear issues on file change
      // Trigger initial analysis
      triggerAnalysis(file.content, file.language);
    } else {
      setContent('');
      setIssues([]);
    }
  }, [file]);

  const triggerAnalysis = (code: string, language: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!code.trim()) {
      setIssues([]);
      return;
    }

    setIsAnalyzing(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await analyzeCode(code, language);
        setIssues(results);
      } catch (error) {
        console.error("Analysis failed", error);
      } finally {
        setIsAnalyzing(false);
      }
    }, 1500); // 1.5s debounce
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (file) {
      onUpdateContent(file.id, newContent);
      triggerAnalysis(newContent, file.language);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const spaces = '  ';
      const newContent = content.substring(0, start) + spaces + content.substring(end);
      
      setContent(newContent);
      if (file) {
        onUpdateContent(file.id, newContent);
        triggerAnalysis(newContent, file.language);
      }

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
      }, 0);
    }
  };

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900 text-slate-500">
        <div className="text-center">
            <p className="text-lg font-medium mb-2">No File Selected</p>
            <p className="text-sm">Select a file from the explorer to start editing.</p>
        </div>
      </div>
    );
  }

  const lineNumbers = content.split('\n').map((_, i) => i + 1);

  return (
    <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden relative font-mono text-sm">
      {/* Header */}
      <div className="bg-slate-800 px-4 py-2 text-xs text-slate-400 border-b border-slate-700 flex justify-between items-center h-10">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-slate-300">{file.name}</span>
          <span className="uppercase text-[10px] bg-slate-700 px-1.5 py-0.5 rounded">{file.language}</span>
        </div>
        
        <div className="flex items-center gap-3">
           {isAnalyzing ? (
             <div className="flex items-center gap-2 text-blue-400">
               <Loader2 size={12} className="animate-spin" />
               <span>Analyzing...</span>
             </div>
           ) : issues.length > 0 ? (
             <div className="flex items-center gap-2 text-amber-400 cursor-pointer hover:text-amber-300" onClick={() => setShowIssues(!showIssues)}>
               <AlertTriangle size={12} />
               <span>{issues.length} Issue{issues.length > 1 ? 's' : ''}</span>
             </div>
           ) : (
             <div className="flex items-center gap-2 text-green-500/80">
               <CheckCircle size={12} />
               <span>Clean</span>
             </div>
           )}
        </div>
      </div>
      
      {/* Editor Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Line Numbers */}
        <div className="bg-slate-900 border-r border-slate-800 text-slate-600 text-right py-4 pr-3 pl-2 select-none overflow-hidden min-w-[3rem]">
          {lineNumbers.map((num) => {
             const hasIssue = issues.some(i => i.line === num);
             return (
              <div key={num} className={`leading-6 h-6 flex justify-end gap-1 ${hasIssue ? 'text-amber-500 font-bold' : ''}`}>
                 {hasIssue && <span className="text-[8px] self-center">●</span>}
                 {num}
              </div>
             );
          })}
        </div>

        <textarea
            ref={textareaRef}
            className="flex-1 bg-slate-900 text-slate-300 p-4 leading-6 border-none outline-none resize-none whitespace-pre overflow-auto"
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            wrap="off"
        />

        {/* Live Analysis Popup */}
        {showIssues && issues.length > 0 && (
          <div className="absolute bottom-4 right-4 z-20 w-80 max-h-96 flex flex-col gap-2">
            {issues.map((issue, idx) => (
              <div key={idx} className="bg-slate-800 border border-slate-700 shadow-xl rounded-lg p-3 animate-in slide-in-from-bottom-2 fade-in duration-300">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                     {issue.severity === 'error' ? (
                       <AlertTriangle size={14} className="text-red-400" />
                     ) : (
                       <Lightbulb size={14} className="text-amber-400" />
                     )}
                     <span className={`font-medium text-xs ${issue.severity === 'error' ? 'text-red-400' : 'text-amber-400'}`}>
                       {issue.severity.toUpperCase()} {issue.line ? `on Line ${issue.line}` : ''}
                     </span>
                  </div>
                  <button onClick={() => setIssues(prev => prev.filter((_, i) => i !== idx))} className="text-slate-500 hover:text-slate-300">
                    <X size={12} />
                  </button>
                </div>
                
                <p className="text-slate-300 text-xs mb-2 leading-relaxed">
                  {issue.message}
                </p>
                
                {issue.suggestion && (
                  <div className="bg-slate-950 rounded p-2 border border-slate-800">
                    <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Suggestion</p>
                    <code className="text-xs font-mono text-green-400 block whitespace-pre-wrap">
                      {issue.suggestion}
                    </code>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;