// https://docs.aws.amazon.com/bedrock/latest/APIReference/API_agent_ListAgentAliases.html
export function request(ctx) {
  const { agentId} = ctx.args;

  return {
    resourcePath: `/agents/${agentId}/agentaliases`,
    method: "POST",
    params: {
      headers: {
        "Content-Type": "application/json",
      },
      body: {},
    },
  };
}

export function response(ctx) {
  return {
    body: ctx.result.body,
  };
}
