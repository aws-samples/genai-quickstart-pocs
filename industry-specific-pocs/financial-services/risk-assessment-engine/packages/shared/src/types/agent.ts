// Agent types
export interface AgentResult {
  agentType: string;
  riskScore: number;
  insights: Record<string, unknown>;
  confidence: number;
}