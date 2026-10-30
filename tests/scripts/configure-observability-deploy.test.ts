import { describe, expect, test } from 'bun:test'
import { readFile } from 'node:fs/promises'
import { deploymentObservabilityVariables } from '../../scripts/configure-observability-deploy'

describe('observability deployment configuration', () => {
  test('requires SHA and a consistent URL/allowlist pair', () => {
    const sha = 'a'.repeat(40)
    expect(deploymentObservabilityVariables({ APP_BUILD_ID: sha })).toEqual({ APP_BUILD_ID: sha, OBSERVABILITY_INGEST_URL: '', OBSERVABILITY_ALLOWED_ORIGINS: '' })
    expect(() => deploymentObservabilityVariables({ APP_BUILD_ID: sha, OBSERVABILITY_INGEST_URL: 'https://telemetry.example/i' })).toThrow()
    expect(() => deploymentObservabilityVariables({ APP_BUILD_ID: sha, OBSERVABILITY_INGEST_URL: 'https://evil.example/i', OBSERVABILITY_ALLOWED_ORIGINS: 'https://telemetry.example' })).toThrow()
  })

  test('workflow injects variables and stores the token only after the build', async () => {
    const workflow = await readFile(new URL('../../.github/workflows/deploy.yml', import.meta.url), 'utf8')
    expect(workflow).toContain('bun scripts/configure-observability-deploy.ts wrangler.jsonc')
    expect(workflow.indexOf('bun run build:vinext')).toBeLessThan(workflow.indexOf('wrangler secret put OBSERVABILITY_INGEST_TOKEN'))
    expect(workflow).toContain('rg --quiet --fixed-strings')
  })
})
