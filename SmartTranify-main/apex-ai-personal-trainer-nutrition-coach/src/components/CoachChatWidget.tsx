import React, { useState } from 'react';
import { MessageSquare, Send, X, Bot, Sparkles, Flame, Shield, HelpCircle } from 'lucide-react';
import { api } from '../api/client';
import { CoachPersona } from '../types';

interface CoachChatWidgetProps {
  persona?: CoachPersona;
  currentExercise?: string;
  currentRep?: number;
  currentSet?: number;
  targetReps?: number;
  formStatus?: string;
  hazardMessage?: string;
}

interface ChatMessage {
  sender: 'user' | 'apex';
  text: string;
  source?: string;
}

const PERSONA_NAMES: Record<string, string> = {
  drill_sergeant: 'Apex Sarge',
  encouraging: 'Elena Coach',
  calm: 'Kai Zen',
  zen_coach: 'Kai Zen',
  clinical_pt: 'Dr. Elena, DPT',
  bio_hacker: 'Apex-9000'
};

const QUICK_QUESTIONS = [
  'Check my current form',
  'How do I improve depth?',
  'What should I eat post-workout?',
  'My knees feel slight fatigue'
];

export const CoachChatWidget: React.FC<CoachChatWidgetProps> = ({
  persona = 'drill_sergeant',
  currentExercise,
  currentRep,
  currentSet,
  targetReps,
  formStatus,
  hazardMessage
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'apex',
      text: `${PERSONA_NAMES[persona] || 'SmartTranify Coach'} active! Ask me about movement biomechanics, form corrections, set pacing, or personalized nutrition.`,
      source: 'coach_engine'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async (textToSend?: string) => {
    const rawMsg = textToSend || input;
    if (!rawMsg.trim() || isTyping) return;
    const userMsg = rawMsg.trim();
    if (!textToSend) setInput('');

    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const data = await api.sendCoachChatMessage({
        message: userMsg,
        persona: persona,
        exercise_name: currentExercise,
        rep_count: currentRep,
        current_set: currentSet,
        target_reps: targetReps,
        form_status: formStatus,
        hazard_message: hazardMessage
      });

      setMessages((prev) => [
        ...prev,
        { sender: 'apex', text: data.reply, source: data.source }
      ]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'apex',
          text: 'SmartTranify Coach: Focus on core engagement, maintain rhythmic breathing, and drive through a stable midfoot!',
          source: 'coach_engine'
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const coachName = PERSONA_NAMES[persona] || 'AI Coach';

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-3.5 bg-gradient-to-tr from-lime-500 to-emerald-600 text-zinc-950 font-black rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center space-x-2 border border-lime-400/40 text-xs shadow-lime-500/20"
        >
          <Bot className="w-5 h-5 text-zinc-950" />
          <span>Ask {coachName}</span>
        </button>
      )}

      {isOpen && (
        <div className="w-80 sm:w-96 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[440px] animate-in slide-in-from-bottom duration-200">
          {/* Chat Header */}
          <div className="p-3 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-lime-400/10 text-lime-400 flex items-center justify-center font-bold text-xs border border-lime-400/30">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-xs text-zinc-100">{coachName}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-lime-400/20 text-lime-300 font-bold uppercase">
                    LIVE AI
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 block font-mono">
                  {currentExercise ? `Monitoring: ${currentExercise}` : 'Personal Fitness Assistant'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Question Chips */}
          <div className="px-3 py-1.5 bg-zinc-950/60 border-b border-zinc-800/80 flex items-center space-x-1.5 overflow-x-auto no-scrollbar text-[10px]">
            {QUICK_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendMessage(q)}
                disabled={isTyping}
                className="shrink-0 px-2 py-0.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-lime-300 transition-colors border border-zinc-700 font-medium"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-2.5 rounded-2xl ${
                    m.sender === 'user'
                      ? 'bg-lime-500 text-zinc-950 font-semibold shadow-md'
                      : 'bg-zinc-950 text-zinc-200 border border-zinc-800 shadow-inner'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                </div>
                {m.sender === 'apex' && m.source && (
                  <span className="text-[9px] font-mono text-zinc-500 mt-1 px-1">
                    {m.source === 'gemini' ? '✦ Gemini 1.5 Flash' : '⚡ Certified Biomechanics Engine'}
                  </span>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center space-x-2 text-[11px] text-lime-400 font-mono animate-pulse">
                <Sparkles className="w-3 h-3" />
                <span>{coachName} is formulating biomechanical advice...</span>
              </div>
            )}
          </div>

          {/* Input Footer */}
          <div className="p-2.5 bg-zinc-950 border-t border-zinc-800 flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={`Ask ${coachName} anything...`}
              disabled={isTyping}
              className="flex-1 bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 rounded-xl px-3 py-2 focus:outline-none focus:border-lime-400 placeholder:text-zinc-600"
            />
            <button
              onClick={() => sendMessage()}
              disabled={isTyping || !input.trim()}
              className="p-2 bg-lime-400 hover:bg-lime-300 disabled:opacity-50 text-zinc-950 rounded-xl font-bold shadow-md shadow-lime-400/20 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
