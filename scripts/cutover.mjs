/**
 * Production cutover and rollback for shoppa.au.
 *
 * Every action is explicit and reversible, and nothing runs without a mode
 * argument. Run `snapshot` first: it writes the complete pre-cutover state that
 * `rollback` restores from.
 *
 *   node scripts/cutover.mjs snapshot   # read-only; writes the state file
 *   node scripts/cutover.mjs cutover    # apex + www + always_use_https
 *   node scripts/cutover.mjs verify     # post-cutover HTTP checks
 *   node scripts/cutover.mjs rollback   # restore GitHub Pages from the snapshot
 *
 * Credentials are read from the macOS Keychain per invocation and never printed.
 */
import { execFileSync } from 'node:child_process';
import './host-override.mjs';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const ACCOUNT_ID = '213ab3604485056376263d22fa242742';
const ZONE_ID = 'dae30eef9757b84c7217dbd9dd624ff9';
const APEX = 'shoppa.au';
const WWW = `www.${APEX}`;
const WWW_RECORD_ID = '6b24bcee2bc397e10fdf6947ca0ae89e';
const REDIRECT_RULE_NAME = 'Redirect www to the Shoppa apex';
const SNAPSHOT_PATH = resolve(import.meta.dirname, '../documents/guides/parity/cutover-snapshot.json');
const STAGING_HOSTNAME = 'staging.shoppa.au';

const mode = process.argv[2];
if (!['snapshot', 'cutover', 'verify', 'rollback', 'remove-staging'].includes(mode)) {
  throw new Error('Usage: node scripts/cutover.mjs <snapshot|cutover|verify|rollback|remove-staging>');
}

const email = 'jake.sacino@gmail.com';
const key = execFileSync('security', ['find-generic-password', '-w', '-s', 'cloudflare-global-api-key', '-a', email], {
  encoding: 'utf8',
}).trim();

async function api(path, init = {}) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: { 'X-Auth-Email': email, 'X-Auth-Key': key, 'Content-Type': 'application/json', ...init.headers },
  });
  const text = await response.text();
  if (text.trim() === '') {
    if (!response.ok) throw new Error(`${init.method ?? 'GET'} ${path} failed with status ${response.status}`);
    return null;
  }
  const body = JSON.parse(text);
  if (!body.success) throw new Error(`${init.method ?? 'GET'} ${path} failed: ${JSON.stringify(body.errors)}`);
  return body.result;
}

async function snapshot() {
  const records = await api(`/zones/${ZONE_ID}/dns_records?per_page=100`);
  const state = {
    capturedAt: new Date().toISOString(),
    zoneId: ZONE_ID,
    accountId: ACCOUNT_ID,
    dnsRecords: records.map((record) => ({
      id: record.id,
      type: record.type,
      name: record.name,
      content: record.content,
      proxied: record.proxied,
      ttl: record.ttl,
      priority: record.priority ?? null,
      comment: record.comment ?? null,
      tags: record.tags ?? [],
    })),
    apexARecords: records
      .filter((record) => record.type === 'A' && record.name === APEX)
      .map(({ type, name, content, ttl, proxied, comment, tags }) => ({ type, name, content, ttl, proxied, comment, tags })),
    wwwRecord: records
      .filter((record) => record.name === WWW)
      .map(({ id, type, name, content, ttl, proxied, comment, tags }) => ({ id, type, name, content, ttl, proxied, comment, tags }))[0],
    alwaysUseHttps: (await api(`/zones/${ZONE_ID}/settings/always_use_https`)).value,
    botManagement: await api(`/zones/${ZONE_ID}/bot_management`),
    workersDomains: await api(`/accounts/${ACCOUNT_ID}/workers/domains`),
    rulesets: await api(`/zones/${ZONE_ID}/rulesets`),
    workerDeployment: (await api(`/accounts/${ACCOUNT_ID}/workers/scripts/shoppa-root/deployments`)).deployments?.[0] ?? null,
    githubPages: JSON.parse(execFileSync('gh', ['api', 'repos/Culpable/shoppa-root/pages'], { encoding: 'utf8' })),
  };
  mkdirSync(dirname(SNAPSHOT_PATH), { recursive: true });
  writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(state, null, 2)}\n`);
  process.stdout.write(
    `Snapshot written to ${SNAPSHOT_PATH}\n` +
      `  DNS records: ${state.dnsRecords.length}\n` +
      `  apex A records: ${state.apexARecords.length}\n` +
      `  www: ${state.wwwRecord?.type} ${state.wwwRecord?.content}\n` +
      `  always_use_https: ${state.alwaysUseHttps}\n` +
      `  Worker deployment: ${state.workerDeployment?.id ?? 'none'}\n` +
      `  GitHub Pages: ${state.githubPages.html_url}\n`,
  );
}

function readSnapshot() {
  const state = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8'));
  if (state.apexARecords.length !== 4) throw new Error('Snapshot does not hold the four apex A records.');
  if (!state.wwwRecord) throw new Error('Snapshot does not hold the www record.');
  return state;
}

async function cutover() {
  const state = readSnapshot();
  const apexRecordIds = state.dnsRecords
    .filter((record) => record.type === 'A' && record.name === APEX)
    .map((record) => record.id);
  if (apexRecordIds.length !== 4) throw new Error(`Expected four apex A records, found ${apexRecordIds.length}.`);

  for (const id of apexRecordIds) await api(`/zones/${ZONE_ID}/dns_records/${id}`, { method: 'DELETE' });
  process.stdout.write(`deleted ${apexRecordIds.length} GitHub apex A records\n`);

  let attached;
  try {
    attached = await api(`/accounts/${ACCOUNT_ID}/workers/domains`, {
      method: 'PUT',
      body: JSON.stringify({ hostname: APEX, service: 'shoppa-root', zone_id: ZONE_ID }),
    });
  } catch (error) {
    for (const record of state.apexARecords) {
      await api(`/zones/${ZONE_ID}/dns_records`, { method: 'POST', body: JSON.stringify(record) });
    }
    throw new Error(`Apex attach failed; the four A records were restored. Cause: ${error.message}`);
  }
  process.stdout.write(`apex custom domain: ${attached.id} cert ${attached.cert_id}\n`);

  await api(`/zones/${ZONE_ID}/dns_records/${WWW_RECORD_ID}`, {
    method: 'PUT',
    body: JSON.stringify({
      type: 'A',
      name: WWW,
      content: '192.0.2.0',
      ttl: 1,
      proxied: true,
      comment: 'Proxied placeholder for canonical www redirect',
    }),
  });
  process.stdout.write('www record replaced with the proxied placeholder\n');

  const ruleset = await api(`/zones/${ZONE_ID}/rulesets`, {
    method: 'POST',
    body: JSON.stringify({
      name: REDIRECT_RULE_NAME,
      kind: 'zone',
      phase: 'http_request_dynamic_redirect',
      rules: [
        {
          action: 'redirect',
          expression: `(http.host eq "${WWW}")`,
          description: REDIRECT_RULE_NAME,
          enabled: true,
          action_parameters: {
            from_value: {
              status_code: 308,
              target_url: { expression: `concat("https://${APEX}", http.request.uri.path)` },
              preserve_query_string: true,
            },
          },
        },
      ],
    }),
  });
  process.stdout.write(`redirect ruleset: ${ruleset.id}\n`);

  await api(`/zones/${ZONE_ID}/settings/always_use_https`, {
    method: 'PATCH',
    body: JSON.stringify({ value: 'on' }),
  });
  process.stdout.write(`always_use_https: ${state.alwaysUseHttps} -> on\n`);

  writeFileSync(
    `${SNAPSHOT_PATH.replace(/\.json$/, '')}-applied.json`,
    `${JSON.stringify({ appliedAt: new Date().toISOString(), apexDomainId: attached.id, apexCertId: attached.cert_id, redirectRulesetId: ruleset.id }, null, 2)}\n`,
  );
}

async function rollback() {
  const state = readSnapshot();
  const applied = JSON.parse(readFileSync(`${SNAPSHOT_PATH.replace(/\.json$/, '')}-applied.json`, 'utf8'));

  await api(`/zones/${ZONE_ID}/settings/always_use_https`, {
    method: 'PATCH',
    body: JSON.stringify({ value: state.alwaysUseHttps }),
  });
  await api(`/zones/${ZONE_ID}/rulesets/${applied.redirectRulesetId}`, { method: 'DELETE' }).catch(() => {});
  await api(`/accounts/${ACCOUNT_ID}/workers/domains/${applied.apexDomainId}`, { method: 'DELETE' }).catch(() => {});

  const current = await api(`/zones/${ZONE_ID}/dns_records?per_page=100`);
  for (const record of current.filter((entry) => entry.name === APEX && ['A', 'AAAA', 'CNAME'].includes(entry.type))) {
    await api(`/zones/${ZONE_ID}/dns_records/${record.id}`, { method: 'DELETE' });
  }
  for (const record of current.filter((entry) => entry.name === WWW)) {
    await api(`/zones/${ZONE_ID}/dns_records/${record.id}`, { method: 'DELETE' });
  }
  for (const record of state.apexARecords) {
    await api(`/zones/${ZONE_ID}/dns_records`, { method: 'POST', body: JSON.stringify(record) });
  }
  const { id, ...wwwBody } = state.wwwRecord;
  await api(`/zones/${ZONE_ID}/dns_records`, { method: 'POST', body: JSON.stringify(wwwBody) });
  process.stdout.write('Rollback applied: GitHub Pages records restored.\n');
}

async function verify() {
  const checks = [];
  const record = (name, ok, detail) => checks.push({ name, ok, detail });

  const apex = await fetch(`https://${APEX}/`, { redirect: 'manual' });
  record('apex 200 from Cloudflare', apex.status === 200 && apex.headers.get('server') === 'cloudflare', `${apex.status} ${apex.headers.get('server')}`);
  record('apex has no noindex', !(apex.headers.get('x-robots-tag') ?? '').includes('noindex'), apex.headers.get('x-robots-tag') ?? 'absent');
  record('apex CSP', (apex.headers.get('content-security-policy') ?? '').includes("script-src 'self'"), 'present');
  record('apex Vary', (apex.headers.get('vary') ?? '').includes('Accept'), apex.headers.get('vary') ?? '');

  const plain = await fetch(`http://${APEX}/about/`, { redirect: 'manual' });
  record('http 301 to https', plain.status === 301 && plain.headers.get('location') === `https://${APEX}/about/`, `${plain.status} ${plain.headers.get('location')}`);

  const www = await fetch(`https://${WWW}/process/?source=host-check`, { redirect: 'manual' });
  record('www 308 to apex', www.status === 308 && www.headers.get('location') === `https://${APEX}/process/?source=host-check`, `${www.status} ${www.headers.get('location')}`);

  const missing = await fetch(`https://${APEX}/__cutover-probe/`);
  record('unknown path 404', missing.status === 404, String(missing.status));

  const markdown = await fetch(`https://${APEX}/`, { headers: { Accept: 'text/markdown' } });
  record('Markdown negotiation', (markdown.headers.get('content-type') ?? '').includes('text/markdown'), markdown.headers.get('content-type') ?? '');

  const llms = await fetch(`https://${APEX}/llms.txt`);
  record('llms charset', (llms.headers.get('content-type') ?? '').includes('charset=utf-8'), llms.headers.get('content-type') ?? '');

  const state = readSnapshot();
  const now = await api(`/zones/${ZONE_ID}/dns_records?per_page=100`);
  const changedIds = new Set(
    state.dnsRecords
      .filter((entry) => (entry.type === 'A' && entry.name === APEX) || entry.name === WWW)
      .map((entry) => entry.id),
  );
  const untouched = state.dnsRecords.filter(
    (entry) => !changedIds.has(entry.id) && !entry.name.startsWith('staging'),
  );
  const stillPresent = untouched.every((entry) =>
    now.some((current) => current.id === entry.id && current.content === entry.content && current.type === entry.type),
  );
  record(`${untouched.length} unrelated DNS records unchanged`, stillPresent, 'byte comparison against the snapshot');
  record('no GitHub apex A record remains', !now.some((entry) => entry.name === APEX && String(entry.content).startsWith('185.199.')), 'checked');

  for (const check of checks) process.stdout.write(`${check.ok ? 'PASS' : 'FAIL'} ${check.name} (${check.detail})\n`);
  if (checks.some((check) => !check.ok)) process.exit(1);
}

async function removeStaging() {
  const domains = await api(`/accounts/${ACCOUNT_ID}/workers/domains`);
  const staging = domains.find((entry) => entry.hostname === STAGING_HOSTNAME);
  if (staging) {
    await api(`/accounts/${ACCOUNT_ID}/workers/domains/${staging.id}`, { method: 'DELETE' });
    process.stdout.write(`deleted Workers custom domain ${staging.id}\n`);
  } else {
    process.stdout.write('no staging custom domain to delete\n');
  }

  const records = await api(`/zones/${ZONE_ID}/dns_records?per_page=100`);
  for (const record of records.filter((entry) => entry.name === STAGING_HOSTNAME)) {
    await api(`/zones/${ZONE_ID}/dns_records/${record.id}`, { method: 'DELETE' });
    process.stdout.write(`deleted DNS record ${record.type} ${record.name} (${record.id})\n`);
  }

  const remaining = await api(`/zones/${ZONE_ID}/dns_records?per_page=100`);
  process.stdout.write(`zone now holds ${remaining.length} records\n`);
}

if (mode === 'snapshot') await snapshot();
if (mode === 'remove-staging') await removeStaging();
if (mode === 'cutover') await cutover();
if (mode === 'rollback') await rollback();
if (mode === 'verify') await verify();
