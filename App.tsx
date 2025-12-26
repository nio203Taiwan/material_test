import React, { useState, useRef, useEffect } from 'react';
import { Message, NoteData } from './types';
import { NoteUploader } from './components/NoteUploader';
import { MessageBubble } from './components/MessageBubble';
import { Button } from './components/Button';
import { Send, Settings, X, AlertTriangle, BookOpen } from 'lucide-react';
import { initializeChat, sendMessage } from './services/geminiService';

const STORAGE_KEY = 'matsci_ta_notes';

const App: React.FC = () => {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadAndInit = async () => {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        try {
          const noteData: NoteData = JSON.parse(savedData);
          if (noteData && noteData.length > 0) {
            await handleStartSession(noteData);
          } else {
            setIsInitializing(false);
          }
        } catch (e) {
          console.error("Storage load error:", e);
          setIsInitializing(false);
        }
      } else {
        setIsInitializing(false);
      }
    };
    loadAndInit();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStartSession = async (noteData: NoteData) => {
    setIsLoading(true);
    setError(null);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(noteData));
      const initialResponse = await initializeChat(noteData);
      setMessages([{ role: 'model', text: initialResponse, timestamp: Date.now() }]);
      setIsAdminOpen(false);
    } catch (err: any) {
      setError(err.message || "初始化失敗。");
    } finally {
      setIsLoading(false);
      setIsInitializing(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', text: inputText, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    setError(null);

    try {
      const responseText = await sendMessage(userMsg.text);
      setMessages((prev) => [...prev, { role: 'model', text: responseText, timestamp: Date.now() }]);
    } catch (err: any) {
      setError("連線失敗：" + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col relative">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="bg-blue-600 text-white p-1.5 rounded-lg shadow-blue-200 shadow-lg">
                    <BookOpen size={20} />
                </div>
                <div>
                  <h1 className="font-bold text-lg leading-tight">材料科學助教</h1>
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Materials Science Graduate Exam TA</p>
                </div>
            </div>
            <button onClick={() => setIsAdminOpen(true)} className="p-2 text-slate-400 hover:text-blue-600 transition-all">
              <Settings size={20} />
            </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col relative overflow-hidden">
        {error && (
          <div className="m-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
            <AlertTriangle size={18} />
            <div className="flex-1">{error}</div>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded-lg"><X size={16} /></button>
          </div>
        )}

        {isInitializing ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-slate-500">正在召喚助教中...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-sm">
              <h2 className="text-xl font-bold mb-2">準備開始考試？</h2>
              <p className="text-slate-500 mb-6 text-sm">請先在後台部署您的筆記資料。</p>
              <Button onClick={() => setIsAdminOpen(true)}>進入部署後台</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {messages.map((msg, idx) => <MessageBubble key={idx} message={msg} />)}
              {isLoading && (
                 <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 px-5 py-3 rounded-2xl rounded-tl-none shadow-sm animate-pulse text-slate-400 text-sm">助教正在思考中...</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-200">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-2">
                    <textarea
                        className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        placeholder="輸入您的回答..."
                        rows={1}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                    />
                    <button type="submit" disabled={!inputText.trim() || isLoading} className="h-[48px] w-[48px] rounded-xl bg-blue-600 text-white flex items-center justify-center disabled:opacity-50">
                        <Send size={18} />
                    </button>
                </form>
            </div>
          </div>
        )}
      </main>

      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">部署後台</h2>
              <button onClick={() => setIsAdminOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
            </div>
            <NoteUploader onNotesSubmit={handleStartSession} isLoading={isLoading} />
            <div className="mt-6 text-center">
                <button onClick={() => { if(confirm("重設後需要重新上傳筆記，確定？")) { localStorage.clear(); window.location.reload(); } }} className="text-xs text-red-400 hover:text-red-600 underline">清除所有部署資料</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;