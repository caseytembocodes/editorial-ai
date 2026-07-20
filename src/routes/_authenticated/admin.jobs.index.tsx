import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { listJobs, retryJob } from "@/lib/admin.functions";
import { PageTitle } from "@/components/blogdel/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { formatDateTime, JOB_STATUS_LABELS } from "@/lib/blogdel";
import { toast } from "sonner";

const opts = (status?: string) => queryOptions({ queryKey: ["admin","jobs", status], queryFn: () => listJobs({ data: { status } }) });

export const Route = createFileRoute("/_authenticated/admin/jobs/")({
  validateSearch: z.object({ status: z.string().optional() }),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(opts(deps.status)),
  component: Jobs,
});

function Jobs() {
  const s = Route.useSearch();
  const { data } = useSuspenseQuery(opts(s.status));
  const qc = useQueryClient();
  const retry = async (id: string) => {
    try { await retryJob({ data: { id } }); toast.success("Requeued"); qc.invalidateQueries({ queryKey: ["admin","jobs"] }); }
    catch (e: any) { toast.error(e.message); }
  };
  const filters = ["","queued","running","completed","failed"];
  return (
    <>
      <PageTitle eyebrow="Delegation" title="Jobs" description="Every generation the pipeline has attempted, latest first." />
      <div className="flex gap-1 mb-4">
        {filters.map(f => (
          <Link key={f} to="/admin/jobs" search={{ status: f || undefined } as any}
            className={`text-xs px-2 py-1 border border-border ${((s.status ?? "") === f) ? "bg-foreground text-background" : "hover:bg-muted"}`}>
            {f || "all"}
          </Link>
        ))}
      </div>
      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left"><tr><th className="p-3">Created</th><th>Category</th><th>Author</th><th>Provider</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {data.map((j: any) => (
              <tr key={j.id} className="border-t border-border">
                <td className="p-3 whitespace-nowrap"><Link to="/admin/jobs/$id" params={{ id: j.id }} className="hover:text-accent-ink">{formatDateTime(j.created_at)}</Link></td>
                <td>{j.categories?.label}</td>
                <td>{j.authors?.display_name}</td>
                <td className="font-mono text-xs">{j.provider}/{j.model}</td>
                <td><Badge variant={j.status === "failed" ? "destructive" : j.status === "completed" ? "default" : "secondary"}>{JOB_STATUS_LABELS[j.status] ?? j.status}</Badge></td>
                <td>{j.status === "failed" && <Button size="sm" variant="outline" onClick={() => retry(j.id)}>Retry</Button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
