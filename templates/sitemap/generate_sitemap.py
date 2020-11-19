import requests
import jinja2
from dateutil import parser

def render(template_file, base_url, snaps, links, blog_posts):
    template_loader = jinja2.FileSystemLoader(".")
    jinja_env = jinja2.Environment(
        loader=template_loader, undefined=jinja2.StrictUndefined
    )

    template = jinja_env.get_template(template_file)

    return template.render(
        base_url=base_url,
        snaps=snaps,
        links=links,
        blog_posts=blog_posts
    )

open('sitemap.xml', 'w').close()

snaps = []
for page in range(34):
    url = f"https://api.snapcraft.io/api/v1/snaps/search?page={page}"

    response = requests.get(url)
    try:
        snaps_response = response.json()
    except Exception:
        print(e)
        continue

    for snap in snaps_response["_embedded"]["clickindex:package"]:
        try:
            last_udpated = parser.parse(snap["last_updated"]).replace(tzinfo=None).strftime("%Y-%m-%d")
            snaps.append(
                {
                    "name": snap["package_name"],
                    "last_udpated": last_udpated
                }
            )
        except Exception:
            print(e)
            continue



blog_posts = []
for page in range(1, 3):
    url = f"https://ubuntu.com/blog/wp-json/wp/v2/posts?tags=2996&per_page=100&page={page}&tags_exclude=3184%2C3265%2C3408"

    response = requests.get(url)
    try:
        blog_response = response.json()
    except Exception as e:
        print(e)
        continue

    for post in blog_response:
        try:
            date = parser.parse(post["date"]).replace(tzinfo=None).strftime("%Y-%m-%d")
            blog_posts.append(
                {
                    "slug": post["slug"],
                    "last_udpated": date
                }
            )
        except Exception as e:
            print(e)
            continue

links = [
    "/store",
    "/about",
    "/about/publish",
    "/about/listing",
    "/about/release",
    "/about/publicise",
    "/blog",
    "/iot",
    "/docs",
    "/tutorials",
]

xml_sitemap = render(
    "sitemap-template.xml",
    base_url="https://snapcraft.io",
    snaps=snaps,
    links=links,
    blog_posts=blog_posts,
)



text_file = open("sitemap.xml", "w")
n = text_file.write(xml_sitemap)
text_file.close()
