import { useState } from 'react';
import { Send, Bot, Zap } from 'lucide-react';

interface Props {
  onInstruction: (instruction: string) => Promise<void>;
  isThinking: boolean;
}

const QUICK_ACTIONS = [
  'Make the tone more exciting',
  'Combine the first two sections',
  'Shorten the intro',
  'Fix grammar and spelling',
];

export default function EditorCopilot({ onInstruction, isThinking }: Props) {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (!input.trim() || isThinking) return;
    onInstruction(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex h-full w-80 flex-col border-l border-fin-border bg-white shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-fin-border bg-fin-surface px-4 py-3">
        <Bot size={18} className="text-fin-primary" />
        <h3 className="text-sm font-bold text-fin-text">Evolution Copilot</h3>
      </div>

      {/* Chat Area / Suggestions */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
        {isThinking ? (
          <div className="flex h-full flex-col items-center justify-center space-y-3 opacity-70">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-fin-primary border-t-transparent"></div>
            <p className="text-xs font-medium text-fin-muted animate-pulse">Refining content...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
              <strong>I can help edit your document.</strong>
              <br />
              Try telling me to merge sections, change tone, or rewrite specific parts.
            </div>

            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-fin-muted">Quick Actions</p>
              <div className="space-y-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action}
                    onClick={() => onInstruction(action)}
                    className="flex w-full items-center gap-2 rounded-md border border-fin-border bg-white px-3 py-2 text-left text-xs text-fin-text transition-colors hover:border-fin-primary hover:text-fin-primary"
                  >
                    <Zap size={12} />
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-fin-border bg-white p-4">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell Gemini what to change..."
            className="w-full resize-none rounded-lg border border-fin-border bg-slate-50 p-3 pr-10 text-sm focus:border-fin-primary focus:ring-1 focus:ring-fin-primary disabled:opacity-50"
            rows={3}
            disabled={isThinking}
          />
          <button
            onClick={handleSubmit}
            disabled={isThinking || !input.trim()}
            className="absolute bottom-2 right-2 rounded-md bg-fin-primary p-1.5 text-white transition-colors hover:bg-fin-primaryHover disabled:opacity-50"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
