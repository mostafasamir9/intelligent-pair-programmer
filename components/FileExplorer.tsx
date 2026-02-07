import React, { useState } from 'react';
import { File } from '../types';
import { FileCode, FilePlus, Trash2, ChevronRight, ChevronDown, FolderOpen } from 'lucide-react';
import { LANGUAGE_MAP } from '../constants';

interface FileExplorerProps {
  files: File[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onCreateFile: (name: string, language: string) => void;
  onDeleteFile: (id: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) {
      setIsCreating(false);
      return;
    }
    
    const extension = newFileName.split('.').pop()?.toLowerCase() || 'txt';
    const language = LANGUAGE_MAP[extension] || 'plaintext';
    
    onCreateFile(newFileName, language);
    setNewFileName('');
    setIsCreating(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-700 w-64 select-none">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center">
        <span className="text-slate-200 font-semibold text-sm tracking-wider flex items-center gap-2">
           <FolderOpen size={16} className="text-blue-400"/> PROJECT
        </span>
        <button
          onClick={() => setIsCreating(true)}
          className="text-slate-400 hover:text-white transition-colors"
          title="New File"
        >
          <FilePlus size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {isCreating && (
          <form onSubmit={handleCreateSubmit} className="px-4 py-2">
            <input
              autoFocus
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onBlur={() => { if(!newFileName) setIsCreating(false); }}
              placeholder="filename.ext"
              className="w-full bg-slate-800 text-white text-xs px-2 py-1 rounded border border-blue-500 focus:outline-none"
            />
          </form>
        )}

        {files.map((file) => (
          <div
            key={file.id}
            className={`group flex items-center justify-between px-4 py-2 cursor-pointer text-sm transition-colors ${
              activeFileId === file.id
                ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-l-2 border-transparent'
            }`}
            onClick={() => onSelectFile(file.id)}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <FileCode size={16} className={activeFileId === file.id ? 'text-blue-400' : 'text-slate-500'} />
              <span className="truncate">{file.name}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFile(file.id);
              }}
              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity"
              title="Delete File"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {files.length === 0 && !isCreating && (
            <div className="px-4 py-8 text-center text-slate-600 text-xs italic">
                No files created yet.
            </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;