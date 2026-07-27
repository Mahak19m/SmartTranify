import React, { useState } from 'react';
import { MessageSquare, Send, X, Bot, Sparkles } from 'lucide-react';

export const CoachChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: 'user' | 'apex'; text: string }[]>([
    {
      sender: 'apex',
      text: 'Apex here! Need an exercise regression, joint warm-up advice, or macro adjustment for today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/apex/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { sender: 'apex', text: data.reply }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        { sender: 'apex', text: 'Apex here: Keep your core braced, drive through heels, and maintain rhythmic breathing!' }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3.5 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-2xl shadow-2xl hover:scale-105 transition-transform flex items-center space-x-2 font-bold text-xs border border-emerald-400/30"
        >
          <Bot className="w-5 h-5" />
          <span>Ask Apex AI</span>
        </button>
      )}

      {isOpen && (
        <div className="w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-96 animate-in slide-in-from-bottom duration-200">
          {/* Chat Header */}
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                AP
              </div>
              <div>
                <span className="font-bold text-xs text-slate-100 block">Apex Assistant</span>
                <span className="text-[10px] text-emerald-400 font-mono">Certified Coach Engine</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-200 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-2.5 rounded-xl ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white font-medium'
                      : 'bg-slate-950 text-slate-200 border border-slate-800'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="text-[10px] text-emerald-400 font-mono animate-pulse">
                Apex is formulating coaching advice...
              </div>
            )}
          </div>

          {/* Input Footer */}
          <div className="p-2 bg-slate-950 border-t border-slate-800 flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask Apex about form, macros, or pain..."
              className="flex-1 bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={sendMessage}
              className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
