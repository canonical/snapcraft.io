from __future__ import absolute_import, unicode_literals

from webapp.exceptions import ValidationError

import unittest
from webapp.spdx import (
    get_spdx_license_symbols,
    is_spdx_or_only_expression,
    validate_spdx_license_expression,
)


class SPDXTestCase(unittest.TestCase):

    def test_validate_expression_with_single_license(self):
        licenses = 'MIT'
        expr = validate_spdx_license_expression(licenses)
        self.assertEqual(expr, 'MIT')

    def test_validate_expression_with_multiple_licenses(self):
        licenses = 'CC-BY-2.0 OR (GPL-3.0 AND MIT)'
        expr = validate_spdx_license_expression(licenses)
        self.assertEqual(expr, 'CC-BY-2.0 OR (GPL-3.0 AND MIT)')

    def test_validate_expression_with_invalid_licenses(self):
        licenses = 'MIT OR Some-other-license'
        with self.assertRaises(ValidationError) as ctx:
            validate_spdx_license_expression(licenses)
        self.assertEqual(
            str(ctx.exception),
            'Unknown license key(s): Some-other-license')

    def test_validate_expression_with_invalid_syntax(self):
        licenses = 'MIT WITH OR'
        with self.assertRaises(ValidationError) as ctx:
            validate_spdx_license_expression(licenses)
        self.assertEqual(
            str(ctx.exception),
            'Invalid expression for token: "WITH" at position: 4')

    def test_validate_expression_with_custom_licenses(self):
        licenses = 'Proprietary OR Other Open Source'
        expr = validate_spdx_license_expression(licenses)
        self.assertEqual(expr, 'Other Open Source OR Proprietary')

    def test_validate_empty_expression(self):
        licenses = ''
        expr = validate_spdx_license_expression(licenses)
        self.assertEqual(expr, '')

    def test_validate_expression_with_deprecated_or_later_versions(self):
        data = ['AGPL-3.0+', 'GPL-2.0+', 'GPL-3.0+', 'LGPL-2.1+', 'LGPL-3.0+']
        for id_ in data:
            expr = validate_spdx_license_expression(id_)
            self.assertEqual(expr, id_)

    def test_get_license_symbols_from_expression_with_single_license(self):
        expr = 'MIT'
        licenses = get_spdx_license_symbols(expr)
        self.assertEqual([l.key for l in licenses], ['MIT'])

    def test_get_license_symbols_from_expression_with_multiple_licenses(self):
        expr = 'CC-BY-2.0 OR GPL-3.0 OR MIT'
        licenses = get_spdx_license_symbols(expr)
        self.assertEqual(
            [l.key for l in licenses], ['CC-BY-2.0', 'GPL-3.0', 'MIT'])

    def test_get_license_symbols_from_expression_with_custom_licenses(self):
        expr = 'Other Open Source OR Proprietary'
        licenses = get_spdx_license_symbols(expr)
        self.assertEqual(
            [l.key for l in licenses], ['Other Open Source', 'Proprietary'])

    def test_get_license_symbols_from_empty_expression(self):
        expr = ''
        licenses = get_spdx_license_symbols(expr)
        self.assertEqual(list(licenses), [])

    def test_is_spdx_or_only_expression_equivalent(self):
        expressions = (
            'MIT OR CC-BY-2.0', '(MIT OR CC-BY-2.0) OR CC-BY-1.0', 'MIT')
        for expr in expressions:
            self.assertTrue(is_spdx_or_only_expression(expr))

    def test_is_spdx_or_only_expression_not_equivalent(self):
        expressions = ('MIT AND CC-BY-2.0', '(MIT AND CC-BY-2.0) OR CC-BY-1.0')
        for expr in expressions:
            self.assertFalse(is_spdx_or_only_expression(expr))

    def test_is_spdx_or_only_expression_errors_not_equivalent(self):
        expressions = ('MIT AND', '(MIT AND CC-BY-2.0)) OR CC-BY-1.0')
        for expr in expressions:
            self.assertFalse(is_spdx_or_only_expression(expr))

    def test_snapd_spdx_valid_expressions(self):
        expressions = [
            "GPL-2.0",
            "GPL-2.0+",
            "GPL-2.0 AND BSD-2-Clause",
            "GPL-2.0 OR BSD-2-Clause",
            "GPL-2.0 WITH GCC-exception-3.1",
            "(GPL-2.0 AND BSD-2-Clause)",
            "GPL-2.0 AND (BSD-2-Clause OR 0BSD)",
            "(BSD-2-Clause OR 0BSD) AND GPL-2.0 WITH GCC-exception-3.1",
            "((GPL-2.0 AND (BSD-2-Clause OR 0BSD)) OR GPL-3.0) ",
        ]
        for expression in expressions:
            validate_spdx_license_expression(expression)

    def test_snapd_spdx_invalid_expressions(self):
        expressions = [
            "GPL-3.0 AND ()",
            "()",
            "FOO",
            "GPL-3.0 xxx",
            "GPL-2.0 GPL-3.0",
            "(GPL-2.0))",
            "(GPL-2.0",
            "OR",
            "OR GPL-2.0",
            "GPL-2.0 OR",
            "GPL-2.0 WITH BAR",
            "GPL-2.0 WITH (foo)",
            "(BSD-2-Clause OR 0BSD) WITH GCC-exception-3.1",
        ]
        for expression in expressions:
            with self.assertRaises(ValidationError):
                validate_spdx_license_expression(expression)
