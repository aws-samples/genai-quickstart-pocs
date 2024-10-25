// types.ts
export interface POC {
  name: string;
  hasExtension: boolean;
  path: string;
  stackName: string;
  requiredEnvVars?: string[];
}