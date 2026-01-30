import { api } from '../api';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Service Tests', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('analyzePeers', () => {
    it('should parse DATA: prefix format correctly', async () => {
      const mockResponse = `DATA: {"data": [{"Bank": "JPMorgan", "Quarter": "2024-Q1", "Metric": "ROA", "Value": 1.5}], "base_bank": "JPMorgan", "peer_banks": ["BofA"]}
      
      Analysis: JPMorgan shows strong performance...`;

      // Mock job submission and polling
      fetch
        .mockResolvedValueOnce({ // submitJob
          ok: true,
          json: async () => ({ jobId: 'test-123', status: 'pending' })
        })
        .mockResolvedValueOnce({ // pollJob - status check
          ok: true,
          json: async () => ({ status: 'completed' })
        })
        .mockResolvedValueOnce({ // pollJob - get result
          ok: true,
          json: async () => ({ status: 'completed', result: mockResponse })
        });

      const result = await api.analyzePeers('JPMorgan', ['BofA'], 'ROA');

      expect(result.success).toBe(true);
      expect(result.result.data).toHaveLength(1);
      expect(result.result.data[0].Bank).toBe('JPMorgan');
      expect(result.result.analysis).not.toContain('DATA:');
    });

    it('should parse embedded JSON format', async () => {
      const mockResponse = `Here is the analysis:
      {"data": [{"Bank": "Wells", "Quarter": "2024-Q2", "Metric": "ROE", "Value": 12.3}]}
      The data shows...`;

      fetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ jobId: 'test-456', status: 'pending' }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'completed' }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'completed', result: mockResponse }) });

      const result = await api.analyzePeers('Wells', ['Citi'], 'ROE');

      expect(result.result.data).toHaveLength(1);
      expect(result.result.data[0].Value).toBe(12.3);
    });

    it('should handle missing data gracefully', async () => {
      const mockResponse = 'Analysis without any data structure';

      fetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ jobId: 'test-789', status: 'pending' }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'completed' }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'completed', result: mockResponse }) });

      const result = await api.analyzePeers('Citi', ['USB'], 'NIM');

      expect(result.result.data).toEqual([]);
      expect(result.result.analysis).toBe(mockResponse);
    });
  });

  describe('getFDICData', () => {
    it('should extract FDIC data from agent response', async () => {
      const mockResponse = `{"success": true, "data": [{"NAME": "JPMorgan", "ROA": 1.5, "ROE": 15.2}]}`;

      fetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ jobId: 'fdic-123', status: 'pending' }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'completed' }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'completed', result: mockResponse }) });

      const result = await api.getFDICData();

      expect(result.success).toBe(true);
      expect(result.result.data).toHaveLength(1);
      expect(result.result.data[0].NAME).toBe('JPMorgan');
    });
  });

  describe('uploadPDFs', () => {
    it('should try agent upload first, then fallback', async () => {
      const mockFiles = [{ name: 'test.pdf', content: 'base64content' }];

      // Agent upload fails
      fetch.mockResolvedValueOnce({ ok: false, status: 500 });
      
      // Direct upload succeeds
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, documents: [{ filename: 'test.pdf' }] })
      });

      const result = await api.uploadPDFs(mockFiles);

      expect(result.success).toBe(true);
      expect(result.method).toBe('direct');
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
});
