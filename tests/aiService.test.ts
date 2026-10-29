import test from 'node:test';
import assert from 'node:assert/strict';
import { fixJobDetailsWithAI } from '../src/services/aiService';
import { ExtractedJobDetails } from '../src/types';

const currentDetails: ExtractedJobDetails = {
  company: 'Unknown',
  role: 'Software Engineer',
  email: '',
  location: '',
  experience: '',
  skills: [],
  jobDescription: '',
  applicationInstructions: ''
};

const fixedDetails = {
  company: 'StartupX',
  role: 'Backend Engineer',
  candidateRoles: ['Backend Engineer'],
  email: 'jobs@startupx.com',
  candidateEmails: ['jobs@startupx.com'],
  location: 'Remote',
  experience: '2+ years',
  skills: ['TypeScript', 'Node.js'],
  jobDescription: 'Build backend services.',
  applicationInstructions: 'Email your resume.'
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

test('fixJobDetailsWithAI tries Gemini first and falls back to OpenAI on failure', async () => {
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    requests.push(url);
    if (url.includes('/v1beta/models?')) {
      return jsonResponse({
        models: [{ name: 'models/gemini-2.0-flash', supportedGenerationMethods: ['generateContent'] }]
      });
    }
    if (url.includes(':generateContent')) {
      return jsonResponse({ error: { message: 'Gemini unavailable' } }, 503);
    }
    if (url === 'https://api.openai.com/v1/chat/completions') {
      return jsonResponse({
        choices: [{ message: { content: JSON.stringify(fixedDetails) } }]
      });
    }
    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    const result = await fixJobDetailsWithAI('Hiring Backend Engineer', currentDetails, 'gemini-key', 'openai-key');
    assert.equal(result.company, 'StartupX');
    assert.equal(result.email, 'jobs@startupx.com');
    assert.equal(result.confidence, 0.99);
    assert.equal(requests.length, 3);
    assert.ok(requests[0].includes('/v1beta/models?'));
    assert.ok(requests[1].includes(':generateContent'));
    assert.equal(requests[2], 'https://api.openai.com/v1/chat/completions');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fixJobDetailsWithAI does not call OpenAI when Gemini succeeds', async () => {
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    requests.push(url);
    if (url.includes('/v1beta/models?')) {
      return jsonResponse({
        models: [{ name: 'models/gemini-2.0-flash', supportedGenerationMethods: ['generateContent'] }]
      });
    }
    if (url.includes(':generateContent')) {
      return jsonResponse({
        candidates: [{ content: { parts: [{ text: JSON.stringify(fixedDetails) }] } }]
      });
    }
    throw new Error(`Unexpected request: ${url}`);
  };

  try {
    const result = await fixJobDetailsWithAI('Hiring Backend Engineer', currentDetails, 'gemini-key', 'openai-key');
    assert.equal(result.company, 'StartupX');
    assert.equal(requests.length, 2);
    assert.ok(requests.every((url) => !url.includes('api.openai.com')));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
