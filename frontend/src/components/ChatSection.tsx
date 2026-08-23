import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Loader2,
  FileText,
  Trash2,
  AlertCircle,
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
      setErrorMsg(err.response?.data?.detail || 'Unable to process your message right now.');
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
    <div className="saas-card p-5 flex flex-col h-full relative">
      {/* Workspace Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#1C3326]">
        <div>
          <h2 className="text-sm font-semibold text-[#F5F7F6] flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#16A34A]" />
            Grounded Knowledge Assistant
          </h2>
          <p className="text-xs text-[#A7B3AC] mt-0.5">
            Ask questions about your uploaded documents.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#101F17] border border-[#1C3326] text-xs font-medium text-[#F5F7F6]">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]"></span>
            <span>Grounding Active</span>
          </div>

          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              title="Clear Conversation"
              className="p-1 text-[#738078] hover:text-[#EF4444] rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="py-2.5 border-b border-[#1C3326] flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => handleActionClick('summarize')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#101F17] hover:bg-[#14271D] border border-[#1C3326] hover:border-[#16A34A]/50 text-xs font-medium text-[#F5F7F6] transition-colors whitespace-nowrap"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-[#16A34A]" />
          <span>Summarize Document</span>
        </button>

        <button
          onClick={() => handleActionClick('tamil')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors whitespace-nowrap ${
            language === 'ta'
              ? 'bg-[#101F17] border-[#16A34A] text-[#16A34A]'
              : 'bg-[#101F17] hover:bg-[#14271D] border-[#1C3326] hover:border-[#16A34A]/50 text-[#F5F7F6]'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-[#16A34A]" />
          <span>Tamil</span>
        </button>

        <button
          onClick={() => handleActionClick('english')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors whitespace-nowrap ${
            language === 'en'
              ? 'bg-[#101F17] border-[#16A34A] text-[#16A34A]'
              : 'bg-[#101F17] hover:bg-[#14271D] border-[#1C3326] hover:border-[#16A34A]/50 text-[#F5F7F6]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-[#16A34A]" />
          <span>English</span>
        </button>

        <button
          onClick={() => handleActionClick('ask')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#101F17] hover:bg-[#14271D] border border-[#1C3326] hover:border-[#16A34A]/50 text-xs font-medium text-[#F5F7F6] transition-colors whitespace-nowrap"
        >
          <HelpCircle className="w-3.5 h-3.5 text-[#16A34A]" />
          <span>Ask About Document</span>
        </button>
      </div>

      {/* Main Conversation Feed */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3.5 min-h-[360px] max-h-[500px] pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center my-8 p-6 rounded-xl bg-[#101F17] border border-[#1C3326]">
            <Bot className="w-8 h-8 text-[#16A34A] mb-2" />
            <h3 className="text-xs font-semibold text-[#F5F7F6]">
              Ask your first question
            </h3>
            <p className="text-[11px] text-[#A7B3AC] max-w-sm mt-1 leading-relaxed">
              Your answers will be grounded in your uploaded documents. Ask in English, Tamil, or Tanglish.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col animate-message-entrance ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-xl p-3.5 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[#101F17] border border-[#16A34A]/40 text-[#F5F7F6] rounded-br-none'
                    : 'bg-[#101F17] border border-[#1C3326] text-[#F5F7F6] rounded-bl-none'
                }`}
              >
                {/* Message Response Badge */}
                {msg.sender === 'assistant' && (
                  <div className="flex items-center justify-between gap-3 mb-2 text-[10px] pb-1.5 border-b border-[#1C3326]">
                    <div className="flex items-center gap-1 font-semibold uppercase tracking-wider">
                      {msg.response_type === 'NORMAL' ? (
                        <span className="text-[#A7B3AC]">CONVERSATIONAL</span>
                      ) : msg.response_type === 'SUMMARY' ? (
                        <span className="text-[#16A34A]">DOCUMENT SUMMARY</span>
                      ) : msg.response_type === 'NO_DOCUMENT' ? (
                        <span className="text-[#F59E0B]">NO DOCUMENTS</span>
                      ) : msg.known === false || msg.response_type === 'UNKNOWN_DOCUMENT' ? (
                        <span className="text-[#F59E0B]">INFORMATION NOT FOUND</span>
                      ) : (
                        <span className="text-[#22C55E]">GROUNDED ANSWER</span>
                      )}
                    </div>
                    <span className="text-[#738078]">{msg.timestamp}</span>
                  </div>
                )}

                <p className="whitespace-pre-wrap font-normal text-xs leading-relaxed">{msg.text}</p>

                {/* Source Citations */}
                {msg.sender === 'assistant' && msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-[#1C3326]">
                    <div className="text-[11px] font-semibold text-[#A7B3AC] mb-1.5">
                      Sources
                    </div>
                    <div className="space-y-1">
                      {msg.citations.map((cite, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[10px] bg-[#0B1711] px-2.5 py-1 rounded border border-[#1C3326] text-[#A7B3AC]"
                        >
                          <span className="flex items-center gap-1.5 font-medium truncate">
                            <FileText className="w-3 h-3 text-[#16A34A] flex-shrink-0" />
                            {cite.document} &bull; {cite.section_label || `Page ${cite.page}`}
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
          <div className="flex items-center gap-2 text-xs text-[#16A34A] bg-[#101F17] border border-[#1C3326] px-3.5 py-2.5 rounded-lg w-fit">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#16A34A]" />
            <span>Processing request... Generating answer...</span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 text-xs text-[#EF4444] bg-[#101F17] border border-[#EF4444]/30 p-3 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-[#EF4444]" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Bar */}
      <div className="mt-auto pt-3 border-t border-[#1C3326]">
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
            className="w-full bg-[#101F17] border border-[#1C3326] focus:border-[#16A34A] focus:outline-none rounded-lg px-3.5 py-2.5 text-xs text-[#F5F7F6] placeholder-[#738078] pr-10 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="absolute right-1.5 p-1.5 bg-[#16A34A] hover:bg-[#15803D] disabled:bg-[#101F17] disabled:text-[#738078] text-white rounded transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
