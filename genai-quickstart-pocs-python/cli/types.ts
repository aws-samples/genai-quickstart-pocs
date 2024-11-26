// types.ts
export interface POC {
  name: string;
  hasExtension: boolean;
  extensionForDeploymentOnly: boolean;
  path: string;
  stackName: string;
  requiredEnvVars?: string[];
}