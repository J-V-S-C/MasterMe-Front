import { describe, expect, test } from 'bun:test'
import { canonicalAppOrigin } from './canonical-origin'

describe('origem canônica', () => {
  test('ignora Host/origem da requisição quando existe configuração', () => {
    expect(canonicalAppOrigin('https://attacker.example/auth/callback', 'https://app.masterme.example', 'production'))
      .toBe('https://app.masterme.example')
  })

  test('falha fechada em produção sem origem HTTPS canônica', () => {
    expect(() => canonicalAppOrigin('https://attacker.example', undefined, 'production')).toThrow('PUBLIC_APP_URL')
    expect(() => canonicalAppOrigin(undefined, 'http://app.masterme.example', 'production')).toThrow('HTTPS')
    expect(() => canonicalAppOrigin(undefined, 'https://app.masterme.example/path', 'production')).toThrow('sem path')
  })

  test('aceita somente origem local como fallback de desenvolvimento', () => {
    expect(canonicalAppOrigin('http://localhost:3000/entrar', undefined, 'development')).toBe('http://localhost:3000')
    expect(canonicalAppOrigin('https://attacker.example/entrar', undefined, 'development')).toBe('http://localhost:3000')
  })
})
