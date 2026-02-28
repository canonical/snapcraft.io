from os import getenv

import flask
import talisker

from canonicalwebteam.discourse import DiscourseAPI, TutorialParser, Tutorials

DISCOURSE_API_KEY = getenv("DISCOURSE_API_KEY")
DISCOURSE_API_USERNAME = getenv("DISCOURSE_API_USERNAME")


def init_tutorials(app, url_prefix):
    session = talisker.requests.get_session()
    tutorials_discourse = Tutorials(
        parser=TutorialParser(
            api=DiscourseAPI(
                base_url="https://forum.snapcraft.io/",
                session=session,
                api_key=DISCOURSE_API_KEY,
                api_username=DISCOURSE_API_USERNAME,
                get_topics_query_id=2,
            ),
            index_topic_id=15409,
            url_prefix=url_prefix,
        ),
        document_template="tutorials/tutorial.html",
        url_prefix=url_prefix,
        blueprint_name="tutorials",
    )

    @app.route(url_prefix)
    def index():
        tutorials_discourse.parser.parse()
        tutorials_discourse.parser.parse_topic(
            tutorials_discourse.parser.index_topic
        )

        tutorials = tutorials_discourse.parser.tutorials
        topic_list = []

        for item in tutorials:
            if item["categories"] not in topic_list:
                topic_list.append(item["categories"])
            item["categories"] = {
                "slug": item["categories"],
                "name": " ".join(
                    [
                        word.capitalize()
                        for word in item["categories"].split("-")
                    ]
                ),
            }

        topic_list.sort()
        topics = []

        for topic in topic_list:
            topics.append(
                {
                    "slug": topic,
                    "name": " ".join(
                        [word.capitalize() for word in topic.split("-")]
                    ),
                }
            )

        return flask.render_template(
            "tutorials/index.html",
            tutorials=tutorials,
            topics=topics,
        )

    tutorials_discourse.init_app(app)
