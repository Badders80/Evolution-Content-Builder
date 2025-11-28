/**
 * Evolution Content Builder — Frontend Configuration
 * 
 * This module loads brand rules, templates, and schemas from /config.
 * It serves as the single source of truth for the React UI.
 * 
 * All brand-related decisions should reference these configs,
 * not hardcoded values in components.
 */

// Import config files directly (Vite handles JSON imports)
import brandRules from '../../../config/brand_rules.json'
import templates from '../../../config/templates.json'
import bannedWords from '../../../config/banned_words.json'

// Re-export for use throughout the app
export const BRAND_RULES = brandRules
export const TEMPLATES = templates.templates
export const AUDIENCES = templates.audiences
export const LENGTH_PRESETS = templates.length_presets
export const BANNED_WORDS = bannedWords

// Type definitions derived from config
export type PresetType = keyof typeof TEMPLATES
export type AudienceType = keyof typeof AUDIENCES
export type LengthType = keyof typeof LENGTH_PRESETS
export type ToneType = 'formal' | 'balanced' | 'conversational'

// Helper functions
export function getTemplateConfig(preset: PresetType) {
  return TEMPLATES[preset] || TEMPLATES.post_race
}

export function getAudienceConfig(audience: AudienceType) {
  return AUDIENCES[audience] || AUDIENCES.investor
}

export function getLengthConfig(length: LengthType) {
  return LENGTH_PRESETS[length] || LENGTH_PRESETS.standard
}

export function isBannedWord(word: string): boolean {
  const lowerWord = word.toLowerCase()
  const allBanned = [
    ...BANNED_WORDS.banned_words,
    ...BANNED_WORDS.hype_words,
    ...BANNED_WORDS.vague_superlatives,
    ...BANNED_WORDS.marketing_buzzwords,
  ]
  return allBanned.some(banned => lowerWord.includes(banned.toLowerCase()))
}

export function checkBrandCompliance(text: string): {
  passed: boolean
  warnings: string[]
} {
  const warnings: string[] = []
  const words = text.toLowerCase().split(/\s+/)
  
  for (const word of words) {
    if (isBannedWord(word)) {
      warnings.push(`Banned word detected: "${word}"`)
    }
  }
  
  // Check for patterns
  if (/!{2,}/.test(text)) {
    warnings.push('Multiple exclamation marks detected')
  }
  
  if (/[A-Z]{5,}/.test(text)) {
    warnings.push('All-caps word detected (avoid shouting)')
  }
  
  return {
    passed: warnings.length === 0,
    warnings,
  }
}

// Brand voice helpers
export function getBrandVoice() {
  return BRAND_RULES.voice
}

export function getBrandBridges() {
  return BRAND_RULES.brand_bridges
}

export function getContentGuidelines() {
  return BRAND_RULES.content_guidelines
}
