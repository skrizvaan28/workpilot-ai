import React, { useState } from 'react';
import {
  X,
  Bot,
  Send,
  Sparkles,
  User,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

interface AskAIModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AskAIModal: React.FC<AskAIModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: "Hello Rizvaan! I am WorkPilot AI Assistant. I can summarize your tasks, analyze bottlenecks, draft progress reports, or extract tasks from uploaded documents. How can I assist your workflow today?",
      timestamp: 'Just now',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    'Summarize my highest priority tasks today',
    'Which tasks are at risk of becoming overdue?',
    'Draft a quick sprint progress update for team sync',
  ];

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsGenerating(true);

    setTimeout(() => {
      let aiResponseText = '';
      const lower = query.toLowerCase();

      if (lower.includes('priority') || lower.includes('highest')) {
        aiResponseText =
          "Here are your top 3 prioritized tasks for today:\n\n1. **WP-104: Finalize Q3 Security & SOC2 Compliance Audit** (Score: 98/100, Due: 4:00 PM) — Critical path for enterprise client sign-off.\n2. **WP-108: Analyze & convert PRD into sprint backlog** (Score: 94/100, Due: 6:30 PM) — 14 tasks extracted.\n3. **WP-101: Reconcile vendor procurement contracts** (Score: 91/100) — Overdue by 1 day.";
      } else if (lower.includes('overdue') || lower.includes('risk')) {
        aiResponseText =
          "⚠️ **Risk Alert**: 3 tasks are on track to exceed deadline:\n- **WP-101: Vendor Procurement Reconcile** is already 1 day overdue.\n- **WP-104: SOC2 Compliance** is due in 3 hours with 15% pending.\n- **WP-112: API Gateway rate limiting** has an upcoming meeting collision.\n\n*Recommendation: Batch 2 code reviews and block 2 hours for deep work this afternoon.*";
      } else if (lower.includes('progress') || lower.includes('draft') || lower.includes('standup')) {
        aiResponseText =
          "📋 **Sprint Standup Draft**:\n\n**Yesterday**: Completed Onboarding Tour Design and automated Slack task digests.\n**Today**: Finalizing SOC2 Compliance report and reviewing PRD task breakdown.\n**Blockers**: Awaiting vendor contract sign-off from Procurement.\n**Velocity**: 18/24 tasks delivered (94% productivity score).";
      } else {
        aiResponseText = `I have analyzed your workspace query: "${query}". All active documents, task metrics, and team dependencies have been cross-referenced. Your workload velocity is currently at 94% with 6 active tasks in queue.`;
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiResponseText,
        timestamp: 'Just now',
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsGenerating(false);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl h-[560px] rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-orange-500/20">
              <Bot size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-white text-base">
                  WorkPilot AI Assistant
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ready • Low Latency
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Workspace Copilot • Document RAG & Task Orchestration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
                  <Sparkles size={15} />
                </div>
              )}

              <div
                className={`max-w-lg rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-line'
                }`}
              >
                {msg.text}
                <div
                  className={`text-[10px] mt-1.5 font-mono ${
                    msg.sender === 'user' ? 'text-amber-950/70' : 'text-slate-500'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs shrink-0">
                  RS
                </div>
              )}
            </div>
          ))}

          {isGenerating && (
            <div className="flex gap-3 justify-start items-center text-xs text-slate-400">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 animate-pulse">
                <Bot size={15} />
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-bounce" />
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] text-slate-400 ml-1">
                  Synthesizing workspace knowledge...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Quick prompt suggestions */}
        <div className="px-5 py-2 border-t border-slate-800/60 bg-slate-950/30 flex items-center gap-2 overflow-x-auto text-[11px]">
          <span className="text-slate-500 whitespace-nowrap flex items-center gap-1">
            <HelpCircle size={11} /> Suggested:
          </span>
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition whitespace-nowrap border border-slate-700/60"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask WorkPilot AI anything about tasks, documents, or team workload..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isGenerating}
              className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold disabled:opacity-50 transition"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
