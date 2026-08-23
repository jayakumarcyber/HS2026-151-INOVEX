import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  Loader2,
  HelpCircle,
  FileText,
  Trash2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Bot,
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
      setErrorMsg(err.response?.data?.detail || 'Unable to generate an answer.');
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
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col h-full border border-emerald-500/15 relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-emerald-500/15">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            Grounded Knowledge Assistant
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Answers generated only from your indexed documents.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              title="Clear Conversation"
              className="p-1.5 rounded-lg bg-dark-900 hover:bg-dark-850 text-slate-400 hover:text-rose-400 transition-colors border border-emerald-500/15"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Grounding Active</span>
          </div>
        </div>
      </div>

      {/* Main Conversation Feed */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-[360px] max-h-[500px] pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center my-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 shadow-inner glow-emerald">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-white">
              Ask your first question
            </h3>
            <p className="text-xs text-slate-400 max-w-md mt-1 leading-relaxed">
              Get answers grounded in your provided documents. Missing facts trigger explicit refusal fallbacks.
            </p>

            {/* Quick Suggestion Pills */}
            <div className="mt-5 grid grid-cols-1 gap-2 w-full max-w-lg">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="p-2.5 rounded-xl bg-dark-900/80 hover:bg-dark-850 border border-emerald-500/15 hover:border-emerald-500/40 text-left transition-all group shadow-sm hover:shadow-emerald-500/10"
                >
                  <p className="text-xs font-medium text-slate-300 group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
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
              className={`flex flex-col animate-message-entrance ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-none shadow-lg shadow-emerald-600/10'
                    : msg.known === false
                    ? 'bg-amber-950/20 border border-amber-500/30 text-amber-200 rounded-bl-none'
                    : 'glass-card bg-dark-900/90 border border-emerald-500/20 text-slate-100 rounded-bl-none shadow-md'
                }`}
              >
                {/* Header Badge in Message */}
                <div className="flex items-center justify-between gap-4 mb-2 text-[10px] opacity-80 border-b border-white/10 pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                    {msg.sender === 'user' ? (
                      <span>You</span>
                    ) : msg.known === false ? (
                      <span className="flex items-center gap-1 text-amber-400 font-semibold">
                        <AlertTriangle className="w-3 h-3" />
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
            <span>Retrieving evidence... Generating grounded answer...</span>
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
        {/* Quick Chip Row */}
        {messages.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-1 no-scrollbar">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="px-2.5 py-1 rounded-full bg-dark-900 border border-emerald-500/15 hover:border-emerald-500/40 text-[10px] font-medium text-slate-300 hover:text-emerald-300 whitespace-nowrap transition-all"
              >
                &quot;{prompt}&quot;
              </button>
            ))}
          </div>
        )}

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
          <span>Grounding: Strict document context ONLY</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Zero-Hallucination Guard active
          </span>
        </div>
      </div>
    </div>
  );
};
