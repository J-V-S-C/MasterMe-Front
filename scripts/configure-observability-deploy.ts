import { readFile, writeFile } from 'node:fs/promises'

export function deploymentObservabilityVariables(environment: Readonly<Record<string, string | undefined>>): Record<string, string> {
  const ingestUrl = environment.OBSERVABILITY_INGEST_URL?.trim() ?? ''
  const allowedOrigins = environment.OBSERVABILITY_ALLOWED_ORIGINS?.trim() ?? ''
  const build = environment.APP_BUILD_ID?.trim() ?? ''
  if (!/^[A-Fa-f0-9]{40}$/.test(build)) throw new Error('APP_BUILD_ID must be a full commit SHA')
  if (Boolean(ingestUrl) !== Boolean(allowedOrigins)) throw new Error('observability URL and allowlist must be configured together')
  if (ingestUrl) {
    const target = new URL(ingestUrl)
    const origins = allowedOrigins.split(',').map((value) => value.trim()).filter(Boolean)
    if (target.protocol !== 'https:' || !origins.includes(target.origin)) throw new Error('observability URL must be HTTPS and explicitly allowlisted')
  }
  return { OBSERVABILITY_INGEST_URL: ingestUrl, OBSERVABILITY_ALLOWED_ORIGINS: allowedOrigins, APP_BUILD_ID: build }
}

async function main(): Promise<void> {
  const path = process.argv[2] ?? 'wrangler.jsonc'
  const configuration = JSON.parse(await readFile(path, 'utf8')) as { vars?: Record<string, string> }
  configuration.vars = { ...configuration.vars, ...deploymentObservabilityVariables(process.env) }
  await writeFile(path, `${JSON.stringify(configuration, null, 2)}\n`)
}

if (import.meta.main) await main()
