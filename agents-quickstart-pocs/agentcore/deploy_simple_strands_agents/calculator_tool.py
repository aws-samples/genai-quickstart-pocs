#!/usr/bin/env python3
"""
Calculator tool for the Strands calculator agent.

strands-agents-tools 0.9.0 removed its ``calculator`` tool. The Strands migration
guide (https://strandsagents.com/docs/user-guide/migrate/strands-agents-tools/)
points to the ``shell`` vended tool instead, which runs arbitrary commands. A
calculator agent does not need that power, so this sample keeps its own small
tool: expressions are parsed with ``ast`` and only arithmetic nodes, a fixed set
of ``math`` functions and a few constants are evaluated. Nothing is passed to
``eval`` or a shell.
"""

import ast
import math
import operator

from strands import tool

_BINARY_OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv: operator.floordiv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
}
_UNARY_OPS = {ast.UAdd: operator.pos, ast.USub: operator.neg}
_FUNCTIONS = {
    name: getattr(math, name)
    for name in (
        "sqrt", "cbrt", "exp", "log", "log10", "log2",
        "sin", "cos", "tan", "asin", "acos", "atan", "atan2",
        "sinh", "cosh", "tanh", "degrees", "radians",
        "floor", "ceil", "fabs", "factorial", "gcd", "hypot",
    )
    if hasattr(math, name)
}
_FUNCTIONS.update(abs=abs, round=round, min=min, max=max)
_CONSTANTS = {"pi": math.pi, "e": math.e, "tau": math.tau}

# Limits that keep a single expression from consuming unbounded CPU or memory.
_MAX_EXPRESSION_LENGTH = 500
_MAX_RESULT_BITS = 100_000
_MAX_FACTORIAL = 1_000


def _check_power(base, exponent):
    if isinstance(base, int) and isinstance(exponent, int) and exponent > 0:
        if max(base.bit_length(), 1) * exponent > _MAX_RESULT_BITS:
            raise ValueError("result would be too large")
    elif abs(exponent) > 10_000:
        raise ValueError("exponent too large")


def _evaluate_node(node):
    if isinstance(node, ast.Constant) and type(node.value) in (int, float):
        return node.value
    if isinstance(node, ast.Name) and node.id in _CONSTANTS:
        return _CONSTANTS[node.id]
    if isinstance(node, ast.BinOp) and type(node.op) in _BINARY_OPS:
        left = _evaluate_node(node.left)
        right = _evaluate_node(node.right)
        if isinstance(node.op, ast.Pow):
            _check_power(left, right)
        result = _BINARY_OPS[type(node.op)](left, right)
        if isinstance(result, int) and result.bit_length() > _MAX_RESULT_BITS:
            raise ValueError("result would be too large")
        return result
    if isinstance(node, ast.UnaryOp) and type(node.op) in _UNARY_OPS:
        return _UNARY_OPS[type(node.op)](_evaluate_node(node.operand))
    if (
        isinstance(node, ast.Call)
        and isinstance(node.func, ast.Name)
        and node.func.id in _FUNCTIONS
        and not node.keywords
    ):
        args = [_evaluate_node(arg) for arg in node.args]
        if node.func.id == "factorial" and (len(args) != 1 or args[0] > _MAX_FACTORIAL):
            raise ValueError(f"factorial is limited to integers up to {_MAX_FACTORIAL}")
        if node.func.id == "round" and len(args) == 2 and abs(args[1]) > 100:
            raise ValueError("round() accepts at most 100 digits")
        return _FUNCTIONS[node.func.id](*args)
    raise ValueError(f"unsupported expression element: {type(node).__name__}")


def evaluate(expression: str):
    """Evaluate an arithmetic expression and return the number."""
    if len(expression) > _MAX_EXPRESSION_LENGTH:
        raise ValueError(f"expression is longer than {_MAX_EXPRESSION_LENGTH} characters")
    return _evaluate_node(ast.parse(expression, mode="eval").body)


@tool
def calculator(expression: str) -> str:
    """Evaluate a mathematical expression and return the result.

    Supports +, -, *, /, // (floor division), % and ** (power), parentheses, the
    constants pi, e and tau, and these functions: sqrt, cbrt, exp, log, log10,
    log2, sin, cos, tan, asin, acos, atan, atan2, sinh, cosh, tanh, degrees,
    radians, floor, ceil, fabs, factorial, gcd, hypot, abs, round, min, max.
    Trigonometric functions use radians.

    Args:
        expression: The expression to evaluate, for example "sqrt(144) + 2**3".
    """
    try:
        return str(evaluate(expression))
    except (ValueError, SyntaxError, TypeError, ZeroDivisionError, OverflowError) as exc:
        return f"Error: could not evaluate {expression!r}: {exc}"
