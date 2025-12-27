
import React, { useState, useRef, useEffect } from 'react';
import { Message, NoteData } from './types.ts';
import { NoteUploader } from './components/NoteUploader.tsx';
import { MessageBubble } from './components/MessageBubble.tsx';
import { Button } from './components/Button.tsx';
import { 
  Send, 
  Settings, 
  X, 
  AlertTriangle, 
  Cpu, 
  Terminal, 
  Box, 
  Cloud,
  Loader2,
  Activity,
  ShieldCheck,
  Zap,
  Lock,
  Unlock,
  CreditCard
} from 'lucide-react';
import { initializeChat, sendMessage } from './services/geminiService.ts';

const STORAGE_KEY_TEXT = 'matsci_ta_text_only';

const UNITS = [
  { id: 'all', label: '綜合章節', desc: '材料科學與工程導論(全)' },
  { id: 'thermo', label: '材料熱力學', desc: '熱力學定律與自由能計算' },
  { id: 'structure', label: '晶體結構', desc: '晶體缺陷、對稱性與繞射' },
  { id: 'kinetics', label: '擴散動力學', desc: 'Fick\'s Law 與反應速率' },
  { id: 'phase', label: '相圖相變', desc: '相平衡、鐵碳平衡圖與相變動力學' },
  { id: 'mechanical', label: '機械性質', desc: '位錯理論、強化機制與斷裂力學' },
];

const DEPLOYMENT_STAGES = [
    "STAGE_01: 正在封裝二進位教材分片...",
    "STAGE_02: 正在計算大規模晶格缺陷場...",
    "STAGE_03: 建立付費級別加密連線...",
    "STAGE_04: 正在掛載高階熱力學引擎...",
    "STAGE_05: 同步大型考古題題庫 (ID: 1HIK1rm...)",
    "STAGE_06: 多軌數據注入 Gemini 3.0 Pro Core...",
    "STAGE_07: 校準專家級助教語氣...",
    "STAGE_08: 正在生成初始考點地圖...",
    "STAGE_09: 教材核心融合完成。系統啟動。"
];

// Fix: Use the established 'AIStudio' type to resolve the subsequent property declaration error.
declare global {
  interface Window {
    aistudio?: AIStudio;
  }
}

const App: React.FC = () => {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(UNITS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('系統就緒');
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      try {
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
          const selected = await window.aistudio.hasSelectedApiKey();
          setHasKey(selected);
        } else {
          // If running on Vercel or other environments, check process.env.API_KEY.
          setHasKey(!!process.env.API_KEY);
        }
      } catch (err) {
        console.warn("API Key check failed, falling back to environment variable.", err);
        setHasKey(!!process.env.API_KEY);
      } finally {
        setIsInitializing(false);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelection = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      try {
        await window.aistudio.openSelectKey();
        setHasKey(true);
      } catch (err) {
        console.error("Failed to open key selection", err);
      }
    } else {
      setError("當前環境不支援主動選取金鑰。請確保已在伺服器端或 Vercel 環境變數中設定 API_KEY。");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (logEndRef.current) {
        logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [deploymentLogs]);

  const toggleAdmin = () => {
    setIsAdminOpen(!isAdminOpen);
  };

  const handleStartSession = (noteData: NoteData) => {
    setIsLoading(true);
    setError(null);
    setProgress(5);
    setStatusText('正在初始化核心');
    setDeploymentLogs([DEPLOYMENT_STAGES[0]]);

    setTimeout(async () => {
      let stageIdx = 0;
      const logInterval = setInterval(() => {
        if (stageIdx < DEPLOYMENT_STAGES.length - 1) {
          stageIdx++;
          setDeploymentLogs(prev => [...prev, DEPLOYMENT_STAGES[stageIdx]]);
          setProgress(prev => Math.min(prev + (100 / DEPLOYMENT_STAGES.length), 95));
        }
      }, 700);

      try {
        const textNotes = noteData.filter(n => n.type === 'text');
        localStorage.setItem(STORAGE_KEY_TEXT, JSON.stringify(textNotes));

        const initialResponse = await initializeChat(noteData, selectedUnit.desc);
        
        clearInterval(logInterval);
        setProgress(100);
        setStatusText('部署完成');
        setDeploymentLogs(prev => [...prev, "COMPLETE: 專家級核心已成功上線。"]);
        setMessages([{ role: 'model', text: initialResponse, timestamp: Date.now() }]);
        
        setTimeout(() => {
          setIsAdminOpen(false);
          setIsLoading(false);
          setDeploymentLogs([]);
          setProgress(0);
          setStatusText('系統就緒');
        }, 1200);

      } catch (err: any) {
        clearInterval(logInterval);
        let msg = err.message || "初始化失敗";
        if (msg.includes("limit") || msg.includes("400")) {
          msg = "單個檔案分片仍超過 50MB。請將您的 100MB 檔案分割為 2~3 個較小的 PDF 檔案再分別上傳，系統會自動融合。";
        }
        setError(msg);
        setIsLoading(false);
        setStatusText('中斷');
      }
    }, 200);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', text: inputText, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const responseText = await sendMessage(userMsg.text);
      setMessages((prev) => [...prev, { role: 'model', text: responseText, timestamp: Date.now() }]);
    } catch (err: any) {
      setError("通訊異常: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans text-slate-200 selection:bg-orange-500/40 ${hasKey ? 'bg-[#0a0c10]' : 'bg-[#0d1117]'}`}>
      <header className={`border-b sticky top-0 z-40 shadow-2xl transition-colors duration-500 ${hasKey ? 'bg-black border-yellow-600/30' : 'bg-[#0d1117] border-slate-800'}`}>
        <div className={hasKey ? "h-1 bg-gradient-to-r from-yellow-600 via-yellow-200 to-yellow-600" : "caution-stripe"}></div>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`${hasKey ? 'bg-yellow-600' : 'bg-[#c2410c]'} text-black font-bold p-2 border border-white/20 shadow-lg`}>
              <Cpu size={20} />
            </div>
            <div>
              <h1 className="font-mono font-bold text-lg tracking-tighter text-white uppercase flex items-center gap-2">
                材科助教<span className={hasKey ? "text-yellow-500" : "text-orange-600"}>.</span>Pro
              </h1>
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full animate-pulse ${hasKey ? 'bg-yellow-400' : 'bg-emerald-500'}`}></span>
                <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                  {hasKey ? 'PAID_TIER_ACTIVE' : 'FREE_CORE_ONLINE'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!hasKey && (
              <button 
                onClick={handleOpenKeySelection}
                className="hidden md:flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded text-[10px] font-mono tracking-widest text-slate-400 transition-all border border-slate-700"
              >
                <Lock size={14} /> 啟用付費金鑰 (支援大檔案)
              </button>
            )}
            <button 
              onClick={toggleAdmin}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-6 overflow-hidden flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-700">
             <div className="relative">
                <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full"></div>
                <div className="relative bg-slate-900 border-2 border-slate-800 p-8 shadow-2xl">
                  <Cpu size={48} className="text-[#c2410c] mb-4" />
                  <h2 className="text-2xl font-mono font-bold tracking-tighter uppercase mb-2">待命系統 [READY]</h2>
                  <p className="text-slate-500 text-sm max-w-xs font-mono">
                    請點擊右上方部署按鈕或設定教材，以啟動材料科學專用 AI 核心。
                  </p>
                </div>
             </div>
             <Button onClick={toggleAdmin} className="group">
                <Settings size={18} className="group-hover:rotate-90 transition-transform" />
                進入部署終端
             </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6 pb-20 pr-2 custom-scrollbar">
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0a0c10] via-[#0a0c10]/90 to-transparent">
          <div className="max-w-4xl mx-auto relative">
             {error && (
                <div className="absolute bottom-full left-0 right-0 mb-4 p-3 bg-red-950/80 border border-red-500/50 rounded flex items-center gap-3 text-red-400 text-xs font-mono uppercase animate-in slide-in-from-bottom-2">
                   <AlertTriangle size={14} />
                   <span>{error}</span>
                   <button onClick={() => setError(null)} className="ml-auto hover:text-white"><X size={14} /></button>
                </div>
             )}
             
             <form onSubmit={handleSendMessage} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600 to-cyan-600 rounded-none blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
                <div className="relative flex bg-slate-900 border border-slate-800">
                  <div className="flex items-center px-4 border-r border-slate-800 text-slate-500">
                    <Terminal size={16} />
                  </div>
                  <input 
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={isLoading ? "正在計算學理分析..." : "輸入材料科學問題..."}
                    className="flex-1 bg-transparent px-6 py-4 outline-none font-mono text-sm placeholder:text-slate-600"
                    disabled={isLoading || messages.length === 0}
                  />
                  <button 
                    type="submit"
                    disabled={isLoading || !inputText.trim() || messages.length === 0}
                    className="px-8 bg-slate-800 border-l border-slate-700 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 transition-colors text-cyan-400"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                  </button>
                </div>
             </form>
          </div>
        </div>
      </main>

      {/* Deployment Modal */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl shadow-2xl my-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <Box className="text-orange-500" />
                <h2 className="font-mono font-bold uppercase tracking-tighter">系統部署與教材掛載</h2>
              </div>
              <button onClick={toggleAdmin} className="text-slate-500 hover:text-white"><X /></button>
            </div>
            
            <div className="p-8">
              {!isLoading ? (
                <>
                  <div className="mb-8">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">選擇目標單元</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {UNITS.map(unit => (
                        <button
                          key={unit.id}
                          onClick={() => setSelectedUnit(unit)}
                          className={`p-3 border text-left transition-all ${
                            selectedUnit.id === unit.id 
                            ? 'bg-orange-500/10 border-orange-500 text-orange-400' 
                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'
                          }`}
                        >
                          <div className="font-bold text-[11px] mb-1">{unit.label}</div>
                          <div className="text-[9px] opacity-60 leading-tight">{unit.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <NoteUploader onNotesSubmit={handleStartSession} isLoading={isLoading} />
                </>
              ) : (
                <div className="py-10">
                   <div className="mb-8 space-y-2">
                      <div className="flex justify-between text-[10px] font-mono text-cyan-400 mb-1">
                        <span>DEPLOYMENT_PROGRESS</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-cyan-500 transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                   </div>

                   <div className="bg-black border border-slate-800 p-6 font-mono text-[10px] h-48 overflow-y-auto space-y-1 text-slate-400">
                      {deploymentLogs.map((log, i) => (
                        <div key={i} className="flex gap-3">
                           <span className="text-slate-700">[{new Date().toLocaleTimeString()}]</span>
                           <span className={log.includes('COMPLETE') ? 'text-emerald-500' : ''}>{log}</span>
                        </div>
                      ))}
                      <div ref={logEndRef} />
                   </div>
                   
                   <div className="mt-8 flex flex-col items-center gap-4">
                      <div className="flex items-center gap-3 text-cyan-400 text-xs font-bold animate-pulse uppercase tracking-widest">
                         <Loader2 className="animate-spin" size={14} />
                         {statusText}...
                      </div>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Key Info Banner */}
      {!hasKey && !isAdminOpen && (
        <div className="bg-orange-950/20 border-t border-orange-900/30 p-2 text-center text-[10px] font-mono text-orange-400/60 uppercase tracking-widest">
           Notice: Free tier has strict token limits. Upgrading to paid key is recommended for large PDFs.
        </div>
      )}
    </div>
  );
};

// Fix: Add default export as expected by index.tsx.
export default App;
