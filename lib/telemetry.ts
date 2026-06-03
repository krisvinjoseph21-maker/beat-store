import { NodeSDK } from '@opentelemetry/sdk-node'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_DEPLOYMENT_ENVIRONMENT } from '@opentelemetry/semantic-conventions'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { ConsoleSpanExporter, SimpleSpanProcessor, BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'

export function setupTelemetry() {
  const resource = resourceFromAttributes({
    [SEMRESATTRS_SERVICE_NAME]: 'kjyoucrazy',
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV ?? 'development',
  })

  // In development, print spans to stdout so they're visible without an external backend.
  // In production, export via OTLP HTTP to whatever endpoint is configured
  // (Jaeger, Grafana Tempo, Honeycomb, Datadog, etc.).
  const exporter = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    ? new OTLPTraceExporter({ url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT })
    : new ConsoleSpanExporter()

  const processor = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    ? new BatchSpanProcessor(exporter)
    : new SimpleSpanProcessor(exporter)

  const sdk = new NodeSDK({ resource, spanProcessors: [processor] })
  sdk.start()
}
