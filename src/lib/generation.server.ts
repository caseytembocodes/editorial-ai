// Generation providers: Groq (primary), Gemini (fallback 1), Cerebras (fallback 2).
// Falls back to Lovable AI Gateway (Gemini) when GROQ_API_KEY is absent so the
// demo pipeline works before the user configures Groq secrets.

import { articleOutputSchema, sourceInputSchema } from "./article-schema";
import type { z } from "zod";
import slugify from "slugify";

type Input = z.infer<typeof sourceInputSchema>;
type Output = z.infer<typeof articleOutputSchema> & { __provider: string; __model: string };

const SYSTEM_PROMPT = `You are the Blogdel editorial engine. Produce ONE original, schema-valid article as JSON.
STRICT: respond with a JSON object ONLY (no markdown, no commentary), matching this shape:
{
  "slug": "lowercase-kebab-case",
  "category": "<one of technology,health,sports,politics,entertainment,business,science,education,food,history>",
  "title": "8-160 chars",
  "description": "30-320 chars",
  "body_markdown": "at least 500 characters, in Markdown, using ## H2 subheads",
  "article_type": "news|analysis|explainer|list|profile|history|guide",
  "language": "en",
  "keywords": ["up to 12 keywords"],
  "references": [ { "provider": "...", "title": "...", "url": "...", "authority": "primary|secondary|tertiary" } ]
}
Rules: never fabricate quotes attributed to real people, do not include placeholder text like TODO or LOREM, do not include the source prompt back in the body, always include the supplied references, keep description a plain sentence (no markdown), and use British/American English consistently.`;

function buildUserPrompt(input: Input): string {
  return [
    `CATEGORY: ${input.category}`,
    `ARTICLE_TYPE: ${input.instructions.article_type}`,
    `TARGET_LENGTH_WORDS: ${input.instructions.target_length}`,
    `AUDIENCE: ${input.instructions.audience}`,
    `PROMPT:\n${input.prompt}`,
    input.context?.summary ? `CONTEXT_SUMMARY:\n${input.context.summary}` : "",
    `REFERENCES (must be echoed back in "references"):\n${JSON.stringify(input.references, null, 2)}`,
    `Respond with a JSON object matching the schema.`,
  ].filter(Boolean).join("\n\n");
}

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced?.[1] ?? text).trim();
  const first = candidate.indexOf("{");
  const last = candidate.lastIndexOf("}");
  const slice = first >= 0 && last > first ? candidate.slice(first, last + 1) : candidate;
  return JSON.parse(slice);
}

async function callGroq(input: Input, model: string): Promise<Output | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model, temperature: 0.6, response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const body = await res.json();
  const content = body.choices?.[0]?.message?.content;
  const json = typeof content === "string" ? extractJson(content) : content;
  const parsed = articleOutputSchema.parse(json);
  return { ...parsed, __provider: "groq", __model: model };
}

async function callLovableAI(input: Input, model: string): Promise<Output> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY is not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model, temperature: 0.6, response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input) },
      ],
    }),
  });
  if (res.status === 429) throw new Error("AI gateway rate-limited (429). Try again shortly.");
  if (res.status === 402) throw new Error("AI credits exhausted (402). Add credits to the workspace.");
  if (!res.ok) throw new Error(`Lovable AI ${res.status}: ${await res.text()}`);
  const body = await res.json();
  const content = body.choices?.[0]?.message?.content;
  const json = typeof content === "string" ? extractJson(content) : content;
  const parsed = articleOutputSchema.parse(json);
  return { ...parsed, __provider: "lovable-ai", __model: model };
}

async function callGemini(input: Input): Promise<Output | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const model = "gemini-2.5-flash";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: buildUserPrompt(input) }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.6 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const body = await res.json();
  const text = body?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  const parsed = articleOutputSchema.parse(extractJson(text));
  return { ...parsed, __provider: "gemini", __model: model };
}

async function callCerebras(input: Input): Promise<Output | null> {
  const key = process.env.CEREBRAS_API_KEY;
  if (!key) return null;
  const model = "llama-3.3-70b";
  const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model, temperature: 0.6, response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Cerebras ${res.status}: ${await res.text()}`);
  const body = await res.json();
  const content = body.choices?.[0]?.message?.content;
  const parsed = articleOutputSchema.parse(typeof content === "string" ? extractJson(content) : content);
  return { ...parsed, __provider: "cerebras", __model: model };
}

export async function runGeneration(opts: { input: Input; categorySlug: string; model?: string }): Promise<Output> {
  const model = opts.model ?? "openai/gpt-oss-20b";
  const errors: string[] = [];
  // Groq
  try {
    const r = await callGroq(opts.input, model);
    if (r) return finalize(r, opts.input);
  } catch (e: any) { errors.push(`groq: ${e.message}`); }
  // Gemini direct
  try {
    const r = await callGemini(opts.input);
    if (r) return finalize(r, opts.input);
  } catch (e: any) { errors.push(`gemini: ${e.message}`); }
  // Cerebras
  try {
    const r = await callCerebras(opts.input);
    if (r) return finalize(r, opts.input);
  } catch (e: any) { errors.push(`cerebras: ${e.message}`); }
  // Lovable AI (built-in) — final fallback so the demo pipeline always works.
  const r = await callLovableAI(opts.input, "google/gemini-2.5-flash");
  return finalize(r, opts.input);
}

function finalize(out: Output, input: Input): Output {
  const slug = slugify(out.slug || out.title, { lower: true, strict: true }).slice(0, 90) || "untitled";
  // Ensure references are at least those we supplied.
  const refs = out.references?.length ? out.references : input.references;
  return { ...out, slug, references: refs };
}
