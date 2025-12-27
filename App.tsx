import React, { useState, useRef, useEffect } from 'react';
import { Message, NoteData } from './types.ts';
import { NoteUploader } from './components/NoteUploader.tsx';
import { MessageBubble } from './components/MessageBubble.tsx';
import { Button } from './components/Button.tsx';
import * as Lucide from 'lucide-react';
import { initializeChat, sendMessage } from './services/geminiService.ts';

const { Send, Settings, X, AlertTriangle, Cpu, Terminal, Book, Box, Link2, Cloud } = Lucide;

const STORAGE_KEY = 'matsci_ta_notes';
const DRIVE_ID = "1HIK1rmsqBh0vmHf-g8TcwMLxzJ2Y-B_o";

const UNITS = [
  { id: 'all', label: '綜合章節', desc: '材料科學與工程導論(全)' },
  { id: 'thermo', label: '材料熱力學', desc: '熱力學定律與自由能計算' },
  { id: 'structure', label: '晶體結構', desc: '晶體缺陷、對稱性與繞射' },
  { id: 'kinetics', label: '擴散動力學', desc: 'Fick\'s Law 與反應速率' },
  { id: 'phase', label: '相圖相變', desc: '相平衡、鐵碳平衡圖與相變動力學' },
  { id: 'mechanical', label: '機械性質', desc: '位錯理論、強化機制與斷裂力學' },
];

const App: React.FC = () => {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(UNITS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsInitializing(false);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStartSession = async (noteData: NoteData) => {
    setIsLoading(true);
    setError(null);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(noteData));
      const initialResponse = await initializeChat(noteData, selectedUnit.desc);
      setMessages([{ role: 'model', text: initialResponse, timestamp: Date.now() }]);
      setIsAdminOpen(false);
    } catch (err: any) {
      setError(err.message || "系統核心載入異常");
    } finally {
      setIsLoading(false);
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
      setError("連線斷開: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-orange-500/30">
      <header className="bg-[#0d1117] border-b border-slate-800 sticky top-0 z-30 shadow-xl">
        <div className="caution-stripe"></div>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-[#c2410c] text-white p-2 border border-orange-400/50 shadow-[0_0_15px_rgba(194,65,12,0.4)]">
              <Terminal size={20} />
            </div>
            <div>
              <h1 className="font-mono font-bold text-lg tracking-tight text-white uppercase flex items-center gap-2">
                材科助教<span className="text-orange-600">.</span>Processor
              </h1>
              <div className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase flex items-center gap-1">
                  <Link2 size={10} className="text-emerald-500" />
                  雲端題庫已掛載
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex flex-col items-end mr-4">
              <span className="text-[9px] text-slate-500 font-mono uppercase tracking-tighter">Master_Bank_ID</span>
              <span className="text-[10px] text-emerald-500 font-mono truncate max-w-[120px]">{DRIVE_ID}</span>
            </div>
            <button 
              onClick={() => setIsAdminOpen(true)} 
              className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800 rounded-md shadow-lg"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm border-t border-slate-800/50 px-6 py-2">
          <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
            <Box size={14} className="text-slate-600 flex-shrink-0" />
            {UNITS.map((unit) => (
              <button
                key={unit.id}
                onClick={() => !isLoading && setSelectedUnit(unit)}
                className={`px-3 py-1.5 font-mono text-[10px] border transition-all whitespace-nowrap rounded-sm ${
                  selectedUnit.id === unit.id 
                  ? 'border-orange-500/50 text-orange-400 bg-orange-500/10' 
                  : 'border-slate-800 text-slate-500 hover:bg-slate-800'
                }`}
              >
                {unit.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col relative bg-[#0d1117]/60 border-x border-slate-800/50 shadow-2xl">
        {error && (
          <div className="mx-6 mt-6 p-4 bg-red-950/20 border-l-4 border-red-600 text-red-400 text-xs flex items-center gap-4 font-mono animate-in fade-in slide-in-from-top-2">
            <AlertTriangle size={18} className="flex-shrink-0" />
            <div className="flex-1 uppercase tracking-tighter">{error}</div>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        {isInitializing ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 border-2 border-slate-800 border-t-orange-500 rounded-full animate-spin mb-6"></div>
            <p className="text-slate-500 font-mono text-[11px] tracking-widest uppercase">系統核心同步中...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="max-w-md w-full bg-slate-900/40 p-10 border border-slate-800 rounded-xl shadow-2xl">
              <div className="w-16 h-16 bg-orange-600/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-orange-500/20">
                <Cloud className="text-orange-500" size={32} />
              </div>
              <h2 className="text-xl font-mono font-bold text-white mb-4 tracking-tighter uppercase">部署教材以連結雲端庫</h2>
              <p className="text-slate-500 mb-8 text-sm leading-relaxed">
                助教將同時參考您的 PDF 教材與指定的 Google Drive 考古題庫。準備好後，請點擊下方按鈕部署核心。
              </p>
              <Button onClick={() => setIsAdminOpen(true)} className="w-full">
                配置核心與上傳
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-10 scroll-smooth">
              {messages.map((msg, idx) => <MessageBubble key={idx} message={msg} />)}
              {isLoading && (
                 <div className="flex justify-start">
                    <div className="bg-slate-900 border-l-2 border-orange-600 px-6 py-4 flex items-center gap-4 shadow-xl">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
                        <span className="text-orange-400 font-mono text-xs uppercase tracking-widest">雲端數據處理中...</span>
                    </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-6 bg-slate-900/30 border-t border-slate-800 backdrop-blur-md">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-4">
                    <textarea
                        className="flex-1 p-4 bg-slate-950 border border-slate-800 text-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 outline-none resize-none font-mono text-sm transition-all"
                        placeholder={`針對 [${selectedUnit.label}] 單元回答或提問...`}
                        rows={1}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                    />
                    <button 
                      type="submit" 
                      disabled={!inputText.trim() || isLoading} 
                      className="px-8 bg-orange-600 hover:bg-orange-500 text-white font-mono font-bold uppercase text-xs tracking-widest transition-all disabled:opacity-20 flex items-center gap-2 border-b-4 border-orange-800 active:border-b-0 active:translate-y-1 shadow-lg"
                    >
                        <Send size={16} />
                        <span className="hidden md:inline">發送指令</span>
                    </button>
                </form>
            </div>
          </div>
        )}
      </main>

      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg animate-in fade-in">
          <div className="bg-[#0d1117] w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-800 p-1 shadow-2xl rounded-lg">
            <div className="caution-stripe rounded-t-lg"></div>
            <div className="p-8">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                  <Cpu className="text-orange-500" size={20} />
                  <h2 className="text-lg font-mono font-bold uppercase text-white tracking-tighter">教材模組與雲端同步配置</h2>
                </div>
                <button onClick={() => setIsAdminOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                <NoteUploader onNotesSubmit={handleStartSession} isLoading={isLoading} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;