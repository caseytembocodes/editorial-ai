import { createFileRoute, Link, useRouter, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getCategoryPage } from "@/lib/public.functions";
import { SiteShell } from "@/components/blogdel/SiteShell";
import { ArticleCard, type ArticleCardData } from "@/components/blogdel/ArticleCard";
import { z } from "zod";

const opts = (slug: string, page: number) => queryOptions({
  queryKey: ["category", slug, page],
  queryFn: () => getCategoryPage({ data: { slug, page } }),
});

export const Route = createFileRoute("/category/$slug")({
  validateSearch: z.object({ page: z.coerce.number().int().min(1).optional().default(1) }),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: async ({ context, params, deps }) => {
    const d = await context.queryClient.ensureQueryData(opts(params.slug, deps.page));
    if (!d) throw notFound();
    return d;
  },
  head: ({ loaderData }) => {
    const c: any = loaderData?.category;
    return c ? { meta: [
      { title: `${c.label} — Blogdel` },
      { name: "description", content: c.description ?? `Articles from the ${c.label} desk.` },
      { property: "og:title", content: `${c.label} — Blogdel` },
      { property: "og:description", content: c.description ?? `Articles from the ${c.label} desk.` },
    ] } : { meta: [{ title: "Category — Blogdel" }] };
  },
  errorComponent: ({ error, reset }) => {
    const r = useRouter();
    return <SiteShell><div className="text-center py-16"><p className="text-red-600">{error.message}</p><button className="mt-4 border border-foreground px-3 py-1 text-sm" onClick={() => { r.invalidate(); reset(); }}>Retry</button></div></SiteShell>;
  },
  notFoundComponent: () => <SiteShell><div className="text-center py-24"><h1 className="headline text-3xl">Desk not found</h1></div></SiteShell>,
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const { data } = useSuspenseQuery(opts(slug, search.page));
  if (!data) return null;
  const totalPages = Math.max(1, Math.ceil(data.count / data.perPage));

  return (
    <SiteShell>
      <div className="border-b border-border pb-6 mb-6">
        <div className="eyebrow">Desk</div>
        <h1 className="headline text-5xl mt-1">{data.category.label}</h1>
        {data.category.description && <p className="text-muted-foreground mt-3 max-w-2xl font-serif text-lg">{data.category.description}</p>}
      </div>

      <div className="grid gap-10 md:grid-cols-3">
        <div className="md:col-span-2 space-y-2">
          {(data.articles as unknown as ArticleCardData[]).map(a => <ArticleCard key={a.id} a={a} />)}
          {data.articles.length === 0 && <p className="text-muted-foreground py-16 text-center">No articles yet.</p>}
        </div>
        <aside>
          <div className="border-b-2 border-foreground pb-2 mb-3"><h2 className="eyebrow">Editors on this desk</h2></div>
          <ul className="space-y-1 text-sm">
            {data.authors.map(a => (
              <li key={a.id}>
                <Link to="/authors/$slug" params={{ slug: a.slug }} className="hover:text-accent-ink">{a.display_name}</Link>
                <span className="text-muted-foreground text-xs"> · {a.article_count} articles</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {totalPages > 1 && (
        <div className="mt-10 flex justify-center gap-2 text-sm">
          {Array.from({ length: totalPages }).map((_, i) => (
            <Link key={i} to="/category/$slug" params={{ slug }} search={{ page: i+1 }}
              className={`px-3 py-1 border border-border ${data.page === i+1 ? "bg-foreground text-background" : "hover:bg-muted"}`}>{i+1}</Link>
          ))}
        </div>
      )}
    </SiteShell>
  );
}
