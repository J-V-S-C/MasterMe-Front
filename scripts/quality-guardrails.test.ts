import { describe, expect, test } from 'bun:test'
import { readFile } from 'node:fs/promises'

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

describe('frontend release guardrails', () => {
  test('CI uses a single validation, audit and build smoke test', async () => {
    const workflow = await read('.github/workflows/ci.yml')
    expect(workflow).toContain('bun run validate')
    expect(workflow).toContain('bun run validate:dependencies')
    expect(workflow).toContain('./scripts/smoke-next-build.sh')
    expect(workflow).toContain('cancel-in-progress: true')
  })

  test('deployment is exclusive to main and validates Next before the Worker', async () => {
    const workflow = await read('.github/workflows/deploy.yml')
    expect(workflow).toContain('branches: [main]')
    expect(workflow).toContain("if: github.ref == 'refs/heads/main'")
    expect(workflow).toContain('cancel-in-progress: false')
    expect(workflow).toContain('bun run validate:dependencies')
    expect(workflow.indexOf('./scripts/smoke-next-build.sh')).toBeLessThan(workflow.indexOf('bun run deploy:vinext'))
    expect(workflow).not.toContain('pull_request:')
  })

  test('observability secret remains server-only and is checked in the artifact', async () => {
    const [workflow, template] = await Promise.all([read('.github/workflows/deploy.yml'), read('.env.example')])
    expect(workflow).toContain('rg --quiet --fixed-strings')
    expect(template).toContain('OBSERVABILITY_INGEST_TOKEN=')
    expect(template).not.toContain('NEXT_PUBLIC_OBSERVABILITY_INGEST_TOKEN')
  })
})
