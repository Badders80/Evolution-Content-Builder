// Template Configuration System
// Each template defines its layout, sections, and styling

export interface TemplateSection {
  type: 'headline' | 'subheadline' | 'body' | 'image' | 'pullquote' | 'stats' | 'cta' | 'signature'
  required: boolean
  placeholder?: string
}

export interface TemplateConfig {
  id: string
  name: string
  description: string
  layout: 'magazine' | 'letter' | 'social' | 'newsletter' | 'report'
  columns: 1 | 2
  hasImage: boolean
  hasPullQuote: boolean
  hasStats: boolean
  hasSignature: boolean
  sections: TemplateSection[]
  style: {
    headlineSize: 'sm' | 'md' | 'lg' | 'xl'
    bodyFont: 'serif' | 'sans'
    accent: string
  }
}

export const TEMPLATES: Record<string, TemplateConfig> = {
  'Post-Race Report': {
    id: 'post-race-report',
    name: 'Post-Race Report',
    description: 'Magazine-style race recap with image and pull quote',
    layout: 'magazine',
    columns: 2,
    hasImage: true,
    hasPullQuote: true,
    hasStats: false,
    hasSignature: false,
    sections: [
      { type: 'headline', required: true, placeholder: 'Race Result Headline' },
      { type: 'subheadline', required: false, placeholder: 'Brief summary of the race' },
      { type: 'image', required: true },
      { type: 'body', required: true, placeholder: 'Full race report...' },
      { type: 'pullquote', required: false },
    ],
    style: {
      headlineSize: 'xl',
      bodyFont: 'serif',
      accent: '#d4a964',
    },
  },

  'Race Day Update': {
    id: 'race-day-update',
    name: 'Race Day Update',
    description: 'Quick social-style update for race day',
    layout: 'social',
    columns: 1,
    hasImage: true,
    hasPullQuote: false,
    hasStats: true,
    hasSignature: false,
    sections: [
      { type: 'headline', required: true, placeholder: 'Quick Update Title' },
      { type: 'image', required: true },
      { type: 'body', required: true, placeholder: 'Brief update...' },
      { type: 'stats', required: false },
    ],
    style: {
      headlineSize: 'lg',
      bodyFont: 'sans',
      accent: '#3b82f6',
    },
  },

  'Owner Update': {
    id: 'owner-update',
    name: 'Owner Update',
    description: 'Personal letter format for syndicate members',
    layout: 'letter',
    columns: 1,
    hasImage: false,
    hasPullQuote: false,
    hasStats: false,
    hasSignature: true,
    sections: [
      { type: 'headline', required: true, placeholder: 'Dear Owners,' },
      { type: 'body', required: true, placeholder: 'Personal update letter...' },
      { type: 'signature', required: true },
    ],
    style: {
      headlineSize: 'md',
      bodyFont: 'serif',
      accent: '#1f2937',
    },
  },

  'Trainer Update': {
    id: 'trainer-update',
    name: 'Trainer Update',
    description: 'Technical update with stats and analysis',
    layout: 'report',
    columns: 1,
    hasImage: true,
    hasPullQuote: true,
    hasStats: true,
    hasSignature: true,
    sections: [
      { type: 'headline', required: true, placeholder: 'Training Report' },
      { type: 'subheadline', required: false, placeholder: 'Week overview' },
      { type: 'stats', required: true },
      { type: 'body', required: true, placeholder: 'Detailed analysis...' },
      { type: 'image', required: false },
      { type: 'pullquote', required: false },
      { type: 'signature', required: true },
    ],
    style: {
      headlineSize: 'lg',
      bodyFont: 'sans',
      accent: '#059669',
    },
  },

  'Pre-Race Preview': {
    id: 'pre-race-preview',
    name: 'Pre-Race Preview',
    description: 'Promotional hype piece before race day',
    layout: 'newsletter',
    columns: 2,
    hasImage: true,
    hasPullQuote: false,
    hasStats: true,
    hasSignature: false,
    sections: [
      { type: 'headline', required: true, placeholder: 'Race Preview Title' },
      { type: 'subheadline', required: true, placeholder: 'Key details and expectations' },
      { type: 'image', required: true },
      { type: 'stats', required: true },
      { type: 'body', required: true, placeholder: 'Preview content...' },
      { type: 'cta', required: false },
    ],
    style: {
      headlineSize: 'xl',
      bodyFont: 'sans',
      accent: '#dc2626',
    },
  },
}

export const getTemplate = (name: string): TemplateConfig => {
  return TEMPLATES[name] || TEMPLATES['Post-Race Report']
}

export const TEMPLATE_NAMES = Object.keys(TEMPLATES)
