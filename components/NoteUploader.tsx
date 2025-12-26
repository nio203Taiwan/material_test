import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { FileText, File as FileIcon, Trash2, Plus, AlertCircle, Save } from 'lucide-react';
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

  // 載入現有資料
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data: NoteData = JSON.parse(saved);
        const fileItems = data.filter(i => i.type === 'file');
        const textItem = data.find(i => i.type === 'text');
        setFiles(fileItems);
        if (textItem) setText(textItem.content);
      } catch (e) {}
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const selectedFiles = Array.from(e.target.files || []) as File[];
    const remainingSlots = MAX_FILES - files.length;
    
    const filesToProcess = selectedFiles.slice(0, remainingSlots);

    if (selectedFiles.length > remainingSlots) {
        setUploadError(`最多只能上傳 ${MAX_FILES} 份檔案。`);
    }

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        let newNote: NoteItem | null = null;

        if (file.type === 'application/pdf') {
            const base64Data = result.split(',')[1];
            newNote = {
                type: 'file',
                content: base64Data,
                mimeType: 'application/pdf',
                fileName: file.name
            };
        } else {
             newNote = {
                 type: 'text',
                 content: result,
                 mimeType: 'text/plain',
                 fileName: file.name
             };
        }

        if (newNote) {
            setFiles(prev => {
                if (prev.some(f => f.fileName === newNote?.fileName)) return prev;
                return [...prev, newNote!];
            });
        }
      };

      if (file.type === 'application/pdf') {
          reader.readAsDataURL(file);
      } else {
          reader.readAsText(file);
      }
    });
    e.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
      setFiles(prev => prev.filter((_, i) => i !== index));
      setUploadError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload: NoteData = [...files];
    if (text.trim()) {
        payload.push({
            type: 'text',
            content: text,
            mimeType: 'text/plain',
            fileName: '補充重點'
        });
    }

    if (payload.length > 0) {
        onNotesSubmit(payload);
    }
  };

  const hasContent = files.length > 0 || text.trim().length > 0;

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit}>
        
        {uploadError && (
             <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-2">
                <AlertCircle size={16} />
                {uploadError}
            </div>
        )}

        {/* File List */}
        <div className="mb-6 space-y-2">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">已上傳筆記 ({files.length}/{MAX_FILES})</h3>
            {files.length === 0 && (
              <p className="text-xs text-slate-400 italic py-2">尚未上傳任何 PDF...</p>
            )}
            {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                            <FileIcon size={16} className="text-blue-500" />
                        </div>
                        <span className="text-sm font-medium text-slate-700 truncate">{file.fileName}</span>
                    </div>
                    <button 
                        type="button" 
                        onClick={() => handleRemoveFile(idx)}
                        className="text-slate-400 hover:text-red-500 p-1"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}
        </div>

        {/* Upload Area */}
        {files.length < MAX_FILES && (
             <div className="mb-6 relative group">
                <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={isLoading}
                />
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-slate-500 group-hover:border-blue-400 group-hover:bg-blue-50/50 transition-all">
                    <Plus size={24} className="text-slate-300 group-hover:text-blue-500 mb-2" />
                    <span className="font-medium text-sm">新增 PDF 筆記</span>
                    <span className="text-[10px] mt-1 text-slate-400 uppercase tracking-widest">Supports PDF only</span>
                </div>
            </div>
        )}

        <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
                額外文字補充 (Key Points)
            </label>
            <textarea
                className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm shadow-inner"
                placeholder="在此貼上筆記沒寫到，但希望助教考出的重點內容..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isLoading}
            />
        </div>

        <Button 
          type="submit" 
          disabled={!hasContent || isLoading} 
          isLoading={isLoading} 
          className="w-full py-4 rounded-2xl shadow-lg shadow-blue-100"
        >
          <Save size={18} />
          儲存並部署到前台
        </Button>
      </form>
    </div>
  );
};