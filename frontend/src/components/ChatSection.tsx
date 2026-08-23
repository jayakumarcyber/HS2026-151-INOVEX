import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  Loader2,
  BookOpen,
  HelpCircle,
  FileText,
  Trash2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { ChatMessage } from '../types';
import { apiService } from '../services/api';

export const ChatSection: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (queryOverride?: string) => {
    const query = (queryOverride || inputQuery).trim();
    if (!query || isLoading) return;

    setErrorMsg(null);
    setInputQuery('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await apiService.askQuestion({ question: query });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        known: response.known,
        citations: response.sources,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to reach backend RAG service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setErrorMsg(null);
  };

  const quickPrompts = [
    'What is the minimum attendance requirement?',
    'How many books can a student borrow?',
    'Are mobile phones allowed in the examination hall?',
    'What is the hostel fee?',
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col h-full border border-slate-800 relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            Grounded Knowledge Assistant
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified RAG question answering with strict document citations &amp; refusal fallback
          </p>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              title="Clear Conversation"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Phase 4 Active</span>
          </div>
        </div>
      </div>

      {/* Main Conversation Feed */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-[360px] max-h-[500px] pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center my-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">
              Ask Grounded Questions
            </h3>
            <p className="text-xs text-slate-400 max-w-md mt-1 leading-relaxed">
              Answers are generated solely from your ingested PDF documents. If information is missing from the knowledge base, the assistant will explicitly respond with a refusal fallback.
            </p>

            {/* Quick Suggestion Pills */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/30 text-left transition-all group"
                >
                  <p className="text-xs font-medium text-slate-300 group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                    <HelpCircle className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                    <span className="truncate">&quot;{prompt}&quot;</span>
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                    : msg.known === false
                    ? 'bg-amber-950/20 border border-amber-500/30 text-amber-200 rounded-bl-none'
                    : 'glass-panel bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1.5 text-[10px] opacity-75 border-b border-white/10 pb-1">
                  <span className="font-semibold uppercase tracking-wider">
                    {msg.sender === 'user' ? 'You' : 'Grounded Assistant'}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Grounding & Source Citations Display */}
                {msg.sender === 'assistant' && msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-300 mb-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Source Citations ({msg.citations.length})</span>
                    </div>
                    <div className="space-y-1">
                      {msg.citations.map((cite, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[10px] bg-slate-950/60 px-2.5 py-1.5 rounded border border-slate-800/80 text-slate-300"
                        >
                          <span className="flex items-center gap-1.5 font-medium truncate">
                            <FileText className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                            {cite.document} (Page {cite.page})
                          </span>
                          <span className="font-mono text-slate-400">
                            Score: {(cite.score * 100).toFixed(1)}%
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
          <div className="flex items-center gap-2 text-xs text-indigo-400 bg-indigo-950/20 border border-indigo-500/20 px-3.5 py-2.5 rounded-xl w-fit">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Retrieving vectors &amp; synthesizing answer...</span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-950/30 border border-rose-500/30 p-3 rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Bar */}
      <div className="mt-auto pt-4 border-t border-slate-800/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask a question about your uploaded documents..."
            className="w-full bg-slate-900/90 border border-slate-800 focus:border-indigo-500/60 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-400 pr-12 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-400">
          <span>Grounding: Strict document context ONLY</span>
          <span className="text-emerald-400 font-mono">Zero-Hallucination Guard active</span>
        </div>
      </div>
    </div>
  );
};
