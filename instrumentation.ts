export async function register() {
  // Only run in the Node.js runtime — the edge runtime doesn't support the
  // Node OTel SDK and doesn't need server-side tracing.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { setupTelemetry } = await import('./lib/telemetry')
    setupTelemetry()
  }
}
