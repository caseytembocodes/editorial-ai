import { Link } from "@tanstack/react-router";
import { formatDate, readingMinutes } from "@/lib/blogdel";
import { Badge } from "@/components/ui/badge";

export interface ArticleCardData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  published_at: string | null;
  reading_time_minutes: number | null;
  word_count?: number | null;
  article_type: string;
  provider: string | null;
  model: string | null;
  is_demo?: boolean | null;
  categories?: { slug: string; label: string } | null;
  authors?: { slug: string; display_name: string } | null;
}

export function ArticleCard({ a, variant = "row" }: { a: ArticleCardData; variant?: "row" | "lead" | "compact" }) {
  const cat = a.categories;
  const author = a.authors;
  if (variant === "lead") {
    return (
      <article className="border-b border-border pb-8">
        {cat && <Link to="/category/$slug" params={{ slug: cat.slug }} className="eyebrow">{cat.label}</Link>}
        <Link to="/blogs/$slug" params={{ slug: a.slug }} className="block mt-2 group">
          <h2 className="headline text-4xl md:text-5xl group-hover:text-accent-ink transition-colors">{a.title}</h2>
        </Link>
        {a.description && <p className="mt-3 max-w-3xl text-lg text-muted-foreground font-serif">{a.description}</p>}
        <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          {author && <Link to="/authors/$slug" params={{ slug: author.slug }} className="hover:text-foreground">{author.display_name}</Link>}
          <span>·</span>
          <span>{formatDate(a.published_at)}</span>
          <span>·</span>
          <span>{a.reading_time_minutes ?? readingMinutes(a.word_count ?? 700)} min read</span>
          {a.is_demo && <Badge variant="outline" className="ml-2">Demo</Badge>}
        </div>
      </article>
    );
  }
  if (variant === "compact") {
    return (
      <article className="border-b border-border py-3">
        <Link to="/blogs/$slug" params={{ slug: a.slug }} className="block group">
          <h3 className="headline text-lg leading-snug group-hover:text-accent-ink">{a.title}</h3>
        </Link>
        <div className="mt-1 flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          {cat && <Link to="/category/$slug" params={{ slug: cat.slug }} className="text-accent-ink">{cat.label}</Link>}
          <span>·</span>
          <span>{formatDate(a.published_at)}</span>
        </div>
      </article>
    );
  }
  return (
    <article className="border-b border-border py-6">
      {cat && <Link to="/category/$slug" params={{ slug: cat.slug }} className="eyebrow">{cat.label}</Link>}
      <Link to="/blogs/$slug" params={{ slug: a.slug }} className="block mt-2 group">
        <h3 className="headline text-2xl md:text-3xl group-hover:text-accent-ink transition-colors">{a.title}</h3>
      </Link>
      {a.description && <p className="mt-2 max-w-2xl text-base text-muted-foreground font-serif">{a.description}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {author && <Link to="/authors/$slug" params={{ slug: author.slug }} className="hover:text-foreground">{author.display_name}</Link>}
        <span>·</span>
        <span>{formatDate(a.published_at)}</span>
        <span>·</span>
        <span>{a.reading_time_minutes ?? readingMinutes(a.word_count ?? 700)} min read</span>
        <span>·</span>
        <span>{a.article_type}</span>
        {a.is_demo && <Badge variant="outline" className="ml-2">Demo</Badge>}
      </div>
    </article>
  );
}
