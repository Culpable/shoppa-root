import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import {
  LIGHTHOUSE_VERSION,
  createReportIdentity,
  readCompletedReport,
  recordCompletedReport,
  releaseFingerprint,
} from './lighthouse-report-cache.mjs';

const hosts = [
  { id: 'production', origin: 'https://shoppa.au' },
  { id: 'staging', origin: 'https://staging.shoppa.au' },
];
const routes = [
  { id: 'home', path: '/' },
  { id: 'about', path: '/about/' },
  { id: 'process', path: '/process/' },
  { id: 'contact', path: '/contact/' },
  { id: 'privacy', path: '/privacy/' },
  { id: 'thank-you', path: '/thank-you/' },
];
const modes = [
  { id: 'mobile', runs: 5, arguments: [] },
  { id: 'desktop', runs: 3, arguments: ['--preset=desktop'] },
];

const cliArguments = process.argv.slice(2);
const outputArgument = cliArguments[0]?.startsWith('--') ? null : cliArguments[0];

/** Read a required value from the matrix command line. */
function readOption(name) {
  const optionIndex = cliArguments.indexOf(name);
  const value = optionIndex === -1 ? null : cliArguments[optionIndex + 1];
  return value && !value.startsWith('--') ? value : null;
}

const releases = {
  production: readOption('--production-release'),
  staging: readOption('--staging-release'),
};
if (!releases.production || !releases.staging) {
  throw new Error(
    'Provide --production-release <commit-or-version> and --staging-release <commit-or-version> so reports cannot cross release boundaries.',
  );
}

const forceFresh = cliArguments.includes('--force');
const outputDirectory = resolve(outputArgument ?? 'documents/guides/parity/lighthouse');
mkdirSync(outputDirectory, { recursive: true });

/** Return the middle value from a sorted numeric sample. */
function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

/** Run Lighthouse in a unique Chrome profile and keep the raw JSON result. */
function runLighthouse({ url, reportPath, extraArguments, categories, releaseId }) {
  const identity = createReportIdentity({ url, categories, extraArguments, releaseId });
  const existingReport = readCompletedReport(reportPath, identity, forceFresh);
  if (existingReport) return existingReport;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const profileDirectory = mkdtempSync(join(tmpdir(), 'shoppa-lighthouse-profile-'));
    const result = spawnSync(
      'npx',
      [
        '--yes',
        `lighthouse@${LIGHTHOUSE_VERSION}`,
        url,
        `--only-categories=${categories.join(',')}`,
        '--output=json',
        `--output-path=${reportPath}`,
        '--quiet',
        '--chrome-flags',
        `--headless=new --no-sandbox --user-data-dir=${profileDirectory}`,
        ...extraArguments,
      ],
      { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
    );

    // Move the disposable browser profile to Trash so failed runs remain recoverable.
    const trashResult = spawnSync('trash', [profileDirectory], { encoding: 'utf8' });
    if (trashResult.status !== 0) {
      throw new Error(`Could not move Lighthouse profile to Trash: ${trashResult.stderr}`);
    }
    if (result.status === 0) return recordCompletedReport(reportPath, identity);

    const failureOutput = result.stderr || result.stdout;
    writeFileSync(`${reportPath}.attempt-${attempt}.stderr.txt`, failureOutput, 'utf8');
    if (attempt === 3) {
      throw new Error(`Lighthouse failed three times for ${url}; see ${reportPath}.attempt-3.stderr.txt`);
    }
  }
}

/** Extract the stable performance values used in the release comparison. */
function extractPerformance(report) {
  const auditValue = (id) => report.audits[id].numericValue;
  return {
    score: report.categories.performance.score * 100,
    fcpMs: auditValue('first-contentful-paint'),
    lcpMs: auditValue('largest-contentful-paint'),
    speedIndexMs: auditValue('speed-index'),
    tbtMs: auditValue('total-blocking-time'),
    cls: auditValue('cumulative-layout-shift'),
  };
}

const measurements = [];
let completedRuns = 0;
const totalPerformanceRuns = modes.reduce(
  (total, mode) => total + mode.runs * routes.length * hosts.length,
  0,
);

for (const mode of modes) {
  for (const route of routes) {
    for (let run = 1; run <= mode.runs; run += 1) {
      // Alternate host order on every pair to distribute machine and network drift.
      const orderedHosts = run % 2 === 1 ? hosts : [...hosts].reverse();
      for (const host of orderedHosts) {
        const releaseId = releases[host.id];
        const reportPath = join(
          outputDirectory,
          `${mode.id}-${route.id}-${host.id}-${releaseFingerprint(releaseId)}-${String(run).padStart(2, '0')}.json`,
        );
        const report = runLighthouse({
          url: new URL(route.path, host.origin).href,
          reportPath,
          extraArguments: mode.arguments,
          categories: ['performance'],
          releaseId,
        });
        measurements.push({
          mode: mode.id,
          route: route.path,
          host: host.id,
          run,
          ...extractPerformance(report),
        });
        completedRuns += 1;
        process.stdout.write(`Completed ${completedRuns}/${totalPerformanceRuns} performance reports\n`);
      }
    }
  }
}

const performanceSummary = [];
for (const mode of modes) {
  for (const route of routes) {
    const hostSummaries = {};
    for (const host of hosts) {
      const values = measurements.filter(
        (measurement) =>
          measurement.mode === mode.id &&
          measurement.route === route.path &&
          measurement.host === host.id,
      );
      hostSummaries[host.id] = {};
      for (const metric of ['score', 'fcpMs', 'lcpMs', 'speedIndexMs', 'tbtMs', 'cls']) {
        const sample = values.map((value) => value[metric]);
        hostSummaries[host.id][metric] = {
          median: median(sample),
          min: Math.min(...sample),
          max: Math.max(...sample),
        };
      }
    }

    const deltas = {};
    for (const metric of ['score', 'fcpMs', 'lcpMs', 'speedIndexMs', 'tbtMs', 'cls']) {
      const productionMedian = hostSummaries.production[metric].median;
      const stagingMedian = hostSummaries.staging[metric].median;
      deltas[metric] = {
        absolute: stagingMedian - productionMedian,
        percent: productionMedian === 0
          ? null
          : ((stagingMedian - productionMedian) / productionMedian) * 100,
      };
    }
    performanceSummary.push({ mode: mode.id, route: route.path, ...hostSummaries, deltas });
  }
}

const stagingCategorySummary = [];
for (const route of routes) {
  const releaseId = releases.staging;
  const reportPath = join(
    outputDirectory,
    `staging-categories-${route.id}-${releaseFingerprint(releaseId)}.json`,
  );
  const report = runLighthouse({
    url: new URL(route.path, hosts[1].origin).href,
    reportPath,
    extraArguments: [],
    categories: ['accessibility', 'best-practices', 'seo', 'agentic-browsing'],
    releaseId,
  });
  stagingCategorySummary.push({
    route: route.path,
    accessibility: report.categories.accessibility.score * 100,
    bestPractices: report.categories['best-practices'].score * 100,
    seo: report.categories.seo.score * 100,
    agenticBrowsing: report.categories['agentic-browsing'].score * 100,
  });
  process.stdout.write(`Completed staging category report for ${route.path}\n`);
}

const summary = {
  lighthouseVersion: LIGHTHOUSE_VERSION,
  generatedAt: new Date().toISOString(),
  releases,
  forceFresh,
  performanceReportCount: measurements.length,
  stagingCategoryReportCount: stagingCategorySummary.length,
  performanceSummary,
  stagingCategorySummary,
};
writeFileSync(join(outputDirectory, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
process.stdout.write(`Wrote ${join(outputDirectory, 'summary.json')}\n`);
