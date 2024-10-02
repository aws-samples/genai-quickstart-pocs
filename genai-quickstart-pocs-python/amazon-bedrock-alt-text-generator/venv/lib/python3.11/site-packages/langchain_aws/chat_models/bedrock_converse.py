import base64
import json
import re
from operator import itemgetter
from typing import (
    Any,
    Callable,
    Dict,
    Iterator,
    List,
    Literal,
    Optional,
    Sequence,
    Tuple,
    Type,
    TypeVar,
    Union,
    cast,
)

import boto3
from langchain_core.callbacks import CallbackManagerForLLMRun
from langchain_core.language_models import BaseChatModel, LanguageModelInput
from langchain_core.language_models.chat_models import LangSmithParams
from langchain_core.messages import (
    AIMessage,
    BaseMessage,
    BaseMessageChunk,
    HumanMessage,
    HumanMessageChunk,
    SystemMessage,
    ToolCall,
    ToolMessage,
    merge_message_runs,
)
from langchain_core.messages.ai import AIMessageChunk, UsageMetadata
from langchain_core.messages.tool import tool_call as create_tool_call
from langchain_core.messages.tool import tool_call_chunk
from langchain_core.output_parsers import JsonOutputKeyToolsParser, PydanticToolsParser
from langchain_core.output_parsers.base import OutputParserLike
from langchain_core.outputs import ChatGeneration, ChatGenerationChunk, ChatResult
from langchain_core.pydantic_v1 import BaseModel, Extra, Field, root_validator
from langchain_core.runnables import Runnable, RunnableMap, RunnablePassthrough
from langchain_core.tools import BaseTool
from langchain_core.utils import get_from_dict_or_env
from langchain_core.utils.function_calling import (
    convert_to_openai_function,
    convert_to_openai_tool,
)
from langchain_core.utils.pydantic import TypeBaseModel, is_basemodel_subclass

from langchain_aws.function_calling import ToolsOutputParser

_BM = TypeVar("_BM", bound=BaseModel)
_DictOrPydanticClass = Union[Dict[str, Any], Type[_BM], Type]


class ChatBedrockConverse(BaseChatModel):
    """Bedrock chat model integration built on the Bedrock converse API.

    This implementation will eventually replace the existing ChatBedrock implementation
    once the Bedrock converse API has feature parity with older Bedrock API.
    Specifically the converse API does not yet support custom Bedrock models.

    Setup:
        To use Amazon Bedrock make sure you've gone through all the steps described
        here: https://docs.aws.amazon.com/bedrock/latest/userguide/setting-up.html

        Once that's completed, install the LangChain integration:

        .. code-block:: bash

            pip install -U langchain-aws

    Key init args — completion params:
        model: str
            Name of BedrockConverse model to use.
        temperature: float
            Sampling temperature.
        max_tokens: Optional[int]
            Max number of tokens to generate.

    Key init args — client params:
        region_name: Optional[str]
            AWS region to use, e.g. 'us-west-2'.
        base_url: Optional[str]
            Bedrock endpoint to use. Needed if you don't want to default to us-east-
            1 endpoint.
        credentials_profile_name: Optional[str]
            The name of the profile in the ~/.aws/credentials or ~/.aws/config files.

    See full list of supported init args and their descriptions in the params section.

    Instantiate:
        .. code-block:: python

            from langchain_aws import ChatBedrockConverse

            llm = ChatBedrockConverse(
                model="anthropic.claude-3-sonnet-20240229-v1:0",
                temperature=0,
                max_tokens=None,
                # other params...
            )

    Invoke:
        .. code-block:: python

            messages = [
                ("system", "You are a helpful translator. Translate the user sentence to French."),
                ("human", "I love programming."),
            ]
            llm.invoke(messages)

        .. code-block:: python

            AIMessage(content=[{'type': 'text', 'text': "J'aime la programmation."}], response_metadata={'ResponseMetadata': {'RequestId': '9ef1e313-a4c1-4f79-b631-171f658d3c0e', 'HTTPStatusCode': 200, 'HTTPHeaders': {'date': 'Sat, 15 Jun 2024 01:19:24 GMT', 'content-type': 'application/json', 'content-length': '205', 'connection': 'keep-alive', 'x-amzn-requestid': '9ef1e313-a4c1-4f79-b631-171f658d3c0e'}, 'RetryAttempts': 0}, 'stopReason': 'end_turn', 'metrics': {'latencyMs': 609}}, id='run-754e152b-2b41-4784-9538-d40d71a5c3bc-0', usage_metadata={'input_tokens': 25, 'output_tokens': 11, 'total_tokens': 36})

    Stream:
        .. code-block:: python

            for chunk in llm.stream(messages):
                print(chunk)

        .. code-block:: python

            AIMessageChunk(content=[], id='run-da3c2606-4792-440a-ac66-72e0d1f6d117')
            AIMessageChunk(content=[{'type': 'text', 'text': 'J', 'index': 0}], id='run-da3c2606-4792-440a-ac66-72e0d1f6d117')
            AIMessageChunk(content=[{'text': "'", 'index': 0}], id='run-da3c2606-4792-440a-ac66-72e0d1f6d117')
            AIMessageChunk(content=[{'text': 'a', 'index': 0}], id='run-da3c2606-4792-440a-ac66-72e0d1f6d117')
            AIMessageChunk(content=[{'text': 'ime', 'index': 0}], id='run-da3c2606-4792-440a-ac66-72e0d1f6d117')
            AIMessageChunk(content=[{'text': ' la', 'index': 0}], id='run-da3c2606-4792-440a-ac66-72e0d1f6d117')
            AIMessageChunk(content=[{'text': ' programm', 'index': 0}], id='run-da3c2606-4792-440a-ac66-72e0d1f6d117')
            AIMessageChunk(content=[{'text': 'ation', 'index': 0}], id='run-da3c2606-4792-440a-ac66-72e0d1f6d117')
            AIMessageChunk(content=[{'text': '.', 'index': 0}], id='run-da3c2606-4792-440a-ac66-72e0d1f6d117')
            AIMessageChunk(content=[{'index': 0}], id='run-da3c2606-4792-440a-ac66-72e0d1f6d117')
            AIMessageChunk(content=[], response_metadata={'stopReason': 'end_turn'}, id='run-da3c2606-4792-440a-ac66-72e0d1f6d117')
            AIMessageChunk(content=[], response_metadata={'metrics': {'latencyMs': 581}}, id='run-da3c2606-4792-440a-ac66-72e0d1f6d117', usage_metadata={'input_tokens': 25, 'output_tokens': 11, 'total_tokens': 36})

        .. code-block:: python

            stream = llm.stream(messages)
            full = next(stream)
            for chunk in stream:
                full += chunk
            full

        .. code-block:: python

            AIMessageChunk(content=[{'type': 'text', 'text': "J'aime la programmation.", 'index': 0}], response_metadata={'stopReason': 'end_turn', 'metrics': {'latencyMs': 554}}, id='run-56a5a5e0-de86-412b-9835-624652dc3539', usage_metadata={'input_tokens': 25, 'output_tokens': 11, 'total_tokens': 36})

    Tool calling:
        .. code-block:: python

            from langchain_core.pydantic_v1 import BaseModel, Field

            class GetWeather(BaseModel):
                '''Get the current weather in a given location'''

                location: str = Field(..., description="The city and state, e.g. San Francisco, CA")

            class GetPopulation(BaseModel):
                '''Get the current population in a given location'''

                location: str = Field(..., description="The city and state, e.g. San Francisco, CA")

            llm_with_tools = llm.bind_tools([GetWeather, GetPopulation])
            ai_msg = llm_with_tools.invoke("Which city is hotter today and which is bigger: LA or NY?")
            ai_msg.tool_calls

        .. code-block:: python

            [{'name': 'GetWeather',
              'args': {'location': 'Los Angeles, CA'},
              'id': 'tooluse_Mspi2igUTQygp-xbX6XGVw'},
             {'name': 'GetWeather',
              'args': {'location': 'New York, NY'},
              'id': 'tooluse_tOPHiDhvR2m0xF5_5tyqWg'},
             {'name': 'GetPopulation',
              'args': {'location': 'Los Angeles, CA'},
              'id': 'tooluse__gcY_klbSC-GqB-bF_pxNg'},
             {'name': 'GetPopulation',
              'args': {'location': 'New York, NY'},
              'id': 'tooluse_-1HSoGX0TQCSaIg7cdFy8Q'}]

        See ``ChatBedrockConverse.bind_tools()`` method for more.

    Structured output:
        .. code-block:: python

            from typing import Optional

            from langchain_core.pydantic_v1 import BaseModel, Field

            class Joke(BaseModel):
                '''Joke to tell user.'''

                setup: str = Field(description="The setup of the joke")
                punchline: str = Field(description="The punchline to the joke")
                rating: Optional[int] = Field(description="How funny the joke is, from 1 to 10")

            structured_llm = llm.with_structured_output(Joke)
            structured_llm.invoke("Tell me a joke about cats")

        .. code-block:: python

            Joke(setup='What do you call a cat that gets all dressed up?', punchline='A purrfessional!', rating=7)

        See ``ChatBedrockConverse.with_structured_output()`` for more.

    Image input:
        .. code-block:: python

            import base64
            import httpx
            from langchain_core.messages import HumanMessage

            image_url = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"
            image_data = base64.b64encode(httpx.get(image_url).content).decode("utf-8")
            message = HumanMessage(
                content=[
                    {"type": "text", "text": "describe the weather in this image"},
                    {
                        "type": "image",
                        "source": {"type": "base64", "media_type": "image/jpeg", "data": image_data},
                    },
                ],
            )
            ai_msg = llm.invoke([message])
            ai_msg.content

        .. code-block:: python

            [{'type': 'text',
              'text': 'The image depicts a sunny day with a partly cloudy sky. The sky is a brilliant blue color with scattered white clouds drifting across. The lighting and cloud patterns suggest pleasant, mild weather conditions. The scene shows an open grassy field or meadow, indicating warm temperatures conducive for vegetation growth. Overall, the weather portrayed in this scenic outdoor image appears to be sunny with some clouds, likely representing a nice, comfortable day.'}]

    Token usage:
        .. code-block:: python

            ai_msg = llm.invoke(messages)
            ai_msg.usage_metadata

        .. code-block:: python

            {'input_tokens': 25, 'output_tokens': 11, 'total_tokens': 36}

    Response metadata
        .. code-block:: python

            ai_msg = llm.invoke(messages)
            ai_msg.response_metadata

        .. code-block:: python

            {'ResponseMetadata': {'RequestId': '776a2a26-5946-45ae-859e-82dc5f12017c',
              'HTTPStatusCode': 200,
              'HTTPHeaders': {'date': 'Mon, 17 Jun 2024 01:37:05 GMT',
               'content-type': 'application/json',
               'content-length': '206',
               'connection': 'keep-alive',
               'x-amzn-requestid': '776a2a26-5946-45ae-859e-82dc5f12017c'},
              'RetryAttempts': 0},
             'stopReason': 'end_turn',
             'metrics': {'latencyMs': 1290}}
    """  # noqa: E501

    client: Any = Field(default=None, exclude=True)  #: :meta private:

    model_id: str = Field(alias="model")
    """Id of the model to call.
    
    e.g., ``"anthropic.claude-3-sonnet-20240229-v1:0"``. This is equivalent to the 
    modelID property in the list-foundation-models api. For custom and provisioned 
    models, an ARN value is expected. See 
    https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html#model-ids-arns 
    for a list of all supported built-in models.
    """

    max_tokens: Optional[int] = None
    """Max tokens to generate."""

    stop_sequences: Optional[List[str]] = Field(default=None, alias="stop")
    """Stop generation if any of these substrings occurs."""

    temperature: Optional[float] = None
    """Sampling temperature. Must be 0 to 1."""

    top_p: Optional[float] = None
    """The percentage of most-likely candidates that are considered for the next token.
    
    Must be 0 to 1.
    
    For example, if you choose a value of 0.8 for topP, the model selects from 
    the top 80% of the probability distribution of tokens that could be next in the 
    sequence."""

    region_name: Optional[str] = None
    """The aws region, e.g., `us-west-2`. 
    
    Falls back to AWS_DEFAULT_REGION env variable or region specified in ~/.aws/config 
    in case it is not provided here.
    """

    credentials_profile_name: Optional[str] = Field(default=None, exclude=True)
    """The name of the profile in the ~/.aws/credentials or ~/.aws/config files.
    
    Profile should either have access keys or role information specified.
    If not specified, the default credential profile or, if on an EC2 instance,
    credentials from IMDS will be used. See: 
    https://boto3.amazonaws.com/v1/documentation/api/latest/guide/credentials.html
    """

    provider: str = ""
    """The model provider, e.g., amazon, cohere, ai21, etc. 
    
    When not supplied, provider is extracted from the first part of the model_id, e.g. 
    'amazon' in 'amazon.titan-text-express-v1'. This value should be provided for model 
    ids that do not have the provider in them, like custom and provisioned models that 
    have an ARN associated with them.
    """

    endpoint_url: Optional[str] = Field(default=None, alias="base_url")
    """Needed if you don't want to default to us-east-1 endpoint"""

    config: Any = None
    """An optional botocore.config.Config instance to pass to the client."""

    guardrail_config: Optional[Dict[str, Any]] = Field(default=None, alias="guardrails")
    """Configuration information for a guardrail that you want to use in the request."""

    additional_model_request_fields: Optional[Dict[str, Any]] = None
    """Additional inference parameters that the model supports.
    
    Parameters beyond the base set of inference parameters that Converse supports in the
    inferenceConfig field.
    """

    additional_model_response_field_paths: Optional[List[str]] = None
    """Additional model parameters field paths to return in the response. 
    
    Converse returns the requested fields as a JSON Pointer object in the 
    additionalModelResponseFields field. The following is example JSON for 
    additionalModelResponseFieldPaths.
    """

    supports_tool_choice_values: Optional[
        Sequence[Literal["auto", "any", "tool"]]
    ] = None
    """Which types of tool_choice values the model supports.
    
    Inferred if not specified. Inferred as ('auto', 'any', 'tool') if a 'claude-3' 
    model is used, ('auto', 'any') if a 'mistral-large' model is used, empty otherwise.
    """

    class Config:
        """Configuration for this pydantic object."""

        extra = Extra.forbid
        allow_population_by_field_name = True

    @root_validator(pre=True)
    def set_disable_streaming(cls, values: Dict) -> Dict:
        values["provider"] = (
            values.get("provider")
            or (values.get("model_id", values["model"])).split(".")[0]
        )

        # As of 08/05/24 only Anthropic models support streamed tool calling
        if "disable_streaming" not in values:
            values["disable_streaming"] = (
                False if "anthropic" in values["provider"] else "tool_calling"
            )
        return values

    @root_validator(pre=False, skip_on_failure=True)
    def validate_environment(cls, values: Dict) -> Dict:
        """Validate that AWS credentials to and python package exists in environment."""
        if values["client"] is not None:
            return values

        try:
            if values["credentials_profile_name"] is not None:
                session = boto3.Session(profile_name=values["credentials_profile_name"])
            else:
                session = boto3.Session()
        except ValueError as e:
            raise ValueError(f"Error raised by bedrock service: {e}")
        except Exception as e:
            raise ValueError(
                "Could not load credentials to authenticate with AWS client. "
                "Please check that credentials in the specified "
                f"profile name are valid. Bedrock error: {e}"
            ) from e

        values["region_name"] = get_from_dict_or_env(
            values,
            "region_name",
            "AWS_DEFAULT_REGION",
            default=session.region_name,
        )

        client_params = {}
        if values["region_name"]:
            client_params["region_name"] = values["region_name"]
        if values["endpoint_url"]:
            client_params["endpoint_url"] = values["endpoint_url"]
        if values["config"]:
            client_params["config"] = values["config"]

        try:
            values["client"] = session.client("bedrock-runtime", **client_params)
        except ValueError as e:
            raise ValueError(f"Error raised by bedrock service: {e}")
        except Exception as e:
            raise ValueError(
                "Could not load credentials to authenticate with AWS client. "
                "Please check that credentials in the specified "
                f"profile name are valid. Bedrock error: {e}"
            ) from e

        # As of 08/05/24 only claude-3 and mistral-large models support tool choice:
        # https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_ToolChoice.html
        if values["supports_tool_choice_values"] is None:
            if "claude-3" in values["model_id"]:
                values["supports_tool_choice_values"] = ("auto", "any", "tool")
            elif "mistral-large" in values["model_id"]:
                values["supports_tool_choice_values"] = ("auto", "any")
            else:
                values["supports_tool_choice_values"] = ()

        return values

    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> ChatResult:
        """Top Level call"""
        bedrock_messages, system = _messages_to_bedrock(messages)
        params = self._converse_params(
            stop=stop, **_snake_to_camel_keys(kwargs, excluded_keys={"inputSchema"})
        )
        response = self.client.converse(
            messages=bedrock_messages, system=system, **params
        )
        response_message = _parse_response(response)
        return ChatResult(generations=[ChatGeneration(message=response_message)])

    def _stream(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> Iterator[ChatGenerationChunk]:
        bedrock_messages, system = _messages_to_bedrock(messages)
        params = self._converse_params(
            stop=stop, **_snake_to_camel_keys(kwargs, excluded_keys={"inputSchema"})
        )
        response = self.client.converse_stream(
            messages=bedrock_messages, system=system, **params
        )
        for event in response["stream"]:
            if message_chunk := _parse_stream_event(event):
                yield ChatGenerationChunk(message=message_chunk)

    # TODO: Add async support once there are async bedrock.converse methods.

    def bind_tools(
        self,
        tools: Sequence[Union[Dict[str, Any], TypeBaseModel, Callable, BaseTool]],
        *,
        tool_choice: Optional[Union[dict, str, Literal["auto", "any"]]] = None,
        **kwargs: Any,
    ) -> Runnable[LanguageModelInput, BaseMessage]:
        if tool_choice:
            tool_choice = _format_tool_choice(tool_choice)
            tool_choice_type = list(tool_choice.keys())[0]
            if tool_choice_type not in list(self.supports_tool_choice_values or []):
                if self.supports_tool_choice_values:
                    supported = (
                        f"Model {self.model_id} does not currently support tool_choice "
                        f"of type {tool_choice_type}. The following tool_choice types "
                        f"are supported: {self.supports_tool_choice_values}."
                    )
                else:
                    supported = (
                        f"Model {self.model_id} does not currently support tool_choice."
                    )

                raise ValueError(
                    f"{supported} Please see "
                    f"https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_ToolChoice.html "  # noqa: E501
                    f"for the latest documentation on models that support tool choice."
                )
            kwargs["tool_choice"] = _format_tool_choice(tool_choice)
        return self.bind(tools=_format_tools(tools), **kwargs)

    def with_structured_output(
        self,
        schema: _DictOrPydanticClass,
        *,
        include_raw: bool = False,
        **kwargs: Any,
    ) -> Runnable[LanguageModelInput, Union[Dict, BaseModel]]:
        supports_tool_choice_values = self.supports_tool_choice_values or ()
        if "tool" in supports_tool_choice_values:
            tool_choice = convert_to_openai_function(schema)["name"]
        elif "any" in supports_tool_choice_values:
            tool_choice = "any"
        else:
            tool_choice = None
        llm = self.bind_tools([schema], tool_choice=tool_choice)
        if isinstance(schema, type) and is_basemodel_subclass(schema):
            if self.disable_streaming:
                output_parser: OutputParserLike = ToolsOutputParser(
                    first_tool_only=True, pydantic_schemas=[schema]
                )
            else:
                output_parser = PydanticToolsParser(
                    tools=[schema],
                    first_tool_only=True,
                )
        else:
            tool_name = convert_to_openai_tool(schema)["function"]["name"]
            if self.disable_streaming:
                output_parser = ToolsOutputParser(first_tool_only=True, args_only=True)
            else:
                output_parser = JsonOutputKeyToolsParser(
                    key_name=tool_name, first_tool_only=True
                )

        if include_raw:
            parser_assign = RunnablePassthrough.assign(
                parsed=itemgetter("raw") | output_parser, parsing_error=lambda _: None
            )
            parser_none = RunnablePassthrough.assign(parsed=lambda _: None)
            parser_with_fallback = parser_assign.with_fallbacks(
                [parser_none], exception_key="parsing_error"
            )
            return RunnableMap(raw=llm) | parser_with_fallback
        else:
            return llm | output_parser

    def _converse_params(
        self,
        *,
        stop: Optional[List[str]] = None,
        stopSequences: Optional[List[str]] = None,
        maxTokens: Optional[List[str]] = None,
        temperature: Optional[float] = None,
        topP: Optional[float] = None,
        tools: Optional[List] = None,
        toolChoice: Optional[dict] = None,
        modelId: Optional[str] = None,
        inferenceConfig: Optional[dict] = None,
        toolConfig: Optional[dict] = None,
        additionalModelRequestFields: Optional[dict] = None,
        additionalModelResponseFieldPaths: Optional[List[str]] = None,
        guardrailConfig: Optional[dict] = None,
    ) -> Dict[str, Any]:
        if not inferenceConfig:
            inferenceConfig = {
                "maxTokens": maxTokens or self.max_tokens,
                "temperature": temperature or self.temperature,
                "topP": self.top_p or topP,
                "stopSequences": stop or stopSequences or self.stop_sequences,
            }
        if not toolConfig and tools:
            toolChoice = _format_tool_choice(toolChoice) if toolChoice else None
            toolConfig = {"tools": _format_tools(tools), "toolChoice": toolChoice}

        return _drop_none(
            {
                "modelId": modelId or self.model_id,
                "inferenceConfig": inferenceConfig,
                "toolConfig": toolConfig,
                "additionalModelRequestFields": additionalModelRequestFields
                or self.additional_model_request_fields,
                "additionalModelResponseFieldPaths": additionalModelResponseFieldPaths
                or self.additional_model_response_field_paths,
                "guardrailConfig": guardrailConfig or self.guardrail_config,
            }
        )

    def _get_ls_params(
        self, stop: Optional[List[str]] = None, **kwargs: Any
    ) -> LangSmithParams:
        """Get standard params for tracing."""
        params = self._get_invocation_params(stop=stop, **kwargs)
        ls_params = LangSmithParams(
            ls_provider="amazon_bedrock",
            ls_model_name=self.model_id,
            ls_model_type="chat",
            ls_temperature=params.get("temperature", self.temperature),
        )
        if ls_max_tokens := params.get("max_tokens", self.max_tokens):
            ls_params["ls_max_tokens"] = ls_max_tokens
        if ls_stop := stop or params.get("stop", None):
            ls_params["ls_stop"] = ls_stop
        return ls_params

    @property
    def _llm_type(self) -> str:
        """Return type of chat model."""
        return "amazon_bedrock_converse_chat"


def _messages_to_bedrock(
    messages: List[BaseMessage],
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Handle Bedrock converse and Anthropic style content blocks"""
    bedrock_messages: List[Dict[str, Any]] = []
    bedrock_system: List[Dict[str, Any]] = []
    # Merge system, human, ai message runs because Anthropic expects (at most) 1
    # system message then alternating human/ai messages.
    messages = merge_message_runs(messages)
    for msg in messages:
        content = _anthropic_to_bedrock(msg.content)
        if isinstance(msg, HumanMessage):
            # If there's a human, tool, human message sequence, the
            # tool message will be merged with the first human message, so the second
            # human message will now be preceded by a human message and should also
            # be merged with it.
            if bedrock_messages and bedrock_messages[-1]["role"] == "user":
                bedrock_messages[-1]["content"].extend(content)
            else:
                bedrock_messages.append({"role": "user", "content": content})
        elif isinstance(msg, AIMessage):
            content = _upsert_tool_calls_to_bedrock_content(content, msg.tool_calls)
            bedrock_messages.append({"role": "assistant", "content": content})
        elif isinstance(msg, SystemMessage):
            bedrock_system.extend(content)
        elif isinstance(msg, ToolMessage):
            if bedrock_messages and bedrock_messages[-1]["role"] == "user":
                curr = bedrock_messages.pop()
            else:
                curr = {"role": "user", "content": []}

            curr["content"].append(
                {
                    "toolResult": {
                        "content": content,
                        "toolUseId": msg.tool_call_id,
                        "status": msg.status,
                    }
                }
            )
            bedrock_messages.append(curr)
        else:
            raise ValueError()
    return bedrock_messages, bedrock_system


def _parse_response(response: Dict[str, Any]) -> AIMessage:
    anthropic_content = _bedrock_to_anthropic(
        response.pop("output")["message"]["content"]
    )
    tool_calls = _extract_tool_calls(anthropic_content)
    usage = UsageMetadata(_camel_to_snake_keys(response.pop("usage")))  # type: ignore[misc]
    return AIMessage(
        content=_str_if_single_text_block(anthropic_content),  # type: ignore[arg-type]
        usage_metadata=usage,
        response_metadata=response,
        tool_calls=tool_calls,
    )


def _parse_stream_event(event: Dict[str, Any]) -> Optional[BaseMessageChunk]:
    if "messageStart" in event:
        # TODO: needed?
        return (
            AIMessageChunk(content=[])
            if event["messageStart"]["role"] == "assistant"
            else HumanMessageChunk(content=[])
        )
    elif "contentBlockStart" in event:
        block = {
            **_bedrock_to_anthropic([event["contentBlockStart"]["start"]])[0],
            "index": event["contentBlockStart"]["contentBlockIndex"],
        }
        tool_call_chunks = []
        if block["type"] == "tool_use":
            tool_call_chunks.append(
                tool_call_chunk(
                    name=block.get("name"),
                    id=block.get("id"),
                    args=block.get("input"),
                    index=event["contentBlockStart"]["contentBlockIndex"],
                )
            )
        return AIMessageChunk(content=[block], tool_call_chunks=tool_call_chunks)
    elif "contentBlockDelta" in event:
        block = {
            **_bedrock_to_anthropic([event["contentBlockDelta"]["delta"]])[0],
            "index": event["contentBlockDelta"]["contentBlockIndex"],
        }
        tool_call_chunks = []
        if block["type"] == "tool_use":
            tool_call_chunks.append(
                tool_call_chunk(
                    name=block.get("name"),
                    id=block.get("id"),
                    args=block.get("input"),
                    index=event["contentBlockDelta"]["contentBlockIndex"],
                )
            )
        return AIMessageChunk(content=[block], tool_call_chunks=tool_call_chunks)
    elif "contentBlockStop" in event:
        # TODO: needed?
        return AIMessageChunk(
            content=[{"index": event["contentBlockStop"]["contentBlockIndex"]}]
        )
    elif "messageStop" in event:
        # TODO: snake case response metadata?
        return AIMessageChunk(content=[], response_metadata=event["messageStop"])
    elif "metadata" in event:
        usage = UsageMetadata(_camel_to_snake_keys(event["metadata"].pop("usage")))  # type: ignore[misc]
        return AIMessageChunk(
            content=[], response_metadata=event["metadata"], usage_metadata=usage
        )
    elif "Exception" in list(event.keys())[0]:
        name, info = list(event.items())[0]
        raise ValueError(
            f"Received AWS exception {name}:\n\n{json.dumps(info, indent=2)}"
        )
    else:
        raise ValueError(f"Received unsupported stream event:\n\n{event}")


def _anthropic_to_bedrock(
    content: Union[str, List[Union[str, Dict[str, Any]]]],
) -> List[Dict[str, Any]]:
    if isinstance(content, str):
        content = [{"text": content}]
    bedrock_content: List[Dict[str, Any]] = []
    for block in _snake_to_camel_keys(content):
        if isinstance(block, str):
            bedrock_content.append({"text": block})
        # Assume block is already in bedrock format.
        elif "type" not in block:
            bedrock_content.append(block)
        elif block["type"] == "text":
            bedrock_content.append({"text": block["text"]})
        elif block["type"] == "image":
            # Assume block is already in bedrock format.
            if "image" in block:
                bedrock_content.append({"image": block["image"]})
            else:
                bedrock_content.append(
                    {
                        "image": {
                            "format": block["source"]["mediaType"].split("/")[1],
                            "source": {
                                "bytes": _b64str_to_bytes(block["source"]["data"])
                            },
                        }
                    }
                )
        elif block["type"] == "image_url":
            # Support OpenAI image format as well.
            bedrock_content.append(
                {"image": _format_openai_image_url(block["imageUrl"]["url"])}
            )
        elif block["type"] == "document":
            # Assume block in bedrock document format
            bedrock_content.append({"document": block["document"]})
        elif block["type"] == "tool_use":
            bedrock_content.append(
                {
                    "toolUse": {
                        "toolUseId": block["id"],
                        "input": block["input"],
                        "name": block["name"],
                    }
                }
            )
        elif block["type"] == "tool_result":
            bedrock_content.append(
                {
                    "toolResult": {
                        "toolUseId": block["toolUseId"],
                        "content": _anthropic_to_bedrock(block["content"]),
                        "status": "error" if block.get("isError") else "success",
                    }
                }
            )
        # Only needed for tool_result content blocks.
        elif block["type"] == "json":
            bedrock_content.append({"json": block["json"]})
        elif block["type"] == "guard_content":
            bedrock_content.append({"guardContent": {"text": {"text": block["text"]}}})
        else:
            raise ValueError(f"Unsupported content block type:\n{block}")
    # drop empty text blocks
    return [block for block in bedrock_content if block.get("text", True)]


def _bedrock_to_anthropic(content: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    anthropic_content = []
    for block in _camel_to_snake_keys(content):
        if "text" in block:
            anthropic_content.append({"type": "text", "text": block["text"]})
        elif "tool_use" in block:
            block["tool_use"]["id"] = block["tool_use"].pop("tool_use_id", None)
            anthropic_content.append({"type": "tool_use", **block["tool_use"]})
        elif "image" in block:
            anthropic_content.append(
                {
                    "type": "image",
                    "source": {
                        "media_type": f"image/{block['image']['format']}",
                        "type": "base64",
                        "data": _bytes_to_b64_str(block["image"]["source"]["bytes"]),
                    },
                }
            )
        elif "tool_result" in block:
            anthropic_content.append(
                {
                    "type": "tool_result",
                    "tool_use_id": block["tool_result"]["tool_use_id"],
                    "is_error": block["tool_result"].get("status") == "error",
                    "content": _bedrock_to_anthropic(block["tool_result"]["content"]),
                }
            )
        # Only occurs in content blocks of a tool_result:
        elif "json" in block:
            anthropic_content.append({"type": "json", **block})
        elif "guard_content" in block:
            anthropic_content.append(
                {
                    "type": "guard_content",
                    "guard_content": {
                        "type": "text",
                        "text": block["guard_content"]["text"]["text"],
                    },
                }
            )
        else:
            raise ValueError(
                "Unexpected content block type in content. Expected to have one of "
                "'text', 'tool_use', 'image', or 'tool_result' keys. Received:\n\n"
                f"{block}"
            )
    return anthropic_content


def _format_tools(
    tools: Sequence[Union[Dict[str, Any], TypeBaseModel, Callable, BaseTool],],
) -> List[Dict[Literal["toolSpec"], Dict[str, Union[Dict[str, Any], str]]]]:
    formatted_tools: List = []
    for tool in tools:
        if isinstance(tool, dict) and "toolSpec" in tool:
            formatted_tools.append(tool)
        else:
            spec = convert_to_openai_function(tool)
            spec["inputSchema"] = {"json": spec.pop("parameters")}
            formatted_tools.append({"toolSpec": spec})
    return formatted_tools


def _format_tool_choice(
    tool_choice: Union[Dict[str, Dict], Literal["auto", "any"], str],
) -> Dict[str, Dict[str, str]]:
    if isinstance(tool_choice, dict):
        return tool_choice
    elif tool_choice in ("auto", "any"):
        return {tool_choice: {}}
    else:
        return {"tool": {"name": tool_choice}}


def _extract_tool_calls(anthropic_content: List[dict]) -> List[ToolCall]:
    tool_calls = []
    for block in anthropic_content:
        if block["type"] == "tool_use":
            tool_calls.append(
                create_tool_call(
                    name=block["name"], args=block["input"], id=block["id"]
                )
            )
    return tool_calls


def _snake_to_camel(text: str) -> str:
    split = text.split("_")
    return "".join(split[:1] + [s.title() for s in split[1:]])


def _camel_to_snake(text: str) -> str:
    pattern = re.compile(r"(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])")
    return pattern.sub("_", text).lower()


_T = TypeVar("_T")


def _camel_to_snake_keys(obj: _T) -> _T:
    if isinstance(obj, list):
        return cast(_T, [_camel_to_snake_keys(e) for e in obj])
    elif isinstance(obj, dict):
        return cast(
            _T, {_camel_to_snake(k): _camel_to_snake_keys(v) for k, v in obj.items()}
        )
    else:
        return obj


def _snake_to_camel_keys(obj: _T, excluded_keys: set = set()) -> _T:
    if isinstance(obj, list):
        return cast(
            _T, [_snake_to_camel_keys(e, excluded_keys=excluded_keys) for e in obj]
        )
    elif isinstance(obj, dict):
        _dict = {}
        for k, v in obj.items():
            if k in excluded_keys:
                _dict[k] = v
            else:
                _dict[_snake_to_camel(k)] = _snake_to_camel_keys(
                    v, excluded_keys=excluded_keys
                )
        return cast(_T, _dict)
    else:
        return obj


def _drop_none(obj: Any) -> Any:
    if isinstance(obj, dict):
        new = {k: _drop_none(v) for k, v in obj.items() if _drop_none(v) is not None}
        return new
    else:
        return obj


def _b64str_to_bytes(base64_str: str) -> bytes:
    return base64.b64decode(base64_str.encode("utf-8"))


def _bytes_to_b64_str(bytes_: bytes) -> str:
    return base64.b64encode(bytes_).decode("utf-8")


def _str_if_single_text_block(
    anthropic_content: List[Dict[str, Any]],
) -> Union[str, List[Dict[str, Any]]]:
    if len(anthropic_content) == 1 and anthropic_content[0]["type"] == "text":
        return anthropic_content[0]["text"]
    return anthropic_content


def _upsert_tool_calls_to_bedrock_content(
    content: List[Dict[str, Any]], tool_calls: List[ToolCall]
) -> List[Dict[str, Any]]:
    existing_tc_blocks = [block for block in content if "toolUse" in block]
    for tool_call in tool_calls:
        if tool_call["id"] in [
            block["toolUse"]["toolUseId"] for block in existing_tc_blocks
        ]:
            tc_block = next(
                block
                for block in existing_tc_blocks
                if block["toolUse"]["toolUseId"] == tool_call["id"]
            )
            tc_block["toolUse"]["input"] = tool_call["args"]
            tc_block["toolUse"]["name"] = tool_call["name"]
        else:
            content.append(
                {
                    "toolUse": {
                        "toolUseId": tool_call["id"],
                        "input": tool_call["args"],
                        "name": tool_call["name"],
                    }
                }
            )
    return content


def _format_openai_image_url(image_url: str) -> Dict:
    """
    Formats an image of format data:image/jpeg;base64,{b64_string}
    to a dict for bedrock api.

    And throws an error if url is not a b64 image.
    """
    regex = r"^data:image/(?P<media_type>.+);base64,(?P<data>.+)$"
    match = re.match(regex, image_url)
    if match is None:
        raise ValueError(
            "Bedrock does not currently support OpenAI-format image URLs, only "
            "base64-encoded images. Example: data:image/png;base64,'/9j/4AAQSk'..."
        )
    return {
        "format": match.group("media_type"),
        "source": {"bytes": _b64str_to_bytes(match.group("data"))},
    }
