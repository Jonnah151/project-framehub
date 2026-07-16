import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Trash2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { findAnswer, defaultGreeting } from '../data/knowledge';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const suggestedQuestions = [
  'Muungano ulifanyika lini?',
  'Bendera ya Tanzania ina rangi zipi?',
  'Nani alikuwa Rais wa kwanza?',
  'Tanzania ina mikoa mingapi?',
];

export function ChatbotPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { id: 'greeting', role: 'assistant', content: defaultGreeting },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    if (user) {
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        role: 'user',
        content: trimmed,
      });
    }

    setTimeout(async () => {
      const answer = findAnswer(trimmed);
      const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: answer };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);

      if (user) {
        await supabase.from('chat_messages').insert({
          user_id: user.id,
          role: 'assistant',
          content: answer,
        });
      }
    }, 800);
  };

  const clearChat = () => {
    setMessages([{ id: 'greeting', role: 'assistant', content: defaultGreeting }]);
  };

  return (
    <div className="min-h-screen pt-20 flex flex-col">
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-tz-green to-tz-blue flex items-center justify-center shadow-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Chatbot ya AI</h1>
              <p className="text-sm text-gray-400">Uliza maswali kuhusu Muungano wa Tanzania</p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Futa mazungumzo"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="card flex-1 overflow-y-auto p-4 sm:p-6 mb-4 min-h-[400px] max-h-[60vh]">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 animate-slide-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-tz-blue/20'
                      : 'bg-gradient-to-br from-tz-green to-tz-blue'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <User className="w-5 h-5 text-tz-blue-light" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-tz-blue/20 text-white'
                      : 'bg-white/5 text-gray-100'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-tz-green to-tz-blue flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-white/5 rounded-2xl px-4 py-3 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-tz-green animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-tz-yellow animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <span className="w-2 h-2 rounded-full bg-tz-blue animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Suggested questions */}
        {messages.length <= 1 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3 text-sm text-gray-400">
              <Sparkles className="w-4 h-4 text-tz-yellow" />
              Maswali yanayopendekezwa:
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 hover:border-tz-green/40 hover:text-tz-green transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder="Andika swali lako hapa..."
            className="input-field flex-1"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isTyping}
            className="btn-primary bg-tz-green text-white hover:bg-tz-green-dark disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-tz-green/20 flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            <span className="hidden sm:inline">Tuma</span>
          </button>
        </div>
      </div>
    </div>
  );
}
