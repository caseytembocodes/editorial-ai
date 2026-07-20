import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { getHomepage } from "@/lib/public.functions";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/blogdel/SiteShell";
import { ArticleCard, type ArticleCardData } from "@/components/blogdel/ArticleCard";

const homeOpts = queryOptions({
  queryKey: ["home"],
  queryFn: () => getHomepage(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Blogdel — Autonomous editorial publication" },
      { name: "description", content: "Ten desks. Disclosed models. Every article generated from named sources and validated against a strict schema." },
      { property: "og:title", content: "Blogdel — Autonomous editorial publication" },
      { property: "og:description", content: "Ten desks. Disclosed models. Every article generated from named sources." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homeOpts),
  errorComponent: ({ error, reset }) => {
    const r = useRouter();
    return <SiteShell><div className="text-center py-16"><p className="text-red-600">{error.message}</p><button className="mt-4 border border-foreground px-3 py-1 text-sm" onClick={() => { r.invalidate(); reset(); }}>Retry</button></div></SiteShell>;
  },
  notFoundComponent: () => <SiteShell><p>Not found</p></SiteShell>,
  component: Home,
});

function Home() {
  const { data } = useSuspenseQuery(homeOpts);
  const articles = (data.articles as unknown as ArticleCardData[]);
  const [lead, ...rest] = articles;
  const above = rest.slice(0, 6);
  const below = rest.slice(6, 20);

  return (
    <SiteShell>
      {!lead && (
        <div className="text-center py-24">
          <p className="text-muted-foreground">No articles have been published yet.</p>
        </div>
      )}
      {lead && (
        <div className="grid gap-10 md:grid-cols-3">
          <div className="md:col-span-2">
            <ArticleCard a={lead} variant="lead" />
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {above.map(a => <ArticleCard key={a.id} a={a} />)}
            </div>
          </div>
          <aside className="md:col-span-1">
            <div className="border-b-2 border-foreground pb-2 mb-3">
              <h2 className="eyebrow">The Desks</h2>
            </div>
            <ul className="grid grid-cols-2 gap-y-1 text-sm">
              {data.categories.map(c => (
                <li key={c.id}>
                  <Link to="/category/$slug" params={{ slug: c.slug }} className="hover:text-accent-ink">{c.label}</Link>
                </li>
              ))}
            </ul>
            <div className="mt-8 border-b-2 border-foreground pb-2 mb-3">
              <h2 className="eyebrow">More stories</h2>
            </div>
            {below.slice(0, 8).map(a => <ArticleCard key={a.id} a={a} variant="compact" />)}
          </aside>
        </div>
      )}
      {below.length > 8 && (
        <section className="mt-16">
          <div className="border-b-2 border-foreground pb-2 mb-4"><h2 className="eyebrow">Latest across desks</h2></div>
          <div className="grid gap-6 md:grid-cols-3">
            {below.slice(8).map(a => <ArticleCard key={a.id} a={a} />)}
          </div>
        </section>
      )}
    </SiteShell>
  );
}
