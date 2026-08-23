import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  Loader2,
  FileText,
  Trash2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Bot,
  Globe,
  FileSpreadsheet,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { ChatMessage } from '../types';
import { apiService } from '../services/api';

export const ChatSection: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [language, setLanguage] = useState<'en' | 'ta'>('en');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (customQuery?: string, isSummary: boolean = false) => {
    const query = (customQuery || inputQuery).trim();
    if (!query && !isSummary) return;
    if (isLoading) return;

    setErrorMsg(null);
    setInputQuery('');

    const displayQuestion = isSummary
      ? language === 'ta'
        ? '📄 ஆவணத்தைச் சுருக்கவும் (Summarize Document)'
        : '📄 Summarize Document'
      : query;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: displayQuestion,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await apiService.askQuestion({
        question: displayQuestion,
        language: language,
        is_summary: isSummary,
      });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        known: response.known,
        response_type: response.response_type || (response.known ? 'DOCUMENT_ANSWER' : 'UNKNOWN_DOCUMENT'),
        citations: response.sources,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Unable to process your message.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setErrorMsg(null);
  };

  const handleActionClick = (actionType: 'summarize' | 'tamil' | 'english' | 'ask') => {
    if (actionType === 'summarize') {
      handleSendMessage('Summarize Document', true);
    } else if (actionType === 'tamil') {
      setLanguage('ta');
      const sysMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        sender: 'assistant',
        text: '🌐 பதில் மொழி தமிழுக்கு மாற்றப்பட்டது. (Response language set to Tamil)',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        response_type: 'NORMAL',
      };
      setMessages((prev) => [...prev, sysMsg]);
    } else if (actionType === 'english') {
      setLanguage('en');
      const sysMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        sender: 'assistant',
        text: '🇬🇧 Response language set to English.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        response_type: 'NORMAL',
      };
      setMessages((prev) => [...prev, sysMsg]);
    } else if (actionType === 'ask') {
      inputRef.current?.focus();
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col h-full border border-emerald-500/15 relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-emerald-500/15">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            AI Knowledge Assistant
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Natural Chat &bull; Document Grounding &bull; Multilingual Tools
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Active Language Badge */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-dark-900 border border-emerald-500/25 text-slate-200 text-xs font-semibold">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'ta' ? '🌐 Tamil Active' : '🇬🇧 English Active'}</span>
          </div>

          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              title="Clear Conversation"
              className="p-1.5 rounded-lg bg-dark-900 hover:bg-dark-850 text-slate-400 hover:text-rose-400 transition-colors border border-emerald-500/15"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* General Quick Action Bar */}
      <div className="py-3 border-b border-emerald-500/10 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => handleActionClick('summarize')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-900/90 hover:bg-emerald-950/40 border border-emerald-500/20 hover:border-emerald-400 text-xs font-medium text-slate-200 hover:text-emerald-300 transition-all shadow-sm hover:shadow-emerald-500/10 whitespace-nowrap"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span>📄 Summarize Document</span>
        </button>

        <button
          onClick={() => handleActionClick('tamil')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all shadow-sm whitespace-nowrap ${
            language === 'ta'
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-semibold'
              : 'bg-dark-900/90 hover:bg-emerald-950/40 border-emerald-500/20 hover:border-emerald-400 text-slate-200 hover:text-emerald-300'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span>🌐 Tamil</span>
        </button>

        <button
          onClick={() => handleActionClick('english')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all shadow-sm whitespace-nowrap ${
            language === 'en'
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-semibold'
              : 'bg-dark-900/90 hover:bg-emerald-950/40 border-emerald-500/20 hover:border-emerald-400 text-slate-200 hover:text-emerald-300'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
          <span>🇬🇧 English</span>
        </button>

        <button
          onClick={() => handleActionClick('ask')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-900/90 hover:bg-emerald-950/40 border border-emerald-500/20 hover:border-emerald-400 text-xs font-medium text-slate-200 hover:text-emerald-300 transition-all shadow-sm hover:shadow-emerald-500/10 whitespace-nowrap"
        >
          <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>💡 Ask About Document</span>
        </button>
      </div>

      {/* Main Conversation Feed */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-[360px] max-h-[500px] pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center my-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 shadow-inner glow-emerald">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-white">
              AI Knowledge Assistant Active
            </h3>
            <p className="text-xs text-slate-400 max-w-md mt-1 leading-relaxed">
              Ask any question in English, Tamil, or Tanglish. Use general tools to summarize documents or switch language preferences.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col animate-message-entrance ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-none shadow-lg shadow-emerald-600/10'
                    : msg.response_type === 'NORMAL'
                    ? 'bg-dark-900/90 border border-emerald-500/20 text-slate-200 rounded-bl-none'
                    : msg.response_type === 'SUMMARY'
                    ? 'bg-emerald-950/30 border border-emerald-500/30 text-emerald-100 rounded-bl-none shadow-md'
                    : msg.response_type === 'NO_DOCUMENT' || msg.response_type === 'UNKNOWN_DOCUMENT'
                    ? 'bg-amber-950/20 border border-amber-500/30 text-amber-200 rounded-bl-none'
                    : 'glass-card bg-dark-900/90 border border-emerald-500/20 text-slate-100 rounded-bl-none shadow-md'
                }`}
              >
                {/* Header Badge in Message */}
                <div className="flex items-center justify-between gap-4 mb-2 text-[10px] opacity-80 border-b border-white/10 pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                    {msg.sender === 'user' ? (
                      <span>You</span>
                    ) : msg.response_type === 'NORMAL' ? (
                      <span className="flex items-center gap-1 text-slate-300 font-semibold">
                        <Bot className="w-3 h-3 text-emerald-400" />
                        CONVERSATIONAL
                      </span>
                    ) : msg.response_type === 'SUMMARY' ? (
                      <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                        <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                        DOCUMENT SUMMARY
                      </span>
                    ) : msg.response_type === 'NO_DOCUMENT' ? (
                      <span className="flex items-center gap-1 text-amber-400 font-semibold">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        NO DOCUMENTS
                      </span>
                    ) : msg.known === false || msg.response_type === 'UNKNOWN_DOCUMENT' ? (
                      <span className="flex items-center gap-1 text-amber-400 font-semibold">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        INFORMATION NOT FOUND
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        GROUNDED ANSWER
                      </span>
                    )}
                  </div>
                  <span>{msg.timestamp}</span>
                </div>

                <p className="whitespace-pre-wrap text-xs font-normal leading-relaxed">{msg.text}</p>

                {/* Grounding & Source Citations Display */}
                {msg.sender === 'assistant' && msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3.5 pt-2.5 border-t border-emerald-500/15">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-300 mb-2">
                      <span className="flex items-center gap-1">
                        <Bot className="w-3.5 h-3.5 text-emerald-400" />
                        Sources ({msg.citations.length})
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {msg.citations.map((cite, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[10px] bg-dark-950/80 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-slate-200"
                        >
                          <span className="flex items-center gap-1.5 font-medium truncate">
                            <FileText className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                            {cite.document} &bull; Page {cite.page}
                          </span>
                          <span className="font-mono text-slate-400">
                            Chunk: {cite.chunk_id}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-center gap-2.5 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 px-4 py-3 rounded-2xl w-fit animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Processing request... Generating grounded response...</span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-950/30 border border-rose-500/30 p-3.5 rounded-2xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Bar */}
      <div className="mt-auto pt-4 border-t border-emerald-500/15">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask anything about your documents..."
            className="w-full bg-dark-900/90 border border-emerald-500/20 focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/30 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-400 pr-12 focus:outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="absolute right-2 p-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-dark-800 disabled:text-slate-600 text-white rounded-lg transition-colors shadow-md shadow-emerald-600/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="flex items-center justify-between mt-2.5 px-1 text-[11px] text-slate-400">
          <span>Grounding: Document Context &bull; English / Tamil / Tanglish</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Zero-Hallucination Guard active
          </span>
        </div>
      </div>
    </div>
  );
};
