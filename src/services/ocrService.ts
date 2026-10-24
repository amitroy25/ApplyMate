import { createWorker, Worker } from 'tesseract.js';
import { ExtractedJobDetails } from '../types';

export interface OcrProgress {
  status: string;
  progress: number;
}

// Tech keywords dictionary for smart skills detection
const KNOWN_SKILLS = [
  'Java',
  'Spring Boot',
  'Spring',
  'Microservices',
  'Python',
  'JavaScript',
  'TypeScript',
  'Node.js',
  'React',
  'Next.js',
  'Appium',
  'Selenium',
  'TestNG',
  'JUnit',
  'RestAssured',
  'Postman',
  'Cypress',
  'Playwright',
  'Docker',
  'Kubernetes',
  'AWS',
  'GCP',
  'Azure',
  'PostgreSQL',
  'MySQL',
  'MongoDB',
  'Redis',
  'Kafka',
  'CI/CD',
  'Git',
  'Linux',
  'Automation Testing',
  'API Testing',
  'Performance Testing',
  'JMeter',
  'SQL',
  'Golang',
  'Rust',
  'C++',
  'Android',
  'iOS',
  'Flutter'
];

// Common job title keywords with seniority prefixes
const TITLE_KEYWORDS = [
  'Software Engineer',
  'Software Developer',
  'Backend Engineer',
  'Backend Developer',
  'Frontend Engineer',
  'Frontend Developer',
  'Full Stack Developer',
  'Full Stack Engineer',
  'SDET',
  'QA Automation Engineer',
  'QA Engineer',
  'Quality Assurance',
  'Test Automation Engineer',
  'DevOps Engineer',
  'Site Reliability Engineer',
  'Data Engineer',
  'Mobile Engineer',
  'Android Developer',
  'iOS Developer',
  'Test Lead',
  'SDET Lead',
  'Lead SDET',
  'Senior SDET',
  'Senior Software Engineer',
  'Principal Engineer',
  'Staff Engineer',
  'Engineering Manager'
];

// Singleton OCR worker cache to avoid expensive re-initializations
let cachedWorker: Worker | null = null;
let isWorkerInitializing = false;

async function getOcrWorker(onProgress?: (progress: OcrProgress) => void): Promise<Worker> {
  if (cachedWorker) {
    return cachedWorker;
  }

  if (isWorkerInitializing) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (cachedWorker) return cachedWorker;
  }

  isWorkerInitializing = true;
  if (onProgress) {
    onProgress({ status: 'Loading OCR engine...', progress: 0.1 });
  }

  try {
    const worker = await createWorker('eng');
    cachedWorker = worker;
    return worker;
  } finally {
    isWorkerInitializing = false;
  }
}

/**
 * Extracts visible text using cached Tesseract.js worker
 */
export async function runOcrOnImage(
  imageSource: string | File | Blob,
  onProgress?: (progress: OcrProgress) => void
): Promise<{ text: string; confidence: number }> {
  const worker = await getOcrWorker(onProgress);

  if (onProgress) {
    onProgress({ status: 'Scanning image text...', progress: 0.35 });
  }

  const result = await worker.recognize(imageSource);

  if (onProgress) {
    onProgress({ status: 'Processing detected text...', progress: 0.95 });
  }

  return {
    text: result.data.text || '',
    confidence: result.data.confidence ? result.data.confidence / 100 : 0.85
  };
}

/**
 * Normalizes common OCR artifacts in screenshot text
 * (fixes spaces around @, [at], dots, and punctuation)
 */
export function normalizeOcrText(text: string): string {
  let cleaned = text.replace(/\r\n/g, '\n');

  // Replace explicit obfuscations like [at], (at), etc. (do not replace standard word 'at')
  cleaned = cleaned.replace(/\s*(\[@\]|\(@\)|\[at\]|\(at\)|©)\s*/gi, '@');

  // Collapse spaces around dots in email domains (e.g., "startupx . com" -> "startupx.com")
  cleaned = cleaned.replace(/@\s*([a-zA-Z0-9_-]+)\s*\.\s*([a-zA-Z]{2,10})/g, '@$1.$2');

  // Collapse spaces directly adjacent to @ (e.g., "careers @ company" -> "careers@company")
  cleaned = cleaned.replace(/([a-zA-Z0-9._%+-]+)\s+@/g, '$1@');
  cleaned = cleaned.replace(/@\s+([a-zA-Z0-9.-]+)/g, '@$1');

  // Remove mailto: prefix if detected
  cleaned = cleaned.replace(/mailto:\s*/gi, '');

  return cleaned;
}

/**
 * Extracts all email addresses with fuzzy recovery of OCR spacing issues
 */
export function extractEmailsFromText(rawText: string): string[] {
  const normalized = normalizeOcrText(rawText);
  const foundEmails: string[] = [];

  // Pass 1: Standard regex
  const standardRegex = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/gi;
  const standardMatches = normalized.match(standardRegex) || [];
  foundEmails.push(...standardMatches);

  // Pass 2: Line token scanning for emails wrapped in brackets, quotes, or trailing punctuation
  const lines = normalized.split('\n');
  for (const line of lines) {
    if (line.includes('@')) {
      const words = line.split(/\s+/);
      for (const word of words) {
        // Strip leading/trailing symbols like <>, (), [], commas, semicolons
        const cleanWord = word.replace(/^[<(\[{'"`:;]+|[>)\]}'"`:;,]+$/g, '');
        if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(cleanWord)) {
          foundEmails.push(cleanWord);
        }
      }
    }
  }

  // Filter out noisy image file names or duplicates
  const filtered = Array.from(
    new Set(foundEmails.map((e) => e.toLowerCase().trim()))
  ).filter(
    (e) =>
      !e.endsWith('.png') &&
      !e.endsWith('.jpg') &&
      !e.endsWith('.jpeg') &&
      !e.endsWith('.webp') &&
      !e.endsWith('.svg') &&
      !e.includes('2x') &&
      !e.includes('3x') &&
      e.length >= 6
  );

  return filtered;
}

/**
 * Derives a clean company name from email domain if possible
 * e.g., careers@startupx.com -> "StartupX"
 * e.g., jobs@razorpay.com -> "Razorpay"
 */
function inferCompanyFromEmail(email: string): string | null {
  if (!email || !email.includes('@')) return null;
  const domainPart = email.split('@')[1];
  if (!domainPart) return null;

  const baseName = domainPart.split('.')[0];
  // Ignore generic email providers
  const genericDomains = ['gmail', 'yahoo', 'outlook', 'hotmail', 'proton', 'icloud', 'mail'];
  if (genericDomains.includes(baseName.toLowerCase())) {
    return null;
  }

  // Capitalize nicely
  return baseName.charAt(0).toUpperCase() + baseName.slice(1);
}

/**
 * Parses raw extracted text into structured job fields
 */
export function parseJobText(rawText: string, defaultConfidence = 0.85): ExtractedJobDetails {
  const normalized = normalizeOcrText(rawText);
  const lines = normalized
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // 1. Extract Emails
  const candidateEmails = extractEmailsFromText(rawText);
  const primaryEmail = candidateEmails.length > 0 ? candidateEmails[0] : '';

  // 2. Identify Job Title
  let detectedRole = '';

  // Pattern A: Check explicit headings like "Hiring: [Title]", "We are hiring [Title]", "Role: [Title]"
  const titleHeadingRegex =
    /(?:we\s+are\s+hiring|we'?re\s+hiring|hiring\s+for|looking\s+for|seeking|role\s*:|position\s*:|opening\s*for)\s*(?:an?|the)?\s*([A-Za-z0-9\s()/-]{3,45}?)(?:\s+(?:to\s+join|at|for|with|in|\n|\.|\!|;|•))/i;
  const headingMatch = normalized.match(titleHeadingRegex);
  if (headingMatch && headingMatch[1]) {
    const candidate = headingMatch[1].trim();
    if (candidate.length >= 3 && candidate.length <= 40 && !candidate.toLowerCase().includes('candidate')) {
      detectedRole = candidate;
    }
  }

  // Pattern B: Search for known role keywords in text
  if (!detectedRole) {
    for (const kw of TITLE_KEYWORDS) {
      const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s*\\([^)]+\\))?`, 'i');
      const match = normalized.match(regex);
      if (match) {
        detectedRole = match[0].trim();
        break;
      }
    }
  }

  // Fallback: Check top lines
  if (!detectedRole) {
    for (const line of lines.slice(0, 4)) {
      if (
        line.toLowerCase().includes('engineer') ||
        line.toLowerCase().includes('developer') ||
        line.toLowerCase().includes('sdet') ||
        line.toLowerCase().includes('qa')
      ) {
        detectedRole = line.replace(/[^a-zA-Z0-9\s()/-]/g, '').trim();
        break;
      }
    }
  }
  if (!detectedRole) {
    detectedRole = 'Software Engineer';
  }

  // Collect ALL matching role titles across the full text for multi-role picker
  const allDetectedRoles: string[] = [];
  for (const kw of TITLE_KEYWORDS) {
    const kwEscaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${kwEscaped}(\\s*\\([^)]+\\))?`, 'gi');
    const matches = [...normalized.matchAll(regex)];
    for (const m of matches) {
      const r = m[0].trim();
      if (!allDetectedRoles.some((x) => x.toLowerCase() === r.toLowerCase())) {
        allDetectedRoles.push(r);
      }
    }
  }
  // Ensure the primary detected role is always first in the list
  if (detectedRole && !allDetectedRoles.some((x) => x.toLowerCase() === detectedRole.toLowerCase())) {
    allDetectedRoles.unshift(detectedRole);
  }
  const candidateRoles: string[] =
    allDetectedRoles.length > 0 ? allDetectedRoles : detectedRole ? [detectedRole] : [];

  // 3. Identify Company Name
  let detectedCompany = '';

  // Method A: Check for "at [Company]" or "[Company] is hiring"
  const companyAtRegex = /(?:at|join|with)\s+([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+)?)/;
  const companyMatch = normalized.match(companyAtRegex);
  if (
    companyMatch &&
    companyMatch[1] &&
    !['Remote', 'Our', 'An', 'The', 'Join', 'India', 'Full', 'Part'].includes(companyMatch[1].trim())
  ) {
    detectedCompany = companyMatch[1].trim();
  }

  // Method B: Check first clean line of the post (LinkedIn header author)
  if (!detectedCompany && lines.length > 0) {
    const candidateLine = lines[0].replace(/[^a-zA-Z0-9\s]/g, '').trim();
    if (
      candidateLine.length >= 3 &&
      candidateLine.length <= 30 &&
      !candidateLine.toLowerCase().includes('hiring') &&
      !candidateLine.toLowerCase().includes('urgent') &&
      !candidateLine.toLowerCase().includes('post')
    ) {
      detectedCompany = candidateLine;
    }
  }

  // Method C: Infer from recruiter email domain
  if (!detectedCompany && primaryEmail) {
    const domainCompany = inferCompanyFromEmail(primaryEmail);
    if (domainCompany) {
      detectedCompany = domainCompany;
    }
  }

  if (!detectedCompany) {
    detectedCompany = 'Startup';
  }

  // 4. Identify Experience Requirement
  let detectedExperience = '';
  const expMatch = normalized.match(/(\d+\s*(?:-\s*\d+|\+)?\s*(?:years?|yrs?)(?:\s*of\s*experience)?)/i);
  if (expMatch) {
    detectedExperience = expMatch[1].replace(/\s*of\s*experience/i, '').trim();
  } else {
    detectedExperience = '2-4 years';
  }

  // 5. Identify Location
  let detectedLocation = '';
  const locationKeywords = [
    'Remote',
    'Hybrid',
    'Bangalore',
    'Bengaluru',
    'Delhi',
    'Gurgaon',
    'Gurugram',
    'Noida',
    'Mumbai',
    'Hyderabad',
    'Pune',
    'Chennai',
    'India',
    'US',
    'USA',
    'UK',
    'Singapore'
  ];

  // Collect ALL matching locations for multi-location picker
  const candidateLocations: string[] = [];
  for (const loc of locationKeywords) {
    if (new RegExp(`\\b${loc}\\b`, 'i').test(normalized)) {
      candidateLocations.push(loc);
    }
  }
  detectedLocation = candidateLocations.length > 0 ? candidateLocations[0] : 'Remote';
  if (candidateLocations.length === 0) {
    candidateLocations.push('Remote');
  }

  // 6. Identify Skills
  const detectedSkills: string[] = [];
  for (const skill of KNOWN_SKILLS) {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(normalized)) {
      if (!detectedSkills.includes(skill)) {
        detectedSkills.push(skill);
      }
    }
  }
  if (detectedSkills.length === 0) {
    detectedSkills.push('Java', 'Automation', 'Problem Solving');
  }

  // 7. Extract Application Instructions
  let applicationInstructions = '';
  const applyMatch = normalized.match(
    /(?:send\s+your\s+resume|mail\s+your\s+cv|apply\s+at|reach\s+out\s+to|share\s+cv\s+to)[^\n.]+/i
  );
  if (applyMatch) {
    applicationInstructions = applyMatch[0].trim();
  } else if (primaryEmail) {
    applicationInstructions = `Send resume to ${primaryEmail}`;
  } else {
    applicationInstructions = 'Send resume by email';
  }

  // 8. Job Description summary
  let jobDescription = normalized.slice(0, 320).replace(/\n+/g, ' ');
  if (jobDescription.length < 50 && lines.length > 2) {
    jobDescription = lines.slice(1, 4).join(' ');
  }

  return {
    company: detectedCompany,
    role: detectedRole,
    candidateRoles,
    email: primaryEmail,
    candidateEmails,
    location: detectedLocation,
    candidateLocations,
    experience: detectedExperience,
    skills: detectedSkills.slice(0, 5),
    jobDescription,
    applicationInstructions,
    confidence: primaryEmail && detectedRole !== 'Software Engineer' ? 0.92 : defaultConfidence,
    rawText: rawText
  };
}
