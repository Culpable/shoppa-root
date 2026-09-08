// Three mobile Lighthouse runs per route against one origin, reporting medians.
// Usage: node scripts/run-lighthouse-sanity.mjs <origin> [outputDirectory]
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { LIGHTHOUSE_VERSION } from './lighthouse-report-cache.mjs'

const origin = (process.argv[2] ?? '').replace(/\/$/, '')
if (!origin) throw new Error('Usage: node scripts/run-lighthouse-sanity.mjs <origin> [outputDirectory]')
const outputDirectory = resolve(process.argv[3] ?? 'test-results/lighthouse-production')
mkdirSync(outputDirectory, { recursive: true })

const ROUTES = [['home', '/'], ['about', '/about/'], ['engagement', '/engagement/'], ['contact', '/contact/'], ['privacy', '/privacy/']]
const RUNS = 3

const median = (values) => {
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

const summary = []
for (const [id, path] of ROUTES) {
  const samples = []
  for (let run = 1; run <= RUNS; run += 1) {
    const reportPath = join(outputDirectory, `mobile-${id}-${String(run).padStart(2, '0')}.json`)
    const profile = mkdtempSync(join(tmpdir(), 'fintrace-lh-sanity-'))
    const result = spawnSync(
      'npx',
      ['--yes', `lighthouse@${LIGHTHOUSE_VERSION}`, new URL(path, origin).href,
       '--only-categories=performance', '--output=json', `--output-path=${reportPath}`, '--quiet',
       `--chrome-flags=--headless=new --no-sandbox --user-data-dir=${profile}`],
      { encoding: 'utf8' },
    )
    spawnSync('trash', [profile], { encoding: 'utf8' })
    if (result.status !== 0) throw new Error(`Lighthouse failed for ${path} run ${run}: ${result.stderr.slice(-500)}`)
    const report = JSON.parse(readFileSync(reportPath, 'utf8'))
    samples.push({
      score: report.categories.performance.score * 100,
      lcpMs: report.audits['largest-contentful-paint'].numericValue,
      tbtMs: report.audits['total-blocking-time'].numericValue,
      cls: report.audits['cumulative-layout-shift'].numericValue,
    })
    process.stdout.write(`${path} run ${run}: score ${Math.round(samples.at(-1).score)}\n`)
  }
  summary.push({
    route: path,
    score: median(samples.map((s) => s.score)),
    lcpMs: Math.round(median(samples.map((s) => s.lcpMs))),
    tbtMs: Math.round(median(samples.map((s) => s.tbtMs))),
    cls: median(samples.map((s) => s.cls)),
  })
}

writeFileSync(join(outputDirectory, 'summary.json'), `${JSON.stringify({ origin, runs: RUNS, lighthouseVersion: LIGHTHOUSE_VERSION, summary }, null, 2)}\n`)
process.stdout.write(`\n${summary.map((e) => `${e.route.padEnd(14)} score ${e.score}  LCP ${e.lcpMs}ms  TBT ${e.tbtMs}ms  CLS ${e.cls}`).join('\n')}\n`)
