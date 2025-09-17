// handler.mjs
import { BedrockAgentCoreClient, InvokeAgentRuntimeCommand } from "@aws-sdk/client-bedrock-agentcore";

// IMPORTANT: deploy with @aws-sdk/client-bedrock-agentcore (bundled or via a layer)

export const handler = awslambda.streamifyResponse(async (event, responseStream, context) => {
  const httpStream = awslambda.HttpResponseStream.from(responseStream, {
    statusCode: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
      // CORS headers removed - handled by Function URL configuration
    }
  });

  const region = process.env.AWS_REGION || "us-east-1";
  const runtimeArn = process.env.AGENTCORE_RUNTIME_ARN || "placeholder";
  const qualifier  = process.env.AGENTCORE_QUALIFIER || "DEFAULT";
  const s3SessionBucket = process.env.AGENT_SESSION_S3 || "";
  const fundDocumentsBucket = process.env.FUND_DOCUMENTS_BUCKET || "";
  const knowledgeBaseId = process.env.KNOWLEDGE_BASE_ID || "";

  // Log environment variables for debugging
  console.log('Environment variables:', {
    AWS_REGION: process.env.AWS_REGION,
    AGENTCORE_RUNTIME_ARN: process.env.AGENTCORE_RUNTIME_ARN,
    AGENTCORE_QUALIFIER: process.env.AGENTCORE_QUALIFIER,
    AGENT_SESSION_S3: process.env.AGENT_SESSION_S3,
    FUND_DOCUMENTS_BUCKET: process.env.FUND_DOCUMENTS_BUCKET,
    KNOWLEDGE_BASE_ID: process.env.KNOWLEDGE_BASE_ID,
    region,
    runtimeArn,
    qualifier,
    s3SessionBucket,
    fundDocumentsBucket,
    knowledgeBaseId
  });

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch {}
  const prompt      = body.prompt ?? "Hello";
  const sessionId   = body.session_id ?? "default-session";
  const model       = body.model ?? "us.amazon.nova-micro-v1:0";
  const personality = body.personality ?? "basic";

  console.log('Request parameters:', { prompt, sessionId, model, personality, s3SessionBucket });

  const client = new BedrockAgentCoreClient({ region });

  // Pass all parameters including S3 session bucket and fund documents bucket to the agent
  const payload = JSON.stringify({ 
    prompt, 
    session_id: sessionId,
    model, 
    personality,
    s3sessionbucket: s3SessionBucket,
    fund_documents_bucket: fundDocumentsBucket,
    knowledge_base_id: knowledgeBaseId
  });

  const cmd = new InvokeAgentRuntimeCommand({
    agentRuntimeArn: runtimeArn,
    runtimeSessionId: sessionId,
    payload,
    contentType: "application/json",
    accept: "text/event-stream",
    qualifier
  });

  try {
    const resp = await client.send(cmd);

    // Stream AgentCore SSE directly to client
    for await (const chunk of resp.response) {
      // chunk is Uint8Array that already contains "data: ..." SSE lines
      httpStream.write(chunk);
    }
  } catch (err) {
    // Emit an SSE error event so the client sees something useful
    const msg = (err?.message || "unknown error").replace(/\n/g, " ");
    httpStream.write(`event: error\ndata: ${msg}\n\n`);
  } finally {
    httpStream.end();
  }
});
