"""Unit tests for the sample's calculator tool. They need no AWS access."""

import math
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from calculator_tool import calculator, evaluate  # noqa: E402


@pytest.mark.parametrize(
    "expression, expected",
    [
        ("2 + 3", 5),
        ("15 * 7 + 23", 128),
        ("sqrt(144)", 12.0),
        ("2 ** 10", 1024),
        ("-(4 - 10) / 3", 2.0),
        ("17 // 5 + 17 % 5", 5),
        ("round(sin(pi / 2), 6)", 1.0),
        ("log10(1000)", 3.0),
        ("factorial(5)", 120),
    ],
)
def test_evaluates_arithmetic(expression, expected):
    assert evaluate(expression) == pytest.approx(expected)


def test_constants():
    assert evaluate("tau / 2") == pytest.approx(math.pi)


@pytest.mark.parametrize(
    "expression",
    [
        "__import__('os').system('id')",
        "open('/etc/passwd')",
        "(1).__class__",
        "[x for x in range(3)]",
        "lambda: 1",
        "'abc' * 3",
        "True + 1",
        "sqrt(x=4)",
    ],
)
def test_rejects_non_arithmetic(expression):
    with pytest.raises((ValueError, SyntaxError)):
        evaluate(expression)


@pytest.mark.parametrize(
    "expression",
    ["9 ** 9 ** 9", "factorial(100000)", "round(5, -1000000000)", "1" * 501],
)
def test_rejects_expensive_expressions(expression):
    with pytest.raises(ValueError):
        evaluate(expression)


def test_tool_returns_errors_as_text():
    assert calculator(expression="1 / 0").startswith("Error:")
    assert calculator(expression="2 + 2") == "4"
