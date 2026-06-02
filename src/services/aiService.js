import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;

let geminiAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;
let groq = GROQ_KEY ? new Groq({ apiKey: GROQ_KEY, dangerouslyAllowBrowser: true }) : null;

const today = new Date().toDateString();
const storedDay = localStorage.getItem('ai_request_day');
let geminiExhausted = localStorage.getItem('gemini_exhausted') === today;
let requestCount = 0;

if (storedDay === today) {
  requestCount = parseInt(localStorage.getItem('ai_request_count') || '0', 10);
} else {
  localStorage.setItem('ai_request_day', today);
  localStorage.setItem('ai_request_count', '0');
  localStorage.removeItem('gemini_exhausted');
  geminiExhausted = false;
}

function markGeminiExhausted() {
  geminiExhausted = true;
  localStorage.setItem('gemini_exhausted', today);
}

function getSetting(key, fallback) {
  return localStorage.getItem(key) || fallback;
}

let primaryModel = getSetting('ai_primary_model', 'gemini-2.5-flash');
let fallbackModel = getSetting('ai_fallback_model', 'gemini-2.0-flash');
let groqModel = getSetting('ai_groq_model', 'llama-3.3-70b-versatile');
let maxDailyRequests = parseInt(getSetting('ai_daily_limit', '18'), 10);

const GROQ_FALLBACK_CHAIN = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it',
];

// =====================
// SUDAN STYLE (unchanged)
// =====================
const SUDAN_STYLE = `
You are writing as a Sudan Ministry of Health national clinical guideline author.
Style: real hospital protocol tone, natural clinical English, suitable for doctors, interns, nurses in Sudan hospitals.
`;

// =====================
// PROMPTS
// =====================
const STRUCTURED_GENERATION_PROMPT = `
${SUDAN_STYLE}
Convert input into a structured clinical guideline.
Return ONLY valid JSON:
{
  "title": "clinical guideline title",
  "sections": [
    {
      "section_type": "overview|indications|diagnosis|management|red_flags|prevention|references",
      "title": "section title",
      "content": "well-structured Markdown in Sudan protocol style"
    }
  ]
}
RULES:
- Output ONLY JSON
- No invented medical facts
- If missing info → "NOT CONFIRMED"
- Preserve all clinical values & dosages exactly
- Use Markdown: headings (##), bold (**), bullet lists, numbered lists
- Write like real Ministry of Health document
`;

// IMPROVED FORMAT PROMPT – strict Markdown with example
const SECTION_FORMAT_PROMPT = `
${SUDAN_STYLE}

You are an expert medical editor. Format the following clinical text into **professional, consistent Markdown** suitable for a clinical guidelines platform.

STRICT FORMATTING RULES (follow exactly):
- Start with a level-2 heading (##) that summarizes the section if not already present.
- Use bullet points (*) for lists of symptoms, criteria, or options.
- Use numbered lists (1.) for sequential steps or priorities.
- Bold (**) only the most critical medical terms or actions (e.g., **IMPORTANT**, **first-line**).
- Preserve all original information, dosages, and clinical facts exactly.
- Do NOT add any extra commentary or change the meaning.
- Do NOT use HTML tags.
- Output ONLY the Markdown content, without any wrapper or explanation.

Example of expected output:
## Initial Management
* Assess airway, breathing, circulation
* Start **oxygen therapy** if SpO₂ < 90%
* Obtain IV access
1. Administer first dose of **IV artesunate 2.4 mg/kg**
2. Check blood glucose
3. Begin fluid resuscitation with **Ringer's lactate 10 mL/kg**

Section type: {section_type}

TEXT:
---
{content}
---
`;

const RULE_SUGGESTION_PROMPT = `
You are a Clinical Decision Support System (CDSS) for Sudan hospitals.
STRICT RULES:
- NO diagnosis
- NO prescriptions
- ONLY safety-based clinical rules
- ONLY extract rules explicitly supported by text

Return JSON array ONLY:
[
  {
    "name": "",
    "condition": {
      "parameter": "temperature|heart_rate|respiratory_rate|systolic_bp|diastolic_bp|oxygen_saturation|age|rdt_result|blood_smear|hb|platelets|creatinine|gcs",
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
If unclear → return []
`;

// =====================
// HELPERS
// =====================
function extractJson(text) {
  try { return JSON.parse(text); } catch (_) {
    const cleaned = text.replace(/```json|```/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Invalid AI JSON response');
  }
}

function chunkText(text, size = 8000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size));
  return chunks;
}

async function groqGenerate(prompt, jsonMode, model) {
  const completion = await groq.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: jsonMode
          ? 'Output ONLY valid JSON. No explanation.'
          : 'You are a helpful clinical assistant.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
    response_format: jsonMode ? { type: 'json_object' } : undefined,
  });
  return completion.choices[0]?.message?.content || '';
}

async function unifiedGenerate(prompt, jsonMode = false) {
  if (geminiAI && !geminiExhausted && requestCount < maxDailyRequests) {
    requestCount++;
    localStorage.setItem('ai_request_count', requestCount.toString());
    const modelName = requestCount <= maxDailyRequests ? primaryModel : fallbackModel;
    const model = geminiAI.getGenerativeModel({ model: modelName });
    try {
      const config = jsonMode ? { generationConfig: { responseMimeType: 'application/json' } } : {};
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        ...config,
      });
      return result.response.text();
    } catch (err) {
      if (err?.status === 429 || err?.message?.includes('429')) {
        markGeminiExhausted();
      } else {
        throw err;
      }
    }
  }

  if (!groq) throw new Error('No AI provider available');

  const modelsToTry = [groqModel, ...GROQ_FALLBACK_CHAIN.filter(m => m !== groqModel)];
  for (const model of modelsToTry) {
    try {
      return await groqGenerate(prompt, jsonMode, model);
    } catch (err) {
      if (err.message?.includes('decommissioned') || err.message?.includes('no longer supported')) {
        continue;
      }
      throw err;
    }
  }
  throw new Error('All AI providers failed');
}

export async function generateFromPrompt(description) {
  const prompt = `${STRUCTURED_GENERATION_PROMPT}\n\nINPUT:\n${description}`;
  const text = await unifiedGenerate(prompt, true);
  return extractJson(text);
}

export async function generateFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map(item => item.str).join(' ') + '\n';
  }

  const chunks = chunkText(fullText, 8000);
  const sections = [];
  let title = 'Clinical Guideline';

  for (const chunk of chunks) {
    const prompt = `${STRUCTURED_GENERATION_PROMPT}\n\nRAW:\n${chunk}`;
    const text = await unifiedGenerate(prompt, true);
    const data = extractJson(text);
    if (data?.sections) sections.push(...data.sections);
    if (title === 'Clinical Guideline' && data?.title) title = data.title;
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
  const text = await unifiedGenerate(prompt, false);
  return text.trim();
}

export async function suggestCDSSRules(sections) {
  const content = sections
    .map(s => `## ${s.title || s.section_type}\n${s.content}`)
    .join('\n\n')
    .substring(0, 12000);
  const prompt = `${RULE_SUGGESTION_PROMPT}\n\nCONTENT:\n${content}`;
  const text = await unifiedGenerate(prompt, true);
  return extractJson(text);
}

export function getAiSettings() {
  return {
    primaryModel: getSetting('ai_primary_model', 'gemini-2.5-flash'),
    fallbackModel: getSetting('ai_fallback_model', 'gemini-2.0-flash'),
    groqModel: getSetting('ai_groq_model', 'llama-3.3-70b-versatile'),
    dailyLimit: parseInt(getSetting('ai_daily_limit', '18'), 10),
    requestCount,
    geminiExhausted,
  };
}

export function updateAiSettings({ primaryModel, fallbackModel, groqModel, dailyLimit }) {
  if (primaryModel) {
    localStorage.setItem('ai_primary_model', primaryModel);
    primaryModel = primaryModel;
  }
  if (fallbackModel) {
    localStorage.setItem('ai_fallback_model', fallbackModel);
    fallbackModel = fallbackModel;
  }
  if (groqModel) {
    localStorage.setItem('ai_groq_model', groqModel);
    groqModel = groqModel;
  }
  if (dailyLimit !== undefined) {
    localStorage.setItem('ai_daily_limit', dailyLimit.toString());
    maxDailyRequests = parseInt(dailyLimit, 10);
  }
}
