// MCP interfaces
export interface MCPServer {
  handleRequest(request: unknown): Promise<unknown>;
}