import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { FileText, File as FileIcon, Trash2, Plus, AlertCircle, Save, Database } from 'lucide-react';
import { NoteData, NoteItem } from '../types';

interface NoteUploaderProps {
  onNotesSubmit: (data: NoteData) => void;
  isLoading: boolean;
}

const STORAGE_KEY = 'matsci_ta_notes';

export const NoteUploader: React.FC<NoteUploaderProps> = ({ onNotesSubmit, isLoading }) => {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<NoteItem[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const MAX_FILES = 5;

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data: NoteData = JSON.parse(saved);
        setFiles(data.filter(i => i.type === 'file'));
        const t = data.find(i => i.type === 'text');
        if (t) setText(t.content);
      } catch (e) {}
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const selectedFiles = Array.from(e.target.files || []) as File[];
    const remainingSlots = MAX_FILES - files.length;
    
    selectedFiles.slice(0, remainingSlots).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        let newNote: NoteItem = file.type === 'application/pdf' 
          ? { type: 'file', content: result.split(',')[1], mimeType: 'application/pdf', fileName: file.name }
          : { type: 'text', content: result, mimeType: 'text/plain', fileName: file.name };

        setFiles(prev => prev.some(f => f.fileName === newNote.fileName) ? prev : [...prev, newNote]);
      };
      if (file.type === 'application/pdf') reader.readAsDataURL(file); else reader.readAsText(file);
    });
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: NoteData = [...files];
    if (text.trim()) payload.push({ type: 'text', content: text, mimeType: 'text/plain', fileName: 'SUPPLEMENT_DATA' });
    onNotesSubmit(payload);
  };

  return (
    <div className="w-full font-mono text-sm">
      <form onSubmit={handleSubmit}>
        {uploadError && (
             <div className="mb-6 p-4 bg-red-900/30 border border-red-500 text-red-400 flex items-center gap-2">
                <AlertCircle size={16} />
                {uploadError}
            </div>
        )}

        <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 text-cyan-500">
                <Database size={18} />
                <h3 className="font-bold uppercase tracking-tighter">Asset Manifest ({files.length}/{MAX_FILES})</h3>
            </div>
            <div className="space-y-3">
              {files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 group hover:border-cyan-500/50 transition-all">
                      <div className="flex items-center gap-3 overflow-hidden">
                          <FileIcon size={16} className="text-cyan-500" />
                          <span className="text-slate-300 truncate">{file.fileName}</span>
                      </div>
                      <button type="button" onClick={() => setFiles(f => f.filter((_, i) => i !== idx))} className="text-slate-600 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
              ))}
              {files.length < MAX_FILES && (
                <div className="relative border-2 border-dashed border-slate-800 p-6 flex flex-col items-center justify-center hover:bg-cyan-500/5 hover:border-cyan-500 transition-all cursor-pointer">
                    <input type="file" accept=".pdf" multiple onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <Plus size={20} className="text-slate-600 mb-2" />
                    <span className="text-slate-500 uppercase tracking-widest text-[10px]">Inject PDF Module</span>
                </div>
              )}
            </div>
        </div>

        <div className="mb-8">
            <label className="block font-bold text-cyan-500 mb-4 uppercase tracking-tighter">Direct Logic Override (Text Supplement)</label>
            <textarea
                className="w-full h-32 p-4 bg-slate-900 border border-slate-800 text-cyan-50 focus:border-cyan-500 outline-none resize-none shadow-inner"
                placeholder="Paste key technical parameters here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
        </div>

        <Button type="submit" disabled={files.length === 0 && !text.trim() || isLoading} className="w-full">
          COMMIT TO CORE
        </Button>
      </form>
    </div>
  );
};