import React, { useState, useEffect } from 'react';
import { Button } from './Button.tsx';
import { File as FileIcon, Trash2, Plus, AlertCircle, Database, Cloud, Loader2, Info, BookOpen } from 'lucide-react';
import { NoteData, NoteItem } from '../types.ts';

interface NoteUploaderProps {
  onNotesSubmit: (data: NoteData) => void;
  isLoading: boolean;
}

const STORAGE_KEY_TEXT = 'matsci_ta_text_only';
const DRIVE_FOLDER_ID = "1HIK1rmsqBh0vmHf-g8TcwMLxzJ2Y-B_o";
const MAX_FILE_SIZE = 45 * 1024 * 1024; // 單一檔案傳輸上限

export const NoteUploader: React.FC<NoteUploaderProps> = ({ onNotesSubmit, isLoading }) => {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<NoteItem[]>([]);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const MAX_FILES = 8; // 增加上限以容納分片

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TEXT);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (Array.isArray(data)) {
          setText(data[0]?.content || '');
        }
      } catch (e) {}
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const selectedFiles = Array.from(e.target.files || []) as File[];
    if (selectedFiles.length === 0) return;

    setIsReadingFile(true);
    let processedCount = 0;
    
    selectedFiles.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        setErrorMessage(`「${file.name}」體積超過 API 單次傳輸限制 (50MB)。請將您的超大型 PDF 拆分為數個 45MB 以下的小檔案再分別上傳，系統將自動進行「教材融合」。`);
        setIsReadingFile(false);
        return;
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
        
        processedCount++;
        if (processedCount === selectedFiles.length) {
          setIsReadingFile(false);
        }
      };
      
      reader.onerror = () => {
        setIsReadingFile(false);
        setErrorMessage(`讀取錯誤: ${file.name}`);
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
    if (isLoading || isReadingFile) return;
    onNotesSubmit([...files]);
  };

  return (
    <div className="w-full font-mono text-sm">
      <div className="mb-6 flex flex-col gap-3">
        <div className="p-4 bg-cyan-950/20 border border-cyan-800/50 rounded flex items-start gap-4 shadow-inner">
          <Cloud className="text-cyan-400 mt-1 flex-shrink-0" size={18} />
          <div>
            <p className="text-cyan-400 font-bold mb-1 tracking-tight uppercase text-[10px]">雲端存取 [CONNECTED]</p>
            <p className="text-slate-500 text-[9px] font-mono opacity-60">DRIVE_FOLDER: {DRIVE_FOLDER_ID}</p>
          </div>
        </div>
        
        <div className="p-4 bg-orange-950/10 border border-orange-500/30 rounded flex items-start gap-4">
          <BookOpen className="text-orange-500 mt-1 flex-shrink-0" size={18} />
          <div>
            <p className="text-orange-500 font-bold mb-1 tracking-tight uppercase text-[10px]">100MB+ 大型教材處理指引</p>
            <p className="text-slate-400 text-[9px] leading-relaxed">
              因技術限制，單個檔案需小於 50MB。若您的教材為 100MB，請拆分為「Part 1.pdf」與「Part 2.pdf」後一併在此上傳，系統會將它們視為一個完整個體。
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {errorMessage && (
             <div className="mb-6 p-4 bg-red-950/40 border border-red-500/50 text-red-400 text-[11px] rounded flex items-start gap-3">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed font-bold uppercase">{errorMessage}</span>
            </div>
        )}

        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 text-slate-100">
                    <Database size={18} className="text-orange-500" />
                    <h3 className="font-bold uppercase tracking-tighter text-sm">教材部署分片 ({files.length}/{MAX_FILES})</h3>
                </div>
                {isReadingFile && (
                  <div className="flex items-center gap-2 text-orange-400 text-[10px] font-bold animate-pulse">
                    <Loader2 size={12} className="animate-spin" />
                    BUFFERING_DATA...
                  </div>
                )}
            </div>
            
            <div className="space-y-2">
              {files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 shadow-md group hover:border-slate-600 transition-colors">
                      <div className="flex items-center gap-3 overflow-hidden">
                          <FileIcon size={16} className="text-orange-500 flex-shrink-0" />
                          <span className="text-slate-300 truncate text-[11px] font-mono">{file.fileName}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setFiles(f => f.filter((_, i) => i !== idx))} 
                        className="text-slate-600 hover:text-red-500 p-1.5 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                  </div>
              ))}
              
              {files.length < MAX_FILES && (
                <div className={`relative border-2 border-dashed p-10 flex flex-col items-center justify-center transition-all cursor-pointer rounded-lg ${isReadingFile ? 'border-slate-800 pointer-events-none' : 'border-slate-800 hover:border-orange-500/30 hover:bg-orange-500/5'}`}>
                    <input type="file" accept=".pdf" multiple onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isReadingFile} />
                    {isReadingFile ? <Loader2 size={24} className="text-orange-500 animate-spin mb-3" /> : <Plus size={24} className="text-slate-600 mb-3" />}
                    <span className="text-slate-600 uppercase tracking-widest text-[9px] font-bold">點擊上傳教材分片 (Max 45MB/file)</span>
                </div>
              )}
            </div>
        </div>

        <div className="flex flex-col gap-4">
          <Button 
            type="submit" 
            disabled={(files.length === 0 && !text.trim()) || isLoading || isReadingFile} 
            className="w-full py-5 text-base border-b-8 shadow-xl"
            isLoading={isLoading}
          >
            確認部署並同步雲端題庫
          </Button>
          
          <div className="flex items-center gap-2 justify-center text-[9px] text-slate-600 uppercase font-mono tracking-widest">
             <Info size={10} />
             Multishard processing may take up to 2 minutes
          </div>
        </div>
      </form>
    </div>
  );
};