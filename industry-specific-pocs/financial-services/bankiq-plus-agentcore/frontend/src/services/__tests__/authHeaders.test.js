import { describe, it, expect, beforeEach, vi } from 'vitest';

// Every backend call must carry the signed-in user's Cognito ID token.
vi.mock('@aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn(async () => ({ tokens: { idToken: { toString: () => 'id-token-123' } } })),
}));

const { api } = await import('../api');
const { default: AgentService } = await import('../AgentService');

global.fetch = vi.fn();

function ok(body) {
  return { ok: true, json: async () => body };
}

function expectEveryCallAuthorized() {
  expect(fetch).toHaveBeenCalled();
  for (const [url, init] of fetch.mock.calls) {
    expect(init?.headers?.Authorization, url).toBe('Bearer id-token-123');
  }
}

describe('Authorization header on backend calls', () => {
  beforeEach(() => {
    fetch.mockReset();
  });

  it('api: SEC filings, bank search, jobs and uploads', async () => {
    fetch.mockResolvedValue(ok({ success: true, results: [], status: 'completed', result: 'r', jobId: 'j', '10-K': [], '10-Q': [], documents: [] }));
    await api.getSECReports('Bank', 2024, false, '0000019617');
    await api.searchBanks('JPM');
    await api.submitJob('hi');
    await api.checkJobStatus('j');
    await api.getJobResult('j');
    await api.uploadPDFs([{ name: 'a.pdf', content: 'x' }]);
    expectEveryCallAuthorized();
  });

  it('AgentService: status and async job polling', async () => {
    vi.useFakeTimers();
    fetch.mockResolvedValue(ok({ status: 'completed', jobId: 'j', result: 'done' }));
    await AgentService.connectAgent();
    const chat = AgentService.chatWithAgent('q', 'Bank');
    await vi.advanceTimersByTimeAsync(2000);
    await chat;
    vi.useRealTimers();
    expectEveryCallAuthorized();
    expect(fetch.mock.calls.map(([u]) => u.replace(/^.*\/api/, '/api'))).toEqual([
      '/api/agent-status', '/api/jobs/submit', '/api/jobs/j', '/api/jobs/j/result',
    ]);
  });
});
