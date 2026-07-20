import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listArticles } from "@/lib/public.functions";
import { SiteShell } from "@/components/blogdel/SiteShell";
import { ArticleCard, type ArticleCardData } from "@/components/blogdel/ArticleCard";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const searchSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  q: z.string().optional(),
  category: z.string().optional(),
  type: z.string().optional(),
});

const opts = (input: any) => queryOptions({
  queryKey: ["blogs", input],
  queryFn: () => listArticles({ data: input }),
});

export const Route = createFileRoute("/blogs/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(opts(deps)),
  head: () => ({ meta: [{ title: "All articles — Blogdel" }, { name: "description", content: "Every article Blogdel has published, across all ten editorial desks." }] }),
  errorComponent: ({ error, reset }) => {
    const r = useRouter();
    return <SiteShell><div className="text-center py-16"><p className="text-red-600">{error.message}</p><button className="mt-4 border border-foreground px-3 py-1 text-sm" onClick={() => { r.invalidate(); reset(); }}>Retry</button></div></SiteShell>;
  },
  notFoundComponent: () => <SiteShell>Not found</SiteShell>,
  component: BlogsIndex,
});

function BlogsIndex() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data } = useSuspenseQuery(opts(search));
  const [q, setQ] = useState(search.q ?? "");
  const totalPages = Math.max(1, Math.ceil(data.count / data.perPage));

  return (
    <SiteShell>
      <div className="border-b border-border pb-6 mb-6">
        <div className="eyebrow">Archive</div>
        <h1 className="headline text-4xl mt-1">All articles</h1>
        <p className="text-muted-foreground mt-2 text-sm">{data.count} published across all desks.</p>
      </div>

      <form className="mb-6 flex gap-2" onSubmit={(e) => { e.preventDefault(); navigate({ search: (prev: any) => ({ ...prev, q: q || undefined, page: 1 }) }); }}>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles, keywords…" className="max-w-md" />
        <Button type="submit" variant="default">Search</Button>
        {(search.q || search.category || search.type) && (
          <Button type="button" variant="ghost" onClick={() => { setQ(""); navigate({ search: {} as any }); }}>Clear</Button>
        )}
      </form>

      <div className="grid gap-6 md:grid-cols-2">
        {(data.rows as unknown as ArticleCardData[]).map(a => <ArticleCard key={a.id} a={a} />)}
      </div>
      {data.rows.length === 0 && <p className="text-center py-16 text-muted-foreground">No matches.</p>}

      {totalPages > 1 && (
        <div className="mt-10 flex justify-center gap-2 text-sm">
          {Array.from({ length: totalPages }).slice(0, 12).map((_, i) => (
            <Link key={i} to="/blogs" search={{ ...search, page: i+1 } as any}
              className={`px-3 py-1 border border-border ${data.page === i+1 ? "bg-foreground text-background" : "hover:bg-muted"}`}>{i+1}</Link>
          ))}
        </div>
      )}
    </SiteShell>
  );
}
