"""
Enhanced logging configuration for Loki integration.

This module provides structured logging that works seamlessly with Loki.
Logs are output to stdout in JSON format, which Promtail can parse and send to Loki.
"""

import logging
import sys
import json
from datetime import datetime
from flask import has_request_context, request, g


class JSONFormatter(logging.Formatter):
    """
    Format logs as JSON for better parsing in Loki.
    """

    def format(self, record):
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }

        # Add request context if available
        if has_request_context():
            log_data['request'] = {
                'method': request.method,
                'path': request.path,
                'remote_addr': request.remote_addr,
                'user_agent': request.headers.get('User-Agent', ''),
            }

            # Add user info if available
            if hasattr(g, 'publisher') and g.publisher:
                log_data['publisher_id'] = getattr(g.publisher, 'id', None)

        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)

        # Add extra fields passed via extra={}
        standard_attrs = {
            'name', 'msg', 'args', 'created', 'filename', 'funcName',
            'levelname', 'levelno', 'lineno', 'module', 'msecs',
            'message', 'pathname', 'process', 'processName', 'relativeCreated',
            'thread', 'threadName', 'exc_info', 'exc_text', 'stack_info',
            'getMessage', 'asctime'
        }

        for key, value in record.__dict__.items():
            if key not in standard_attrs and not key.startswith('_'):
                log_data[key] = value

        return json.dumps(log_data)


def configure_logging(app, json_logs=True):
    """
    Configure application logging for Loki integration.

    Args:
        app: Flask application instance
        json_logs: If True, use JSON format; if False, use standard format
    """
    # Get log level from config or default to INFO
    log_level = app.config.get('LOG_LEVEL', 'INFO')

    # Create handler for stdout
    handler = logging.StreamHandler(sys.stdout)

    if json_logs:
        # Use JSON formatter for Loki
        formatter = JSONFormatter()
    else:
        # Use standard formatter for development
        formatter = logging.Formatter(
            '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
        )

    handler.setFormatter(formatter)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.addHandler(handler)

    # Configure Flask app logger
    app.logger.setLevel(log_level)
    app.logger.addHandler(handler)

    return app


def log_with_context(logger, level, message, **extra_fields):
    """
    Helper function to log with additional context fields.

    Usage:
        log_with_context(
            logger,
            'info',
            'User action completed',
            action_type='edit_listing',
            snap_name='my-snap'
        )
    """
    log_func = getattr(logger, level.lower())

    # Create a LogRecord with extra fields
    record = logger.makeRecord(
        logger.name,
        getattr(logging, level.upper()),
        "(unknown file)", 0, message, (), None
    )
    record.extra_fields = extra_fields

    # Log it
    logger.handle(record)
