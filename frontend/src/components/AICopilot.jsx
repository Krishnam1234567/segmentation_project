import { Sparkles, Send, X, Trash2, BotMessageSquare } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const QUICK_PROMPTS = [
  'Summarize top legal risks',
  'What contracts expire soon?',
  'GDPR compliance status?',
  'Litigation cost forecast?',
];

export function AICopilot() {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your Legal AI Assistant. I can help you analyze contracts, check compliance, predict litigation risk, and navigate your legal operations.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const buildHistory = (msgs) =>
    msgs.slice(0, -0).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));

  const handleSend = async (messageOverride) => {
    const userMessage = (messageOverride || input).trim();
    if (!userMessage) return;

    const updated = [...messages, { role: 'user', content: userMessage }];
    setMessages(updated);
    setInput('');
    setIsLoading(true);

    try {
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiBase}/agents/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: buildHistory(updated.slice(0, -1)),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ Backend not connected. Start the backend server to enable AI responses.\n\n${error.message}`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
      >
        <Sparkles className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="w-96 h-full bg-card border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">AI Legal Copilot</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <p className="text-xs text-muted-foreground">Powered by Gemini</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setMessages(messages.slice(0, 1))}
            className="p-1.5 hover:bg-muted/50 rounded transition-colors" title="Clear chat">
            <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-muted/50 rounded transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                <BotMessageSquare className="w-3.5 h-3.5 text-primary" />
              </div>
            )}
            <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.role === 'user'
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted text-foreground rounded-bl-sm'
              }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-2 flex-shrink-0">
              <BotMessageSquare className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground mb-2">Quick actions</p>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_PROMPTS.map(p => (
              <button key={p} onClick={() => handleSend(p)}
                className="text-left text-xs px-2.5 py-2 bg-muted/50 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors leading-tight">
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && !isLoading && handleSend()}
            placeholder="Ask about contracts, compliance..."
            className="flex-1 px-3 py-2 bg-input-background border border-input rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button onClick={() => handleSend()} disabled={isLoading || !input.trim()}
            className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
