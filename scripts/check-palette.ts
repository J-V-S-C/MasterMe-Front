import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const sourceDirectories = ['app', 'components', 'lib', 'styles']
const sourceExtensions = new Set(['.css', '.ts', '.tsx', '.svg'])
const literalColor = /#[\da-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\s*\(/gi
const namedColor = /(?:^|[;{])\s*(?:color|background|background-color|border-color|fill|stroke)\s*:\s*(?:white|black|red|green|blue)\b/gi
const inlineNamedColor = /\b(?:color|background|backgroundColor|borderColor|fill|stroke)\s*:\s*['"](?:white|black|red|green|blue)['"]/gi

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(join(root, directory), { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return entry.isFile() && [...sourceExtensions].some((extension) => path.endsWith(extension)) ? [path] : []
  }))
  return nested.flat()
}

function maskPaletteBlocks(source: string): string {
  return source.replace(/(?:^|[}\s])(?:\:root|\[data-theme="dark"\])\s*\{[^{}]*\}/gm, (block) => block.replace(/[^\n]/g, ' '))
}

const files = (await Promise.all(sourceDirectories.map(sourceFiles))).flat()
const errors: string[] = []
for (const path of files) {
  const content = await readFile(join(root, path), 'utf8')
  const checked = path === 'app/themes.css' ? maskPaletteBlocks(content) : content
  for (const pattern of [literalColor, ...(path.endsWith('.css') ? [namedColor] : [inlineNamedColor])]) {
    pattern.lastIndex = 0
    for (const match of checked.matchAll(pattern)) {
      const line = checked.slice(0, match.index).split('\n').length
      errors.push(`${path}:${line}: use a theme token instead of ${match[0].trim()}`)
    }
  }
  if (path.endsWith('.css')) {
    for (const match of checked.matchAll(/--blue(?:-ink)?\s*:/g)) {
      const line = checked.slice(0, match.index).split('\n').length
      errors.push(`${path}:${line}: define ${match[0].slice(0, -1).trim()} only in the shared palette`)
    }
  }
}

const theme = await readFile(join(root, 'app/themes.css'), 'utf8')
const paletteBlocks = [...theme.matchAll(/(?:^|[}\s])(\:root|\[data-theme="dark"\])\s*\{([^{}]*)\}/gm)]
for (const token of ['--blue', '--blue-ink']) {
  for (const selector of [':root', '[data-theme="dark"]']) {
    const count = paletteBlocks
      .filter((match) => match[1] === selector)
      .flatMap((match) => [...match[2].matchAll(new RegExp(`(?:^|;)\\s*${token}\\s*:`, 'g'))]).length
    if (count !== 1) errors.push(`app/themes.css: expected exactly one ${token} in ${selector}, found ${count}`)
  }
}

if (errors.length) {
  console.error(`Palette check failed:\n${errors.join('\n')}`)
  process.exitCode = 1
} else {
  console.log(`Palette check passed (${files.length} frontend source files).`)
}
