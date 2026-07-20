// Public reads via the server publishable client (respects RLS as anon).
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function serverPublic() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const ARTICLE_COLS =
  "id,slug,title,description,category_id,author_id,article_type,status,featured_image_url,featured_image_alt,reading_time_minutes,word_count,published_at,updated_at,provider,model,keywords,body_markdown,is_demo";

export const getHomepage = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverPublic();
  const [{ data: categories }, { data: articles }] = await Promise.all([
    sb.from("categories").select("id,slug,label,internal_label,description,sort_order").order("sort_order"),
    sb.from("articles").select(ARTICLE_COLS + ",categories(slug,label),authors(slug,display_name)").eq("status","published").order("published_at",{ ascending: false }).limit(60),
  ]);
  return { categories: categories ?? [], articles: articles ?? [] };
});

export const listArticles = createServerFn({ method: "GET" })
  .inputValidator((d: { category?: string; author?: string; type?: string; q?: string; sort?: "newest"|"oldest"|"relevance"; page?: number; perPage?: number }) => d)
  .handler(async ({ data }) => {
    const sb = serverPublic();
    const perPage = Math.min(48, Math.max(1, data.perPage ?? 12));
    const page = Math.max(1, data.page ?? 1);
    let query = sb.from("articles").select(ARTICLE_COLS + ",categories(slug,label),authors(slug,display_name)", { count: "exact" }).eq("status","published");
    if (data.category) {
      const { data: cat } = await sb.from("categories").select("id").eq("slug", data.category).maybeSingle();
      if (cat) query = query.eq("category_id", cat.id);
    }
    if (data.author) {
      const { data: au } = await sb.from("authors").select("id").eq("slug", data.author).maybeSingle();
      if (au) query = query.eq("author_id", au.id);
    }
    if (data.type) query = query.eq("article_type", data.type as never);
    if (data.q && data.q.trim()) {
      query = query.textSearch("search_tsv", data.q.trim().split(/\s+/).map(t=>t.replace(/[^a-z0-9]/gi,"")).filter(Boolean).join(" & "), { config: "english" });
    }
    if (data.sort === "oldest") query = query.order("published_at",{ ascending: true });
    else query = query.order("published_at",{ ascending: false });
    query = query.range((page-1)*perPage, page*perPage - 1);
    const { data: rows, count } = await query;
    return { rows: rows ?? [], count: count ?? 0, page, perPage };
  });

export const getArticleBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const sb = serverPublic();
    const { data: article } = await sb.from("articles")
      .select(ARTICLE_COLS + ",categories(slug,label),authors(slug,display_name,description)")
      .eq("slug", data.slug).eq("status","published").maybeSingle();
    if (!article) return null;
    const [{ data: refs }, { data: related }] = await Promise.all([
      sb.from("article_references").select("*").eq("article_id", article.id).order("position"),
      sb.from("articles").select("id,slug,title,description,published_at,reading_time_minutes,categories(slug,label),authors(slug,display_name)")
        .eq("status","published").eq("category_id", article.category_id).neq("id", article.id)
        .order("published_at",{ ascending: false }).limit(4),
    ]);
    return { article, refs: refs ?? [], related: related ?? [] };
  });

export const getCategoryPage = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string; page?: number }) => d)
  .handler(async ({ data }) => {
    const sb = serverPublic();
    const { data: cat } = await sb.from("categories").select("*").eq("slug", data.slug).maybeSingle();
    if (!cat) return null;
    const perPage = 12;
    const page = Math.max(1, data.page ?? 1);
    const [{ data: articles, count }, { data: authors }] = await Promise.all([
      sb.from("articles").select(ARTICLE_COLS + ",categories(slug,label),authors(slug,display_name)", { count: "exact" })
        .eq("category_id", cat.id).eq("status","published").order("published_at",{ ascending: false })
        .range((page-1)*perPage, page*perPage - 1),
      sb.from("authors").select("id,slug,display_name,article_count").eq("category_id", cat.id).eq("is_active",true).order("display_name"),
    ]);
    return { category: cat, articles: articles ?? [], count: count ?? 0, page, perPage, authors: authors ?? [] };
  });

export const getAuthorPage = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const sb = serverPublic();
    const { data: author } = await sb.from("authors").select("*,categories(slug,label)").eq("slug", data.slug).maybeSingle();
    if (!author) return null;
    const { data: articles } = await sb.from("articles")
      .select(ARTICLE_COLS + ",categories(slug,label),authors(slug,display_name)")
      .eq("author_id", author.id).eq("status","published").order("published_at",{ ascending: false }).limit(30);
    return { author, articles: articles ?? [] };
  });

export const searchArticles = createServerFn({ method: "GET" })
  .inputValidator((d: { q: string; category?: string }) => d)
  .handler(async ({ data }) => {
    const q = (data.q ?? "").trim();
    if (!q) return { rows: [], q: "" };
    const sb = serverPublic();
    const tsq = q.split(/\s+/).map(t=>t.replace(/[^a-z0-9]/gi,"")).filter(Boolean).join(" & ");
    let query = sb.from("articles").select(ARTICLE_COLS + ",categories(slug,label),authors(slug,display_name)").eq("status","published");
    if (tsq) query = query.textSearch("search_tsv", tsq, { config: "english" });
    if (data.category) {
      const { data: cat } = await sb.from("categories").select("id").eq("slug", data.category).maybeSingle();
      if (cat) query = query.eq("category_id", cat.id);
    }
    const { data: rows } = await query.order("published_at",{ ascending: false }).limit(40);
    return { rows: rows ?? [], q };
  });
