// Writes the manifest of the content: the version (a short hash of the bytes) of every
// published file, by its path. The application requests each file with its version
// (`?v=<hash>`, see `assetUrl` in src/content/index.ts), so a file can be cached for a year
// and is downloaded again only when it changes.
//
//   node scripts/content-manifest.mjs <public-dir> <output-file>
//
// Run by deploy-content.sh on the committed content, never by hand: the manifest is not
// kept in git.
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

// The folders of public/ that hold content (the same ones deploy-content.sh publishes).
const FOLDERS = ['content', 'images', 'cv', 'documents', 'brand']
const MANIFEST = '/content/manifest.json'

const [publicDir, output] = process.argv.slice(2)
if (!publicDir || !output) {
  console.error('Usage: node scripts/content-manifest.mjs <public-dir> <output-file>')
  process.exit(1)
}

function* files(directory) {
  for (const name of readdirSync(directory).sort()) {
    const path = join(directory, name)
    if (statSync(path).isDirectory()) yield* files(path)
    else if (!name.startsWith('.')) yield path
  }
}

const manifest = {}
for (const folder of FOLDERS) {
  for (const file of files(join(publicDir, folder))) {
    const key = '/' + relative(publicDir, file).split(sep).join('/')
    if (key === MANIFEST) continue
    manifest[key] = createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 10)
  }
}

writeFileSync(output, JSON.stringify(manifest) + '\n')
console.log(`Wrote ${Object.keys(manifest).length} versions to ${output}`)
