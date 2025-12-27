
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
      // @ts-ignore
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasKey(selected);
      setIsInitializing(false);
    };
    checkKey();
  }, []);

  const handleOpenKeySelection = async () => {
    // @ts-ignore
    await window.aistudio.openSelectKey();
    setHasKey(true);
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
        let msg = err.message || "";
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
              className={`p-3 transition-all border rounded shadow-inner ${hasKey ? 'text-yellow-500 bg-yellow-900/20 border-yellow-700/50' : 'text-slate-400 border-slate-800 hover:bg-slate-800'}`}
            >
              <Settings size={22} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col bg-[#0d1117]/80 border-x border-slate-800 shadow-2xl overflow-hidden relative">
        {error && (
          <div className="mx-6 mt-6 p-5 bg-red-950/40 border-l-4 border-red-600 text-red-400 text-xs flex items-center gap-4 font-mono z-20 shadow-2xl">
            <AlertTriangle size={20} className="flex-shrink-0" />
            <div className="flex-1 font-bold leading-relaxed">{error}</div>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-900/40 rounded transition-colors"><X size={18} /></button>
          </div>
        )}

        {isInitializing ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="w-16 h-16 border-4 border-slate-800 border-t-orange-500 rounded-full animate-spin mb-6"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className={`max-w-md w-full p-12 rounded shadow-2xl relative group border transition-all duration-500 ${hasKey ? 'bg-black border-yellow-900/50' : 'bg-slate-900 border-slate-800'}`}>
              {hasKey && <div className="absolute inset-0 bg-yellow-500/5 pointer-events-none"></div>}
              <div className="absolute top-0 right-0 p-6">
                <ShieldCheck className={hasKey ? 'text-yellow-700/50' : 'text-slate-800'} size={48} />
              </div>
              {/* Fix duplicate className attribute on Cloud component below */}
              <Cloud className={`${hasKey ? 'text-yellow-500' : 'text-orange-500'} mx-auto mb-6`} size={56} />
              <h2 className="text-2xl font-mono font-bold text-white mb-4 uppercase tracking-tighter">部署 100MB+ 教材核心</h2>
              <p className="text-slate-500 mb-10 text-sm leading-relaxed font-sans">
                透過「多檔案分片」技術，您可以上傳多個 50MB 以下的檔案，系統將自動融合成超過 100MB 的完整資料庫。
              </p>
              <Button onClick={toggleAdmin} variant={hasKey ? 'primary' : 'primary'} className={hasKey ? 'bg-yellow-600 border-yellow-900 hover:bg-yellow-500' : ''}>
                開始配置與同步
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-12 scroll-smooth custom-scrollbar">
              {messages.map((msg, idx) => <MessageBubble key={idx} message={msg} />)}
              {isLoading && (
                 <div className="flex justify-start">
                    <div className={`border-l-4 px-8 py-5 flex items-center gap-5 shadow-2xl ${hasKey ? 'bg-black border-yellow-600' : 'bg-slate-900 border-orange-600'}`}>
                        <Activity className={hasKey ? 'text-yellow-500 animate-pulse' : 'text-orange-500 animate-pulse'} size={20} />
                        <span className={`font-mono text-xs uppercase tracking-widest font-bold ${hasKey ? 'text-yellow-500' : 'text-orange-400'}`}>正在演算高級學理...</span>
                    </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-8 bg-black/60 border-t border-slate-800 backdrop-blur-lg">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-4">
                    <textarea
                        className="flex-1 p-5 bg-black border border-slate-700 text-slate-100 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 outline-none resize-none font-mono text-sm shadow-inner"
                        placeholder="輸入對教材內容的提問..."
                        rows={1}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                    />
                    <button 
                      type="submit" 
                      disabled={!inputText.trim() || isLoading} 
                      className={`px-10 text-white font-mono font-bold uppercase text-xs tracking-widest transition-all disabled:opacity-30 border-b-4 active:border-b-0 active:translate-y-1 shadow-lg ${hasKey ? 'bg-yellow-700 hover:bg-yellow-600 border-yellow-900' : 'bg-orange-600 hover:bg-orange-500 border-orange-800'}`}
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
          </div>
        )}
      </main>

      {isAdminOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
          <div className={`w-full max-w-3xl max-h-[90vh] overflow-hidden border p-1 shadow-[0_0_120px_rgba(0,0,0,0.6)] flex flex-col rounded-lg ${hasKey ? 'bg-[#0a0c10] border-yellow-700/50' : 'bg-[#0d1117] border-slate-700'}`}>
            <div className={hasKey ? "h-1 bg-yellow-600" : "caution-stripe"}></div>
            
            <div className="p-8 md:p-10 flex-1 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-sm ${isLoading ? (hasKey ? 'bg-yellow-600' : 'bg-orange-600') + ' animate-pulse' : 'bg-slate-800'}`}>
                    {isLoading ? <Zap size={24} className="text-white" /> : <Cpu size={24} className="text-slate-400" />}
                  </div>
                  <div>
                    <h2 className={`text-xl font-mono font-bold uppercase tracking-tighter ${hasKey ? 'text-yellow-500' : 'text-white'}`}>
                      {isLoading ? 'CORE_ACTIVE_DEPLOY' : '教材配置中心'}
                    </h2>
                    <div className="flex items-center gap-3 mt-1">
                       <span className={`text-[10px] font-mono tracking-widest uppercase ${isLoading ? 'text-orange-500' : 'text-emerald-500'}`}>{statusText}</span>
                       {hasKey && <span className="text-[9px] px-2 py-0.5 bg-yellow-600/20 text-yellow-500 border border-yellow-500/30 rounded-full font-bold">PREMIUM_TIER</span>}
                    </div>
                  </div>
                </div>
                {!isLoading && (
                  <button onClick={toggleAdmin} className="text-slate-500 hover:text-white transition-colors p-2">
                    <X size={28} />
                  </button>
                )}
              </div>

              {!hasKey && !isLoading && (
                 <div className="mb-8 p-6 bg-yellow-950/20 border border-yellow-600/30 rounded-lg flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 text-yellow-500">
                       <CreditCard size={28} className="flex-shrink-0" />
                       <div className="text-left">
                          <p className="font-bold text-sm uppercase">建議選取付費 API Key</p>
                          <p className="text-[10px] text-slate-400 font-sans mt-1">付費 API 提供更高頻寬處理大型教材分片 (100MB+)。</p>
                       </div>
                    </div>
                    <button 
                      onClick={handleOpenKeySelection}
                      className="whitespace-nowrap bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-2 px-6 rounded text-xs uppercase transition-all shadow-lg"
                    >
                      啟用付費功能
                    </button>
                 </div>
              )}

              {isLoading ? (
                <div className="flex flex-col h-[480px]">
                  <div className="flex items-center justify-between mb-6 px-1">
                    <div className="flex items-center gap-2">
                      <Activity size={14} className={hasKey ? 'text-yellow-500' : 'text-orange-500'} />
                      <span className={`text-[11px] font-mono font-bold uppercase tracking-widest ${hasKey ? 'text-yellow-500' : 'text-orange-500'}`}>Processing</span>
                    </div>
                    <span className="text-slate-400 font-mono text-sm font-bold">{Math.floor(progress)}%</span>
                  </div>

                  <div className="w-full h-3 bg-slate-950 border border-slate-800 mb-10 overflow-hidden rounded-full p-0.5">
                    <div className={`h-full transition-all duration-700 rounded-full ${hasKey ? 'bg-gradient-to-r from-yellow-700 to-yellow-400' : 'bg-gradient-to-r from-orange-800 to-orange-500'}`} style={{ width: `${progress}%` }}></div>
                  </div>

                  <div className="flex-1 bg-black border border-slate-800 p-8 font-mono text-[11px] overflow-hidden relative shadow-2xl rounded">
                    <div className={`absolute inset-0 h-40 w-full animate-scanline pointer-events-none ${hasKey ? 'bg-gradient-to-b from-transparent via-yellow-500/5 to-transparent' : 'bg-gradient-to-b from-transparent via-orange-500/5 to-transparent'}`}></div>
                    <div className="space-y-4 h-full overflow-y-auto no-scrollbar scroll-smooth">
                        {deploymentLogs.map((log, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <span className="text-slate-700 font-bold">[{i+1}]</span>
                                <span className={i === deploymentLogs.length - 1 ? (hasKey ? "text-yellow-500 font-bold" : "text-orange-400 font-bold") : "text-slate-600"}>{log}</span>
                            </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                  </div>
                </div>
              ) : (
                <NoteUploader onNotesSubmit={handleStartSession} isLoading={isLoading} />
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(400%); } }
        .animate-scanline { animation: scanline 5s linear infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
