import { ExtractedJobDetails } from '../types';

export const GEMINI_API_KEY_STORAGE = 'jobapply_gemini_api_key';
export const OPENAI_API_KEY_STORAGE = 'jobapply_openai_api_key';

export function getSavedGeminiKey(): string {
  return localStorage.getItem(GEMINI_API_KEY_STORAGE) || '';
}

export function saveGeminiKey(key: string): void {
  localStorage.setItem(GEMINI_API_KEY_STORAGE, key.trim());
}

export function getSavedOpenAIKey(): string {
  return localStorage.getItem(OPENAI_API_KEY_STORAGE) || '';
}

export function saveOpenAIKey(key: string): void {
  localStorage.setItem(OPENAI_API_KEY_STORAGE, key.trim());
}

interface GeminiModel {
  name: string;
  supportedGenerationMethods?: string[];
}

// Fallback candidate models in preference order
const CANDIDATE_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-flash-002',
  'gemini-1.5-flash-8b',
  'gemini-2.0-flash-exp',
  'gemini-1.5-pro'
];

/**
 * Dynamically resolves the best available Gemini model for the user's API key
 */
async function resolveAvailableModel(key: string): Promise<string> {
  try {
    const listRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
    );
    if (listRes.ok) {
      const listData = await listRes.json() as { models?: GeminiModel[] };
      const models = listData.models || [];
      // Find models that support generateContent
      const generateModels = models
        .filter((model) => model.supportedGenerationMethods?.includes('generateContent'))
        .map((model) => model.name.replace(/^models\//, ''));

      // Pick the best match from our preferred candidate list
      for (const candidate of CANDIDATE_MODELS) {
        if (generateModels.includes(candidate)) {
          return candidate;
        }
      }

      // If exact candidate not matched, find any flash or gemini model
      const flashModel = generateModels.find((name: string) => name.includes('flash'));
      if (flashModel) return flashModel;

      const anyGemini = generateModels.find((name: string) => name.startsWith('gemini'));
      if (anyGemini) return anyGemini;

      if (generateModels.length > 0) return generateModels[0];
    }
  } catch (err) {
    console.warn('Could not list models, using fallback list', err);
  }

  // Default fallback
  return 'gemini-2.0-flash';
}

function createPrompt(rawText: string, currentDetails: ExtractedJobDetails): string {
  return `You are an expert LinkedIn job post analyzer.
Analyze the following OCR text extracted from a LinkedIn job post screenshot.
The initial OCR might have noise, missing punctuation, spaces around emails (like "careers @ startup . com"), or formatting errors.
Fix all fields and extract the exact structured job details.

Current imperfect extraction:
Company: ${currentDetails.company}
Role: ${currentDetails.role}
Email: ${currentDetails.email}
Location: ${currentDetails.location}
Experience: ${currentDetails.experience}

Raw OCR Text:
"""
${rawText || currentDetails.jobDescription}
"""

Instructions:
1. "company": Accurately identify the hiring company or startup name. Do NOT mistake the LinkedIn user's personal name for the company.
2. "role": The primary standardized job title (e.g., "SDET", "Software Engineer (Backend)", "QA Automation Engineer").
3. "candidateRoles": Array of ALL distinct roles/job titles being hired for in the post if multiple positions are mentioned (e.g. ["Software Engineer (Backend)", "SDET Lead", "Frontend Developer"]). If only one role is mentioned, return an array with that single role.
4. "email": Find the exact recruiter or application email address from the text. Fix any OCR spacing (e.g. "careers @ domain.com" -> "careers@domain.com"). If no email exists in the text, return empty string "". Never invent an email address.
5. "candidateEmails": Array of all valid email addresses found in the text.
6. "location": "Remote", "Hybrid", or city/country (e.g., "Bangalore, India").
7. "experience": Experience requirements (e.g., "2-4 years").
8. "skills": Array of 3 to 6 key technical skills mentioned in the post.
9. "jobDescription": Clean 2-3 sentence summary of the role.
10. "applicationInstructions": Clear instruction on how to apply.

Return strictly valid JSON matching this schema:
{
  "company": "string",
  "role": "string",
  "candidateRoles": ["string"],
  "email": "string",
  "candidateEmails": ["string"],
  "location": "string",
  "experience": "string",
  "skills": ["string"],
  "jobDescription": "string",
  "applicationInstructions": "string"
}`;
}

function detailsFromResponse(
  parsed: Partial<ExtractedJobDetails>,
  rawText: string,
  currentDetails: ExtractedJobDetails
): ExtractedJobDetails {
  const rolesList = Array.isArray(parsed.candidateRoles) && parsed.candidateRoles.length > 0
    ? parsed.candidateRoles
    : [parsed.role || currentDetails.role];

  return {
    company: parsed.company || currentDetails.company,
    role: parsed.role || rolesList[0] || currentDetails.role,
    candidateRoles: rolesList,
    email: parsed.email || currentDetails.email,
    candidateEmails: parsed.candidateEmails || currentDetails.candidateEmails || [],
    location: parsed.location || currentDetails.location,
    experience: parsed.experience || currentDetails.experience,
    skills: Array.isArray(parsed.skills) && parsed.skills.length > 0 ? parsed.skills : currentDetails.skills,
    jobDescription: parsed.jobDescription || currentDetails.jobDescription,
    applicationInstructions: parsed.applicationInstructions || currentDetails.applicationInstructions,
    confidence: 0.99,
    rawText: rawText || currentDetails.rawText
  };
}

function parseResponseJson(rawJson: string): Partial<ExtractedJobDetails> {
  const cleanedJson = rawJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleanedJson) as Partial<ExtractedJobDetails>;
}

async function fixWithGemini(
  prompt: string,
  key: string
): Promise<Partial<ExtractedJobDetails>> {
  const modelsToTry = [
    await resolveAvailableModel(key),
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro'
  ];
  const uniqueModels = Array.from(new Set(modelsToTry));

  let lastErrorMsg = '';

  for (const model of uniqueModels) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }]
              }
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
        lastErrorMsg = errorData?.error?.message || `HTTP ${response.status}`;
        // If it's a model not found error, continue to next candidate model
        if (lastErrorMsg.includes('not found') || lastErrorMsg.includes('not supported')) {
          continue;
        }
        throw new Error(lastErrorMsg);
      }

      const data = await response.json() as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawJson) {
        throw new Error('AI returned an empty response.');
      }

      return parseResponseJson(rawJson);
    } catch (error: unknown) {
      if (error instanceof Error && !error.message.includes('not found')) {
        throw error;
      }
    }
  }

  throw new Error(lastErrorMsg || 'All candidate Gemini models were unavailable.');
}

async function fixWithOpenAI(
  prompt: string,
  key: string
): Promise<Partial<ExtractedJobDetails>> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(errorData?.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const rawJson = data.choices?.[0]?.message?.content;
  if (!rawJson) throw new Error('ChatGPT returned an empty response.');
  return parseResponseJson(rawJson);
}

/**
 * Uses Gemini first and falls back to ChatGPT when Gemini is unavailable.
 */
export async function fixJobDetailsWithAI(
  rawText: string,
  currentDetails: ExtractedJobDetails,
  geminiApiKey: string = getSavedGeminiKey(),
  openAiApiKey: string = getSavedOpenAIKey()
): Promise<ExtractedJobDetails> {
  const geminiKey = geminiApiKey.trim();
  const openAiKey = openAiApiKey.trim();
  if (!geminiKey && !openAiKey) throw new Error('NO_API_KEY');

  const prompt = createPrompt(rawText, currentDetails);
  let geminiError: Error | null = null;
  if (geminiKey) {
    try {
      const parsed = await fixWithGemini(prompt, geminiKey);
      return detailsFromResponse(parsed, rawText, currentDetails);
    } catch (error) {
      geminiError = error instanceof Error ? error : new Error(String(error));
    }
  }

  if (openAiKey) {
    try {
      const parsed = await fixWithOpenAI(prompt, openAiKey);
      return detailsFromResponse(parsed, rawText, currentDetails);
    } catch (error) {
      const openAiError = error instanceof Error ? error.message : String(error);
      const prefix = geminiError ? `Gemini failed: ${geminiError.message}. ` : '';
      throw new Error(`AI_REQUEST_FAILED: ${prefix}ChatGPT fallback failed: ${openAiError}`);
    }
  }

  throw new Error(`AI_REQUEST_FAILED: ${geminiError?.message || 'Gemini request failed.'}`);
}
