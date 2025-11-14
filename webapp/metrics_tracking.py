"""
Publisher metrics-to-action tracking using StatsD.

This module provides functionality to track whether viewing publisher metrics
influences publisher behavior (i.e., taking actions after viewing metrics).

Key metrics tracked:
- When publishers view their metrics
- What actions publishers take after viewing metrics
- Time between viewing metrics and taking action
- Conversion rate (metrics view -> action)
"""

import os
import time
import hashlib
import functools
import logging
from typing import Callable
import statsd
from flask import session
from webapp.tracing_config import get_current_trace_id, add_span_attributes


logger = logging.getLogger(__name__)

STATSD_HOST = os.getenv('STATSD_HOST', 'host.docker.internal')
STATSD_PORT = int(os.getenv('STATSD_PORT', '9125'))
STATSD_PREFIX = os.getenv('STATSD_PREFIX', 'snapcraft')

# Attribution window: how long after viewing metrics do we attribute actions?
# Default: 5 minutes (300 seconds) => for testing purposes its 15secs
METRICS_ATTRIBUTION_WINDOW_SECONDS = int(
    os.getenv('METRICS_ATTRIBUTION_WINDOW_SECONDS', '15')
)

statsd_client = statsd.StatsClient(
    host=STATSD_HOST,
    port=STATSD_PORT,
    prefix=STATSD_PREFIX
)


def _get_publisher_hash() -> str:
    try:
        from flask import session
        if session.get('publisher') and session['publisher'].get('email'):
            publisher_email = session['publisher']['email']
            return hashlib.sha256(publisher_email.encode()).hexdigest()[:16]
    except Exception:
        pass
    return ""


def mark_metrics_viewed():
    """
    Mark that the publisher has viewed their metrics.

    This function should be called when a publisher accesses their metrics
    dashboard. It stores the timestamp in the session and sends a metric
    to StatsD.

    This creates the start of the conversion funnel:
    View Metrics -> Take Action
    """
    try:
        publisher_hash = _get_publisher_hash()
        trace_id = get_current_trace_id()

        session['last_metrics_view_time'] = time.time()
        statsd_client.incr('publisher.funnel.metrics_viewed')

        # Add attributes to current span
        add_span_attributes(
            event='metrics_viewed',
            publisher_hash=publisher_hash
        )

        logger.info(
            "Publisher viewed metrics",
            extra={
                'event': 'metrics_viewed',
                'publisher_hash': publisher_hash,
                'timestamp': time.time(),
                'trace_id': trace_id
            }
        )

    except Exception as e:
        logger.error(f"Error in mark_metrics_viewed(): {e}", exc_info=True)


def track_metrics_to_action_flow(action_type: str) -> Callable:
    """
    Decorator to track publisher actions and their correlation with metrics viewing.

    This decorator tracks:
    1. That an action was taken (regardless of metrics viewing)
    2. Whether the action was taken after recently viewing metrics (conversion)
    3. Time elapsed between viewing metrics and taking action

    Metrics emitted:
        - publisher.action - Total actions
        - publisher.conversion.metrics_to_action - Actions after viewing metrics
        - publisher.conversion.time_to_action - Time from metrics to action
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            try:

                publisher_hash = _get_publisher_hash()
                trace_id = get_current_trace_id()
                statsd_client.incr('publisher.action')

                add_span_attributes(
                    action_type=action_type,
                    publisher_hash=publisher_hash
                )

                last_metrics_view = session.get('last_metrics_view_time')

                if last_metrics_view:
                    time_since_metrics_view = time.time() - last_metrics_view

                    if time_since_metrics_view < METRICS_ATTRIBUTION_WINDOW_SECONDS:
                        statsd_client.incr(
                            f'publisher.conversion.metrics_to_action'
                        )

                        statsd_client.timing(
                            f'publisher.conversion.time_to_action',
                            int(time_since_metrics_view * 1000)
                        )

                        add_span_attributes(
                            event='conversion',
                            time_to_action_seconds=time_since_metrics_view
                        )

                        logger.info(
                            "Publisher action converted from metrics view",
                            extra={
                                'event': 'conversion',
                                'action_type': action_type,
                                'publisher_hash': publisher_hash,
                                'time_to_action_seconds': time_since_metrics_view,
                                'within_attribution_window': True,
                                'trace_id': trace_id
                            }
                        )

                    else:
                        logger.info(
                            "Action outside attribution window",
                            extra={
                                'event': 'action_no_conversion',
                                'action_type': action_type,
                                'publisher_hash': publisher_hash,
                                'time_since_metrics_view': time_since_metrics_view,
                                'attribution_window': METRICS_ATTRIBUTION_WINDOW_SECONDS,
                                'within_attribution_window': False
                            }
                        )
                else:
                    logger.info(
                        "Publisher action without metrics view",
                        extra={
                            'event': 'action_no_metrics_view',
                            'action_type': action_type,
                            'publisher_hash': publisher_hash,
                            'within_attribution_window': False
                        }
                    )

            except Exception as e:
                logger.error(f"Error in track_metrics_to_action_flow: {e}", exc_info=True)

            return func(*args, **kwargs)

        return wrapper
    return decorator


def track_custom_event(event_name: str, value: int = 1):
    try:
        statsd_client.incr(f'publisher.events.{event_name}', value)
    except Exception:
        pass


def track_timing(metric_name: str, milliseconds: int):
    try:
        statsd_client.timing(f'publisher.timing.{metric_name}', milliseconds)
    except Exception:
        pass
