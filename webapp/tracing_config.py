"""
OpenTelemetry tracing configuration for Tempo integration.

This module configures distributed tracing for the Flask application,
allowing you to track requests across services and correlate with logs.
"""

import os
import logging
from functools import wraps

logger = logging.getLogger(__name__)


def configure_tracing(app):
    """
    Configure OpenTelemetry tracing for the Flask application.

    Args:
        app: Flask application instance
    """
    # Only enable tracing if OTEL_EXPORTER_OTLP_ENDPOINT is set
    otlp_endpoint = os.getenv('OTEL_EXPORTER_OTLP_ENDPOINT')
    if not otlp_endpoint:
        app.logger.info("Tracing disabled: OTEL_EXPORTER_OTLP_ENDPOINT not set")
        return

    try:
        from opentelemetry import trace
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
        from opentelemetry.sdk.resources import Resource, SERVICE_NAME
        from opentelemetry.instrumentation.flask import FlaskInstrumentor
        from opentelemetry.instrumentation.requests import RequestsInstrumentor
    except ImportError:
        app.logger.warning(
            "OpenTelemetry packages not installed. "
            "Run: pip install opentelemetry-api opentelemetry-sdk "
            "opentelemetry-instrumentation-flask opentelemetry-exporter-otlp-proto-http"
        )
        return

    service_name = os.getenv('OTEL_SERVICE_NAME', 'snapcraft-io')

    # Create resource with service name
    resource = Resource(attributes={
        SERVICE_NAME: service_name,
        "service.version": "1.0.0",
        "deployment.environment": os.getenv('ENVIRONMENT', 'development')
    })

    # Create tracer provider
    provider = TracerProvider(resource=resource)

    # Configure OTLP exporter
    otlp_exporter = OTLPSpanExporter(
        endpoint=f"{otlp_endpoint}/v1/traces",
        timeout=5  # seconds
    )

    # Add span processor
    processor = BatchSpanProcessor(otlp_exporter)
    provider.add_span_processor(processor)

    # Set as global tracer provider
    trace.set_tracer_provider(provider)

    # Auto-instrument Flask
    FlaskInstrumentor().instrument_app(app)

    # Auto-instrument requests library (for external API calls)
    RequestsInstrumentor().instrument()

    app.logger.info(f"Tracing enabled: sending traces to {otlp_endpoint}")


def get_tracer(name: str):
    """
    Get a tracer instance for manual instrumentation.

    Args:
        name: Name of the tracer (usually module name)

    Returns:
        Tracer instance or None if tracing not enabled
    """
    try:
        from opentelemetry import trace
        return trace.get_tracer(name)
    except ImportError:
        return None


def get_current_trace_id():
    """
    Get the current trace ID as a hex string.

    Returns:
        Trace ID string or None if no active span
    """
    try:
        from opentelemetry import trace
        span = trace.get_current_span()
        if span and span.get_span_context().is_valid:
            return format(span.get_span_context().trace_id, '032x')
    except (ImportError, Exception):
        pass
    return None


def add_span_attributes(**attributes):
    """
    Add attributes to the current span.

    Usage:
        add_span_attributes(
            publisher_hash="abc123",
            action_type="edit_listing"
        )
    """
    try:
        from opentelemetry import trace
        span = trace.get_current_span()
        if span:
            for key, value in attributes.items():
                span.set_attribute(key, str(value))
    except (ImportError, Exception) as e:
        logger.debug(f"Could not add span attributes: {e}")


def create_span(name: str, **attributes):
    """
    Decorator to create a span for a function.

    Usage:
        @create_span("process_listing", operation="update")
        def process_listing(snap_name):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            tracer = get_tracer(__name__)
            if not tracer:
                # Tracing not enabled, just execute function
                return func(*args, **kwargs)

            with tracer.start_as_current_span(name) as span:
                # Add attributes
                for key, value in attributes.items():
                    span.set_attribute(key, str(value))

                # Execute function
                try:
                    result = func(*args, **kwargs)
                    span.set_attribute("result.status", "success")
                    return result
                except Exception as e:
                    span.set_attribute("result.status", "error")
                    span.set_attribute("error.message", str(e))
                    span.record_exception(e)
                    raise

        return wrapper
    return decorator
