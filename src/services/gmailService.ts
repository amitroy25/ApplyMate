const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';

export const googleOAuthScopes = `email profile ${GMAIL_SEND_SCOPE}`;

export class GmailDeliveryUncertainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GmailDeliveryUncertainError';
  }
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function encodeHeader(value: string): string {
  return `=?UTF-8?B?${encodeBase64(new TextEncoder().encode(value))}?=`;
}

function wrapBase64(value: string): string {
  return value.match(/.{1,76}/g)?.join('\r\n') || '';
}

export function encodeRawMessage(
  recipient: string,
  subject: string,
  body: string,
  file: Blob,
  fileName: string
): Promise<string> {
  const normalizedRecipient = recipient.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedRecipient) || /[\r\n]/.test(normalizedRecipient)) {
    throw new Error('Enter a valid recipient email address.');
  }
  if (!subject.trim() || /[\r\n]/.test(subject)) {
    throw new Error('Enter an email subject without line breaks.');
  }
  if (!fileName.toLowerCase().endsWith('.pdf') || file.type !== 'application/pdf') {
    throw new Error('A PDF resume is required before sending.');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Resume must be 10 MB or smaller.');
  }

  return file.arrayBuffer().then((buffer) => {
    const boundary = `jobapply_${crypto.randomUUID().replace(/-/g, '')}`;
    const attachment = wrapBase64(encodeBase64(new Uint8Array(buffer)));
    const encodedBody = wrapBase64(encodeBase64(new TextEncoder().encode(body)));
    const safeFileName = fileName.replace(/["\r\n]/g, '_');
    const mimeMessage = [
      `To: ${normalizedRecipient}`,
      `Subject: ${encodeHeader(subject)}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      encodedBody,
      `--${boundary}`,
      `Content-Type: application/pdf; name="${safeFileName}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${safeFileName}"`,
      '',
      attachment,
      `--${boundary}--`
    ].join('\r\n');

    return encodeBase64(new TextEncoder().encode(mimeMessage))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  });
}

export async function sendGmailMessage(
  accessToken: string,
  recipient: string,
  subject: string,
  body: string,
  resume: Blob,
  fileName: string
): Promise<string> {
  if (!accessToken) throw new Error('Gmail authorization expired. Reconnect your Google account in Settings.');
  const raw = await encodeRawMessage(recipient, subject, body, resume, fileName);
  let response: Response;
  try {
    response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw })
    });
  } catch {
    throw new GmailDeliveryUncertainError('The connection dropped during sending. Check your Gmail Sent folder before trying again to avoid a duplicate application.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => null) as { error?: { message?: string } } | null;
    if (response.status === 401 || response.status === 403) {
      throw new Error('Gmail authorization expired or lacks send permission. Reconnect Google in Settings and grant Gmail send access.');
    }
    throw new Error(error?.error?.message || `Gmail could not send this message (HTTP ${response.status}).`);
  }

  const result = await response.json().catch(() => null) as { id?: string } | null;
  if (!result?.id) {
    throw new GmailDeliveryUncertainError('Gmail accepted the request but returned no message ID. Check your Gmail Sent folder before trying again.');
  }
  return result.id;
}
