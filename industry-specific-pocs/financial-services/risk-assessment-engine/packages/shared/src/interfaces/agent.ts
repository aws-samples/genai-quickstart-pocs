// Agent interfaces
export interface Agent {
  analyze(data: unknown): Promise<unknown>;
}