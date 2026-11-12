import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { createRequire } from 'module';
import { EventEmitter } from 'events';
import request from 'supertest';

// Tests for POST /api/upload-pdf. The S3 client and the PyPDF2 metadata
// extractor are both mocked, so these tests make no AWS calls and do not need
// python3. server.js is CommonJS, so the mocks go on the CommonJS modules it
// require()s: S3Client.prototype.send and child_process.spawn.
const require = createRequire(import.meta.url);
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const childProcess = require('child_process');

const EXTRACTED = { success: true, bank_name: 'Test Bank, N.A.', form_type: '10-K', year: 2025 };

// Fake child process that answers the extractor's stdin with EXTRACTED.
function fakeExtractor() {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.stdin = {
    write: () => {},
    end: () => {
      setImmediate(() => {
        child.stdout.emit('data', Buffer.from(JSON.stringify(EXTRACTED)));
        child.emit('close', 0);
      });
    },
  };
  return child;
}

let app;
let sendSpy;
const pdf = Buffer.from('%PDF-1.4 fake test content');
const file = { name: 'report.pdf', size: pdf.length, content: pdf.toString('base64') };

beforeAll(async () => {
  process.env.AUTH_ENABLED = 'false';
  process.env.REGION = 'eu-west-1';
  process.env.UPLOADED_DOCS_BUCKET = 'test-bucket';
  // server.js destructures spawn at load time, so spy before importing it.
  vi.spyOn(childProcess, 'spawn').mockImplementation(fakeExtractor);
  sendSpy = vi.spyOn(S3Client.prototype, 'send');
  const mod = await import('./server.js');
  app = mod.default || mod;
});

beforeEach(() => {
  sendSpy.mockReset();
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('POST /api/upload-pdf', () => {
  it('uploads the decoded PDF to S3 with a PutObjectCommand and returns its key', async () => {
    let clientConfig;
    sendSpy.mockImplementation(async function () {
      clientConfig = { region: await this.config.region(), logger: this.config.logger };
      return {};
    });

    const res = await request(app).post('/api/upload-pdf').send({ files: [file] });

    expect(res.status).toBe(200);
    const key = 'uploaded-docs/Test_Bank__N_A_/2025/10-K/report.pdf';
    expect(res.body).toEqual({
      success: true,
      documents: [{ bank_name: 'Test Bank, N.A.', form_type: '10-K', year: 2025, filename: 'report.pdf', size: pdf.length, s3_key: key }],
    });

    expect(sendSpy).toHaveBeenCalledTimes(1);
    const command = sendSpy.mock.calls[0][0];
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toEqual({
      Bucket: 'test-bucket',
      Key: key,
      Body: pdf,
      ContentType: 'application/pdf',
      Metadata: { 'bank-name': 'Test Bank, N.A.', 'form-type': '10-K', year: '2025', 'original-filename': 'report.pdf' },
    });

    // Region and the debug logger are set on the client constructor
    // (NODE_ENV is not 'production' under vitest, so DEBUG_MODE is on).
    expect(clientConfig.region).toBe('eu-west-1');
    expect(clientConfig.logger).toBe(console);
  });

  it('still returns the document when the S3 upload fails', async () => {
    sendSpy.mockRejectedValue(new Error('AccessDenied'));

    const res = await request(app).post('/api/upload-pdf').send({ files: [file] });

    // The route logs the S3 error and carries on (behaviour unchanged from v2).
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.documents).toHaveLength(1);
    expect(res.body.documents[0].filename).toBe('report.pdf');
    expect(sendSpy).toHaveBeenCalledTimes(1);
  });

  it('returns 400 and does not call S3 when no files are sent', async () => {
    const res = await request(app).post('/api/upload-pdf').send({ files: [] });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'No files provided' });
    expect(sendSpy).not.toHaveBeenCalled();
  });
});
