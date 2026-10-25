import { describe, expect, test } from 'bun:test'
import { canonicalAppOrigin } from '../../lib/canonical-origin'

describe('canonical origin', () => {
  test('ignores request Host and origin when configuration exists', () => {
    expect(canonicalAppOrigin('https://attacker.example/auth/callback', 'https://app.masterme.example', 'production'))
      .toBe('https://app.masterme.example')
  })

  test('fails closed in production without a canonical HTTPS origin', () => {
    expect(() => canonicalAppOrigin('https://attacker.example', undefined, 'production')).toThrow('PUBLIC_APP_URL')
    expect(() => canonicalAppOrigin(undefined, 'http://app.masterme.example', 'production')).toThrow('HTTPS')
    expect(() => canonicalAppOrigin(undefined, 'https://app.masterme.example/path', 'production')).toThrow('sem path')
  })

  test('accepts only a local origin as the development fallback', () => {
    expect(canonicalAppOrigin('http://localhost:3000/login', undefined, 'development')).toBe('http://localhost:3000')
    expect(canonicalAppOrigin('https://attacker.example/login', undefined, 'development')).toBe('http://localhost:3000')
  })
})
