/**
 * Optional DNS override for hosted checks.
 *
 * Set `HOSTED_HOST_IP` to `hostname=address` to make this process resolve that
 * one hostname itself. It exists because a freshly created record can sit
 * behind a stale negative entry in the local resolver's cache for the zone's
 * SOA minimum, long after public resolvers answer correctly. It changes nothing
 * about the hosted behaviour under test, and every check that uses it is
 * re-run without it before the result is treated as final.
 */
import dns from 'node:dns'

// `HOSTED_HOST_IP` takes one or more comma-separated `hostname=address` pairs.
const raw = process.env.HOSTED_HOST_IP
export const hostOverrides = raw
  ? raw
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => ({ host: entry.split('=')[0], address: entry.split('=')[1] }))
  : []

if (hostOverrides.length > 0) {
  // Node's fetch resolves through `dns.lookup`, so one override covers it and
  // every other socket this process opens.
  const originalLookup = dns.lookup.bind(dns)
  const byHost = new Map(hostOverrides.map((entry) => [entry.host, entry.address]))
  dns.lookup = (hostname, options, callback) => {
    const address = byHost.get(hostname)
    if (address === undefined) return originalLookup(hostname, options, callback)
    const done = typeof options === 'function' ? options : callback
    const settings = typeof options === 'function' ? {} : (options ?? {})
    const family = address.includes(':') ? 6 : 4
    if (typeof settings === 'object' && settings.all) return done(null, [{ address, family }])
    return done(null, address, family)
  }
}

/** Chromium launch arguments that apply the same overrides, if any are set. */
export function browserResolverArguments() {
  if (hostOverrides.length === 0) return []
  const rules = hostOverrides.map((entry) => `MAP ${entry.host} ${entry.address}`).join(', ')
  return [`--host-resolver-rules=${rules}`]
}
