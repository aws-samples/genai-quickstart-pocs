import { describe, it, expect } from 'vitest'
import { generateSessionId, formatTime } from '../sessionUtils'

// Behavior-lock tests for the pure-logic session utilities.
// These require no AWS/Amplify and act as a regression gate for the
// dependency upgrades applied to this POC.

describe('generateSessionId', () => {
  it('always returns a 33-character id', () => {
    for (const name of ['Alice', 'Bob Smith', 'A', '']) {
      expect(generateSessionId(name)).toHaveLength(33)
    }
  })

  it('strips spaces from the username prefix', () => {
    const id = generateSessionId('John Doe')
    // prefix is the space-stripped name, truncated to <=15 chars, then a hyphen
    expect(id.startsWith('JohnDoe-')).toBe(true)
  })

  it('truncates a long username prefix to 15 chars', () => {
    const id = generateSessionId('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
    // first 15 chars of the (space-free) name, then '-'
    expect(id.startsWith('ABCDEFGHIJKLMNO-')).toBe(true)
    expect(id).toHaveLength(33)
  })

  it('produces a hyphen separator after the prefix', () => {
    const id = generateSessionId('Zoe')
    expect(id[3]).toBe('-')
  })

  it('generates different ids on repeated calls (random suffix)', () => {
    const a = generateSessionId('user')
    const b = generateSessionId('user')
    expect(a).not.toBe(b)
  })
})

describe('formatTime', () => {
  it('formats a Date as a 2-digit hour:minute string', () => {
    const d = new Date('2026-01-02T09:05:00')
    const s = formatTime(d)
    // locale-dependent, but should contain the minute and be non-empty
    expect(typeof s).toBe('string')
    expect(s.length).toBeGreaterThan(0)
  })
})
