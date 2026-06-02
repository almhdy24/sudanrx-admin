import { GoogleGenerativeAI } from '@google/generative-ai';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// =====================
// INIT
// =====================
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY || '');

// Default models – can be overridden via AI Settings
let primaryModelName = localStorage.getItem('ai_primary_model') || 'gemini-2.5-flash';
let fallbackModelName = localStorage.getItem('ai_fallback_model') || 'gemini-2.0-flash';
let maxDailyRequests = parseInt(localStorage.getItem('ai_daily_limit') || '18', 10);

// Request counter with daily reset
const today = new Date().toDateString();
const storedDay = localStorage.getItem('ai_request_day');
let requestCount = 0;

if (storedDay === today) {
  requestCount = parseInt(localStorage.getItem('ai_request_count') || '0', 10);
} else {
  localStorage.setItem('ai_request_day', today);
  localStorage.setItem('ai_request_count', '0');
}

function incrementRequestCount() {
  requestCount++;
  localStorage.setItem('ai_request_count', requestCount.toString());
}

// =====================
// MODEL FACTORY
// =====================
function getModel() {
  if (requestCount < maxDailyRequests) {
    return genAI.getGenerativeModel({ model: primaryModelName });
  }
  console.warn(`Daily limit reached (${maxDailyRequests}). Switching to fallback model: ${fallbackModelName}`);
  return genAI.getGenerativeModel({ model: fallbackModelName });
}

/**
 * Wrapper that applies rate‑limit and model switching.
 */
async function safeGenerate(prompt, jsonMode = false) {
  if (!API_KEY) throw new Error('Gemini API key missing');

  incrementRequestCount();

  const model = getModel();
  const config = jsonMode ? { generationConfig: { responseMimeType: 'application/json' } } : {};

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    ...config,
  });
  return result.response.text();
}

// =====================
// SUDAN CLINICAL STYLE LAYER
// =====================
const SUDAN_STYLE = `
You are writing as a Sudan Ministry of Health clinical guideline author.

STYLE REQUIREMENTS:
- Natural clinical English used in African hospital protocols
- NOT AI-like or overly structured
- Avoid robotic formatting
- Use phrases like:
  "is recommended", "should be considered", "may indicate", "patients typically present"
- Keep tone practical for frontline clinicians
- Avoid generic AI wording like "Key Points"
`;

// =====================
// PROMPTS
// =====================
const STRUCTURED_GENERATION_PROMPT = `
${SUDAN_STYLE}

You are a Sudanese clinical guideline formatter.

Return ONLY a valid JSON object:

{
  "title": "short clinical title",
  "sections": [
    {
      "section_type": "overview|indications|diagnosis|management|red_flags|prevention|references",
      "title": "section title",
      "content": "clinical Markdown text in Sudan protocol style"
    }
  ]
}

CRITICAL RULES:
- NO extra text, NO markdown outside JSON
- Use ONLY provided information
- DO NOT invent medical facts
- If missing info → write "NOT CONFIRMED"
- Preserve all clinical values exactly
- Write like REAL Sudan national guideline document
`;

const SECTION_FORMAT_PROMPT = `
${SUDAN_STYLE}

You are editing a Sudan national clinical guideline section.

TASK:
Rewrite into natural clinical guideline style used in hospital protocols.

RULES:
- Keep all medical facts unchanged
- Do NOT sound like AI
- Do NOT add new information
- Use natural clinical flow (not bullet-heavy AI style)
- Preserve dosages exactly
- If already good → return unchanged

Section type: {section_type}

Text:
---
{content}
---
`;

const RULE_SUGGESTION_PROMPT = `
You are a Clinical Decision Support System (CDSS) for Sudan hospitals.

STRICT RULES:
- NO diagnosis
- NO prescriptions
- ONLY supportive clinical rules
- ONLY guideline-based logic

Extract rules ONLY if clearly stated.

Return JSON array:
[
  {
    "name": "",
    "condition": {
      "parameter": "",
      "operator": ">|<|>=|<=|==|!=",
      "value": ""
    },
    "action": {
      "type": "recommend",
      "message": ""
    },
    "priority": 1
  }
]

Allowed parameters:
temperature, heart_rate, respiratory_rate, systolic_bp, diastolic_bp,
oxygen_saturation, age, rdt_result, blood_smear, hb, platelets,
creatinine, gcs

If unclear → return []
`;

// =====================
// HELPERS
// =====================
function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    const cleaned = text.replace(/```json|```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('Invalid AI JSON response');
  }
}

function chunkText(text, maxLength = 8000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.slice(i, i + maxLength));
  }
  return chunks;
}

// =====================
// PUBLIC API
// =====================

export async function generateFromPrompt(description) {
  const prompt = `${STRUCTURED_GENERATION_PROMPT}\n\nINPUT:\n${description}`;
  const text = await safeGenerate(prompt, true);
  return extractJson(text);
}

export async function generateFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    fullText += strings.join(' ') + '\n';
  }

  const chunks = chunkText(fullText, 8000);
  const sections = [];
  let title = 'Untitled Guideline';

  for (const chunk of chunks) {
    const prompt = `${STRUCTURED_GENERATION_PROMPT}\n\nRAW TEXT:\n${chunk}`;
    const text = await safeGenerate(prompt, true);
    const data = extractJson(text);
    if (data?.sections) sections.push(...data.sections);
    if (title === 'Untitled Guideline' && data?.title) title = data.title;
  }

  const seen = new Set();
  const uniqueSections = [];
  for (const s of sections) {
    if (!seen.has(s.section_type)) {
      seen.add(s.section_type);
      uniqueSections.push(s);
    }
  }

  return { title, sections: uniqueSections };
}

export async function formatSectionContent(sectionType, content) {
  const prompt = SECTION_FORMAT_PROMPT
    .replace('{section_type}', sectionType)
    .replace('{content}', content);
  const text = await safeGenerate(prompt, false);  // no JSON mode
  return text.trim();
}

export async function suggestCDSSRules(sections) {
  const content = sections
    .map(s => `## ${s.title || s.section_type}\n${s.content}`)
    .join('\n\n')
    .substring(0, 12000);
  const prompt = `${RULE_SUGGESTION_PROMPT}\n\nCONTENT:\n${content}`;
  const text = await safeGenerate(prompt, true);
  return extractJson(text);
}

// =====================
// SETTINGS HELPERS
// =====================
export function getAiSettings() {
  return {
    primaryModel: localStorage.getItem('ai_primary_model') || 'gemini-2.5-flash',
    fallbackModel: localStorage.getItem('ai_fallback_model') || 'gemini-2.0-flash',
    dailyLimit: parseInt(localStorage.getItem('ai_daily_limit') || '18', 10),
    requestCount: requestCount,
  };
}

export function updateAiSettings({ primaryModel, fallbackModel, dailyLimit }) {
  if (primaryModel) {
    primaryModelName = primaryModel;
    localStorage.setItem('ai_primary_model', primaryModel);
  }
  if (fallbackModel) {
    fallbackModelName = fallbackModel;
    localStorage.setItem('ai_fallback_model', fallbackModel);
  }
  if (dailyLimit !== undefined) {
    maxDailyRequests = parseInt(dailyLimit, 10);
    localStorage.setItem('ai_daily_limit', dailyLimit.toString());
  }
}
