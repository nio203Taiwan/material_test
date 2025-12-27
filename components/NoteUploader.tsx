import React, { useState, useEffect } from 'react';
import { Button } from './Button.tsx';
import { File as FileIcon, Trash2, Plus, AlertCircle, Database, Cloud } from 'lucide-react';
import { NoteData, NoteItem } from '../types.ts';

interface NoteUploaderProps {
  onNotesSubmit: (data: NoteData) => void;
  isLoading: boolean;
}

const STORAGE_KEY = 'matsci_ta_notes';
const DRIVE_FOLDER_ID = "1HIK1rmsqBh0vmHf-g8TcwMLxzJ2Y-B_o";

export const NoteUploader: React.FC<NoteUploaderProps> = ({ onNotesSubmit, isLoading }) => {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<NoteItem[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
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
    setUploadStatus(null);
    const selectedFiles = Array.from(e.target.files || []) as File[];
    
    selectedFiles.forEach(file => {
      if (file.size > 50 * 1024 * 1024) {
        setUploadStatus(`偵測到大型檔案: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)，解析可能需要較長時間。`);
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        let newNote: NoteItem = file.type === 'application/pdf' 
          ? { type: 'file', content: result.split(',')[1], mimeType: 'application/pdf', fileName: file.name }
          : { type: 'text', content: result, mimeType: 'text/plain', fileName: file.name };

        setFiles(prev => {
            if (prev.length >= MAX_FILES) return prev;
            if (prev.some(f => f.fileName === newNote.fileName)) return prev;
            return [...prev, newNote];
        });
      };
      
      if (file.type === 'application/pdf') {
        reader.readAsDataURL(file); 
      } else {
        reader.readAsText(file);
      }
    });
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: NoteData = [...files];
    if (text.trim()) payload.push({ type: 'text', content: text, mimeType: 'text/plain', fileName: '補充說明' });
    onNotesSubmit(payload);
  };

  return (
    <div className="w-full font-mono text-sm">
      <div className="mb-6 p-4 bg-cyan-950/20 border border-cyan-800/50 rounded flex items-start gap-4">
        <Cloud className="text-cyan-400 mt-1 flex-shrink-0" size={18} />
        <div>
          <p className="text-cyan-400 font-bold mb-1 tracking-tighter">雲端題庫已連結</p>
          <p className="text-slate-500 text-[10px] break-all">ID: {DRIVE_FOLDER_ID}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {uploadStatus && (
             <div className="mb-6 p-4 bg-orange-900/20 border border-orange-500/50 text-orange-400 flex items-center gap-3 text-xs">
                <AlertCircle size={16} />
                {uploadStatus}
            </div>
        )}

        <div className="mb-8">
            <div className="flex items-center gap-2 mb-4 text-slate-300">
                <Database size={18} className="text-orange-500" />
                <h3 className="font-bold uppercase tracking-tighter">本地教材部署 ({files.length}/{MAX_FILES})</h3>
            </div>
            <div className="space-y-3">
              {files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 group transition-all">
                      <div className="flex items-center gap-3 overflow-hidden">
                          <FileIcon size={16} className="text-orange-500" />
                          <span className="text-slate-300 truncate text-xs">{file.fileName}</span>
                      </div>
                      <button type="button" onClick={() => setFiles(f => f.filter((_, i) => i !== idx))} className="text-slate-600 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
              ))}
              {files.length < MAX_FILES && (
                <div className="relative border-2 border-dashed border-slate-800 p-8 flex flex-col items-center justify-center hover:bg-orange-500/5 hover:border-orange-500/50 transition-all cursor-pointer">
                    <input type="file" accept=".pdf" multiple onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <Plus size={20} className="text-slate-600 mb-2" />
                    <span className="text-slate-500 uppercase tracking-widest text-[10px]">選取 PDF (支援 100MB+ 大型檔案)</span>
                </div>
              )}
            </div>
        </div>

        <div className="mb-8">
            <label className="block font-bold text-slate-300 mb-4 uppercase tracking-tighter">自定義測驗邏輯 / 關鍵點補充</label>
            <textarea
                className="w-full h-24 p-4 bg-slate-900 border border-slate-800 text-slate-200 focus:border-orange-500 outline-none resize-none"
                placeholder="在此輸入您想特別加強的考點或對助教的額外指令..."
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
        </div>

        <Button type="submit" disabled={(files.length === 0 && !text.trim()) || isLoading} className="w-full">
          確認部署並同步雲端題庫
        </Button>
      </form>
    </div>
  );
};