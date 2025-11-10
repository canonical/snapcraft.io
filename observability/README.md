# Local Observability for snapcraft.io

This guide explains how to test OpenTelemetry traces, metrics, and logs locally using OpenTelemetry, Grafana, Prometheus, Loki, and Tempo.

*This setup is intended for local development and testing purposes only.*

## Overview

This setup enables observability for local development by:
- Capturing traces from the application and visualizing them in Grafana using Tempo
- Collecting metrics with Prometheus and displaying them in Grafana dashboards
- Aggregating logs with Loki and making them searchable through Grafana

## Prerequisites

- Docker and Docker Compose installed
- A properly configured `.env` file

## Setup Instructions

### 1. Configure environment variables

In your `.env` file, make the following changes:

- Uncomment the appropriate `OTEL_EXPORTER_OTLP_ENDPOINT` based on your operating system.
- Uncomment `OTEL_SERVICE_NAME` to enable tracing.

### 2. Start observability stack

Open a new terminal window and run:

```bash
cd observability
docker compose up -d
```

This starts the following containers:
- **Grafana**: Visualization platform for metrics, logs, and traces
- **Prometheus**: Metrics collection and storage
- **Tempo**: Distributed tracing backend
- **Loki**: Log aggregation system
- **Promtail**: Log collector
- **OpenTelemetry Collector**: Receives and exports telemetry data
- **StatsD Exporter**: Converts StatsD metrics to Prometheus format

### 3. Run the application

Back in the main terminal (in the root of the project), run `dotrun`

### 4. Generate traces

Interact with the application by visiting various pages such as:

- Homepage (list of snaps)
- Snap detail pages
- Login page
- Publisher pages

These interactions will generate traces.

### 5. View observability data in Grafana

Open Grafana in the browser at: http://localhost:3000

Login using the default credentials:

- Username: `admin`
- Password: `admin`

#### Viewing Traces

1. Go to `Explore`
2. Select the **Tempo** datasource
3. Click `Search`
4. You should see a list of trace IDs
5. Click on a trace ID to view detailed nested spans

#### Viewing Metrics

1. Go to `Explore`
2. Select the **Prometheus** datasource
3. Use the query builder or type a PromQL query
4. View metrics from:
   - OpenTelemetry Collector (`otel_*` metrics)
   - Application metrics (via StatsD exporter)
   - Snap metadata completeness metrics (`snapcraft_*` metrics)
   - Publisher tool interaction metrics (`snapcraft_publisher_interactions_*`)
