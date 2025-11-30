import { Trash2, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import type { Stage1Section } from '../../types/stage1';

interface Props {
  sections: Stage1Section[];
  onChange: (sections: Stage1Section[]) => void;
}

export default function SmartSectionList({ sections, onChange }: Props) {
  const updateSection = (index: number, field: keyof Stage1Section, value: string) => {
    const newSections = [...sections];
    newSections[index] = { ...newSections[index], [field]: value };
    onChange(newSections);
  };

  const deleteSection = (index: number) => {
    onChange(sections.filter((_, i) => i !== index));
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= sections.length) return;
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[index + direction];
    newSections[index + direction] = temp;
    onChange(newSections);
  };

  const addSection = (index: number) => {
    const newSections = [...sections];
    newSections.splice(index + 1, 0, {
      id: `sec-${Date.now()}`,
      heading: 'New Section',
      body: '',
    });
    onChange(newSections);
  };

  return (
    <div className="space-y-6">
      {sections.map((section, idx) => (
        <div
          key={section.id || idx}
          className="group relative rounded-lg border border-fin-border bg-white p-6 shadow-sm transition-all hover:border-fin-primary hover:shadow-md"
        >
          {/* Section Toolbar (Visible on Hover) */}
          <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => moveSection(idx, -1)}
              disabled={idx === 0}
              className="rounded bg-gray-100 p-1.5 text-fin-muted hover:bg-white hover:text-fin-text hover:shadow-sm disabled:opacity-30"
              title="Move Up"
            >
              <ArrowUp size={14} />
            </button>
            <button
              onClick={() => moveSection(idx, 1)}
              disabled={idx === sections.length - 1}
              className="rounded bg-gray-100 p-1.5 text-fin-muted hover:bg-white hover:text-fin-text hover:shadow-sm disabled:opacity-30"
              title="Move Down"
            >
              <ArrowDown size={14} />
            </button>
            <button
              onClick={() => deleteSection(idx)}
              className="rounded bg-red-50 p-1.5 text-red-400 hover:bg-red-100 hover:text-red-600"
              title="Delete Section"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Inputs */}
          <div className="space-y-3">
            <input
              type="text"
              value={section.heading}
              onChange={(e) => updateSection(idx, 'heading', e.target.value)}
              className="block w-full border-none bg-transparent p-0 text-lg font-bold text-fin-text focus:ring-0 placeholder-gray-300"
              placeholder="Section Heading"
            />
            <textarea
              value={section.body}
              onChange={(e) => updateSection(idx, 'body', e.target.value)}
              className="block w-full resize-none border-none bg-transparent p-0 text-sm leading-relaxed text-fin-muted focus:ring-0"
              placeholder="Write section content here..."
              style={{ height: 'auto', minHeight: '80px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              }}
            />
          </div>

          {/* Add Button (Floating Bottom) */}
          <div className="absolute -bottom-3 left-1/2 z-10 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => addSection(idx)}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-fin-primary text-white shadow-md transition-transform hover:scale-110"
              title="Add Section Below"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
