import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeRawMessage } from '../src/services/gmailService';

function decodeRawMessage(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  return atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
}

test('encodeRawMessage builds a Gmail-compatible multipart PDF email', async () => {
  const pdf = new Blob(['%PDF-1.4 test resume'], { type: 'application/pdf' });
  const raw = await encodeRawMessage(
    'careers@example.com',
    'Application – Backend Engineer',
    'Hello hiring team,\n\nResume attached.',
    pdf,
    'Amit Resume.pdf'
  );
  const message = decodeRawMessage(raw);

  assert.match(message, /To: careers@example\.com/);
  assert.match(message, /Content-Type: multipart\/mixed/);
  assert.match(message, /Content-Type: application\/pdf; name="Amit Resume\.pdf"/);
  assert.match(message, /filename="Amit Resume\.pdf"/);
  assert.ok(message.includes(btoa('%PDF-1.4 test resume')));
  assert.ok(message.includes('=?UTF-8?B?'));
});

test('encodeRawMessage rejects invalid recipients and non-PDF attachments', () => {
  const pdf = new Blob(['resume'], { type: 'application/pdf' });
  assert.throws(() => encodeRawMessage('not-an-email', 'Subject', 'Body', pdf, 'resume.pdf'));
  assert.throws(() => encodeRawMessage('user@example.com\r\nBcc:bad@example.com', 'Subject', 'Body', pdf, 'resume.pdf'));
  assert.throws(() => encodeRawMessage('user@example.com', 'Subject', 'Body', new Blob(['text']), 'resume.txt'));
});
