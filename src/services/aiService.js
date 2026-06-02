import { GoogleGenerativeAI } from '@google/generative-ai';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY || '');

const fastModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
const proModel = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

// ---------- Medical safety & formatting prompts ----------
const STRUCTURED_GENERATION_PROMPT = `
You are a medical content formatter. Given a description of a clinical guideline (or raw text), produce a strict JSON object with:
{
  "title": "short descriptive title",
  "sections": [
    {
      "section_type": "overview|indications|diagnosis|management|red_flags|prevention|references",
      "title": "section heading (can be empty)",
      "content": "well-structured Markdown"
    }
  ]
}

CRITICAL RULES:
- Return ONLY the JSON object (no backticks, no markdown, no extra text).
- Use the provided information ONLY.
- If a section lacks data, OMIT it (do not invent facts).
- For missing details, write "NOT CONFIRMED" instead of guessing.
- Preserve dosages, numbers, and clinical terms exactly.
- Use proper Markdown: headings (##), bold (**), bullet lists.
- Output MUST be valid JSON.
`;

const SECTION_FORMAT_PROMPT = `
You are a medical editor. Improve the following text into polished Markdown for a clinical guidelines platform.
- Keep all original information.
- Use headings (##) where helpful, bullet lists, bold (**) for key terms.
- Add a short introductory sentence if missing.
- Ensure clinical neutrality. Do not add new medical claims.
- Preserve all dosages exactly.
- Output ONLY the improved Markdown, nothing else.
- If the text is already well-formatted, return it unchanged.

Section type: {section_type}

Raw content:
---
{content}
---

Improved Markdown:
`;

const RULE_SUGGESTION_PROMPT = `
You are a clinical decision support system expert. Given the following clinical guideline content, extract actionable CDSS rules.
Each rule must be an object with:
- "name": short description
- "condition": { "parameter": "parameter_name", "operator": ">|<|>=|<=|==|!=", "value": "threshold" }
- "action": { "type": "recommend", "message": "clear clinical instruction" }
- "priority": integer (1=high, 2=medium, 3=low)

Parameters must be one of: temperature, heart_rate, respiratory_rate, systolic_bp, diastolic_bp, oxygen_saturation, age, rdt_result, blood_smear, hb, platelets, creatinine, gcs.

Rules must be directly derived from the text. If no rules can be inferred, return an empty array.
Output ONLY a JSON array of rule objects, nothing else.

Guideline content:
{content}

Rules (JSON array):
`;

// ---------- Helper: safe JSON extract ----------
function extractJson(text) {
  let cleaned = text.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('No valid JSON found in AI response');
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
// PUBLIC FUNCTIONS
// =====================

export async function generateFromPrompt(description) {
  if (!API_KEY) throw new Error('Gemini API key not configured');
  const prompt = `${STRUCTURED_GENERATION_PROMPT}\n\nInput: ${description}`;
  const result = await fastModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' },
  });
  const text = result.response.text();
  return extractJson(text);
}

export async function generateFromPDF(file) {
  if (!API_KEY) throw new Error('Gemini API key not configured');
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    fullText += strings.join(' ') + '\n';
  }

  if (fullText.length <= 12000) {
    const prompt = `${STRUCTURED_GENERATION_PROMPT}\n\nRaw text:\n${fullText}`;
    const result = await fastModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });
    return extractJson(result.response.text());
  }

  const chunks = chunkText(fullText, 8000);
  const allSections = [];

  for (const chunk of chunks) {
    const prompt = `${STRUCTURED_GENERATION_PROMPT}\n\nRaw text (part):\n${chunk}`;
    const result = await fastModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });
    const data = extractJson(result.response.text());
    if (data.sections) {
      allSections.push(...data.sections);
    }
    if (!allSections.title && data.title) {
      allSections.title = data.title;
    }
  }

  const seenTypes = new Set();
  const mergedSections = [];
  for (const sec of allSections) {
    if (!seenTypes.has(sec.section_type)) {
      seenTypes.add(sec.section_type);
      mergedSections.push(sec);
    }
  }

  return { title: allSections.title || 'Untitled Guideline', sections: mergedSections };
}

export async function formatSectionContent(sectionType, content) {
  if (!API_KEY) throw new Error('Gemini API key not configured');
  const prompt = SECTION_FORMAT_PROMPT.replace('{section_type}', sectionType).replace('{content}', content);
  const result = await fastModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });
  return result.response.text().trim();
}

export async function suggestCDSSRules(sections) {
  if (!API_KEY) throw new Error('Gemini API key not configured');
  const content = sections.map(s => `## ${s.title || s.section_type}\n${s.content}`).join('\n\n');
  const prompt = RULE_SUGGESTION_PROMPT.replace('{content}', content.substring(0, 12000));
  const result = await fastModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json' },
  });
  const text = result.response.text();
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}
