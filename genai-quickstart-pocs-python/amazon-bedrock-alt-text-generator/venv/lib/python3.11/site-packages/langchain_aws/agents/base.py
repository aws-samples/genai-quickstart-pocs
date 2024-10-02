from __future__ import annotations

import json
import logging
import time
import uuid
from collections import defaultdict
from typing import Any, Dict, List, Optional, Tuple, TypedDict, Union

import boto3
from botocore.client import Config
from botocore.exceptions import UnknownServiceError
from langchain_core.agents import AgentAction, AgentFinish
from langchain_core.callbacks import CallbackManager
from langchain_core.load import dumpd
from langchain_core.messages import AIMessage
from langchain_core.pydantic_v1 import root_validator
from langchain_core.runnables import RunnableConfig, RunnableSerializable, ensure_config
from langchain_core.tools import BaseTool

_DEFAULT_ACTION_GROUP_NAME = "DEFAULT_AG_"
_TEST_AGENT_ALIAS_ID = "TSTALIASID"


def get_boto_session(
    credentials_profile_name: Optional[str] = None,
    region_name: Optional[str] = None,
    endpoint_url: Optional[str] = None,
) -> Any:
    """
    Construct the boto3 session
    """
    if credentials_profile_name:
        session = boto3.Session(profile_name=credentials_profile_name)
    else:
        # use default credentials
        session = boto3.Session()
    client_params = {
        "config": Config(
            connect_timeout=120, read_timeout=120, retries={"max_attempts": 0}
        )
    }
    if region_name:
        client_params["region_name"] = region_name
    if endpoint_url:
        client_params["endpoint_url"] = endpoint_url
    return client_params, session


def parse_agent_response(response: Any) -> OutputType:
    """
    Parses the raw response from Bedrock Agent

    Args:
        response: The raw response from Bedrock Agent

    Returns
        Either a BedrockAgentAction or a BedrockAgentFinish
    """
    response_text = ""
    event_stream = response["completion"]
    session_id = response["sessionId"]
    for event in event_stream:
        if "returnControl" in event:
            response_text = json.dumps(event)
            break

        if "chunk" in event:
            response_text = event["chunk"]["bytes"].decode("utf-8")

    agent_finish = BedrockAgentFinish(
        return_values={"output": response_text},
        log=response_text,
        session_id=session_id,
    )
    if not response_text:
        return agent_finish

    if "returnControl" not in response_text:
        return agent_finish

    return_control = json.loads(response_text).get("returnControl")
    if not return_control:
        return agent_finish

    invocation_inputs = return_control.get("invocationInputs")
    if not invocation_inputs:
        return agent_finish

    try:
        invocation_input = invocation_inputs[0].get("functionInvocationInput", {})
        action_group = invocation_input.get("actionGroup", "")
        function = invocation_input.get("function", "")
        parameters = invocation_input.get("parameters", [])
        parameters_json = {}
        for parameter in parameters:
            parameters_json[parameter.get("name")] = parameter.get("value", "")

        tool = f"{action_group}::{function}"
        if _DEFAULT_ACTION_GROUP_NAME in action_group:
            tool = f"{function}"
        return [
            BedrockAgentAction(
                tool=tool,
                tool_input=parameters_json,
                log=response_text,
                session_id=session_id,
            )
        ]
    except Exception as ex:
        raise Exception("Parse exception encountered {}".format(repr(ex)))


def _create_bedrock_agent(
    bedrock_client: Any,
    agent_name: str,
    agent_resource_role_arn: str,
    instruction: str,
    foundation_model: str,
    client_token: Optional[str] = None,
    customer_encryption_key_arn: Optional[str] = None,
    description: Optional[str] = None,
    guardrail_configuration: Optional[GuardrailConfiguration] = None,
    idle_session_ttl_in_seconds: Optional[int] = None,
) -> Union[str, None]:
    """
    Creates the bedrock agent
    """
    create_agent_request: dict = {
        "agentName": agent_name,
        "agentResourceRoleArn": agent_resource_role_arn,
        "foundationModel": foundation_model,
        "instruction": instruction,
    }

    if description:
        create_agent_request["description"] = description

    if client_token:
        create_agent_request["clientToken"] = client_token

    if customer_encryption_key_arn:
        create_agent_request["customerEncryptionKeyArn"] = customer_encryption_key_arn

    if guardrail_configuration is not None:
        create_agent_request["guardrailConfiguration"] = {
            "guardrailIdentifier": guardrail_configuration["guardrail_identifier"],
            "guardrailVersion": guardrail_configuration["guardrail_version"] or "DRAFT",
        }

    if idle_session_ttl_in_seconds:
        create_agent_request["idleSessionTTLInSeconds"] = idle_session_ttl_in_seconds

    create_agent_response = bedrock_client.create_agent(**create_agent_request)
    request_id = create_agent_response.get("ResponseMetadata", {}).get("RequestId", "")
    logging.info(f"Create bedrock agent call successful with request id: {request_id}")
    agent_id = create_agent_response["agent"]["agentId"]
    create_agent_start_time = time.time()
    while time.time() - create_agent_start_time < 10:
        agent_creation_status = (
            bedrock_client.get_agent(agentId=agent_id)
            .get("agent", {})
            .get("agentStatus", {})
        )
        if agent_creation_status == "NOT_PREPARED":
            return agent_id
        else:
            time.sleep(2)

    logging.error(f"Failed to create bedrock agent {agent_id}")
    raise Exception(f"Failed to create bedrock agent {agent_id}")


def _get_action_group_and_function_names(tool: BaseTool) -> Tuple[str, str]:
    """
    Convert the LangChain 'Tool' into Bedrock Action Group name and Function name
    """
    action_group_name = _DEFAULT_ACTION_GROUP_NAME
    function_name = tool.name
    tool_name_split = tool.name.split("::")
    if len(tool_name_split) > 1:
        action_group_name = tool_name_split[0]
        function_name = tool_name_split[1]
    return action_group_name, function_name


def _create_bedrock_action_groups(
    bedrock_client: Any, agent_id: str, tools: List[BaseTool]
) -> None:
    """Create the bedrock action groups for the agent"""

    tools_by_action_group = defaultdict(list)
    for tool in tools:
        action_group_name, function_name = _get_action_group_and_function_names(tool)
        tools_by_action_group[action_group_name].append(tool)
    for action_group_name, functions in tools_by_action_group.items():
        bedrock_client.create_agent_action_group(
            actionGroupName=action_group_name,
            actionGroupState="ENABLED",
            actionGroupExecutor={"customControl": "RETURN_CONTROL"},
            functionSchema={
                "functions": [_tool_to_function(function) for function in functions]
            },
            agentId=agent_id,
            agentVersion="DRAFT",
        )


def _tool_to_function(tool: BaseTool) -> dict:
    """
    Convert LangChain tool to a Bedrock function schema
    """
    _, function_name = _get_action_group_and_function_names(tool)
    function_parameters = {}
    for arg_name, arg_details in tool.args.items():
        function_parameters[arg_name] = {
            "description": arg_details.get(
                "description", arg_details.get("title", arg_name)
            ),
            "type": arg_details.get("type", "string"),
            "required": not bool(arg_details.get("default", None)),
        }
    return {
        "description": tool.description,
        "name": function_name,
        "parameters": function_parameters,
    }


def _prepare_agent(bedrock_client: Any, agent_id: str) -> None:
    """
    Prepare the agent for invocations
    """
    bedrock_client.prepare_agent(agentId=agent_id)
    prepare_agent_start_time = time.time()
    while time.time() - prepare_agent_start_time < 10:
        agent_status = bedrock_client.get_agent(agentId=agent_id)
        if agent_status.get("agent", {}).get("agentStatus", "") == "PREPARED":
            return
        else:
            time.sleep(2)
    raise Exception(f"Timed out while preparing the agent with id {agent_id}")


def _get_bedrock_agent(bedrock_client: Any, agent_name: str) -> Any:
    """
    Get the agent by name
    """
    next_token = None
    while True:
        if next_token:
            list_agents_response = bedrock_client.list_agents(
                maxResults=1000, nextToken=next_token
            )
        else:
            list_agents_response = bedrock_client.list_agents(maxResults=1000)
        agent_summaries = list_agents_response.get("agentSummaries", [])
        next_token = list_agents_response.get("nextToken")
        agent_summary = next(
            (x for x in agent_summaries if x.get("agentName") == agent_name), None
        )
        if agent_summary:
            return agent_summary
        if next_token is None:
            return None


class BedrockAgentFinish(AgentFinish):
    """AgentFinish with session id information.

    Parameters:
        session_id: Session id
    """

    session_id: str

    @classmethod
    def is_lc_serializable(cls) -> bool:
        """Check if the class is serializable by LangChain.

        Returns:
            False
        """
        return False


class BedrockAgentAction(AgentAction):
    """AgentAction with session id information.

    Parameters:
        session_id: session id
    """

    session_id: str

    @classmethod
    def is_lc_serializable(cls) -> bool:
        """Check if the class is serializable by LangChain.

        Returns:
            False
        """
        return False


OutputType = Union[List[BedrockAgentAction], BedrockAgentFinish]


class GuardrailConfiguration(TypedDict):
    guardrail_identifier: str
    guardrail_version: str


class BedrockAgentsRunnable(RunnableSerializable[Dict, OutputType]):
    """
    Invoke a Bedrock Agent
    """

    agent_id: Optional[str]
    """Bedrock Agent Id"""
    agent_alias_id: Optional[str] = _TEST_AGENT_ALIAS_ID
    """Bedrock Agent Alias Id"""
    client: Any
    """Boto3 client"""
    region_name: Optional[str] = None
    """Region"""
    credentials_profile_name: Optional[str] = None
    """Credentials to use to invoke the agent"""
    endpoint_url: Optional[str] = None
    """Endpoint URL"""

    @root_validator(skip_on_failure=True)
    def validate_agent(cls, values: dict) -> dict:
        if values.get("client") is not None:
            return values

        try:
            client_params, session = get_boto_session(
                credentials_profile_name=values["credentials_profile_name"],
                region_name=values["region_name"],
                endpoint_url=values["endpoint_url"],
            )

            values["client"] = session.client("bedrock-agent-runtime", **client_params)

            return values
        except ImportError:
            raise ModuleNotFoundError(
                "Could not import boto3 python package. "
                "Please install it with `pip install boto3`."
            )
        except UnknownServiceError as e:
            raise ModuleNotFoundError(
                "Ensure that you have installed the latest boto3 package "
                "that contains the API for `bedrock-runtime-agent`."
            ) from e
        except Exception as e:
            raise ValueError(
                "Could not load credentials to authenticate with AWS client. "
                "Please check that credentials in the specified "
                "profile name are valid."
            ) from e

    @classmethod
    def create_agent(
        cls,
        agent_name: str,
        agent_resource_role_arn: str,
        foundation_model: str,
        instruction: str,
        tools: List[BaseTool] = [],
        *,
        client_token: Optional[str] = None,
        customer_encryption_key_arn: Optional[str] = None,
        description: Optional[str] = None,
        guardrail_configuration: Optional[GuardrailConfiguration] = None,
        idle_session_ttl_in_seconds: Optional[int] = None,
        credentials_profile_name: Optional[str] = None,
        region_name: Optional[str] = None,
        bedrock_endpoint_url: Optional[str] = None,
        runtime_endpoint_url: Optional[str] = None,
        **kwargs: Any,
    ) -> BedrockAgentsRunnable:
        """
        Creates a Bedrock Agent Runnable that can be used with an AgentExecutor
        or with LangGraph.

        This also sets up the Bedrock agent, actions and action groups infrastructure
        if they don't exist, ensures the agent is in PREPARED state so that it is
        ready to be called.

        Args:
            agent_name: Name of the agent
            agent_resource_role_arn: The Amazon Resource Name (ARN) of the IAM role with
                permissions to invoke API operations on the agent.
            foundation_model: The foundation model to be used for orchestration by the
                agent you create
            instruction: Instructions that tell the agent what it should do and how it
                should interact with users
            tools: List of tools. Accepts LangChain's BaseTool format
            client_token: A unique, case-sensitive identifier to ensure that the API
                request completes no more than one time. If this token matches a
                previous request, Amazon Bedrock ignores the request, but does not
                return an error
            customer_encryption_key_arn: The Amazon Resource Name (ARN) of the KMS key
                with which to encrypt the agent
            description: A description of the agent
            guardrail_configuration: The unique Guardrail configuration assigned to the
                agent when it is created.
            idle_session_ttl_in_seconds: The number of seconds for which Amazon Bedrock
                keeps information about a user's conversation with the agent. A user
                interaction remains active for the amount of time specified. If no
                conversation occurs during this time, the session expires and Amazon
                Bedrock deletes any data provided before the timeout
            credentials_profile_name: The profile name to use if different from default
            region_name: Region for the Bedrock agent
            bedrock_endpoint_url: Endpoint URL for bedrock agent
            runtime_endpoint_url: Endpoint URL for bedrock agent runtime
            **kwargs: Additional arguments
        Returns:
            BedrockAgentsRunnable configured to invoke the Bedrock agent
        """
        client_params, session = get_boto_session(
            credentials_profile_name=credentials_profile_name,
            region_name=region_name,
            endpoint_url=bedrock_endpoint_url,
        )
        bedrock_client = session.client("bedrock-agent", **client_params)
        bedrock_agent = _get_bedrock_agent(
            bedrock_client=bedrock_client, agent_name=agent_name
        )

        if bedrock_agent:
            agent_id = bedrock_agent["agentId"]
            agent_status = bedrock_agent["agentStatus"]
            if agent_status != "PREPARED":
                _prepare_agent(bedrock_client, agent_id)
        else:
            try:
                agent_id = _create_bedrock_agent(
                    bedrock_client=bedrock_client,
                    agent_name=agent_name,
                    agent_resource_role_arn=agent_resource_role_arn,
                    instruction=instruction,
                    foundation_model=foundation_model,
                    client_token=client_token,
                    customer_encryption_key_arn=customer_encryption_key_arn,
                    description=description,
                    guardrail_configuration=guardrail_configuration,
                    idle_session_ttl_in_seconds=idle_session_ttl_in_seconds,
                )
                _create_bedrock_action_groups(bedrock_client, agent_id, tools)
                _prepare_agent(bedrock_client, agent_id)
            except Exception as exception:
                logging.error(f"Error in create agent call: {exception}")
                raise exception

        return cls(
            agent_id=agent_id,
            region_name=region_name,
            credentials_profile_name=credentials_profile_name,
            endpoint_url=runtime_endpoint_url,
            **kwargs,
        )

    def invoke(
        self, input: Dict, config: Optional[RunnableConfig] = None
    ) -> OutputType:
        """
        Invoke the Bedrock agent.

        Args:
            input: The LangChain Runnable input dictionary that can include:
                input: The input text to the agent
                memory_id: The memory id to use for an agent with memory enabled
                session_id: The session id to use. If not provided, a new session will
                    be started
                end_session: Boolean indicating whether to end a session or not
                intermediate_steps: The intermediate steps that are used to provide RoC
                    invocation details
                enable_trace: Boolean flag to enable trace when invoke bedrock agent

        Returns:
            Union[List[BedrockAgentAction], BedrockAgentFinish]
        """
        config = ensure_config(config)
        callback_manager = CallbackManager.configure(
            inheritable_callbacks=config.get("callbacks"),
            inheritable_tags=config.get("tags"),
            inheritable_metadata=config.get("metadata"),
        )
        run_manager = callback_manager.on_chain_start(
            dumpd(self), input, name=config.get("run_name")
        )

        try:
            agent_input = {
                "agentId": self.agent_id,
                "agentAliasId": self.agent_alias_id,
                "enableTrace": input.get("enable_trace", False),
                "endSession": bool(input.get("end_session", False)),
            }

            if input.get("memory_id"):
                agent_input["memoryId"] = input.get("memory_id")

            if input.get("intermediate_steps"):
                session_id, session_state = self._parse_intermediate_steps(
                    input.get("intermediate_steps")  # type: ignore[arg-type]
                )

                if session_id is not None:
                    agent_input["sessionId"] = session_id

                if session_state is not None:
                    agent_input["sessionState"] = session_state
            else:
                agent_input["inputText"] = input.get("input", "")
                agent_input["sessionId"] = input.get("session_id", str(uuid.uuid4()))

            output = self.client.invoke_agent(**agent_input)
        except Exception as e:
            run_manager.on_chain_error(e)
            raise e

        try:
            response = parse_agent_response(output)
        except Exception as e:
            run_manager.on_chain_error(e)
            raise e
        else:
            run_manager.on_chain_end(response)
            return response

    def _parse_intermediate_steps(
        self, intermediate_steps: List[Tuple[BedrockAgentAction, str]]
    ) -> Tuple[Union[str, None], Union[Dict[str, Any], None]]:
        last_step = max(0, len(intermediate_steps) - 1)
        action = intermediate_steps[last_step][0]
        tool_invoked = action.tool
        messages = action.messages
        session_id = action.session_id

        if tool_invoked:
            action_group_name = _DEFAULT_ACTION_GROUP_NAME
            function_name = tool_invoked
            tool_name_split = tool_invoked.split("::")
            if len(tool_name_split) > 1:
                action_group_name = tool_name_split[0]
                function_name = tool_name_split[1]

            if messages:
                last_message = max(0, len(messages) - 1)
                message = messages[last_message]
                if type(message) is AIMessage:
                    response = intermediate_steps[last_step][1]
                    session_state = {
                        "invocationId": json.loads(message.content)  # type: ignore[arg-type]
                        .get("returnControl", {})
                        .get("invocationId", ""),
                        "returnControlInvocationResults": [
                            {
                                "functionResult": {
                                    "actionGroup": action_group_name,
                                    "function": function_name,
                                    "responseBody": {"TEXT": {"body": response}},
                                }
                            }
                        ],
                    }

                    return session_id, session_state

        return None, None
