
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
  CreditCard,
  Key,
  CheckCircle2
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
    "STAGE_03: 建立加密通訊連線...",
    "STAGE_04: 正在掛載高階熱力學引擎...",
    "STAGE_05: 同步大型考古題題庫 (ID: 1HIK1rm...)",
    "STAGE_06: 多軌數據注入 Gemini 3.0 Core...",
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

  const getAIStudio = () => (window as any).aistudio;

  const checkActualKey = () => {
    try {
      // 偵測是否真的有值
      const k = process.env.API_KEY;
      return typeof k === 'string' && k.length > 5;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const checkKey = async () => {
      try {
        const aistudio = getAIStudio();
        if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
          const selected = await aistudio.hasSelectedApiKey();
          setHasKey(selected);
        } else {
          setHasKey(checkActualKey());
        }
      } catch (err) {
        setHasKey(checkActualKey());
      } finally {
        setIsInitializing(false);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelection = async () => {
    const aistudio = getAIStudio();
    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      try {
        await aistudio.openSelectKey();
        setHasKey(true);
      } catch (err) {
        console.error("選取失敗:", err);
      }
    } else {
      setError("當前環境不支援主動選取。請確保 Vercel 環境變數 API_KEY 已設定並重新部署 (Redeploy)。");
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
    if (!hasKey) {
      setError("偵測不到有效的 API_KEY。如果您已在 Vercel 設定，請務必執行 Redeploy (重新部署) 才能生效。");
      setIsAdminOpen(true);
      return;
    }

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
        setError(err.message || "初始化失敗。");
        setIsLoading(false);
        setStatusText('部署中斷');
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

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center">
        <Loader2 className="text-orange-500 animate-spin mb-4" size={40} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans text-slate-200 ${hasKey ? 'bg-[#0a0c10]' : 'bg-[#0d1117]'}`}>
      <header className={`border-b sticky top-0 z-40 shadow-2xl transition-colors duration-500 ${hasKey ? 'bg-black border-yellow-600/30' : 'bg-[#0d1117] border-slate-800'}`}>
        <div className={hasKey ? "h-1 bg-gradient-to-r from-yellow-600 via-yellow-200 to-yellow-600" : "caution-stripe"}></div>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`${hasKey ? 'bg-yellow-600' : 'bg-[#c2410c]'} text-black font-bold p-2 border border-white/20 shadow-lg`}>
              <Cpu size={20} />
            </div>
            <div>
              <h1 className="font-mono font-bold text-lg tracking-tighter text-white uppercase">材科助教.Pro</h1>
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full animate-pulse ${hasKey ? 'bg-yellow-400' : 'bg-red-500'}`}></span>
                <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                  {hasKey ? 'ENVIRONMENT_LINKED' : 'KEY_MISSING_ALERT'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={toggleAdmin} className={`p-3 border rounded ${hasKey ? 'text-yellow-500 border-yellow-700/50' : 'text-slate-400 border-slate-800'}`}>
            <Settings size={22} />
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col bg-[#0d1117]/80 border-x border-slate-800 shadow-2xl overflow-hidden relative">
        {error && (
          <div className="mx-6 mt-6 p-5 bg-red-950/40 border-l-4 border-red-600 text-red-400 text-xs flex items-center gap-4 font-mono z-20">
            <AlertTriangle size={20} className="flex-shrink-0" />
            <div className="flex-1 font-bold leading-relaxed">{error}</div>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-900/40 rounded"><X size={18} /></button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className={`max-w-md w-full p-12 rounded shadow-2xl border transition-all duration-500 ${hasKey ? 'bg-black border-yellow-900/50' : 'bg-slate-900 border-slate-800'}`}>
              {/* Fixed: Combined duplicate className attributes into one template string */}
              <Cloud className={`${hasKey ? 'text-yellow-500' : 'text-orange-500'} mx-auto mb-6`} size={56} />
              <h2 className="text-2xl font-mono font-bold text-white mb-4 uppercase">部署教材核心</h2>
              <p className="text-slate-500 mb-10 text-sm">
                {hasKey ? "環境已連結。請掛載教材分片以啟動 AI 專家核心。" : "尚未偵測到 API_KEY。若您已在 Vercel 設定，請點擊「Redeploy」更新部署。"}
              </p>
              <Button onClick={toggleAdmin}>進入配置中心</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-12 custom-scrollbar">
              {messages.map((msg, idx) => <MessageBubble key={idx} message={msg} />)}
              {isLoading && (
                 <div className="flex justify-start">
                    <div className="bg-slate-900 border-l-4 border-orange-600 px-8 py-5 flex items-center gap-5">
                        <Activity className="text-orange-500 animate-pulse" size={20} />
                        <span className="font-mono text-xs uppercase text-orange-400">正在演算高級學理...</span>
                    </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-8 bg-black/60 border-t border-slate-800 backdrop-blur-lg">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-4">
                    <textarea
                        className="flex-1 p-5 bg-black border border-slate-700 text-slate-100 focus:border-orange-500 outline-none resize-none font-mono text-sm"
                        placeholder="輸入材料科學提問..."
                        rows={1}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                    />
                    <button type="submit" disabled={!inputText.trim() || isLoading} className="px-10 bg-orange-600 text-white font-mono font-bold uppercase text-xs border-b-4 border-orange-800 hover:bg-orange-500 active:border-b-0 active:translate-y-1 disabled:opacity-30">
                        <Send size={18} />
                    </button>
                </form>
            </div>
          </div>
        )}
      </main>

      {isAdminOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
          <div className={`w-full max-w-3xl max-h-[90vh] overflow-hidden border p-1 flex flex-col rounded-lg ${hasKey ? 'bg-[#0a0c10] border-yellow-700/50' : 'bg-[#0d1117] border-slate-700'}`}>
            <div className={hasKey ? "h-1 bg-yellow-600" : "caution-stripe"}></div>
            <div className="p-8 md:p-10 flex-1 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-sm ${isLoading ? 'bg-orange-600 animate-pulse' : 'bg-slate-800'}`}>
                    <Cpu size={24} className={isLoading ? 'text-white' : 'text-slate-400'} />
                  </div>
                  <h2 className="text-xl font-mono font-bold uppercase tracking-tighter text-white">教材配置中心</h2>
                </div>
                {!isLoading && <button onClick={toggleAdmin} className="text-slate-500 hover:text-white"><X size={28} /></button>}
              </div>

              {/* 系統診斷區塊 */}
              {!isLoading && (
                <div className="mb-8 p-6 bg-slate-900 border border-slate-800 rounded-lg">
                  <h3 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <ShieldCheck size={12} /> SYSTEM_DIAGNOSTICS
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-black/40 rounded border border-slate-800">
                      {hasKey ? <CheckCircle2 size={16} className="text-emerald-500" /> : <AlertTriangle size={16} className="text-red-500" />}
                      <span className="text-[11px] font-mono">API_KEY: {hasKey ? 'LINKED' : 'NOT_FOUND'}</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-black/40 rounded border border-slate-800">
                      <Lock size={16} className="text-slate-500" />
                      <span className="text-[11px] font-mono">ENCRYPTION: AES-256</span>
                    </div>
                  </div>
                  {!hasKey && (
                    <p className="mt-4 text-[10px] text-red-400 leading-relaxed font-mono animate-pulse">
                      [ALERT]: 偵測不到 Vercel 注入的 API_KEY。請確認變數名稱為 API_KEY，並在 Vercel 點擊「Redeploy」重新部署。
                    </p>
                  )}
                </div>
              )}

              {isLoading ? (
                <div className="flex flex-col h-[400px]">
                  <div className="flex items-center justify-between mb-6 px-1 text-[11px] font-mono">
                    <span className="text-orange-500">Processing...</span>
                    <span className="text-slate-400">{Math.floor(progress)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 border border-slate-800 mb-10 overflow-hidden rounded-full">
                    <div className="h-full bg-orange-600 transition-all duration-700" style={{ width: `${progress}%` }}></div>
                  </div>
                  <div className="flex-1 bg-black border border-slate-800 p-6 font-mono text-[10px] overflow-y-auto space-y-2">
                      {deploymentLogs.map((log, i) => (
                          <div key={i} className="text-slate-500 flex gap-2">
                              <span className="opacity-30">[{i}]</span>
                              <span className={i === deploymentLogs.length - 1 ? "text-orange-400" : ""}>{log}</span>
                          </div>
                      ))}
                      <div ref={logEndRef} />
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
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>
    </div>
  );
};

export default App;
