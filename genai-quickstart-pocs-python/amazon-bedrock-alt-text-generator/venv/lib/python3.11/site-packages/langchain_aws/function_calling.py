"""Methods for creating function specs in the style of Bedrock Functions
for supported model providers"""

import json
from typing import (
    Any,
    Callable,
    Dict,
    List,
    Literal,
    Optional,
    Union,
    cast,
)

from langchain_core.messages import ToolCall
from langchain_core.output_parsers import BaseGenerationOutputParser
from langchain_core.outputs import ChatGeneration, Generation
from langchain_core.prompts.chat import AIMessage
from langchain_core.pydantic_v1 import BaseModel
from langchain_core.tools import BaseTool
from langchain_core.utils.function_calling import convert_to_openai_tool
from langchain_core.utils.pydantic import TypeBaseModel
from typing_extensions import TypedDict

PYTHON_TO_JSON_TYPES = {
    "str": "string",
    "int": "integer",
    "float": "number",
    "bool": "boolean",
}

SYSTEM_PROMPT_FORMAT = """In this environment you have access to a set of tools you can use to answer the user's question.

You may call them like this:
<function_calls>
<invoke>
<tool_name>$TOOL_NAME</tool_name>
<parameters>
<$PARAMETER_NAME>$PARAMETER_VALUE</$PARAMETER_NAME>
...
</parameters>
</invoke>
</function_calls>

Here are the tools available:
<tools>
{formatted_tools}
</tools>"""  # noqa: E501

TOOL_FORMAT = """<tool_description>
<tool_name>{tool_name}</tool_name>
<description>{tool_description}</description>
<parameters>
{formatted_parameters}
</parameters>
</tool_description>"""

TOOL_PARAMETER_FORMAT = """<parameter>
<name>{parameter_name}</name>
<type>{parameter_type}</type>
<description>{parameter_description}</description>
</parameter>"""


class AnthropicTool(TypedDict):
    name: str
    description: str
    input_schema: Dict[str, Any]


def _tools_in_params(params: dict) -> bool:
    return "tools" in params or (
        "extra_body" in params and params["extra_body"].get("tools")
    )


class _AnthropicToolUse(TypedDict):
    type: Literal["tool_use"]
    name: str
    input: dict
    id: str


def _lc_tool_calls_to_anthropic_tool_use_blocks(
    tool_calls: List[ToolCall],
) -> List[_AnthropicToolUse]:
    blocks = []
    for tool_call in tool_calls:
        blocks.append(
            _AnthropicToolUse(
                type="tool_use",
                name=tool_call["name"],
                input=tool_call["args"],
                id=cast(str, tool_call["id"]),
            )
        )
    return blocks


def _get_type(parameter: Dict[str, Any]) -> str:
    if "type" in parameter:
        return parameter["type"]
    if "anyOf" in parameter:
        return json.dumps({"anyOf": parameter["anyOf"]})
    if "allOf" in parameter:
        return json.dumps({"allOf": parameter["allOf"]})
    return json.dumps(parameter)


def get_system_message(tools: List[AnthropicTool]) -> str:
    tools_data: List[Dict] = [
        {
            "tool_name": tool["name"],
            "tool_description": tool["description"],
            "formatted_parameters": "\n".join(
                [
                    TOOL_PARAMETER_FORMAT.format(
                        parameter_name=name,
                        parameter_type=_get_type(parameter),
                        parameter_description=parameter.get("description"),
                    )
                    for name, parameter in tool["input_schema"]["properties"].items()
                ]
            ),
        }
        for tool in tools
    ]
    tools_formatted = "\n".join(
        [
            TOOL_FORMAT.format(
                tool_name=tool["tool_name"],
                tool_description=tool["tool_description"],
                formatted_parameters=tool["formatted_parameters"],
            )
            for tool in tools_data
        ]
    )
    return SYSTEM_PROMPT_FORMAT.format(formatted_tools=tools_formatted)


class FunctionDescription(TypedDict):
    """Representation of a callable function to send to an LLM."""

    name: str
    """The name of the function."""
    description: str
    """A description of the function."""
    parameters: dict
    """The parameters of the function."""


class ToolDescription(TypedDict):
    """Representation of a callable function to the OpenAI API."""

    type: Literal["function"]
    function: FunctionDescription


class ToolsOutputParser(BaseGenerationOutputParser):
    first_tool_only: bool = False
    args_only: bool = False
    pydantic_schemas: Optional[List[TypeBaseModel]] = None

    class Config:
        extra = "forbid"

    def parse_result(self, result: List[Generation], *, partial: bool = False) -> Any:
        """Parse a list of candidate model Generations into a specific format.

        Args:
            result: A list of Generations to be parsed. The Generations are assumed
                to be different candidate outputs for a single model input.

        Returns:
            Structured output.
        """
        if (
            not result
            or not isinstance(result[0], ChatGeneration)
            or not isinstance(result[0].message, AIMessage)
            or not result[0].message.tool_calls
        ):
            return None if self.first_tool_only else []
        tool_calls: Any = result[0].message.tool_calls
        if self.pydantic_schemas:
            tool_calls = [self._pydantic_parse(tc) for tc in tool_calls]
        elif self.args_only:
            tool_calls = [tc["args"] for tc in tool_calls]
        else:
            pass

        if self.first_tool_only:
            return tool_calls[0]
        else:
            return tool_calls

    def _pydantic_parse(self, tool_call: ToolCall) -> BaseModel:
        cls_ = {schema.__name__: schema for schema in self.pydantic_schemas or []}[
            tool_call["name"]
        ]
        return cls_(**tool_call["args"])


def convert_to_anthropic_tool(
    tool: Union[Dict[str, Any], TypeBaseModel, Callable, BaseTool],
) -> AnthropicTool:
    # already in Anthropic tool format
    if isinstance(tool, dict) and all(
        k in tool for k in ("name", "description", "input_schema")
    ):
        return AnthropicTool(tool)  # type: ignore
    else:
        formatted = convert_to_openai_tool(tool)["function"]
        return AnthropicTool(
            name=formatted["name"],
            description=formatted["description"],
            input_schema=formatted["parameters"],
        )
