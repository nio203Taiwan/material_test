import React, { useState, useRef, useEffect } from 'react';
import { AppState, Message, NoteData } from './types';
import { NoteUploader } from './components/NoteUploader';
import { MessageBubble } from './components/MessageBubble';
import { Button } from './components/Button';
import { Send, Settings, X, AlertTriangle, BookOpen, User as UserIcon } from 'lucide-react';
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

  // 1. 初始化邏輯：從 LocalStorage 讀取資料並自動啟動聊天
  useEffect(() => {
    const loadAndInit = async () => {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        try {
          const noteData: NoteData = JSON.parse(savedData);
          if (noteData.length > 0) {
            await handleStartSession(noteData);
          } else {
            setIsInitializing(false);
          }
        } catch (e) {
          console.error("Failed to parse saved notes", e);
          setIsInitializing(false);
        }
      } else {
        setIsInitializing(false);
      }
    };
    loadAndInit();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleStartSession = async (noteData: NoteData) => {
    setIsLoading(true);
    setError(null);
    try {
      // 儲存到 LocalStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(noteData));
      
      const initialResponse = await initializeChat(noteData);
      setMessages([
        {
          role: 'model',
          text: initialResponse,
          timestamp: Date.now(),
        },
      ]);
      setIsAdminOpen(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "初始化失敗，請檢查筆記內容或 API Key。");
    } finally {
      setIsLoading(false);
      setIsInitializing(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      text: inputText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    setError(null);

    try {
      const responseText = await sendMessage(userMsg.text);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: responseText,
          timestamp: Date.now(),
        },
      ]);
    } catch (err: any) {
      console.error(err);
      setError("連線失敗，請檢查網路或 API 額度。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col relative">
      {/* Header */}
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
            
            <button 
              onClick={() => setIsAdminOpen(!isAdminOpen)}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
              title="後台設定"
            >
              <Settings size={20} />
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto flex flex-col relative">
        
        {/* 初始化狀態提示 */}
        {isInitializing ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-slate-500">正在讀取筆記並召喚助教...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-sm">
              <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="text-blue-500" size={40} />
              </div>
              <h2 className="text-xl font-bold mb-2">尚未部署筆記</h2>
              <p className="text-slate-500 mb-6 text-sm">請點擊右上角 <Settings className="inline" size={14}/> 進入後台上傳您的考試筆記，助教才能開始工作。</p>
              <Button onClick={() => setIsAdminOpen(true)}>進入後台</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-[calc(100vh-73px)]">
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
              {messages.map((msg, idx) => (
                <MessageBubble key={idx} message={msg} />
              ))}
              
              {isLoading && (
                 <div className="flex w-full mb-6 justify-start">
                    <div className="flex max-w-[85%] md:max-w-[75%] gap-3 flex-row">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-white text-blue-600 border border-blue-100 shadow-sm flex items-center justify-center">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                        <div className="bg-white border border-slate-200 px-5 py-3 rounded-2xl rounded-tl-none shadow-sm">
                            <div className="flex gap-1">
                              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </div>
                        </div>
                    </div>
                </div>
              )}
              {error && (
                <div className="mx-auto max-w-md p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-xs">
                    <AlertTriangle size={14} />
                    <span>{error}</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/80 backdrop-blur-md border-t border-slate-200">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative flex items-end gap-2">
                    <div className="relative flex-1">
                        <textarea
                            className="w-full p-4 pr-12 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-32 min-h-[56px] shadow-sm transition-all"
                            placeholder="請在此輸入您的回答或解題邏輯..."
                            rows={1}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            disabled={isLoading}
                        />
                        <div className="absolute right-4 bottom-4 text-[10px] text-slate-400 pointer-events-none">
                          ENTER 傳送
                        </div>
                    </div>
                    <button 
                        type="submit" 
                        disabled={!inputText.trim() || isLoading}
                        className={`h-[56px] w-[56px] rounded-2xl flex items-center justify-center transition-all shadow-md ${
                          !inputText.trim() || isLoading 
                          ? 'bg-slate-100 text-slate-400 shadow-none' 
                          : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                        }`}
                    >
                        <Send size={20} />
                    </button>
                </form>
            </div>
          </div>
        )}
      </main>

      {/* Admin Panel Overlay */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAdminOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">管理後台</h2>
                <p className="text-xs text-slate-500">部署助教所需的應考筆記資料</p>
              </div>
              <button 
                onClick={() => setIsAdminOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <NoteUploader 
                onNotesSubmit={handleStartSession} 
                isLoading={isLoading} 
              />
              <div className="mt-4 text-center">
                <button 
                  onClick={() => {
                    if(confirm("確定要清除所有已部署的資料嗎？")) {
                      localStorage.removeItem(STORAGE_KEY);
                      window.location.reload();
                    }
                  }}
                  className="text-xs text-red-400 hover:text-red-600 underline"
                >
                  清除所有快取資料並重設系統
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;