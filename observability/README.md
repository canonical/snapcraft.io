# Local Tracing for charmhub.io

This guide explains how to test OpenTelemetry traces locally using OpenTelemetry, Grafana and Tempo. 

*This setup is intended for local development and testing purposes only.*

## Overview

This setup enables observability for local development by capturing traces from the application and visualising them in Grafana, using Tempo as the backend.

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

`cd observability`
`docker compose up -d`

This starts the OpenTelemetry Collector, Grafana and Tempo containers for tracing.

### 3. Run the application

Back in the main terminal (in the root of the project), run `dotrun`

### 4. Generate traces

Interact with the application by visiting various pages such as:

- Homepage (list of charms)
- Charm pages
- Login page
- Publisher pages

These interactions will generate traces.

### 5. View traces in Grafana

Open Grafana in the browser at: http://localhost:3000

Login using the default credentials:

- Username: `admin`
- Password: `admin`

Then:
1. Go to `Explore`
2. The Tempo datasource should be selected
3. Click `Search`
4. You should see a list of trace IDs
5. Click on a trace ID to view detailed nested spans

### 6. Stop the observability stack
Once you're done testing, you can shut down the containers:
`cd observability`
`docker compose down`

