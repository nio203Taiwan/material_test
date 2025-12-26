import React, { useState, useRef, useEffect } from 'react';
import { Message, NoteData } from './types';
import { NoteUploader } from './components/NoteUploader';
import { MessageBubble } from './components/MessageBubble';
import { Button } from './components/Button';
import { Send, Settings, X, AlertTriangle, Cpu, HardHat, Gauge } from 'lucide-react';
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
      setError(err.message || "Initialization Failed.");
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
      setError("Comms Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-cyan-500/30">
      {/* Heavy Industrial Header */}
      <header className="bg-industrial-charcoal border-b-2 border-slate-700 sticky top-0 z-20 shadow-2xl">
        <div className="caution-stripe h-1 w-full"></div>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="bg-industrial-rust text-white p-2 border-2 border-amber-400 shadow-[0_0_15px_rgba(217,119,6,0.4)]">
                    <Cpu size={24} />
                </div>
                <div>
                  <h1 className="font-mono font-bold text-xl tracking-tighter text-slate-100 uppercase">MatSci.Processor_v3</h1>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <p className="text-[10px] text-cyan-500 font-mono tracking-widest uppercase">System Online // TA Node Active</p>
                  </div>
                </div>
            </div>
            <button onClick={() => setIsAdminOpen(true)} className="p-2 text-slate-500 hover:text-cyan-400 border border-slate-700 hover:border-cyan-400 transition-all bg-slate-800/50">
              <Settings size={20} />
            </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col relative overflow-hidden bg-industrial-charcoal/80 backdrop-blur-sm border-x border-slate-800 shadow-inner">
        {error && (
          <div className="m-4 p-4 bg-red-900/20 border-l-4 border-red-500 text-red-400 text-sm flex items-center gap-3 font-mono">
            <AlertTriangle size={18} />
            <div className="flex-1">{error}</div>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-500/20 rounded"><X size={16} /></button>
          </div>
        )}

        {isInitializing ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-800 border-t-cyan-500 rounded-full animate-spin"></div>
                <Gauge className="absolute inset-0 m-auto text-cyan-500" size={24} />
            </div>
            <p className="text-cyan-500 font-mono text-sm tracking-widest animate-pulse">BOOTING MATSCI_CORE...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <div className="bg-slate-800/50 p-10 border border-slate-700 shadow-2xl max-w-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <HardHat size={80} />
              </div>
              <h2 className="text-2xl font-mono font-bold text-slate-100 mb-4 tracking-tight underline decoration-cyan-500 underline-offset-8">INITIATE EXAM MODE</h2>
              <p className="text-slate-400 mb-8 text-sm leading-relaxed">System requires material data injection. Please deploy notes to start processing.</p>
              <Button onClick={() => setIsAdminOpen(true)} className="w-full py-4 text-lg">DEPLOY SOURCE DATA</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
              {messages.map((msg, idx) => <MessageBubble key={idx} message={msg} />)}
              {isLoading && (
                 <div className="flex justify-start">
                    <div className="bg-slate-800 border-l-4 border-cyan-500 px-6 py-4 shadow-xl text-cyan-400 font-mono text-sm flex items-center gap-3">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping"></div>
                        <span>Processing analysis...</span>
                    </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-6 bg-industrial-charcoal border-t border-slate-800 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-3">
                    <div className="flex-1 relative group">
                        <textarea
                            className="w-full p-4 bg-slate-900 border border-slate-700 text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none resize-none font-mono text-sm transition-all"
                            placeholder="Input technical response..."
                            rows={1}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                        />
                        <div className="absolute bottom-0 left-0 h-0.5 w-0 group-focus-within:w-full bg-cyan-500 transition-all duration-300"></div>
                    </div>
                    <button type="submit" disabled={!inputText.trim() || isLoading} className="h-[58px] px-6 bg-industrial-rust text-white flex items-center justify-center disabled:opacity-30 border-b-4 border-amber-700 active:translate-y-1 active:border-b-0 transition-all shadow-lg hover:bg-amber-600">
                        <Send size={20} />
                    </button>
                </form>
            </div>
          </div>
        )}
      </main>

      {isAdminOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative bg-slate-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-slate-700 shadow-[0_0_50px_rgba(0,0,0,1)] p-8">
            <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <Settings className="text-cyan-500" size={24} />
                <h2 className="text-xl font-mono font-bold uppercase text-slate-100 tracking-tighter">System Configuration</h2>
              </div>
              <button onClick={() => setIsAdminOpen(false)} className="p-2 hover:text-red-500 transition-colors text-slate-500 border border-slate-800"><X size={20} /></button>
            </div>
            <NoteUploader onNotesSubmit={handleStartSession} isLoading={isLoading} />
            <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                <button onClick={() => { if(confirm("Purge all system data?")) { localStorage.clear(); window.location.reload(); } }} className="text-[10px] font-mono text-slate-600 hover:text-red-500 uppercase tracking-widest transition-colors">
                  [ System Purge / Factory Reset ]
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;