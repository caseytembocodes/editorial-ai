// Blogdel Source Input + Article Output schemas.
import { z } from "zod";

export const CATEGORIES = [
  "technology","health","sports","politics","entertainment",
  "business","science","education","food","history",
] as const;

export const ARTICLE_TYPES = [
  "news","analysis","explainer","list","profile","history","guide",
] as const;

export const ARTICLE_STATUSES = [
  "draft","review","scheduled","published","failed","archived",
] as const;

export const referenceSchema = z.object({
  id: z.string().optional(),
  provider: z.string(),
  title: z.string().min(1),
  url: z.string().url(),
  published_at: z.string().optional().nullable(),
  retrieved_at: z.string().optional().nullable(),
  authority: z.enum(["primary","secondary","tertiary"]).default("primary"),
});

export const sourceInputSchema = z.object({
  id: z.string().optional(),
  category: z.enum(CATEGORIES),
  source_type: z.enum(["api","dataset","website","evergreen"]).optional(),
  source_id: z.string().optional(),
  prompt: z.string().min(20),
  context: z.object({
    headline: z.string().optional(),
    summary: z.string().optional(),
    published_at: z.string().optional(),
    entities: z.array(z.any()).optional(),
    facts: z.array(z.object({ claim: z.string(), source_ref: z.string().optional() })).optional(),
  }).optional().default({}),
  references: z.array(referenceSchema).min(1, "At least one reference is required."),
  instructions: z.object({
    article_type: z.enum(ARTICLE_TYPES).default("news"),
    tone: z.string().default("clear"),
    target_length: z.number().int().min(300).max(3000).default(900),
    audience: z.string().default("general"),
    freshness: z.string().default("current"),
    avoid: z.array(z.string()).default([]),
  }).default({
    article_type: "news", tone: "clear", target_length: 900,
    audience: "general", freshness: "current", avoid: [],
  }),
  created_at: z.string().optional(),
});
export type SourceInput = z.infer<typeof sourceInputSchema>;

export const articleOutputSchema = z.object({
  slug: z.string().min(3).max(120).regex(/^[a-z0-9-]+$/, "Slug must be lowercase kebab-case."),
  category: z.enum(CATEGORIES),
  title: z.string().min(8).max(160),
  description: z.string().min(30).max(320),
  body_markdown: z.string().min(500, "Body must be at least 500 characters."),
  article_type: z.enum(ARTICLE_TYPES).default("news"),
  language: z.string().default("en"),
  keywords: z.array(z.string()).max(12).default([]),
  references: z.array(referenceSchema).default([]),
});
export type ArticleOutput = z.infer<typeof articleOutputSchema>;

export const REFERENCE_MINIMA: Record<string, number> = {
  technology: 1, health: 2, sports: 1, politics: 2, entertainment: 1,
  business: 1, science: 2, education: 1, food: 1, history: 1,
};
