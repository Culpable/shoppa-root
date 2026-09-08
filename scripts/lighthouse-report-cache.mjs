import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

export const LIGHTHOUSE_VERSION = '13.4.1';
const CACHE_MANIFEST_VERSION = 1;

/** Return a short filesystem-safe key without exposing assumptions about release identifier formats. */
export function releaseFingerprint(releaseId) {
  return createHash('sha256').update(releaseId).digest('hex').slice(0, 12);
}

/** Return the manifest path kept beside one raw Lighthouse report. */
export function reportManifestPath(reportPath) {
  return `${reportPath}.manifest.json`;
}

/** Build the exact inputs that must match before an interrupted matrix can reuse a report. */
export function createReportIdentity({ url, categories, extraArguments, releaseId }) {
  return {
    manifestVersion: CACHE_MANIFEST_VERSION,
    lighthouseVersion: LIGHTHOUSE_VERSION,
    releaseId,
    url,
    categories: [...categories],
    extraArguments: [...extraArguments],
  };
}

/** Return whether two serialisable input records are exactly equal. */
function identitiesMatch(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

/** Return whether the raw report proves the requested URL and category configuration. */
function reportMatchesIdentity(report, identity) {
  const categoryIds = Object.keys(report.categories ?? {}).sort();
  const expectedCategoryIds = [...identity.categories].sort();

  return report.lighthouseVersion === LIGHTHOUSE_VERSION
    && report.requestedUrl === identity.url
    && identitiesMatch(categoryIds, expectedCategoryIds);
}

/** Read a completed report only when its release and complete run inputs still match. */
export function readCompletedReport(reportPath, identity, forceFresh = false) {
  if (forceFresh) return null;

  try {
    const report = JSON.parse(readFileSync(reportPath, 'utf8'));
    const manifest = JSON.parse(readFileSync(reportManifestPath(reportPath), 'utf8'));
    return identitiesMatch(manifest, identity) && reportMatchesIdentity(report, identity)
      ? report
      : null;
  } catch {
    return null;
  }
}

/** Validate a new Lighthouse result and record the identity required for safe resumption. */
export function recordCompletedReport(reportPath, identity) {
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  if (!reportMatchesIdentity(report, identity)) {
    throw new Error(`Lighthouse wrote a report that does not match ${identity.url} and its requested categories`);
  }

  writeFileSync(reportManifestPath(reportPath), `${JSON.stringify(identity, null, 2)}\n`, 'utf8');
  return report;
}
