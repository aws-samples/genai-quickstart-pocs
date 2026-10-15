import { describe, it, expect } from 'vitest'
import {
  MODEL_OPTIONS,
  PERSONALITY_OPTIONS,
  DEFAULT_MODEL,
  DEFAULT_PERSONALITY,
} from '../agentConfig'

// Behavior-lock tests for the agent configuration constants. These guard
// against accidental option drift during dependency upgrades / refactors.

describe('agentConfig', () => {
  it('exposes the four supported models with required fields', () => {
    expect(MODEL_OPTIONS).toHaveLength(4)
    for (const m of MODEL_OPTIONS) {
      expect(m.id).toBeTruthy()
      expect(m.name).toBeTruthy()
      expect(m.description).toBeTruthy()
    }
  })

  it('default model is one of the listed models', () => {
    expect(MODEL_OPTIONS.some((m) => m.id === DEFAULT_MODEL)).toBe(true)
    expect(DEFAULT_MODEL).toBe('us.amazon.nova-pro-v1:0')
  })

  it('exposes pe, mcp and analyst personalities', () => {
    const ids = PERSONALITY_OPTIONS.map((p) => p.id)
    expect(ids).toEqual(['pe', 'mcp', 'analyst'])
  })

  it('default personality is a listed personality', () => {
    expect(PERSONALITY_OPTIONS.some((p) => p.id === DEFAULT_PERSONALITY)).toBe(true)
    expect(DEFAULT_PERSONALITY).toBe('pe')
  })
})
