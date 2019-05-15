from datetime import datetime, timedelta

from webapp import helpers


def get_livestreams():
    """
    Get available livestreams and decide whether they should be shown
    :returns: Dictionary of livestream details
    """
    livestream_to_show = None
    livestreams = helpers.get_livestreams()

    if livestreams:
        now = datetime.now()
        lead_time = 4  # 4 days
        cooldown_time = 2  # 2 days

        for livestream in livestreams:
            instance_lead_time = lead_time
            if "lead_time" in livestream:
                instance_lead_time = livestream["lead_time"]

            instance_cooldown_time = cooldown_time
            if "cooldown_time" in livestream:
                instance_cooldown_time = livestream["cooldown_time"]

            show_from = livestream["time"] - timedelta(days=instance_lead_time)
            show_until = livestream["time"] + timedelta(
                days=instance_cooldown_time
            )

            if show_from < now and show_until > now:
                livestream_to_show = livestream

    return livestream_to_show
