from enum import Enum
from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Set, Tuple, Union

from langchain_aws.utilities.redis import TokenEscaper

# disable mypy error for dunder method overrides
# mypy: disable-error-code="override"


class InMemoryDBFilterOperator(Enum):
    """InMemoryDBFilterOperator enumerator is used to create
    InMemoryDBFilterExpressions"""

    EQ = 1
    NE = 2
    LT = 3
    GT = 4
    LE = 5
    GE = 6
    OR = 7
    AND = 8
    LIKE = 9
    IN = 10


class InMemoryDBFilter:
    """Collection of InMemoryDBFilterFields."""

    @staticmethod
    def text(field: str) -> "InMemoryDBText":
        return InMemoryDBText(field)

    @staticmethod
    def num(field: str) -> "InMemoryDBNum":
        return InMemoryDBNum(field)

    @staticmethod
    def tag(field: str) -> "InMemoryDBTag":
        return InMemoryDBTag(field)


class InMemoryDBFilterField:
    """Base class for InMemoryDBFilterFields."""

    escaper: "TokenEscaper" = TokenEscaper()
    OPERATORS: Dict[InMemoryDBFilterOperator, str] = {}

    def __init__(self, field: str):
        self._field = field
        self._value: Any = None
        self._operator: InMemoryDBFilterOperator = InMemoryDBFilterOperator.EQ

    def equals(self, other: "InMemoryDBFilterField") -> bool:
        if not isinstance(other, type(self)):
            return False
        return self._field == other._field and self._value == other._value

    def _set_value(
        self, val: Any, val_type: Tuple[Any], operator: InMemoryDBFilterOperator
    ) -> None:
        # check that the operator is supported by this class
        if operator not in self.OPERATORS:
            raise ValueError(
                f"Operator {operator} not supported by {self.__class__.__name__}. "
                + f"Supported operators are {self.OPERATORS.values()}."
            )

        if not isinstance(val, val_type):
            raise TypeError(
                f"Right side argument passed to operator {self.OPERATORS[operator]} "
                f"with left side "
                f"argument {self.__class__.__name__} must be of type {val_type}, "
                f"received value {val}"
            )
        self._value = val
        self._operator = operator


def check_operator_misuse(func: Callable) -> Callable:
    """Decorator to check for misuse of equality operators."""

    @wraps(func)
    def wrapper(instance: Any, *args: Any, **kwargs: Any) -> Any:
        # Extracting 'other' from positional arguments or keyword arguments
        other = kwargs.get("other") if "other" in kwargs else None
        if not other:
            for arg in args:
                if isinstance(arg, type(instance)):
                    other = arg
                    break

        if isinstance(other, type(instance)):
            raise ValueError(
                "Equality operators are overridden for FilterExpression creation. Use "
                ".equals() for equality checks"
            )
        return func(instance, *args, **kwargs)

    return wrapper


class InMemoryDBTag(InMemoryDBFilterField):
    """InMemoryDBFilterField representing a tag in a InMemoryDB index."""

    OPERATORS: Dict[InMemoryDBFilterOperator, str] = {
        InMemoryDBFilterOperator.EQ: "==",
        InMemoryDBFilterOperator.NE: "!=",
        InMemoryDBFilterOperator.IN: "==",
    }
    OPERATOR_MAP: Dict[InMemoryDBFilterOperator, str] = {
        InMemoryDBFilterOperator.EQ: "@%s:{%s}",
        InMemoryDBFilterOperator.NE: "(-@%s:{%s})",
        InMemoryDBFilterOperator.IN: "@%s:{%s}",
    }
    SUPPORTED_VAL_TYPES = (list, set, tuple, str, type(None))

    def __init__(self, field: str):
        """Create a InMemoryDBTag FilterField.

        Args:
            field (str): The name of the InMemoryDBTag field in the index to be queried
                against.
        """
        super().__init__(field)

    def _set_tag_value(
        self,
        other: Union[List[str], Set[str], Tuple[str], str],
        operator: InMemoryDBFilterOperator,
    ) -> None:
        if isinstance(other, (list, set, tuple)):
            try:
                # "if val" clause removes non-truthy values from list
                other = [str(val) for val in other if val]
            except ValueError:
                raise ValueError("All tags within collection must be strings")
        # above to catch the "" case
        elif not other:
            other = []
        elif isinstance(other, str):
            other = [other]

        self._set_value(other, self.SUPPORTED_VAL_TYPES, operator)  # type: ignore

    @check_operator_misuse
    def __eq__(
        self, other: Union[List[str], Set[str], Tuple[str], str]
    ) -> "InMemoryDBFilterExpression":
        """Create a InMemoryDBTag equality filter expression.

        Args:
            other (Union[List[str], Set[str], Tuple[str], str]):
                The tag(s) to filter on.

        Example:
            >>> from langchain_community.vectorstores.InMemoryDB import InMemoryDBTag
            >>> filter = InMemoryDBTag("brand") == "nike"
        """
        self._set_tag_value(other, InMemoryDBFilterOperator.EQ)
        return InMemoryDBFilterExpression(str(self))

    @check_operator_misuse
    def __ne__(
        self, other: Union[List[str], Set[str], Tuple[str], str]
    ) -> "InMemoryDBFilterExpression":
        """Create a InMemoryDBTag inequality filter expression.

        Args:
            other (Union[List[str], Set[str], Tuple[str], str]):
                The tag(s) to filter on.

        Example:
            >>> from langchain_community.vectorstores.InMemoryDB import InMemoryDBTag
            >>> filter = InMemoryDBTag("brand") != "nike"
        """
        self._set_tag_value(other, InMemoryDBFilterOperator.NE)
        return InMemoryDBFilterExpression(str(self))

    @property
    def _formatted_tag_value(self) -> str:
        return "|".join([self.escaper.escape(tag) for tag in self._value])

    def __str__(self) -> str:
        """Return the query syntax for a InMemoryDBTag filter expression."""
        if not self._value:
            return "*"

        return self.OPERATOR_MAP[self._operator] % (
            self._field,
            self._formatted_tag_value,
        )


class InMemoryDBNum(InMemoryDBFilterField):
    """InMemoryDBFilterField representing a numeric field in a InMemoryDB index."""

    OPERATORS: Dict[InMemoryDBFilterOperator, str] = {
        InMemoryDBFilterOperator.EQ: "==",
        InMemoryDBFilterOperator.NE: "!=",
        InMemoryDBFilterOperator.LT: "<",
        InMemoryDBFilterOperator.GT: ">",
        InMemoryDBFilterOperator.LE: "<=",
        InMemoryDBFilterOperator.GE: ">=",
    }
    OPERATOR_MAP: Dict[InMemoryDBFilterOperator, str] = {
        InMemoryDBFilterOperator.EQ: "@%s:[%s %s]",
        InMemoryDBFilterOperator.NE: "(-@%s:[%s %s])",
        InMemoryDBFilterOperator.GT: "@%s:[(%s +inf]",
        InMemoryDBFilterOperator.LT: "@%s:[-inf (%s]",
        InMemoryDBFilterOperator.GE: "@%s:[%s +inf]",
        InMemoryDBFilterOperator.LE: "@%s:[-inf %s]",
    }
    SUPPORTED_VAL_TYPES = (int, float, type(None))

    def __str__(self) -> str:
        """Return the query syntax for a InMemoryDBNum filter expression."""
        if self._value is None:
            return "*"

        if (
            self._operator == InMemoryDBFilterOperator.EQ
            or self._operator == InMemoryDBFilterOperator.NE
        ):
            return self.OPERATOR_MAP[self._operator] % (
                self._field,
                self._value,
                self._value,
            )
        else:
            return self.OPERATOR_MAP[self._operator] % (self._field, self._value)

    @check_operator_misuse
    def __eq__(self, other: Union[int, float]) -> "InMemoryDBFilterExpression":
        """Create a Numeric equality filter expression.

        Args:
            other (Union[int, float]): The value to filter on.

        Example:
            >>> from langchain_community.vectorstores.InMemoryDB import InMemoryDBNum
            >>> filter = InMemoryDBNum("zipcode") == 90210
        """
        self._set_value(other, self.SUPPORTED_VAL_TYPES, InMemoryDBFilterOperator.EQ)  # type: ignore
        return InMemoryDBFilterExpression(str(self))

    @check_operator_misuse
    def __ne__(self, other: Union[int, float]) -> "InMemoryDBFilterExpression":
        """Create a Numeric inequality filter expression.

        Args:
            other (Union[int, float]): The value to filter on.

        Example:
            >>> from langchain_community.vectorstores.InMemoryDB import InMemoryDBNum
            >>> filter = InMemoryDBNum("zipcode") != 90210
        """
        self._set_value(other, self.SUPPORTED_VAL_TYPES, InMemoryDBFilterOperator.NE)  # type: ignore
        return InMemoryDBFilterExpression(str(self))

    def __gt__(self, other: Union[int, float]) -> "InMemoryDBFilterExpression":
        """Create a Numeric greater than filter expression.

        Args:
            other (Union[int, float]): The value to filter on.

        Example:
            >>> from langchain_community.vectorstores.InMemoryDB import InMemoryDBNum
            >>> filter = InMemoryDBNum("age") > 18
        """
        self._set_value(other, self.SUPPORTED_VAL_TYPES, InMemoryDBFilterOperator.GT)  # type: ignore
        return InMemoryDBFilterExpression(str(self))

    def __lt__(self, other: Union[int, float]) -> "InMemoryDBFilterExpression":
        """Create a Numeric less than filter expression.

        Args:
            other (Union[int, float]): The value to filter on.

        Example:
            >>> from langchain_community.vectorstores.InMemoryDB import InMemoryDBNum
            >>> filter = InMemoryDBNum("age") < 18
        """
        self._set_value(other, self.SUPPORTED_VAL_TYPES, InMemoryDBFilterOperator.LT)  # type: ignore
        return InMemoryDBFilterExpression(str(self))

    def __ge__(self, other: Union[int, float]) -> "InMemoryDBFilterExpression":
        """Create a Numeric greater than or equal to filter expression.

        Args:
            other (Union[int, float]): The value to filter on.

        Example:
            >>> from langchain_community.vectorstores.InMemoryDB import InMemoryDBNum
            >>> filter = InMemoryDBNum("age") >= 18
        """
        self._set_value(other, self.SUPPORTED_VAL_TYPES, InMemoryDBFilterOperator.GE)  # type: ignore
        return InMemoryDBFilterExpression(str(self))

    def __le__(self, other: Union[int, float]) -> "InMemoryDBFilterExpression":
        """Create a Numeric less than or equal to filter expression.

        Args:
            other (Union[int, float]): The value to filter on.

        Example:
            >>> from langchain_community.vectorstores.InMemoryDB import InMemoryDBNum
            >>> filter = InMemoryDBNum("age") <= 18
        """
        self._set_value(other, self.SUPPORTED_VAL_TYPES, InMemoryDBFilterOperator.LE)  # type: ignore
        return InMemoryDBFilterExpression(str(self))


class InMemoryDBText(InMemoryDBFilterField):
    """InMemoryDBFilterField representing a text field in a InMemoryDB index."""

    OPERATORS: Dict[InMemoryDBFilterOperator, str] = {
        InMemoryDBFilterOperator.EQ: "==",
        InMemoryDBFilterOperator.NE: "!=",
        InMemoryDBFilterOperator.LIKE: "%",
    }
    OPERATOR_MAP: Dict[InMemoryDBFilterOperator, str] = {
        InMemoryDBFilterOperator.EQ: '@%s:("%s")',
        InMemoryDBFilterOperator.NE: '(-@%s:"%s")',
        InMemoryDBFilterOperator.LIKE: "@%s:(%s)",
    }
    SUPPORTED_VAL_TYPES = (str, type(None))

    @check_operator_misuse
    def __eq__(self, other: str) -> "InMemoryDBFilterExpression":
        """Create a InMemoryDBText equality (exact match) filter expression.

        Args:
            other (str): The text value to filter on.

        Example:
            >>> from langchain_community.vectorstores.InMemoryDB import InMemoryDBText
            >>> filter = InMemoryDBText("job") == "engineer"
        """
        self._set_value(other, self.SUPPORTED_VAL_TYPES, InMemoryDBFilterOperator.EQ)  # type: ignore
        return InMemoryDBFilterExpression(str(self))

    @check_operator_misuse
    def __ne__(self, other: str) -> "InMemoryDBFilterExpression":
        """Create a InMemoryDBText inequality filter expression.

        Args:
            other (str): The text value to filter on.

        Example:
            >>> from langchain_community.vectorstores.InMemoryDB import InMemoryDBText
            >>> filter = InMemoryDBText("job") != "engineer"
        """
        self._set_value(other, self.SUPPORTED_VAL_TYPES, InMemoryDBFilterOperator.NE)  # type: ignore
        return InMemoryDBFilterExpression(str(self))

    def __mod__(self, other: str) -> "InMemoryDBFilterExpression":
        """Create a InMemoryDBText "LIKE" filter expression.

        Args:
            other (str): The text value to filter on.

        Example:
            >>> from langchain_aws.vectorstores.inmemorydb import InMemoryDBText
            >>> filter = InMemoryDBText("job") % "engine*"   # suffix wild card match
            >>> filter = InMemoryDBText("job") % "%%engine%%"   # fuzzy match w/ LD
            >>> filter = InMemoryDBText("job") % "engineer|doctor" # contains either
            >>> filter = InMemoryDBText("job") % "engineer doctor" # contains both
        """
        self._set_value(other, self.SUPPORTED_VAL_TYPES, InMemoryDBFilterOperator.LIKE)  # type: ignore
        return InMemoryDBFilterExpression(str(self))

    def __str__(self) -> str:
        """Return the query syntax for a InMemoryDBText filter expression."""
        if not self._value:
            return "*"

        return self.OPERATOR_MAP[self._operator] % (
            self._field,
            self._value,
        )


class InMemoryDBFilterExpression:
    """Logical expression of InMemoryDBFilterFields.

    InMemoryDBFilterExpressions can be combined using the & and | operators to create
    complex logical expressions that evaluate to the InMemoryDB Query language.

    This presents an interface by which users can create complex queries
    without having to know the InMemoryDB Query language.

    Filter expressions are not initialized directly. Instead they are built
    by combining InMemoryDBFilterFields using the & and | operators.

    Examples:
    >>> from langchain_aws.vectorstores.inmemorydb import (
    ...     InMemoryDBTag, InMemoryDBNum
    ... )
    >>> brand_is_nike = InMemoryDBTag("brand") == "nike"
    >>> price_is_under_100 = InMemoryDBNum("price") < 100
    >>> filter = brand_is_nike & price_is_under_100
    >>> print(str(filter))
    (@brand:{nike} @price:[-inf (100)])
    """

    def __init__(
        self,
        _filter: Optional[str] = None,
        operator: Optional[InMemoryDBFilterOperator] = None,
        left: Optional["InMemoryDBFilterExpression"] = None,
        right: Optional["InMemoryDBFilterExpression"] = None,
    ):
        self._filter = _filter
        self._operator = operator
        self._left = left
        self._right = right

    def __and__(
        self, other: "InMemoryDBFilterExpression"
    ) -> "InMemoryDBFilterExpression":
        return InMemoryDBFilterExpression(
            operator=InMemoryDBFilterOperator.AND, left=self, right=other
        )

    def __or__(
        self, other: "InMemoryDBFilterExpression"
    ) -> "InMemoryDBFilterExpression":
        return InMemoryDBFilterExpression(
            operator=InMemoryDBFilterOperator.OR, left=self, right=other
        )

    @staticmethod
    def format_expression(
        left: "InMemoryDBFilterExpression",
        right: "InMemoryDBFilterExpression",
        operator_str: str,
    ) -> str:
        _left, _right = str(left), str(right)
        if _left == _right == "*":
            return _left
        if _left == "*" != _right:
            return _right
        if _right == "*" != _left:
            return _left
        return f"({_left}{operator_str}{_right})"

    def __str__(self) -> str:
        # top level check that allows recursive calls to __str__
        if not self._filter and not self._operator:
            raise ValueError("Improperly initialized InMemoryDBFilterExpression")

        # if there's an operator, combine expressions accordingly
        if self._operator:
            if not isinstance(self._left, InMemoryDBFilterExpression) or not isinstance(
                self._right, InMemoryDBFilterExpression
            ):
                raise TypeError(
                    "Improper combination of filters."
                    "Both left and right should be type FilterExpression"
                )

            operator_str = (
                " | " if self._operator == InMemoryDBFilterOperator.OR else " "
            )
            return self.format_expression(self._left, self._right, operator_str)

        # check that base case, the filter is set
        if not self._filter:
            raise ValueError("Improperly initialized InMemoryDBFilterExpression")
        return self._filter
