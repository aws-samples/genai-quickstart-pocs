import asyncio
import json
import warnings
from abc import ABC
from typing import (
    Any,
    AsyncGenerator,
    AsyncIterator,
    Dict,
    Iterator,
    List,
    Mapping,
    Optional,
    Tuple,
    TypedDict,
    Union,
)

from langchain_core._api.deprecation import deprecated
from langchain_core.callbacks import (
    AsyncCallbackManagerForLLMRun,
    CallbackManagerForLLMRun,
)
from langchain_core.language_models import LLM, BaseLanguageModel, LangSmithParams
from langchain_core.messages import AIMessageChunk, ToolCall
from langchain_core.messages.tool import tool_call, tool_call_chunk
from langchain_core.outputs import Generation, GenerationChunk, LLMResult
from langchain_core.pydantic_v1 import Extra, Field, root_validator
from langchain_core.utils import get_from_dict_or_env

from langchain_aws.function_calling import _tools_in_params
from langchain_aws.utils import (
    enforce_stop_tokens,
    get_num_tokens_anthropic,
    get_token_ids_anthropic,
)

AMAZON_BEDROCK_TRACE_KEY = "amazon-bedrock-trace"
GUARDRAILS_BODY_KEY = "amazon-bedrock-guardrailAssessment"
HUMAN_PROMPT = "\n\nHuman:"
ASSISTANT_PROMPT = "\n\nAssistant:"
ALTERNATION_ERROR = (
    "Error: Prompt must alternate between '\n\nHuman:' and '\n\nAssistant:'."
)


def _add_newlines_before_ha(input_text: str) -> str:
    new_text = input_text
    for word in ["Human:", "Assistant:"]:
        new_text = new_text.replace(word, "\n\n" + word)
        for i in range(2):
            new_text = new_text.replace("\n\n\n" + word, "\n\n" + word)
    return new_text


def _human_assistant_format(input_text: str) -> str:
    if input_text.count("Human:") == 0 or (
        input_text.find("Human:") > input_text.find("Assistant:")
        and "Assistant:" in input_text
    ):
        input_text = HUMAN_PROMPT + " " + input_text  # SILENT CORRECTION
    if input_text.count("Assistant:") == 0:
        input_text = input_text + ASSISTANT_PROMPT  # SILENT CORRECTION
    if input_text[: len("Human:")] == "Human:":
        input_text = "\n\n" + input_text
    input_text = _add_newlines_before_ha(input_text)
    count = 0
    # track alternation
    for i in range(len(input_text)):
        if input_text[i : i + len(HUMAN_PROMPT)] == HUMAN_PROMPT:
            if count % 2 == 0:
                count += 1
            else:
                warnings.warn(ALTERNATION_ERROR + f" Received {input_text}")
        if input_text[i : i + len(ASSISTANT_PROMPT)] == ASSISTANT_PROMPT:
            if count % 2 == 1:
                count += 1
            else:
                warnings.warn(ALTERNATION_ERROR + f" Received {input_text}")

    if count % 2 == 1:  # Only saw Human, no Assistant
        input_text = input_text + ASSISTANT_PROMPT  # SILENT CORRECTION

    return input_text


def _stream_response_to_generation_chunk(
    stream_response: Dict[str, Any],
    provider: str,
    output_key: str,
    messages_api: bool,
    coerce_content_to_string: bool,
) -> Union[GenerationChunk, AIMessageChunk, None]:  # type ignore[return]
    """Convert a stream response to a generation chunk."""
    if messages_api:
        msg_type = stream_response.get("type")
        if msg_type == "message_start":
            return AIMessageChunk(
                content="" if coerce_content_to_string else [],
            )
        elif (
            msg_type == "content_block_start"
            and stream_response["content_block"] is not None
            and stream_response["content_block"]["type"] == "tool_use"
        ):
            content_block = stream_response["content_block"]
            content_block["index"] = stream_response["index"]
            tc_chunk = tool_call_chunk(
                index=stream_response["index"],
                id=stream_response["content_block"]["id"],
                name=stream_response["content_block"]["name"],
                args="",
            )
            return AIMessageChunk(
                content=[content_block],
                tool_call_chunks=[tc_chunk],  # type: ignore
            )
        elif msg_type == "content_block_delta":
            if not stream_response["delta"]:
                return AIMessageChunk(content="")
            if stream_response["delta"]["type"] == "text_delta":
                if coerce_content_to_string:
                    return AIMessageChunk(content=stream_response["delta"]["text"])
                else:
                    content_block = stream_response["delta"]
                    content_block["index"] = stream_response["index"]
                    content_block["type"] = "text"
                    return AIMessageChunk(content=[content_block])
            elif stream_response["delta"]["type"] == "input_json_delta":
                content_block = stream_response["delta"]
                content_block["index"] = stream_response["index"]
                content_block["type"] = "tool_use"
                tc_chunk = {
                    "index": stream_response["index"],
                    "id": None,
                    "name": None,
                    "args": stream_response["delta"]["partial_json"],
                }
                return AIMessageChunk(
                    content=[content_block],
                    tool_call_chunks=[tc_chunk],  # type: ignore
                )
        elif msg_type == "message_delta":
            return AIMessageChunk(
                content="",
                response_metadata={
                    "stop_reason": stream_response["delta"]["stop_reason"],
                    "stop_sequence": stream_response["delta"]["stop_sequence"],
                },
            )
        else:
            return None

    # chunk obj format varies with provider
    generation_info = {
        k: v
        for k, v in stream_response.items()
        if k not in [output_key, "prompt_token_count", "generation_token_count"]
    }
    return GenerationChunk(
        text=(
            stream_response[output_key]
            if provider != "mistral"
            else stream_response[output_key][0]["text"]
        ),
        generation_info=generation_info,
    )


def _combine_generation_info_for_llm_result(
    chunks_generation_info: List[Dict[str, Any]], provider_stop_code: str
) -> Dict[str, Any]:
    """
    Returns usage and stop reason information with the intent to pack into an LLMResult
    Takes a list of generation_info from GenerationChunks
    If the messages api is being used,
    the generation_info from some of these chunks should contain "usage" keys
    if not, the token counts should be found within "amazon-bedrock-invocationMetrics"
    """
    total_usage_info = {"prompt_tokens": 0, "completion_tokens": 0}
    stop_reason = ""
    for generation_info in chunks_generation_info:
        if "usage" in generation_info:
            usage_info = generation_info["usage"]
            if "input_tokens" in usage_info:
                total_usage_info["prompt_tokens"] += sum(usage_info["input_tokens"])
            if "output_tokens" in usage_info:
                total_usage_info["completion_tokens"] += sum(
                    usage_info["output_tokens"]
                )
        if "amazon-bedrock-invocationMetrics" in generation_info:
            usage_info = generation_info["amazon-bedrock-invocationMetrics"]
            if "inputTokenCount" in usage_info:
                total_usage_info["prompt_tokens"] += usage_info["inputTokenCount"]
            if "outputTokenCount" in usage_info:
                total_usage_info["completion_tokens"] += usage_info["outputTokenCount"]

        if provider_stop_code is not None and provider_stop_code in generation_info:
            # uses the last stop reason
            stop_reason = generation_info[provider_stop_code]

    total_usage_info["total_tokens"] = (
        total_usage_info["prompt_tokens"] + total_usage_info["completion_tokens"]
    )

    return {"usage": total_usage_info, "stop_reason": stop_reason}


def _get_invocation_metrics_chunk(chunk: Dict[str, Any]) -> GenerationChunk:
    generation_info = {}
    if metrics := chunk.get("amazon-bedrock-invocationMetrics"):
        input_tokens = metrics.get("inputTokenCount", 0)
        output_tokens = metrics.get("outputTokenCount", 0)
        generation_info["usage_metadata"] = {
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
        }
    return GenerationChunk(text="", generation_info=generation_info)


def extract_tool_calls(content: List[dict]) -> List[ToolCall]:
    tool_calls = []
    for block in content:
        if block["type"] != "tool_use":
            continue
        tool_calls.append(
            tool_call(name=block["name"], args=block["input"], id=block["id"])
        )
    return tool_calls


class AnthropicTool(TypedDict):
    name: str
    description: str
    input_schema: Dict[str, Any]


class LLMInputOutputAdapter:
    """Adapter class to prepare the inputs from Langchain to a format
    that LLM model expects.

    It also provides helper function to extract
    the generated text from the model response."""

    provider_to_output_key_map = {
        "anthropic": "completion",
        "amazon": "outputText",
        "cohere": "text",
        "meta": "generation",
        "mistral": "outputs",
    }

    @classmethod
    def prepare_input(
        cls,
        provider: str,
        model_kwargs: Dict[str, Any],
        prompt: Optional[str] = None,
        system: Optional[str] = None,
        messages: Optional[List[Dict]] = None,
        tools: Optional[List[AnthropicTool]] = None,
    ) -> Dict[str, Any]:
        input_body = {**model_kwargs}
        if provider == "anthropic":
            if messages:
                if tools:
                    input_body["tools"] = tools
                input_body["anthropic_version"] = "bedrock-2023-05-31"
                input_body["messages"] = messages
                if system:
                    input_body["system"] = system
                if "max_tokens" not in input_body:
                    input_body["max_tokens"] = 1024
            if prompt:
                input_body["prompt"] = _human_assistant_format(prompt)
                if "max_tokens_to_sample" not in input_body:
                    input_body["max_tokens_to_sample"] = 1024
        elif provider in ("ai21", "cohere", "meta", "mistral"):
            input_body["prompt"] = prompt
        elif provider == "amazon":
            input_body = dict()
            input_body["inputText"] = prompt
            input_body["textGenerationConfig"] = {**model_kwargs}
        else:
            input_body["inputText"] = prompt

        return input_body

    @classmethod
    def prepare_output(cls, provider: str, response: Any) -> dict:
        text = ""
        tool_calls = []
        response_body = json.loads(response.get("body").read().decode())

        if provider == "anthropic":
            if "completion" in response_body:
                text = response_body.get("completion")
            elif "content" in response_body:
                content = response_body.get("content")
                if len(content) == 1 and content[0]["type"] == "text":
                    text = content[0]["text"]
                elif any(block["type"] == "tool_use" for block in content):
                    tool_calls = extract_tool_calls(content)

        else:
            if provider == "ai21":
                text = response_body.get("completions")[0].get("data").get("text")
            elif provider == "cohere":
                text = response_body.get("generations")[0].get("text")
            elif provider == "meta":
                text = response_body.get("generation")
            elif provider == "mistral":
                text = response_body.get("outputs")[0].get("text")
            else:
                text = response_body.get("results")[0].get("outputText")

        headers = response.get("ResponseMetadata", {}).get("HTTPHeaders", {})
        prompt_tokens = int(headers.get("x-amzn-bedrock-input-token-count", 0))
        completion_tokens = int(headers.get("x-amzn-bedrock-output-token-count", 0))
        return {
            "text": text,
            "tool_calls": tool_calls,
            "body": response_body,
            "usage": {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": prompt_tokens + completion_tokens,
            },
            "stop_reason": response_body.get("stop_reason"),
        }

    @classmethod
    def prepare_output_stream(
        cls,
        provider: str,
        response: Any,
        stop: Optional[List[str]] = None,
        messages_api: bool = False,
        coerce_content_to_string: bool = False,
    ) -> Iterator[Union[GenerationChunk, AIMessageChunk]]:
        stream = response.get("body")

        if not stream:
            return

        if messages_api:
            output_key = "message"
        else:
            output_key = cls.provider_to_output_key_map.get(provider, "")

        if not output_key:
            raise ValueError(
                f"Unknown streaming response output key for provider: {provider}"
            )

        for event in stream:
            chunk = event.get("chunk")
            if not chunk:
                continue

            chunk_obj = json.loads(chunk.get("bytes").decode())

            if provider == "cohere" and (
                chunk_obj["is_finished"] or chunk_obj[output_key] == "<EOS_TOKEN>"
            ):
                return

            elif (
                provider == "mistral"
                and chunk_obj.get(output_key, [{}])[0].get("stop_reason", "") == "stop"
            ):
                yield _get_invocation_metrics_chunk(chunk_obj)
                return

            elif provider == "meta" and chunk_obj.get("stop_reason", "") == "stop":
                yield _get_invocation_metrics_chunk(chunk_obj)
                return

            elif messages_api and (chunk_obj.get("type") == "message_stop"):
                yield _get_invocation_metrics_chunk(chunk_obj)
                return

            generation_chunk = _stream_response_to_generation_chunk(
                chunk_obj,
                provider=provider,
                output_key=output_key,
                messages_api=messages_api,
                coerce_content_to_string=coerce_content_to_string,
            )
            if generation_chunk:
                yield generation_chunk
            else:
                continue

    @classmethod
    async def aprepare_output_stream(
        cls,
        provider: str,
        response: Any,
        stop: Optional[List[str]] = None,
        messages_api: bool = False,
        coerce_content_to_string: bool = False,
    ) -> AsyncIterator[Union[GenerationChunk, AIMessageChunk]]:
        stream = response.get("body")

        if not stream:
            return

        output_key = cls.provider_to_output_key_map.get(provider, None)

        if not output_key:
            raise ValueError(
                f"Unknown streaming response output key for provider: {provider}"
            )

        for event in stream:
            chunk = event.get("chunk")
            if not chunk:
                continue

            chunk_obj = json.loads(chunk.get("bytes").decode())

            if provider == "cohere" and (
                chunk_obj["is_finished"] or chunk_obj[output_key] == "<EOS_TOKEN>"
            ):
                return

            if (
                provider == "mistral"
                and chunk_obj.get(output_key, [{}])[0].get("stop_reason", "") == "stop"
            ):
                return

            generation_chunk = _stream_response_to_generation_chunk(
                chunk_obj,
                provider=provider,
                output_key=output_key,
                messages_api=messages_api,
                coerce_content_to_string=coerce_content_to_string,
            )
            if generation_chunk:
                yield generation_chunk
            else:
                continue


class BedrockBase(BaseLanguageModel, ABC):
    """Base class for Bedrock models."""

    client: Any = Field(exclude=True)  #: :meta private:

    region_name: Optional[str] = None
    """The aws region e.g., `us-west-2`. Fallsback to AWS_DEFAULT_REGION env variable
    or region specified in ~/.aws/config in case it is not provided here.
    """

    credentials_profile_name: Optional[str] = Field(default=None, exclude=True)
    """The name of the profile in the ~/.aws/credentials or ~/.aws/config files, which
    has either access keys or role information specified.
    If not specified, the default credential profile or, if on an EC2 instance,
    credentials from IMDS will be used.
    See: https://boto3.amazonaws.com/v1/documentation/api/latest/guide/credentials.html
    """

    config: Any = None
    """An optional botocore.config.Config instance to pass to the client."""

    provider: Optional[str] = None
    """The model provider, e.g., amazon, cohere, ai21, etc. When not supplied, provider
    is extracted from the first part of the model_id e.g. 'amazon' in 
    'amazon.titan-text-express-v1'. This value should be provided for model ids that do
    not have the provider in them, e.g., custom and provisioned models that have an ARN
    associated with them."""

    model_id: str
    """Id of the model to call, e.g., amazon.titan-text-express-v1, this is
    equivalent to the modelId property in the list-foundation-models api. For custom and
    provisioned models, an ARN value is expected."""

    model_kwargs: Optional[Dict[str, Any]] = None
    """Keyword arguments to pass to the model."""

    endpoint_url: Optional[str] = None
    """Needed if you don't want to default to us-east-1 endpoint"""

    streaming: bool = False
    """Whether to stream the results."""

    provider_stop_sequence_key_name_map: Mapping[str, str] = {
        "anthropic": "stop_sequences",
        "amazon": "stopSequences",
        "ai21": "stop_sequences",
        "cohere": "stop_sequences",
        "mistral": "stop_sequences",
    }

    provider_stop_reason_key_map: Mapping[str, str] = {
        "anthropic": "stop_reason",
        "amazon": "completionReason",
        "ai21": "finishReason",
        "cohere": "finish_reason",
        "mistral": "stop_reason",
    }

    guardrails: Optional[Mapping[str, Any]] = {
        "trace": None,
        "guardrailIdentifier": None,
        "guardrailVersion": None,
    }
    """
    An optional dictionary to configure guardrails for Bedrock.

    This field 'guardrails' consists of two keys: 'id' and 'version',
    which should be strings, but are initialized to None. It's used to
    determine if specific guardrails are enabled and properly set.

    Type:
        Optional[Mapping[str, str]]: A mapping with 'id' and 'version' keys.

    Example:
    llm = Bedrock(model_id="<model_id>", client=<bedrock_client>,
                  model_kwargs={},
                  guardrails={
                        "id": "<guardrail_id>",
                        "version": "<guardrail_version>"})

    To enable tracing for guardrails, set the 'trace' key to True and pass a callback handler to the
    'run_manager' parameter of the 'generate', '_call' methods.

    Example:
    llm = Bedrock(model_id="<model_id>", client=<bedrock_client>,
                  model_kwargs={},
                  guardrails={
                        "id": "<guardrail_id>",
                        "version": "<guardrail_version>",
                        "trace": True},
                callbacks=[BedrockAsyncCallbackHandler()])

    [https://python.langchain.com/docs/modules/callbacks/] for more information on callback handlers.

    class BedrockAsyncCallbackHandler(AsyncCallbackHandler):
        async def on_llm_error(
            self,
            error: BaseException,
            **kwargs: Any,
        ) -> Any:
            reason = kwargs.get("reason")
            if reason == "GUARDRAIL_INTERVENED":
                ...Logic to handle guardrail intervention...
    """  # noqa: E501

    @root_validator()
    def validate_environment(cls, values: Dict) -> Dict:
        """Validate that AWS credentials to and python package exists in environment."""

        # Skip creating new client if passed in constructor
        if values["client"] is not None:
            return values

        try:
            import boto3

            if values["credentials_profile_name"] is not None:
                session = boto3.Session(profile_name=values["credentials_profile_name"])
            else:
                # use default credentials
                session = boto3.Session()

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

            values["client"] = session.client("bedrock-runtime", **client_params)

        except ImportError:
            raise ModuleNotFoundError(
                "Could not import boto3 python package. "
                "Please install it with `pip install boto3`."
            )
        except ValueError as e:
            raise ValueError(f"Error raised by bedrock service: {e}")
        except Exception as e:
            raise ValueError(
                "Could not load credentials to authenticate with AWS client. "
                "Please check that credentials in the specified "
                f"profile name are valid. Bedrock error: {e}"
            ) from e

        return values

    @property
    def _identifying_params(self) -> Dict[str, Any]:
        _model_kwargs = self.model_kwargs or {}
        return {
            "model_id": self.model_id,
            "provider": self._get_provider(),
            "stream": self.streaming,
            "trace": self.guardrails.get("trace"),  # type: ignore[union-attr]
            "guardrailIdentifier": self.guardrails.get("guardrailIdentifier", None),  # type: ignore[union-attr]
            "guardrailVersion": self.guardrails.get("guardrailVersion", None),  # type: ignore[union-attr]
            **_model_kwargs,
        }

    def _get_provider(self) -> str:
        if self.provider:
            return self.provider
        if self.model_id.startswith("arn"):
            raise ValueError(
                "Model provider should be supplied when passing a model ARN as "
                "model_id"
            )

        return self.model_id.split(".")[0]

    def _get_model(self) -> str:
        return self.model_id.split(".", maxsplit=1)[-1]

    @property
    def _model_is_anthropic(self) -> bool:
        return self._get_provider() == "anthropic"

    @property
    def _guardrails_enabled(self) -> bool:
        """
        Determines if guardrails are enabled and correctly configured.
        Checks if 'guardrails' is a dictionary with non-empty 'id' and 'version' keys.
        Checks if 'guardrails.trace' is true.

        Returns:
            bool: True if guardrails are correctly configured, False otherwise.
        Raises:
            TypeError: If 'guardrails' lacks 'id' or 'version' keys.
        """
        try:
            return (
                isinstance(self.guardrails, dict)
                and bool(self.guardrails["guardrailIdentifier"])
                and bool(self.guardrails["guardrailVersion"])
            )

        except KeyError as e:
            raise TypeError(
                "Guardrails must be a dictionary with 'guardrailIdentifier'  \
                and 'guardrailVersion' keys."
            ) from e

    def _prepare_input_and_invoke(
        self,
        prompt: Optional[str] = None,
        system: Optional[str] = None,
        messages: Optional[List[Dict]] = None,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> Tuple[
        str,
        List[ToolCall],
        Dict[str, Any],
    ]:
        _model_kwargs = self.model_kwargs or {}

        provider = self._get_provider()
        params = {**_model_kwargs, **kwargs}
        input_body = LLMInputOutputAdapter.prepare_input(
            provider=provider,
            model_kwargs=params,
            prompt=prompt,
            system=system,
            messages=messages,
        )
        if "claude-3" in self._get_model():
            if _tools_in_params(params):
                input_body = LLMInputOutputAdapter.prepare_input(
                    provider=provider,
                    model_kwargs=params,
                    prompt=prompt,
                    system=system,
                    messages=messages,
                    tools=params["tools"],
                )
        body = json.dumps(input_body)
        accept = "application/json"
        contentType = "application/json"

        request_options = {
            "body": body,
            "modelId": self.model_id,
            "accept": accept,
            "contentType": contentType,
        }

        if self._guardrails_enabled:
            request_options["guardrailIdentifier"] = self.guardrails.get(  # type: ignore[union-attr]
                "guardrailIdentifier", ""
            )
            request_options["guardrailVersion"] = self.guardrails.get(  # type: ignore[union-attr]
                "guardrailVersion", ""
            )
            if self.guardrails.get("trace"):  # type: ignore[union-attr]
                request_options["trace"] = "ENABLED"

        try:
            response = self.client.invoke_model(**request_options)

            (
                text,
                tool_calls,
                body,
                usage_info,
                stop_reason,
            ) = LLMInputOutputAdapter.prepare_output(provider, response).values()

        except Exception as e:
            raise ValueError(f"Error raised by bedrock service: {e}")

        if stop is not None:
            text = enforce_stop_tokens(text, stop)

        llm_output = {"usage": usage_info, "stop_reason": stop_reason}

        # Verify and raise a callback error if any intervention occurs or a signal is
        # sent from a Bedrock service,
        # such as when guardrails are triggered.
        services_trace = self._get_bedrock_services_signal(body)  # type: ignore[arg-type]

        if run_manager is not None and services_trace.get("signal"):
            run_manager.on_llm_error(
                Exception(
                    f"Error raised by bedrock service: {services_trace.get('reason')}"
                ),
                **services_trace,
            )

        return text, tool_calls, llm_output

    def _get_bedrock_services_signal(self, body: dict) -> dict:
        """
        This function checks the response body for an interrupt flag or message that indicates
        whether any of the Bedrock services have intervened in the processing flow. It is
        primarily used to identify modifications or interruptions imposed by these services
        during the request-response cycle with a Large Language Model (LLM).
        """  # noqa: E501

        if (
            self._guardrails_enabled
            and self.guardrails.get("trace")  # type: ignore[union-attr]
            and self._is_guardrails_intervention(body)
        ):
            return {
                "signal": True,
                "reason": "GUARDRAIL_INTERVENED",
                "trace": body.get(AMAZON_BEDROCK_TRACE_KEY),
            }

        return {
            "signal": False,
            "reason": None,
            "trace": None,
        }

    def _is_guardrails_intervention(self, body: dict) -> bool:
        return body.get(GUARDRAILS_BODY_KEY) == "GUARDRAIL_INTERVENED"

    def _prepare_input_and_invoke_stream(
        self,
        prompt: Optional[str] = None,
        system: Optional[str] = None,
        messages: Optional[List[Dict]] = None,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> Iterator[Union[GenerationChunk, AIMessageChunk]]:
        _model_kwargs = self.model_kwargs or {}
        provider = self._get_provider()

        if stop:
            if provider not in self.provider_stop_sequence_key_name_map:
                raise ValueError(
                    f"Stop sequence key name for {provider} is not supported."
                )

            # stop sequence from _generate() overrides
            # stop sequences in the class attribute
            if k := self.provider_stop_sequence_key_name_map.get(provider):
                _model_kwargs[k] = stop

        if provider == "cohere":
            _model_kwargs["stream"] = True

        params = {**_model_kwargs, **kwargs}

        input_body = LLMInputOutputAdapter.prepare_input(
            provider=provider,
            prompt=prompt,
            system=system,
            messages=messages,
            model_kwargs=params,
        )
        coerce_content_to_string = True
        if "claude-3" in self._get_model():
            if _tools_in_params(params):
                coerce_content_to_string = False
                input_body = LLMInputOutputAdapter.prepare_input(
                    provider=provider,
                    model_kwargs=params,
                    prompt=prompt,
                    system=system,
                    messages=messages,
                    tools=params["tools"],
                )
        body = json.dumps(input_body)

        request_options = {
            "body": body,
            "modelId": self.model_id,
            "accept": "application/json",
            "contentType": "application/json",
        }

        if self._guardrails_enabled:
            request_options["guardrailIdentifier"] = self.guardrails.get(  # type: ignore[union-attr]
                "guardrailIdentifier", ""
            )
            request_options["guardrailVersion"] = self.guardrails.get(  # type: ignore[union-attr]
                "guardrailVersion", ""
            )
            if self.guardrails.get("trace"):  # type: ignore[union-attr]
                request_options["trace"] = "ENABLED"

        try:
            response = self.client.invoke_model_with_response_stream(**request_options)

        except Exception as e:
            raise ValueError(f"Error raised by bedrock service: {e}")

        for chunk in LLMInputOutputAdapter.prepare_output_stream(
            provider,
            response,
            stop,
            True if messages else False,
            coerce_content_to_string=coerce_content_to_string,
        ):
            yield chunk
            # verify and raise callback error if any middleware intervened
            if not isinstance(chunk, AIMessageChunk):
                self._get_bedrock_services_signal(chunk.generation_info)  # type: ignore[arg-type]

    async def _aprepare_input_and_invoke_stream(
        self,
        prompt: str,
        system: Optional[str] = None,
        messages: Optional[List[Dict]] = None,
        stop: Optional[List[str]] = None,
        run_manager: Optional[AsyncCallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> AsyncIterator[Union[GenerationChunk, AIMessageChunk]]:
        _model_kwargs = self.model_kwargs or {}
        provider = self._get_provider()

        if stop:
            if provider not in self.provider_stop_sequence_key_name_map:
                raise ValueError(
                    f"Stop sequence key name for {provider} is not supported."
                )
            if k := self.provider_stop_sequence_key_name_map.get(provider):
                _model_kwargs[k] = stop

        if provider == "cohere":
            _model_kwargs["stream"] = True

        params = {**_model_kwargs, **kwargs}
        if "claude-3" in self._get_model() and _tools_in_params(params):
            input_body = LLMInputOutputAdapter.prepare_input(
                provider=provider,
                model_kwargs=params,
                prompt=prompt,
                system=system,
                messages=messages,
                tools=params["tools"],
            )
        else:
            input_body = LLMInputOutputAdapter.prepare_input(
                provider=provider,
                prompt=prompt,
                system=system,
                messages=messages,
                model_kwargs=params,
            )
        body = json.dumps(input_body)

        response = await asyncio.get_running_loop().run_in_executor(
            None,
            lambda: self.client.invoke_model_with_response_stream(
                body=body,
                modelId=self.model_id,
                accept="application/json",
                contentType="application/json",
            ),
        )

        async for chunk in LLMInputOutputAdapter.aprepare_output_stream(
            provider,
            response,
            stop,
            True if messages else False,
        ):
            yield chunk


class BedrockLLM(LLM, BedrockBase):
    """Bedrock models.

    To authenticate, the AWS client uses the following methods to
    automatically load credentials:
    https://boto3.amazonaws.com/v1/documentation/api/latest/guide/credentials.html

    If a specific credential profile should be used, you must pass
    the name of the profile from the ~/.aws/credentials file that is to be used.

    Make sure the credentials / roles used have the required policies to
    access the Bedrock service.
    """

    """
    Example:
        .. code-block:: python

            from bedrock_langchain.bedrock_llm import BedrockLLM

            llm = BedrockLLM(
                credentials_profile_name="default",
                model_id="amazon.titan-text-express-v1",
                streaming=True
            )

    """

    @root_validator()
    def validate_environment(cls, values: Dict) -> Dict:
        model_id = values["model_id"]
        if model_id.startswith("anthropic.claude-3"):
            raise ValueError(
                "Claude v3 models are not supported by this LLM."
                "Please use `from langchain_community.chat_models import BedrockChat` "
                "instead."
            )
        return super().validate_environment(values)

    @property
    def _llm_type(self) -> str:
        """Return type of llm."""
        return "amazon_bedrock"

    @classmethod
    def is_lc_serializable(cls) -> bool:
        """Return whether this model can be serialized by Langchain."""
        return True

    @classmethod
    def get_lc_namespace(cls) -> List[str]:
        """Get the namespace of the langchain object."""
        return ["langchain", "llms", "bedrock"]

    @property
    def lc_attributes(self) -> Dict[str, Any]:
        attributes: Dict[str, Any] = {}

        if self.region_name:
            attributes["region_name"] = self.region_name

        return attributes

    def _get_ls_params(
        self, stop: Optional[List[str]] = None, **kwargs: Any
    ) -> LangSmithParams:
        """Get standard params for tracing."""
        ls_params = super()._get_ls_params(stop=stop, **kwargs)
        ls_params["ls_provider"] = "amazon_bedrock"
        ls_params["ls_model_name"] = self.model_id
        return ls_params

    class Config:
        """Configuration for this pydantic object."""

        extra = Extra.forbid

    def _stream(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> Iterator[GenerationChunk]:
        """Call out to Bedrock service with streaming.

        Args:
            prompt (str): The prompt to pass into the model
            stop (Optional[List[str]], optional): Stop sequences. These will
                override any stop sequences in the `model_kwargs` attribute.
                Defaults to None.
            run_manager (Optional[CallbackManagerForLLMRun], optional): Callback
                run managers used to process the output. Defaults to None.

        Returns:
            Iterator[GenerationChunk]: Generator that yields the streamed responses.

        Yields:
            Iterator[GenerationChunk]: Responses from the model.
        """
        return self._prepare_input_and_invoke_stream(  # type: ignore
            prompt=prompt, stop=stop, run_manager=run_manager, **kwargs
        )

    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        """Call out to Bedrock service model.

        Args:
            prompt: The prompt to pass into the model.
            stop: Optional list of stop words to use when generating.

        Returns:
            The string generated by the model.

        Example:
            .. code-block:: python

                response = llm("Tell me a joke.")
        """

        provider = self._get_provider()
        provider_stop_reason_code = self.provider_stop_reason_key_map.get(
            provider, "stop_reason"
        )

        if self.streaming:
            all_chunks: List[GenerationChunk] = []
            completion = ""
            for chunk in self._stream(
                prompt=prompt, stop=stop, run_manager=run_manager, **kwargs
            ):
                completion += chunk.text
                all_chunks.append(chunk)

            if run_manager is not None:
                chunks_generation_info = [
                    chunk.generation_info
                    for chunk in all_chunks
                    if chunk.generation_info is not None
                ]
                llm_output = _combine_generation_info_for_llm_result(
                    chunks_generation_info, provider_stop_code=provider_stop_reason_code
                )
                all_generations = [
                    Generation(text=chunk.text, generation_info=chunk.generation_info)
                    for chunk in all_chunks
                ]
                run_manager.on_llm_end(
                    LLMResult(generations=[all_generations], llm_output=llm_output)
                )

            return completion

        text, tool_calls, llm_output = self._prepare_input_and_invoke(
            prompt=prompt, stop=stop, run_manager=run_manager, **kwargs
        )
        if run_manager is not None:
            run_manager.on_llm_end(
                LLMResult(generations=[[Generation(text=text)]], llm_output=llm_output)
            )

        return text

    async def _astream(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[AsyncCallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> AsyncGenerator[GenerationChunk, None]:
        """Call out to Bedrock service with streaming.

        Args:
            prompt (str): The prompt to pass into the model
            stop (Optional[List[str]], optional): Stop sequences. These will
                override any stop sequences in the `model_kwargs` attribute.
                Defaults to None.
            run_manager (Optional[CallbackManagerForLLMRun], optional): Callback
                run managers used to process the output. Defaults to None.

        Yields:
            AsyncGenerator[GenerationChunk, None]: Generator that asynchronously yields
            the streamed responses.
        """
        async for chunk in self._aprepare_input_and_invoke_stream(
            prompt=prompt, stop=stop, run_manager=run_manager, **kwargs
        ):
            yield chunk  # type: ignore

    async def _acall(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[AsyncCallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        """Call out to Bedrock service model.

        Args:
            prompt: The prompt to pass into the model.
            stop: Optional list of stop words to use when generating.

        Returns:
            The string generated by the model.

        Example:
            .. code-block:: python

                response = await llm._acall("Tell me a joke.")
        """

        if not self.streaming:
            raise ValueError("Streaming must be set to True for async operations. ")

        provider = self._get_provider()
        provider_stop_reason_code = self.provider_stop_reason_key_map.get(
            provider, "stop_reason"
        )

        chunks = [
            chunk
            async for chunk in self._astream(
                prompt=prompt, stop=stop, run_manager=run_manager, **kwargs
            )
        ]

        if run_manager is not None:
            chunks_generation_info = [
                chunk.generation_info
                for chunk in chunks
                if chunk.generation_info is not None
            ]
            llm_output = _combine_generation_info_for_llm_result(
                chunks_generation_info, provider_stop_code=provider_stop_reason_code
            )
            generations = [
                Generation(text=chunk.text, generation_info=chunk.generation_info)
                for chunk in chunks
            ]
            await run_manager.on_llm_end(
                LLMResult(generations=[generations], llm_output=llm_output)
            )

        return "".join([chunk.text for chunk in chunks])

    def get_num_tokens(self, text: str) -> int:
        if self._model_is_anthropic:
            return get_num_tokens_anthropic(text)
        else:
            return super().get_num_tokens(text)

    def get_token_ids(self, text: str) -> List[int]:
        if self._model_is_anthropic:
            return get_token_ids_anthropic(text)
        else:
            return super().get_token_ids(text)


@deprecated(since="0.1.0", removal="0.2.0", alternative="BedrockLLM")
class Bedrock(BedrockLLM):
    pass
