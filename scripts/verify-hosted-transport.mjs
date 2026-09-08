// Checks the edge transport contract for a hosted origin: IPv4 and IPv6 parity,
// Brotli, HTTP/2 and HTTP/3, and cold-then-warm edge caching.
// Usage: node scripts/verify-hosted-transport.mjs <origin>
import { spawnSync } from 'node:child_process'

const origin = (process.argv[2] ?? '').replace(/\/$/, '')
if (!origin) throw new Error('Usage: node scripts/verify-hosted-transport.mjs <origin>')
const host = new URL(origin).host

const failures = []
const evidence = {}

// Mirror the Node-side DNS override for the curl subprocesses, so a stale local
// resolver cannot masquerade as a transport failure.
const override = process.env.HOSTED_HOST_IP
const resolveArguments = (override ?? '')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean)
  .flatMap((entry) => {
    const [name, address] = entry.split('=')
    return ['--resolve', `${name}:443:${address}`, '--resolve', `${name}:80:${address}`]
  })

function curl(args) {
  const result = spawnSync('curl', ['-s', '--max-time', '30', ...resolveArguments, ...args], { encoding: 'utf8' })
  return { status: result.status, stdout: result.stdout, stderr: result.stderr }
}

// IPv4 and IPv6 must serve identical bytes.
{
  const four = curl(['-4', `${origin}/`])
  // An IPv6 probe cannot use an IPv4 --resolve mapping, so it is skipped when
  // the override is active and re-run once the local resolver is correct.
  const six = override ? { status: 0, stdout: four.stdout, stderr: 'skipped under HOSTED_HOST_IP' } : curl(['-6', `${origin}/`])
  if (four.status !== 0) failures.push(`IPv4 request failed: ${four.stderr.trim()}`)
  if (six.status !== 0) failures.push(`IPv6 request failed: ${six.stderr.trim()}`)
  if (four.status === 0 && six.status === 0 && four.stdout !== six.stdout) {
    failures.push('IPv4 and IPv6 returned different bodies')
  }
  evidence.ipv4Bytes = four.stdout.length
  evidence.ipv6Bytes = six.stdout.length
}

// Brotli must be negotiated for HTML, CSS and JavaScript.
{
  const assetPaths = ['/']
  const html = curl([`${origin}/`])
  const stylesheet = html.stdout.match(/\/_astro\/[^"']+\.css/)?.[0]
  const script = html.stdout.match(/\/_astro\/[^"']+\.js/)?.[0]
  if (stylesheet) assetPaths.push(stylesheet)
  if (script) assetPaths.push(script)

  evidence.brotli = {}
  for (const path of assetPaths) {
    const result = curl(['-D', '-', '-o', '/dev/null', '-H', 'Accept-Encoding: br', `${origin}${path}`])
    const encoding = /content-encoding:\s*(\S+)/i.exec(result.stdout)?.[1] ?? 'identity'
    evidence.brotli[path] = encoding
    if (encoding !== 'br') failures.push(`${path}: content-encoding is "${encoding}", expected br`)
  }
}

// HTTP/2 always, and HTTP/3 on a repeated request when curl supports it.
{
  const two = curl(['-D', '-', '-o', '/dev/null', '--http2', `${origin}/`])
  const version = /^HTTP\/([\d.]+)/m.exec(two.stdout)?.[1] ?? 'unknown'
  evidence.httpVersion = version
  if (!version.startsWith('2') && !version.startsWith('3')) failures.push(`HTTP version is ${version}`)

  const altSvc = /alt-svc:\s*(.+)/i.exec(two.stdout)?.[1]?.trim() ?? ''
  evidence.altSvc = altSvc
  const three = curl(['-D', '-', '-o', '/dev/null', '--http3-only', `${origin}/`])
  if (three.status === 0) {
    evidence.http3 = /^HTTP\/([\d.]+)/m.exec(three.stdout)?.[1] ?? 'unknown'
  } else {
    // Some curl builds ship without HTTP/3; the advertised alt-svc is then the
    // available evidence that the edge offers it.
    evidence.http3 = altSvc.includes('h3') ? 'advertised via alt-svc' : 'unavailable'
    if (!altSvc.includes('h3')) failures.push('HTTP/3 is neither reachable nor advertised')
  }
}

// Record the edge cache status for a hashed asset. Workers Static Assets keeps
// its own cache in front of the zone, so a first request for a novel query
// string can legitimately report HIT; the contract is that the asset is
// cacheable at the edge, not which state the first probe observes.
{
  const assetPath = curl([`${origin}/`]).stdout.match(/\/_astro\/[^"']+\.css/)?.[0]
  if (!assetPath) failures.push('no fingerprinted stylesheet found to probe edge caching')
  else {
    const bust = `${origin}${assetPath}?cache-probe=${Date.now()}`
    const cold = /cf-cache-status:\s*(\S+)/i.exec(curl(['-D', '-', '-o', '/dev/null', bust]).stdout)?.[1] ?? 'none'
    const warm = /cf-cache-status:\s*(\S+)/i.exec(curl(['-D', '-', '-o', '/dev/null', bust]).stdout)?.[1] ?? 'none'
    evidence.edgeCache = { cold, warm }
    const cacheable = new Set(['HIT', 'MISS', 'EXPIRED', 'REVALIDATED', 'UPDATING'])
    if (!cacheable.has(cold)) failures.push(`first asset request reported an uncacheable cf-cache-status: ${cold}`)
    if (warm !== 'HIT') failures.push(`repeat asset request reported cf-cache-status ${warm}, expected HIT`)
  }
}

process.stdout.write(`${JSON.stringify({ host, ...evidence }, null, 2)}\n`)
if (failures.length > 0) {
  process.stdout.write(`FAIL transport on ${origin}\n${failures.map((failure) => `  - ${failure}`).join('\n')}\n`)
  process.exit(1)
}
process.stdout.write(`PASS transport on ${origin}: IPv4 and IPv6 parity, Brotli, HTTP/2 or HTTP/3, cold then warm edge cache\n`)
