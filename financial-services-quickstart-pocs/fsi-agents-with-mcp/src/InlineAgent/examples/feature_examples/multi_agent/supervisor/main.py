import asyncio
from InlineAgent.action_group import ActionGroup
from InlineAgent.agent import InlineAgent, require_confirmation

#################################################
# This example is currently under construction #
###############################################
@require_confirmation
def get_current_weather(location: str, state: str, unit: str = "fahrenheit") -> dict:
    """
    Get the current weather in a given location.

    Parameters:
        location: The city, e.g., San Francisco
        state: The state eg CA
        unit: The unit to use, e.g., fahrenheit or celsius. Defaults to "fahrenheit"
    """
    return f"The current weather in {location}, {state} is 70 degrees {unit}."


weather_action_group = ActionGroup(
    name="WeatherActionGroup",
    description="This is action group to get weather",
    tools=[get_current_weather],
)

weather_agent = InlineAgent(
    foundation_model="us.anthropic.claude-3-5-haiku-20241022-v1:0",
    instruction="You are a friendly assistant that is responsible for getting the current weather.",
    action_groups=[weather_action_group],
    agent_name="MockAgent",
)

restaurant_agent = InlineAgent(
    foundation_model="us.anthropic.claude-3-5-sonnet-20241022-v2:0",
    instruction="You are a restaurant assistant helping 'The Regrettable Experience' handle reservations. You can talk about the restaurant menus. If customers ask anything related to reservations please ask the customer to call: +1 999 999 99 9999.",
    agent_name="restaurant_agent",
    user_input=True,
)

supervisor_agent = InlineAgent(
    foundation_model="us.anthropic.claude-3-5-sonnet-20240620-v1:0",
    instruction="You are a supervisor agent that is responsible for managing the flow of the conversation.",
    collaborators=[restaurant_agent, weather_agent],
    agent_name="supervisor_agent",
    agent_collaboration="SUPERVISOR_ROUTER",
)

asyncio.run(supervisor_agent.invoke(input_text="Whats the name of the restaurant, and whats the weather near the restaurant in San Francisco, CA?"))

#################################################
# This example is currently under construction #
###############################################