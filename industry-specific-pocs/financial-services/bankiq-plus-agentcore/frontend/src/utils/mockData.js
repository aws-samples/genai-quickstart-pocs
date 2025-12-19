/**
 * Mock data for local testing without backend
 */

export const mockPeerAnalysisResponse = {
  success: true,
  result: {
    data: [
      { Bank: 'JPMORGAN CHASE BANK', Quarter: '2024-Q1', Metric: 'ROA', Value: 1.38 },
      { Bank: 'JPMORGAN CHASE BANK', Quarter: '2024-Q2', Metric: 'ROA', Value: 1.41 },
      { Bank: 'JPMORGAN CHASE BANK', Quarter: '2024-Q3', Metric: 'ROA', Value: 1.44 },
      { Bank: 'JPMORGAN CHASE BANK', Quarter: '2024-Q4', Metric: 'ROA', Value: 1.47 },
      { Bank: 'BANK OF AMERICA', Quarter: '2024-Q1', Metric: 'ROA', Value: 1.31 },
      { Bank: 'BANK OF AMERICA', Quarter: '2024-Q2', Metric: 'ROA', Value: 1.34 },
      { Bank: 'BANK OF AMERICA', Quarter: '2024-Q3', Metric: 'ROA', Value: 1.37 },
      { Bank: 'BANK OF AMERICA', Quarter: '2024-Q4', Metric: 'ROA', Value: 1.40 },
      { Bank: 'WELLS FARGO BANK', Quarter: '2024-Q1', Metric: 'ROA', Value: 1.24 },
      { Bank: 'WELLS FARGO BANK', Quarter: '2024-Q2', Metric: 'ROA', Value: 1.27 },
      { Bank: 'WELLS FARGO BANK', Quarter: '2024-Q3', Metric: 'ROA', Value: 1.30 },
      { Bank: 'WELLS FARGO BANK', Quarter: '2024-Q4', Metric: 'ROA', Value: 1.33 }
    ],
    analysis: `## ROA Performance Analysis

**JPMorgan Chase** leads the peer group with a Return on Assets (ROA) of 1.47% in Q4 2024, demonstrating superior asset utilization and profitability. The bank has shown consistent improvement throughout 2024, increasing from 1.38% in Q1 to 1.47% in Q4, representing a 9 basis point improvement.

**Bank of America** maintains a strong competitive position with 1.40% ROA in Q4 2024, trailing JPMorgan by only 7 basis points. The bank has also shown steady improvement, gaining 9 basis points year-over-year. **Wells Fargo** ranks third with 1.33% ROA, showing a 9 basis point improvement but maintaining a 14 basis point gap to JPMorgan.

The consistent upward trajectory across all three banks indicates favorable operating conditions in 2024, with JPMorgan maintaining its leadership position through superior operational efficiency and asset quality management.`,
    base_bank: 'JPMORGAN CHASE BANK',
    peer_banks: ['BANK OF AMERICA', 'WELLS FARGO BANK']
  }
};

export const mockFDICDataResponse = {
  success: true,
  result: {
    data: [
      { NAME: 'JPMORGAN CHASE BANK', ASSET: 3200000, ROA: 1.47, ROE: 15.2, NIMY: 2.8 },
      { NAME: 'BANK OF AMERICA', ASSET: 2500000, ROA: 1.40, ROE: 14.8, NIMY: 2.6 },
      { NAME: 'WELLS FARGO BANK', ASSET: 1800000, ROA: 1.33, ROE: 13.9, NIMY: 2.9 },
      { NAME: 'CITIBANK', ASSET: 1700000, ROA: 1.21, ROE: 13.2, NIMY: 2.7 }
    ],
    data_source: 'FDIC Call Reports (Mock Data)'
  }
};

export const mockSECFilingsResponse = {
  response: 'Found SEC filings for JPMorgan Chase',
  '10-K': [
    {
      form: '10-K',
      filing_date: '2024-02-28',
      accession: '0000019617-24-000123',
      url: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0000019617&type=10-K'
    },
    {
      form: '10-K',
      filing_date: '2023-02-28',
      accession: '0000019617-23-000123',
      url: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0000019617&type=10-K'
    }
  ],
  '10-Q': [
    {
      form: '10-Q',
      filing_date: '2024-11-05',
      accession: '0000019617-24-000456',
      url: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0000019617&type=10-Q'
    },
    {
      form: '10-Q',
      filing_date: '2024-08-05',
      accession: '0000019617-24-000345',
      url: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0000019617&type=10-Q'
    }
  ]
};

export const mockPDFUploadResponse = {
  success: true,
  documents: [
    {
      bank_name: 'Webster Financial Corporation',
      form_type: '10-K',
      year: 2024,
      filename: 'webster-10k-2024.pdf',
      size: 2500000,
      s3_key: 'uploaded-docs/Webster_Financial_Corporation/2024/10-K/webster-10k-2024.pdf'
    }
  ],
  method: 'agent'
};

export const mockChatResponse = {
  response: `Based on the 10-K filing, Webster Financial Corporation reported strong performance in fiscal year 2024:

**Key Financial Metrics:**
- Total Assets: $72.5 billion (up 8% YoY)
- Net Income: $850 million
- Return on Assets (ROA): 1.17%
- Return on Equity (ROE): 12.3%

**Strategic Highlights:**
- Expanded commercial lending portfolio by 12%
- Improved net interest margin to 3.2%
- Maintained strong capital ratios above regulatory requirements

The bank demonstrated resilience in a challenging rate environment while maintaining asset quality with a low non-performing loan ratio of 0.45%.`,
  sources: []
};

/**
 * Enable mock mode for testing
 */
export function enableMockMode() {
  console.warn('🧪 MOCK MODE ENABLED - Using test data instead of real API calls');
  window.__MOCK_MODE__ = true;
}

export function disableMockMode() {
  console.log('✅ Mock mode disabled - Using real API');
  window.__MOCK_MODE__ = false;
}

export function isMockMode() {
  return window.__MOCK_MODE__ === true;
}
