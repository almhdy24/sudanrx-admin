import { GoogleGenerativeAI } from '@google/generative-ai';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source to avoid CORS issues (CDN worker)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!API_KEY) {
  console.error('VITE_GEMINI_API_KEY not set – AI features disabled');
}

const genAI = new GoogleGenerativeAI(API_KEY || '');

// The model we’ll use: gemini-1.5-flash (fast and good for text)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Prompt that tells Gemini exactly what we need
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

/**
 * Generate structured guideline from a natural language description.
 */
export async function generateFromPrompt(description) {
  if (!API_KEY) throw new Error('Gemini API key not configured');

  const prompt = `${SYSTEM_PROMPT}\n\nInput: ${description}`;
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid AI response');
  const data = JSON.parse(jsonMatch[0]);
  return data;
}

/**
 * Extract text from a PDF file, then send to Gemini for formatting.
 */
export async function generateFromPDF(file) {
  // Step 1: Extract text from PDF
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    fullText += strings.join(' ') + '\n';
  }

  // Step 2: Send to Gemini
  const prompt = `${SYSTEM_PROMPT}\n\nRaw text:\n${fullText.substring(0, 15000)}`; // limit token
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid AI response');
  return JSON.parse(jsonMatch[0]);
}
