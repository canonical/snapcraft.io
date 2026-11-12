# Vendored Launchpad OpenID Teams extension

`teams.py` contains the consumer-side code used by snapcraft.io from
`django_openid_auth/teams.py` in **django-openid-auth 0.17** (released
2022-08-17). No Django integration is used or vendored.

## Source and license

- Upstream project: <https://launchpad.net/django-openid-auth>
- Published source archive:
  <https://files.pythonhosted.org/packages/e4/b4/c509da1bd2e4392ff71a93dc09cae1c96e394b5c7f24a963a2986293f6a4/django-openid-auth-0.17.tar.gz>
- Archive SHA-256:
  `ec882c8cdd190e9e42b0782f51b54688769957fa5a83a3ba287fcc2e3be66acb`
- Original `django_openid_auth/teams.py` SHA-256:
  `34d3833282b6776b839e63e9827a6afb1d18cf25af4dace57053d2c3602953a1`
- The original module's complete **BSD-2-Clause** copyright, conditions and
  disclaimer are retained at the top of `teams.py`: Copyright (C) 2008-2020
  Canonical Ltd. Retain that notice in source and binary distributions.

The standalone `python-openid-teams` package was considered, but its latest
PyPI release is 1.1 (2015-06-16), and its upstream repository's last push was
2018-06-19 at the time of investigation. It is not a maintained replacement
for the existing extension. Vendoring the existing code avoids changing the
SSO protocol or adding another dependency on Django.

## Local differences

Only namespace registration/lookup, `TeamsNamespaceError`, the request
constructor, `requestTeam`, `requestTeams`, `getExtensionArgs`, and the response
constructor, namespace lookup hook, `fromSuccessResponse`, `getExtensionArgs`
are retained. Unused server-side parsing, discovery helpers and convenience
methods are omitted. Documentation is shortened, the unnecessary Python 2
`unicode_literals` import is removed, and formatting follows the application.
The retained executable code has the same behavior as the upstream module.

In particular:

- The URI is `http://ns.launchpad.net/2007/openid-teams` and alias is `lp`.
  OpenID 1 namespace registration and OpenID 2 alternate aliases are preserved.
- Request teams are comma-separated, duplicate requests are ignored by default,
  and response membership is split on commas without normalization. An empty
  returned string remains `['']`; an absent field remains `[]`.
- `fromSuccessResponse` defaults to `signed_only=True`, using python3-openid's
  `SuccessResponse.getSignedNS`. All arguments in that extension namespace must
  be signed. The explicit upstream `signed_only=False` API is retained, but
  Flask-OpenID does not use it.
- Upstream fails closed with **TypeError** when `getSignedNS` returns `None`
  for unsigned or partially signed extension arguments. This causes a login
  callback HTTP 500 before establishing publisher state. That existing error
  behavior is deliberately preserved, not converted into empty membership.
  Friendlier rejection is a separate authentication-hardening change.
- Signature verification still belongs to python3-openid's consumer. The app
  remains stateless (`store_factory=lambda: None`) and asks the OpenID provider
  to verify the assertion via `check_authentication` before Flask-OpenID parses
  extension responses or calls `after_login`. This module must never be used
  to treat an unverified browser message as a successful assertion.

`tests/login/test_teams.py` keeps focused coverage for request serialization,
namespace lookup and rejection of unsigned or partially signed membership.
It uses OpenID's real `getSignedNS` implementation on already verified
assertions; signature verification remains the consumer's responsibility.
Existing login tests and staging Ubuntu SSO QA cover the integration.
