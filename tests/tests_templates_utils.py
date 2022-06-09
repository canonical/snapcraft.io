import unittest

from webapp import template_utils


class TemplateUtilsTest(unittest.TestCase):
    def test_generate_slug(self):
        result = template_utils.generate_slug("/snaps")
        self.assertEqual(result, "account")

        result = template_utils.generate_slug("/listing")
        self.assertEqual(result, "account")

        result = template_utils.generate_slug("/releases")
        self.assertEqual(result, "account")

        result = template_utils.generate_slug("/publicise")
        self.assertEqual(result, "account")

        result = template_utils.generate_slug("/publicise/badges")
        self.assertEqual(result, "account")

        result = template_utils.generate_slug("/publicise/cards")
        self.assertEqual(result, "account")

        result = template_utils.generate_slug("/settings")
        self.assertEqual(result, "account")

        result = template_utils.generate_slug("/account/details")
        self.assertEqual(result, "account")

        result = template_utils.generate_slug("/")
        self.assertEqual(result, "home")

        result = template_utils.generate_slug("/first-snap")
        self.assertEqual(result, "home")

        result = template_utils.generate_slug("/build")
        self.assertEqual(result, "build")

        result = template_utils.generate_slug("/blog")
        self.assertEqual(result, "blog")

        result = template_utils.generate_slug("/iot")
        self.assertEqual(result, "iot")

        result = template_utils.generate_slug("/any-route")
        self.assertEqual(result, "store")

    def test_contains(self):
        result = template_utils.contains(["item1", "item2"], "item1")
        self.assertTrue(result)

        result = template_utils.contains(["item1", "item2"], "item3")
        self.assertFalse(result)

    def test_format_number(self):
        result = template_utils.format_number(1)
        self.assertTrue(isinstance(result, str))

        result = template_utils.format_number(10000)
        self.assertTrue(result, "10,000")

    def test_install_snippet(self):

        result = template_utils.install_snippet(
            "spotify", "latest", "stable", ""
        )
        self.assertTrue(result, "sudo snap install spotify")

    def test_install_snippet_with_classic(self):
        result = template_utils.install_snippet(
            "skype", "latest", "stable", "classic"
        )
        self.assertTrue(result, "sudo snap install skype --classic")

    def test_install_snippet_with_non_stable_risk_level(self):
        result = template_utils.install_snippet("test", "latest", "edge", "")
        self.assertTrue(result, "sudo snap install test --edge")

    def test_display_name(self):
        result = template_utils.display_name("Toto", "toto")
        self.assertEqual(result, "Toto")

        result = template_utils.display_name("Toto", "username")
        self.assertEqual(result, "Toto (username)")

    def test_join(self):
        result = template_utils.join(["item1", "item2"], "-")
        self.assertEqual(result, "item1-item2")

    def test_static_url_no_file(self):
        result = template_utils.static_url("url")
        self.assertEqual(result, "/static/url")

    def test_static_url(self):
        result = template_utils.static_url("images/rocket.png")
        self.assertEqual(result, "/static/images/rocket.png?v=7d7c26f")

    def test_format_date(self):
        result = template_utils.format_date(
            "2019-09-02T09:27:58.930567+00:00", "%d %B %Y"
        )
        self.assertEquals(result, "02 September 2019")

    def test_format_member_role(self):
        result = template_utils.format_member_role("admin")
        self.assertEquals(result, "admin")

        result = template_utils.format_member_role("review")
        self.assertEquals(result, "reviewer")

        result = template_utils.format_member_role("view")
        self.assertEquals(result, "viewer")

        result = template_utils.format_member_role("access")
        self.assertEquals(result, "publisher")

    def test_format_link(self):
        result = template_utils.format_link("mailto:hello@example.com")
        self.assertEquals(result, "hello@example.com")

        result = template_utils.format_link("https://example.com")
        self.assertEquals(result, "example.com")

        result = template_utils.format_link("http://example.com")
        self.assertEquals(result, "example.com")

        result = template_utils.format_link("https://example.com/")
        self.assertEquals(result, "example.com")

        result = template_utils.format_link("http://example.com/")
        self.assertEquals(result, "example.com")

        result = template_utils.format_link("https://example.com/path")
        self.assertEquals(result, "example.com")

        result = template_utils.format_link("http://example.com/path")
        self.assertEquals(result, "example.com")

        result = template_utils.format_link("https://example.com/path/")
        self.assertEquals(result, "example.com")

        result = template_utils.format_link("http://example.com/path/")
        self.assertEquals(result, "example.com")

        result = template_utils.format_link("https://example.com/path/path")
        self.assertEquals(result, "example.com")

        result = template_utils.format_link("http://example.com/path/path")
        self.assertEquals(result, "example.com")

        result = template_utils.format_link("https://example.com/path/path/")
        self.assertEquals(result, "example.com")

        result = template_utils.format_link("http://example.com/path/path/")
        self.assertEquals(result, "example.com")

        result = template_utils.format_link("https://example.com?foo=bar")
        self.assertEquals(result, "example.com")

        result = template_utils.format_link("http://example.com?foo=bar")
        self.assertEquals(result, "example.com")

        result = template_utils.format_link("https://example.com/?foo=bar")
        self.assertEquals(result, "example.com")

        result = template_utils.format_link("http://example.com/?foo=bar")
        self.assertEquals(result, "example.com")

        result = template_utils.format_link(
            "https://example.com?foo=bar&bar=foo"
        )
        self.assertEquals(result, "example.com")

        result = template_utils.format_link(
            "http://example.com?foo=bar&bar=foo"
        )
        self.assertEquals(result, "example.com")

        result = template_utils.format_link(
            "https://example.com/?foo=bar&bar=foo"
        )
        self.assertEquals(result, "example.com")

        result = template_utils.format_link(
            "http://example.com/?foo=bar&bar=foo"
        )
        self.assertEquals(result, "example.com")

        result = template_utils.format_link("https://example.com/path?foo=bar")
        self.assertEquals(result, "example.com")

        result = template_utils.format_link("http://example.com/path?foo=bar")
        self.assertEquals(result, "example.com")

        result = template_utils.format_link(
            "https://example.com/path/?foo=bar"
        )
        self.assertEquals(result, "example.com")

        result = template_utils.format_link("http://example.com/path/?foo=bar")
        self.assertEquals(result, "example.com")

        result = template_utils.format_link(
            "https://example.com/path/path?foo=bar"
        )
        self.assertEquals(result, "example.com")

        result = template_utils.format_link(
            "http://example.com/path/path?foo=bar"
        )
        self.assertEquals(result, "example.com")

        result = template_utils.format_link(
            "https://example.com/path/path/?foo=bar"
        )
        self.assertEquals(result, "example.com")

        result = template_utils.format_link(
            "http://example.com/path/path/?foo=bar"
        )
        self.assertEquals(result, "example.com")

        result = template_utils.format_link("https://example.com/path?foo=bar")
        self.assertEquals(result, "example.com")

        result = template_utils.format_link("http://example.com/path?foo=bar")
        self.assertEquals(result, "example.com")

        result = template_utils.format_link(
            "https://example.com/path/?foo=bar"
        )
        self.assertEquals(result, "example.com")

        result = template_utils.format_link(
            "http://example.com/path/?foo=bar&bar=foo"
        )
        self.assertEquals(result, "example.com")

        result = template_utils.format_link(
            "https://example.com/path/path?foo=bar&bar=foo"
        )
        self.assertEquals(result, "example.com")

        result = template_utils.format_link(
            "http://example.com/path/path?foo=bar&bar=foo"
        )
        self.assertEquals(result, "example.com")

        result = template_utils.format_link(
            "https://example.com/path/path/?foo=bar&bar=foo"
        )
        self.assertEquals(result, "example.com")

        result = template_utils.format_link(
            "http://example.com/path/path/?foo=bar&bar=foo"
        )
        self.assertEquals(result, "example.com")
