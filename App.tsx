
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
  Cloud,
  Loader2,
  Activity,
  Key,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { initializeChat, sendMessage } from './services/geminiService.ts';

const DEPLOYMENT_STAGES = [
    "STAGE_01: 正在封裝二進位教材分片...",
    "STAGE_02: 驗證安全憑證...",
    "STAGE_03: 同步大型考古題題庫 (ID: 1HIK1rm...)",
    "STAGE_04: 正在掛載 Gemini 3.0 Pro 專家核心...",
    "STAGE_05: 校準材料科學專業語氣...",
    "STAGE_06: 教材核心融合完成。系統啟動。"
];

const LOCAL_STORAGE_KEY = 'matsci_api_key';

const App: React.FC = () => {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // 初始化時讀取 LocalStorage
  useEffect(() => {
    const savedKey = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedKey) {
      setApiKey(savedKey);
    }
    // 如果沒有 Key，自動打開設定面板
    if (!savedKey) {
      setIsAdminOpen(true);
    }
  }, []);

  // 當 Key 改變時存入 LocalStorage
  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setApiKey(newVal);
    setError(null); // 清除錯誤，讓使用者重試
    localStorage.setItem(LOCAL_STORAGE_KEY, newVal);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (logEndRef.current) {
        logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [deploymentLogs]);

  const handleStartSession = (noteData: NoteData) => {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      setError("請先在配置中心輸入有效的 Gemini API Key 才能啟動系統。");
      setIsAdminOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(5);
    setDeploymentLogs([DEPLOYMENT_STAGES[0]]);

    let stageIdx = 0;
    const logInterval = setInterval(() => {
      if (stageIdx < DEPLOYMENT_STAGES.length - 1) {
        stageIdx++;
        setDeploymentLogs(prev => [...prev, DEPLOYMENT_STAGES[stageIdx]]);
        setProgress(prev => Math.min(prev + 15, 95));
      }
    }, 600);

    // 將 API Key 傳入初始化函數
    initializeChat(noteData, trimmedKey).then((initialResponse) => {
        clearInterval(logInterval);
        setProgress(100);
        setDeploymentLogs(prev => [...prev, "COMPLETE: 專家級核心已成功上線。"]);
        
        // 確保訊息被寫入
        const welcomeMsg = initialResponse || "核心已連線，但未回傳歡迎語。請直接開始提問。";
        setMessages([{ role: 'model', text: welcomeMsg, timestamp: Date.now() }]);
        
        setTimeout(() => {
            setIsAdminOpen(false);
            setIsLoading(false);
        }, 1000);
    }).catch((err) => {
        clearInterval(logInterval);
        console.error("Init failed:", err);
        setError(err.message || "系統初始化發生未知錯誤");
        setIsLoading(false);
        setIsAdminOpen(true); // 保持開啟以顯示錯誤
    });
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
    <div className={`min-h-screen flex flex-col font-sans text-slate-200 bg-[#0d1117]`}>
      <header className="border-b sticky top-0 z-40 bg-black/80 backdrop-blur-md border-slate-800">
        <div className="caution-stripe"></div>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-[#c2410c] text-black font-bold p-2"><Cpu size={20} /></div>
            <h1 className="font-mono font-bold text-lg tracking-tighter uppercase">材科助教.Pro</h1>
          </div>
          <button onClick={() => setIsAdminOpen(true)} className={`p-3 border rounded transition-colors ${!apiKey ? 'border-red-500 text-red-500 animate-pulse' : 'border-slate-800 text-slate-400 hover:text-white'}`}>
            <Settings size={22} />
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col relative overflow-hidden">
        {/* 主要介面的錯誤提示 (僅在 Modal 關閉時顯示) */}
        {error && !isAdminOpen && (
          <div className="mx-6 mt-6 p-5 bg-red-950/40 border-l-4 border-red-600 text-red-400 text-xs flex items-center gap-4 font-mono z-50 animate-in fade-in slide-in-from-top-4">
            <AlertTriangle size={20} className="flex-shrink-0" />
            <div className="flex-1 font-bold">{error}</div>
            <button onClick={() => setError(null)}><X size={18} /></button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="max-w-md w-full p-12 rounded bg-slate-900 border border-slate-800 shadow-2xl">
              <Cloud className="text-orange-500 mx-auto mb-6" size={56} />
              <h2 className="text-2xl font-mono font-bold text-white mb-4">部署教材核心</h2>
              <p className="text-slate-500 mb-10 text-sm italic">請掛載您的 PDF 教材以啟動 AI 模擬考機制</p>
              <Button onClick={() => setIsAdminOpen(true)}>進入配置中心</Button>
              {!apiKey && (
                <div className="mt-6 flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase justify-center animate-pulse">
                   <AlertTriangle size={12} /> 尚未配置 Access Token
                </div>
              )}
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
                        <span className="font-mono text-xs uppercase text-orange-400 tracking-widest">正在演算高級學理...</span>
                    </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-8 bg-black/60 border-t border-slate-800">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-4">
                    <textarea
                        className="flex-1 p-5 bg-black border border-slate-700 text-slate-100 focus:border-orange-500 outline-none resize-none font-mono text-sm"
                        placeholder="輸入對教材內容的提問..."
                        rows={1}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                    />
                    <button type="submit" disabled={!inputText.trim() || isLoading} className="px-10 bg-orange-600 text-white font-mono font-bold uppercase border-b-4 border-orange-800 hover:bg-orange-500 disabled:opacity-30">
                        <Send size={18} />
                    </button>
                </form>
            </div>
          </div>
        )}
      </main>

      {isAdminOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden border border-slate-700 p-1 flex flex-col rounded-lg bg-[#0d1117]">
            <div className="caution-stripe"></div>
            <div className="p-8 md:p-10 flex-1 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded ${isLoading ? 'bg-orange-600 animate-pulse' : 'bg-slate-800'}`}>
                    <Cpu size={24} className={isLoading ? 'text-white' : 'text-slate-400'} />
                  </div>
                  <h2 className="text-xl font-mono font-bold uppercase text-white">教材配置中心</h2>
                </div>
                {!isLoading && <button onClick={() => setIsAdminOpen(false)} className="text-slate-500 hover:text-white"><X size={28} /></button>}
              </div>

              {/* Modal 內部的錯誤提示 (這裡最重要，防止錯誤被遮擋) */}
              {error && (
                <div className="mb-6 p-4 bg-red-950/60 border border-red-500 text-red-200 text-xs font-mono rounded flex items-start gap-3 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                    <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold mb-1">[CRITICAL ERROR DETECTED]</p>
                        <p className="opacity-90 leading-relaxed">{error}</p>
                    </div>
                </div>
              )}

              {!isLoading && (
                <div className="mb-8 p-6 bg-slate-900/50 border border-slate-800 rounded-lg">
                  <h3 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Shield size={12} /> SECURITY_CLEARANCE / API ACCESS TOKEN
                  </h3>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key size={16} className={apiKey ? "text-orange-500" : "text-slate-600"} />
                    </div>
                    <input
                      type={showKey ? "text" : "password"}
                      value={apiKey}
                      onChange={handleKeyChange}
                      placeholder="請輸入 Gemini API Key (AI Studio)"
                      className="w-full bg-black border border-slate-700 text-slate-200 pl-10 pr-12 py-3 font-mono text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 outline-none transition-all placeholder:text-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                    >
                      {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="mt-3 text-[10px] text-slate-500 font-mono flex items-center justify-between">
                    <span>* KEY 將僅儲存於您的瀏覽器本地端 (Local Storage)</span>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                      [GET_NEW_KEY]
                    </a>
                  </p>
                </div>
              )}

              {isLoading ? (
                <div className="flex flex-col h-[400px]">
                  <div className="flex items-center justify-between mb-6 px-1 text-[11px] font-mono">
                    <span className="text-orange-500 animate-pulse">DEPLOYING_CORE...</span>
                    <span className="text-slate-400">{Math.floor(progress)}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-950 border border-slate-800 mb-10 overflow-hidden">
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
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }`}</style>
    </div>
  );
};

export default App;
