export interface ModelOption {
  id: string;
  name: string;
  description: string;
}

export interface PersonalityOption {
  id: string;
  name: string;
  description: string;
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'us.amazon.nova-micro-v1:0',
    name: 'Amazon Nova Micro',
    description: 'Fast and efficient for simple tasks'
  },
  {
    id: 'us.amazon.nova-pro-v1:0',
    name: 'Amazon Nova Pro',
    description: 'Balanced performance and capability'
  },
  {
    id: 'us.amazon.nova-premier-v1:0',
    name: 'Amazon Nova Premier',
    description: 'Most capable Nova model'
  },
  {
    id: 'us.anthropic.claude-sonnet-4-20250514-v1:0',
    name: 'Claude Sonnet 4',
    description: 'Advanced reasoning and analysis'
  }
];

export const PERSONALITY_OPTIONS: PersonalityOption[] = [
  {
    id: 'pe',
    name: 'PE Redemptions (Strands)',
    description: 'Process PE Redemptions using internal Strands tools'
  },
  {
    id: 'mcp',
    name: 'PE Redemptions (MCP)',
    description: 'Process PE Redemptions using MCP Gateway tools',
  },
  {
    id: 'analyst',
    name: 'PR Fund Analyst',
    description: 'Not redemptions focused - returns information on the PE Funds/Inestors'
  },
];

export const DEFAULT_MODEL = 'us.amazon.nova-pro-v1:0';
export const DEFAULT_PERSONALITY = 'pe';
