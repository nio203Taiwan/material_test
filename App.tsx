import React, { useState, useRef, useEffect } from 'https://esm.sh/react@18.3.1';
import { Message, NoteData } from './types.ts';
import { NoteUploader } from './components/NoteUploader.tsx';
import { MessageBubble } from './components/MessageBubble.tsx';
import { Button } from './components/Button.tsx';
import * as Lucide from 'https://esm.sh/lucide-react@0.294.0?deps=react@18.3.1';
import { initializeChat, sendMessage } from './services/geminiService.ts';

const { Send, Settings, X, AlertTriangle, Cpu, HardHat, Gauge, Layers } = Lucide;

const STORAGE_KEY = 'matsci_ta_notes';

const UNITS = [
  { id: 'all', label: 'ALL_SECTORS', desc: '綜合全章節' },
  { id: 'crystal', label: 'CRYSTAL_STR', desc: '晶體結構' },
  { id: 'thermo', label: 'THERMO_DYN', desc: '材料熱力學' },
  { id: 'kinetics', label: 'KINETICS', desc: '材料動力學' },
  { id: 'phase', label: 'PHASE_DIAG', desc: '相圖與相變' },
  { id: 'mech', label: 'MECH_PROP', desc: '機械性質' },
  { id: 'elec', label: 'ELEC_MATS', desc: '電子/電磁性質' },
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
      const initialResponse = await initializeChat(noteData, selectedUnit.desc);
      setMessages([{ role: 'model', text: initialResponse, timestamp: Date.now() }]);
      setIsAdminOpen(false);
    } catch (err: any) {
      setError("初始化失敗：" + (err.message || "未知原因"));
    } finally {
      setIsLoading(false);
      setIsInitializing(false);
    }
  };

  const handleUnitChange = async (unit: typeof UNITS[0]) => {
    if (isLoading || isInitializing) return;
    setSelectedUnit(unit);
    
    if (messages.length > 0) {
      setIsLoading(true);
      try {
        const responseText = await sendMessage(`[系統指令]: 使用者已切換測驗單元為「${unit.desc}」。請立即根據此單元出題或進行指導。`);
        setMessages((prev) => [...prev, { role: 'model', text: responseText, timestamp: Date.now() }]);
      } catch (err: any) {
        setError("單元切換錯誤: " + err.message);
      } finally {
        setIsLoading(false);
      }
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
      setError("連線錯誤: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-cyan-500/30">
      <header className="bg-[#0d0f11] border-b-2 border-slate-700 sticky top-0 z-20 shadow-2xl">
        <div className="caution-stripe h-1 w-full"></div>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="bg-[#c2410c] text-white p-2 border-2 border-amber-400">
                    <Cpu size={24} />
                </div>
                <div>
                  <h1 className="font-mono font-bold text-xl tracking-tighter text-slate-100 uppercase">MatSci.Processor</h1>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <p className="text-[10px] text-cyan-500 font-mono tracking-widest uppercase">TA Node Active</p>
                  </div>
                </div>
            </div>
            <button onClick={() => setIsAdminOpen(true)} className="p-2 text-slate-500 hover:text-cyan-400 border border-slate-700 bg-slate-800/50">
              <Settings size={20} />
            </button>
        </div>
        
        <div className="bg-slate-900 border-t border-slate-800 px-6 py-2 overflow-x-auto whitespace-nowrap">
          <div className="max-w-6xl mx-auto flex items-center gap-3">
            <div className="flex items-center gap-2 text-slate-500 font-mono text-[10px] pr-4 border-r border-slate-800">
               <Layers size={14} />
               <span>SECTOR_SELECT:</span>
            </div>
            {UNITS.map((unit) => (
              <button
                key={unit.id}
                onClick={() => handleUnitChange(unit)}
                className={`px-3 py-1 font-mono text-xs border transition-all ${
                  selectedUnit.id === unit.id 
                  ? 'border-cyan-500 text-cyan-400 bg-cyan-900/20' 
                  : 'border-slate-800 text-slate-500 hover:text-slate-400'
                }`}
              >
                {unit.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col relative bg-[#0d0f11]/80 backdrop-blur-sm border-x border-slate-800">
        {error && (
          <div className="m-4 p-4 bg-red-900/20 border-l-4 border-red-500 text-red-400 text-sm flex items-center gap-3 font-mono">
            <AlertTriangle size={18} />
            <div className="flex-1">{error}</div>
            <button onClick={() => setError(null)} className="p-1"><X size={16} /></button>
          </div>
        )}

        {isInitializing ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
            <div className="w-12 h-12 border-4 border-slate-800 border-t-cyan-500 rounded-full animate-spin"></div>
            <p className="text-cyan-500 font-mono text-sm tracking-widest animate-pulse">SYSTEM_BOOTING...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <div className="bg-slate-800/50 p-10 border border-slate-700 shadow-2xl max-w-md">
              <h2 className="text-2xl font-mono font-bold text-slate-100 mb-4 tracking-tight underline decoration-cyan-500 underline-offset-8">INITIATE EXAM MODE</h2>
              <p className="text-slate-400 mb-8 text-sm">系統需要匯入教材模組以開始分析。</p>
              <Button onClick={() => setIsAdminOpen(true)} className="w-full">部署原始教材</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
              {messages.map((msg, idx) => <MessageBubble key={idx} message={msg} />)}
              {isLoading && (
                 <div className="flex justify-start">
                    <div className="bg-slate-800 border-l-4 border-cyan-500 px-6 py-4 text-cyan-400 font-mono text-sm">
                        <span>分析中...</span>
                    </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-6 bg-[#0d0f11] border-t border-slate-800">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-3">
                    <textarea
                        className="flex-1 p-4 bg-slate-900 border border-slate-700 text-slate-100 focus:border-cyan-500 outline-none resize-none font-mono text-sm"
                        placeholder={`針對 [${selectedUnit.label}] 回答...`}
                        rows={1}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                    />
                    <button type="submit" disabled={!inputText.trim() || isLoading} className="px-6 bg-[#c2410c] text-white border-b-4 border-amber-700 active:translate-y-1 active:border-b-0 disabled:opacity-30">
                        <Send size={20} />
                    </button>
                </form>
            </div>
          </div>
        )}
      </main>

      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-slate-700 p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
              <h2 className="text-xl font-mono font-bold uppercase text-slate-100">核心配置系統</h2>
              <button onClick={() => setIsAdminOpen(false)} className="p-2 text-slate-500 hover:text-red-500"><X size={20} /></button>
            </div>
            <NoteUploader onNotesSubmit={handleStartSession} isLoading={isLoading} />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;