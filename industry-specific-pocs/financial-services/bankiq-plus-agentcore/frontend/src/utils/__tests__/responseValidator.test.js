import { describe, it, expect } from 'vitest';
import { ResponseValidator } from '../responseValidator';

// Pure-logic behavior-lock tests (no mocking needed). These capture the
// ResponseValidator's ACTUAL current behavior so the CRA->Vite migration
// (and later dependency bumps) can be proven not to change it.

describe('ResponseValidator.validatePeerAnalysis', () => {
  it('flags null/undefined response as invalid', () => {
    const r = ResponseValidator.validatePeerAnalysis(null);
    expect(r.valid).toBe(false);
    expect(r.issues).toContain('Response is null or undefined');
  });

  it('flags a missing result object', () => {
    const r = ResponseValidator.validatePeerAnalysis({});
    expect(r.valid).toBe(false);
    expect(r.issues).toContain('Missing result object');
  });

  it('flags result.data that is not an array (null is caught without crashing)', () => {
    // KNOWN BUG: a *truthy* non-array result.data (e.g. a string) would crash
    // on .forEach because the guard only checks `response.result.data` truthiness
    // after already flagging it. null is falsy, so the forEach is skipped and the
    // "not an array" issue is recorded cleanly. We lock the null path here.
    const r = ResponseValidator.validatePeerAnalysis({ result: { data: null } });
    expect(r.valid).toBe(false);
    expect(r.issues).toContain('result.data is not an array');
    expect(r.dataPoints).toBe(0);
  });

  it('passes a fully-formed data point and reports dataPoints', () => {
    const r = ResponseValidator.validatePeerAnalysis({
      result: { data: [{ Bank: 'JPM', Quarter: '2024-Q1', Metric: 'ROA', Value: 1.5 }] }
    });
    expect(r.valid).toBe(true);
    expect(r.issues).toHaveLength(0);
    expect(r.dataPoints).toBe(1);
  });

  it('flags each missing field in a data point', () => {
    const r = ResponseValidator.validatePeerAnalysis({
      result: { data: [{ Bank: 'JPM' }] }
    });
    expect(r.valid).toBe(false);
    expect(r.issues).toContain('Item 0: Missing Quarter field');
    expect(r.issues).toContain('Item 0: Missing Metric field');
    expect(r.issues).toContain('Item 0: Value is not a number');
  });
});

describe('ResponseValidator.validateFDICData', () => {
  it('flags a missing result structure', () => {
    const r = ResponseValidator.validateFDICData(null);
    expect(r.valid).toBe(false);
    expect(r.issues).toContain('Missing result structure');
  });

  it('flags non-array data', () => {
    const r = ResponseValidator.validateFDICData({ result: { data: 'nope' } });
    expect(r.valid).toBe(false);
    expect(r.issues).toContain('result.data is not an array');
  });

  it('passes array data and counts records', () => {
    const r = ResponseValidator.validateFDICData({ result: { data: [{}, {}] } });
    expect(r.valid).toBe(true);
    expect(r.recordCount).toBe(2);
  });
});

describe('ResponseValidator.validateSECFilings', () => {
  it('flags null response', () => {
    const r = ResponseValidator.validateSECFilings(null);
    expect(r.valid).toBe(false);
    expect(r.issues).toContain('Response is null');
  });

  it('flags missing both 10-K and 10-Q', () => {
    const r = ResponseValidator.validateSECFilings({});
    expect(r.valid).toBe(false);
    expect(r.issues).toContain('Missing both 10-K and 10-Q arrays');
  });

  it('passes and counts filings', () => {
    const r = ResponseValidator.validateSECFilings({ '10-K': [{}], '10-Q': [{}, {}] });
    expect(r.valid).toBe(true);
    expect(r.tenKCount).toBe(1);
    expect(r.tenQCount).toBe(2);
  });
});

describe('ResponseValidator.validatePDFUpload', () => {
  it('flags an unsuccessful upload', () => {
    const r = ResponseValidator.validatePDFUpload({ success: false });
    expect(r.valid).toBe(false);
    expect(r.issues).toContain('Upload not successful');
  });

  it('passes a well-formed document and reports method', () => {
    const r = ResponseValidator.validatePDFUpload({
      success: true,
      method: 'direct',
      documents: [{ bank_name: 'JPM', form_type: '10-K', year: 2024, s3_key: 'k' }]
    });
    expect(r.valid).toBe(true);
    expect(r.documentCount).toBe(1);
    expect(r.method).toBe('direct');
  });
});
