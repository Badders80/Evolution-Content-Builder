import { useState } from 'react';
import { Undo } from 'lucide-react';
import SmartSectionList from '../builder/SmartSectionList';
import EditorCopilot from '../builder/EditorCopilot';
import type { Stage1Content, Stage1Section } from '../../types/stage1';

interface EditorPanelProps {
  content: Stage1Content;
  setContent: (content: Stage1Content) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function EditorPanel({ content, setContent, onBack, onNext }: EditorPanelProps) {
  const [isThinking, setIsThinking] = useState(false);
  const [history, setHistory] = useState<Stage1Content[]>([]);

  // Push current state to history before modifying
  const saveToHistory = () => {
    setHistory((prev) => [...prev, JSON.parse(JSON.stringify(content))]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setContent(previous);
  };

  const handleManualChange = (newSections: Stage1Section[]) => {
    // Only save history on manual changes if we want granular undo.
    // For now, keep undo mainly for AI changes to avoid history spam.
    setContent({ ...content, sections: newSections });
  };

  const handleAIInstruction = async (instruction: string) => {
    saveToHistory();
    setIsThinking(true);

    try {
      const response = await fetch('/api/stage2/instruct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_content: content,
          instruction: instruction,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'AI Failed');
      }

      const newContent = await response.json();
      setContent(newContent);
    } catch (err: any) {
      console.error(err);
      alert(`Copilot Error: ${err.message}`);
      // Revert history entry on failure
      setHistory((prev) => prev.slice(0, -1));
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Main Canvas - Scrollable */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Toolbar */}
        <div className="z-10 flex flex-shrink-0 items-center justify-between border-b border-fin-border bg-white px-8 py-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="text-sm font-medium text-fin-muted hover:text-fin-text">
              ← Back
            </button>
            <div className="h-4 w-[1px] bg-fin-border"></div>
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="flex items-center gap-1 text-sm font-medium text-fin-muted hover:text-fin-text disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Undo size={14} /> Undo
            </button>
          </div>

          <div className="text-sm font-bold uppercase tracking-wider text-fin-text">Refinement</div>

          <button
            onClick={onNext}
            className="rounded-md bg-fin-text px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-black"
          >
            Preview & Export →
          </button>
        </div>

        {/* Document Editor */}
        <div
          className={`flex-1 overflow-y-auto p-8 transition-opacity duration-200 ${
            isThinking ? 'pointer-events-none opacity-50' : 'opacity-100'
          }`}
        >
          <div className="mx-auto max-w-3xl space-y-8 pb-20">
            {/* Header Fields */}
            <div className="rounded-lg border border-fin-border bg-white p-8 shadow-sm">
              <div className="mb-6">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-fin-muted">Headline</label>
                <input
                  value={content.headline}
                  onChange={(e) => setContent({ ...content, headline: e.target.value })}
                  className="w-full border-none p-0 text-4xl font-extrabold text-fin-text placeholder-gray-300 focus:ring-0"
                  placeholder="Enter Headline..."
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-fin-muted">Subheadline</label>
                <input
                  value={content.subheadline}
                  onChange={(e) => setContent({ ...content, subheadline: e.target.value })}
                  className="w-full border-none p-0 text-xl font-medium text-fin-muted placeholder-gray-300 focus:ring-0"
                  placeholder="Enter Subheadline..."
                />
              </div>
            </div>

            {/* The Smart List */}
            <SmartSectionList sections={content.sections} onChange={handleManualChange} />
          </div>
        </div>
      </div>

      {/* The Copilot Sidebar - Fixed Right */}
      <EditorCopilot onInstruction={handleAIInstruction} isThinking={isThinking} />
    </div>
  );
}
