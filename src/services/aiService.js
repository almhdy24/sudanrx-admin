import { GoogleGenerativeAI } from '@google/generative-ai';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const SYSTEM_PROMPT = `
You are a medical content formatter. Given a description of a clinical guideline (or raw text from a PDF), produce a JSON object with the following keys:
- "title": a short, descriptive title for the guideline
- "sections": an array of objects, each having:
    - "section_type": one of (overview, indications, diagnosis, management, red_flags, prevention, references)
    - "title": a section heading (can be empty)
    - "content": well‑structured Markdown content for that section.

Important rules:
- Use the information provided; fill all sections that are relevant.
- The "overview" should include a definition, epidemiology, and clinical importance if applicable.
- Use bullet points, bold text (**) for emphasis, and Markdown syntax.
- Only output the JSON object, nothing else.
- If insufficient info, create minimal but plausible medical content based on the title.
`;

// =====================
// UNIVERSAL FORMATTING PROMPT
// =====================
const FORMAT_PROMPT = `
You are a medical editor. Improve the following text into polished, professional Markdown suitable for a clinical guidelines platform.
- Keep all original information and key facts.
- Use proper headings (##, ###) where helpful.
- Use bullet points, numbered lists, bold (**) for important terms.
- Add a short introductory sentence if missing.
- DO NOT change the meaning or remove critical data.
- Output ONLY the improved Markdown, nothing else.

Section type (context): {section_type}

Raw content:
---
{content}
---

Improved Markdown:
`;

/**
 * Generate structured guideline from a natural language description.
 */
export async function generateFromPrompt(description) {
  if (!API_KEY) throw new Error('Gemini API key not configured');
  const prompt = `${SYSTEM_PROMPT}\n\nInput: ${description}`;
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid AI response');
  return JSON.parse(jsonMatch[0]);
}

/**
 * Extract text from a PDF file, then send to Gemini for formatting.
 */
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

  const prompt = `${SYSTEM_PROMPT}\n\nRaw text:\n${fullText.substring(0, 15000)}`;
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid AI response');
  return JSON.parse(jsonMatch[0]);
}

// =====================
// NEW: FORMAT A SINGLE SECTION
// =====================
export async function formatSectionContent(sectionType, content) {
  if (!API_KEY) throw new Error('Gemini API key not configured');
  const prompt = FORMAT_PROMPT.replace('{section_type}', sectionType).replace('{content}', content);
  const result = await model.generateContent(prompt);
  const improved = result.response.text().trim();
  return improved;
}
