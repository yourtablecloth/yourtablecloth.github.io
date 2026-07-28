/*
 * `pnpm preview` — serves the build the way GitHub Pages serves it.
 *
 * `vite preview` runs the SSR server bundle, which is not what ships: the
 * deployed site is a directory of files with no process behind it, and the
 * failure mode worth catching (a route that was never prerendered, an asset
 * referenced with the wrong path) only shows up under static resolution.
 *
 * So this mirrors Pages exactly, and nothing more:
 *   /docs/faq   -> docs/faq/index.html
 *   /og.png     -> og.png
 *   /nope       -> 404.html, status 404
 */
import { createReadStream, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'

const root = resolve(process.argv[2] ?? 'dist/client')
const port = Number(process.env.PORT ?? 3100)

const TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
}

/** The file Pages would serve for a path, or null if it has none. */
function resolveFile(pathname) {
  // `normalize` collapses `..` before it can climb out of the output dir.
  const candidate = join(root, normalize(decodeURIComponent(pathname)))
  if (!candidate.startsWith(root)) return null
  for (const file of [candidate, join(candidate, 'index.html')]) {
    try {
      if (statSync(file).isFile()) return file
    } catch {
      /* next candidate */
    }
  }
  return null
}

createServer((req, res) => {
  const pathname = new URL(req.url ?? '/', 'http://localhost').pathname
  const file = resolveFile(pathname)
  const served = file ?? resolveFile('/404.html')
  const status = file ? 200 : 404

  if (!served) {
    res.writeHead(404, { 'content-type': TYPES['.txt'] })
    res.end(`No file for ${pathname}, and no 404.html either. Did you build?\n`)
    return
  }

  res.writeHead(status, { 'content-type': TYPES[extname(served)] ?? 'application/octet-stream' })
  createReadStream(served).pipe(res)
}).listen(port, () => {
  console.log(`${root} -> http://localhost:${port}`)
})
