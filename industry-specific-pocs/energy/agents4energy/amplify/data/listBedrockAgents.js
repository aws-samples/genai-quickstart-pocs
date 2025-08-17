// https://docs.aws.amazon.com/bedrock/latest/APIReference/API_agent_ListAgents.html
export function request(ctx) {
  return {
    resourcePath: `/agents`,
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
