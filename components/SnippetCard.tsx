
import React from 'react';
import { TextSnippet } from '../types';

interface SnippetCardProps {
  snippet: TextSnippet;
  onDelete: (id: string) => void;
  onCopy: (text: string) => void;
}

const SnippetCard: React.FC<SnippetCardProps> = ({ snippet, onDelete, onCopy }) => {
  const formattedDate = new Date(snippet.timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="bg-white dark:bg-slate-800/50 p-5 rounded-ios ios-shadow border border-slate-100 dark:border-slate-700/50 mb-4 transition-all">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{snippet.title}</h3>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{formattedDate}</span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-4 mb-4 whitespace-pre-wrap leading-relaxed">
        {snippet.content}
      </p>
      <div className="flex gap-3">
        <button 
          onClick={() => onCopy(snippet.content)}
          className="flex-1 bg-primary text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">content_copy</span>
          <span>COPY</span>
        </button>
        <button 
          onClick={() => onDelete(snippet.id)}
          className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-sm">delete</span>
        </button>
      </div>
    </div>
  );
};

export default SnippetCard;
