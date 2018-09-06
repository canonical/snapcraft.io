import pycountry
from operator import itemgetter


def _calculate_colors(countries, max_users):
    """Calculate the displayed colors for a list of countries depending on the
    maximum number of users

    :param countries: List of countries
    :param max_users: Maximum of number users

    :returns: The list of countries with a calculated color for each
    """
    for country_code in countries:
        countries[country_code]["color_rgb"] = [
            _calculate_color(
                countries[country_code]["percentage_of_users"],
                max_users,
                8,
                229,
            ),
            _calculate_color(
                countries[country_code]["percentage_of_users"],
                max_users,
                64,
                245,
            ),
            _calculate_color(
                countries[country_code]["percentage_of_users"],
                max_users,
                129,
                223,
            ),
        ]

    return countries


def _calculate_color(thisCountry, maxCountry, maxColor, minColor):
    """Calculate displayed color for a given country

    :param thisCountry: The country
    :param maxCountry: The number of users of the country with
    the most users
    :param maxColor: The maximum color to reach
    :param minColor: The minimum color to reach

    :returns: The calculated color for the country
    """
    countryFactor = float(thisCountry) / maxCountry
    colorRange = maxColor - minColor

    return int(colorRange * countryFactor + minColor)


class Metric(object):
    """This is a basic class for metrics

    :var name: The name of the metric
    :var series: The series dictionary from the metric
    :var buckets: The buckets dictionary from the metric
    :var status: The status of the metric"""

    def __init__(self, name, series, buckets, status):
        self.name = name
        self.series = series
        self.buckets = buckets
        self.status = status

    def __iter__(self):
        yield ("name", self.name)
        yield ("series", self.series)
        yield ("buckets", self.buckets)

    def __bool__(self):
        """Verifies if one of the metrics has no data

        :return: True if the metric has data, False if not
        """

        return self.status == "OK"


class ActiveDevices(Metric):
    """Metrics for the active devices.

    By default the series will be sorted by name.

    :var name: The name of the metric
    :var series: The series dictionary from the metric
    :var buckets: The buckets dictionary from the metric
    :var status: The status of the metric"""

    def __init__(self, name, series, buckets, status):
        series_sorted = sorted(series, key=itemgetter("name"))

        super().__init__(name, series_sorted, buckets, status)

    def get_number_latest_active_devices(self):
        """Get the number of latest active devices from the list of active devices.

        :returns The number of lastest active devices
        """
        latest_active_devices = 0

        for series_index, series in enumerate(self.series):
            for index, value in enumerate(series["values"]):
                if value is None:
                    self.series[series_index]["values"][index] = 0
            values = series["values"]
            if len(values) == len(self.buckets):
                latest_active_devices += values[len(values) - 1]

        return latest_active_devices


class CountryDevices(Metric):
    """Metrics for the devices in countries.

    :var name: The name of the metric
    :var series: The series dictionary from the metric
    :var buckets: The buckets dictionary from the metric
    :var status: The status of the metric
    :var private: Boolean, True to add private information
    displayed for publisher, False if not
    :var users_by_country: Dictionary with additional metrics per country
    :var country_data: The metrics on every country"""

    def __init__(self, name, series, buckets, status, private):
        super().__init__(name, series, buckets, status)
        self.private = private
        self.users_by_country = self._calculate_metrics_countries()
        self.country_data = self._build_country_info()

    def get_number_territories(self):
        """Get the number of territories with users

        :returns The number of territories with users
        """
        territories_total = 0
        for data in self.country_data.values():
            if data["number_of_users"] > 0:
                territories_total += 1

        return territories_total

    def _calculate_metrics_countries(self):
        """Calculate metrics per countries:
        - Number of users
        - Percentage of users
        - Colors to display

        Output:
        ```
        {
          'FR': {
            'number_of_users': 1.125,
            'percentage_of_users': 0.1875,
            'color_rgb': [8, 64, 129]
          },
          ...
        }
        ```

        :returns: The transformed metrics
        """
        users_by_country = {}
        max_users = 0.0
        for country_counts in self.series:
            country_code = country_counts["name"]
            users_by_country[country_code] = {}
            counts = []
            for daily_count in country_counts["values"]:
                if daily_count is not None:
                    counts.append(daily_count)

            number_of_users = 0
            percentage_of_users = 0
            if len(counts) > 0:
                percentage_of_users = sum(counts) / len(counts)
                number_of_users = sum(counts)

            users_by_country[country_code]["number_of_users"] = number_of_users
            users_by_country[country_code][
                "percentage_of_users"
            ] = percentage_of_users

            if max_users < percentage_of_users:
                max_users = percentage_of_users

        metrics_countries = _calculate_colors(users_by_country, max_users)

        return metrics_countries

    def _build_country_info(self):
        """Build information for every country from a subset of information of
        country.

        Input:
        ```
        {
          'FR': {
            'number_of_users': 1.125,
            'percentage_of_users': 0.1875,
            'color_rgb': [8, 64, 129]
          },
          ...
        }
        ```

        :returns: A dictionary with the country information for every country
        """
        if not self.users_by_country:
            return {}

        country_data = {}
        for country in pycountry.countries:
            country_info = self.users_by_country.get(country.alpha_2)
            number_of_users = 0
            percentage_of_users = 0
            color_rgb = [247, 247, 247]
            if country_info is not None:
                if self.private:
                    number_of_users = country_info["number_of_users"] or 0
                percentage_of_users = country_info["percentage_of_users"] or 0
                color_rgb = country_info["color_rgb"] or [247, 247, 247]

            # Use common_name if available to be less political
            # offending (#310)
            try:
                country_name = country.common_name
            except AttributeError:
                country_name = country.name

            country_data[country.numeric] = {
                "name": country_name,
                "code": country.alpha_2,
                "percentage_of_users": percentage_of_users,
                "color_rgb": color_rgb,
            }

            if self.private:
                country_data[country.numeric][
                    "number_of_users"
                ] = number_of_users

        return country_data


class OsMetric(Metric):
    """Metrics for the devices per os.

    :var name: The name of the metric
    :var series: The series dictionary from the metric
    :var buckets: The buckets dictionary from the metric
    :var status: The status of the metric
    :var os: Dictionary with informations per os"""

    def __init__(self, name, series, buckets, status):
        super().__init__(name, series, buckets, status)

        self.os = self._build_os_info()

    def _build_os_info(self):
        """Build information for OS distro graph

        :returns: A list with the sorted distros
        """
        oses = []

        for distro in self.series:
            if distro["values"][0]:
                name = distro["name"].replace("/-", "")
                oses.append(
                    {
                        "name": name.replace("/", " "),
                        "value": distro["values"][-1],
                    }
                )

        oses.sort(key=lambda x: x["value"], reverse=True)

        return oses
