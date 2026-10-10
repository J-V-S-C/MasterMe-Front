import { describe, expect, test } from 'bun:test'
import { loginHrefFor, planLoginHref, safeInternalDestination } from './auth-redirect'
import { isPublicPage } from './public-routes'

describe('redirects internos de autenticação', () => {
  test('preserva apenas destinos e planos conhecidos', () => {
    expect(safeInternalDestination('/estudar')).toBe('/estudar')
    expect(safeInternalDestination('/mapa-do-conhecimento')).toBe('/mapa-do-conhecimento')
    expect(safeInternalDestination('/pratica')).toBe('/pratica')
    expect(safeInternalDestination('/estudar?plan=ESSENTIAL')).toBe('/estudar?plan=ESSENTIAL')
    expect(safeInternalDestination('/pagamento/retorno?orderId=11111111-1111-4111-8111-111111111111')).toBe('/pagamento/retorno?orderId=11111111-1111-4111-8111-111111111111')
  })

  test('recusa origem externa, protocolo relativo, plano e parâmetros desconhecidos', () => {
    expect(safeInternalDestination('https://example.com/estudar')).toBe('/estudar')
    expect(safeInternalDestination('//example.com/estudar')).toBe('/estudar')
    expect(safeInternalDestination('javascript:alert(1)')).toBe('/estudar')
    expect(safeInternalDestination('/estudar?plan=UNLIMITED')).toBe('/estudar')
    expect(safeInternalDestination('/estudar?plan=FREE&plan=PRO')).toBe('/estudar')
    expect(safeInternalDestination('/estudar?returnTo=https://example.com')).toBe('/estudar')
    expect(safeInternalDestination('/pagamento/retorno?orderId=invalid')).toBe('/estudar')
    expect(safeInternalDestination('/pagamento/retorno?orderId=11111111-1111-4111-8111-111111111111&next=https://example.com')).toBe('/estudar')
  })

  test('monta CTA somente com o identificador do plano', () => {
    expect(decodeURIComponent(planLoginHref('PRO'))).toBe('/entrar?next=/estudar?plan=PRO')
    expect(loginHrefFor('/pratica')).toBe('/entrar?next=%2Fpratica')
  })
})

describe('rotas públicas', () => {
  test('mantém somente aquisição e autenticação fora do gate', () => {
    expect(isPublicPage('/')).toBe(true)
    expect(isPublicPage('/entrar')).toBe(true)
    expect(isPublicPage('/auth/callback')).toBe(true)
    expect(isPublicPage('/estudar')).toBe(false)
    expect(isPublicPage('/mapa-do-conhecimento')).toBe(false)
    expect(isPublicPage('/pratica')).toBe(false)
  })
})
