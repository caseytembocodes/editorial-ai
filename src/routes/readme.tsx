import { createFileRoute } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { SiteShell } from "@/components/blogdel/SiteShell";
import readme from "../../README.md?raw";

export const Route = createFileRoute("/readme")({
  head: () => ({
    meta: [
      { title: "Read Me — Blogdel" },
      { name: "description", content: "Meet Blogdel: the autonomous editorial system built for OpenAI Build Week." },
    ],
  }),
  component: ReadmePage,
});

function ReadmePage() {
  return (
    <SiteShell>
      <article className="mx-auto w-full max-w-3xl overflow-hidden">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSanitize]}
          components={{
            h1: ({ children }) => <h1 className="headline text-5xl sm:text-6xl">{children}</h1>,
            h2: ({ children }) => <h2 className="headline mt-12 border-t border-border pt-6 text-3xl">{children}</h2>,
            h3: ({ children }) => <h3 className="headline mt-8 text-2xl">{children}</h3>,
            p: ({ children }) => <p className="mt-4 text-base leading-7 text-foreground/85 sm:text-lg">{children}</p>,
            blockquote: ({ children }) => <blockquote className="mt-5 border-l-4 border-black pl-5 font-serif text-xl italic text-muted-foreground">{children}</blockquote>,
            ul: ({ children }) => <ul className="mt-5 list-disc space-y-2 pl-6 leading-7">{children}</ul>,
            ol: ({ children }) => <ol className="mt-5 list-decimal space-y-2 pl-6 leading-7">{children}</ol>,
            a: ({ href, children }) => <a href={href} className="font-medium underline decoration-1 underline-offset-4 hover:text-accent-ink">{children}</a>,
            pre: ({ children }) => <pre className="mt-5 max-w-full overflow-x-auto border border-border bg-muted p-4 text-sm leading-6">{children}</pre>,
            code: ({ children, className }) => className
              ? <code className={className}>{children}</code>
              : <code className="bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">{children}</code>,
            hr: () => <hr className="my-10 border-border" />,
            strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          }}
        >
          {readme}
        </ReactMarkdown>
      </article>
    </SiteShell>
  );
}
