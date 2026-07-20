import { createFileRoute, useRouter } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { searchArticles } from "@/lib/public.functions";
import { SiteShell } from "@/components/blogdel/SiteShell";
import { ArticleCard, type ArticleCardData } from "@/components/blogdel/ArticleCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useState } from "react";

const searchSchema = z.object({ q: z.string().optional().default(""), category: z.string().optional() });
const opts = (q: string, cat?: string) => queryOptions({
  queryKey: ["search", q, cat],
  queryFn: () => searchArticles({ data: { q, category: cat } }),
  enabled: q.length > 0,
});

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => deps.q ? context.queryClient.ensureQueryData(opts(deps.q, deps.category)) : Promise.resolve({ rows: [], q: "" }),
  head: () => ({ meta: [{ title: "Search — Blogdel" }] }),
  errorComponent: ({ error, reset }) => { const r = useRouter(); return <SiteShell><p className="text-red-600">{error.message}</p><button onClick={()=>{r.invalidate();reset();}}>retry</button></SiteShell>; },
  notFoundComponent: () => <SiteShell>Not found</SiteShell>,
  component: SearchPage,
});

function SearchPage() {
  const s = Route.useSearch();
  const nav = Route.useNavigate();
  const [q, setQ] = useState(s.q ?? "");
  const data: any = s.q ? useSuspenseQuery(opts(s.q, s.category)).data : { rows: [] };
  return (
    <SiteShell>
      <div className="mb-6">
        <div className="eyebrow">Search</div>
        <h1 className="headline text-4xl mt-1">Find articles</h1>
      </div>
      <form className="flex gap-2 mb-6" onSubmit={(e) => { e.preventDefault(); nav({ search: { q, category: s.category } }); }}>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Titles, keywords, topics…" className="max-w-md" />
        <Button type="submit">Search</Button>
      </form>
      {s.q && <p className="text-sm text-muted-foreground mb-4">{data.rows.length} results for “{s.q}”.</p>}
      <div className="grid gap-6 md:grid-cols-2">
        {(data.rows as ArticleCardData[]).map((a) => <ArticleCard key={a.id} a={a} />)}
      </div>
    </SiteShell>
  );
}
