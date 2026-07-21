import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { listJobs, retryJob } from "@/lib/admin.functions";
import { PageTitle } from "@/components/blogdel/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { formatDateTime, JOB_STATUS_LABELS } from "@/lib/blogdel";
import { toast } from "sonner";

const opts = (status?: string) => queryOptions({ queryKey: ["admin","jobs", status], queryFn: () => listJobs({ data: { status: status === "schedule" ? undefined : status } }) });

const DAILY_SCHEDULES = [
  { job: "blogdel-daily-0700-sast", hour: 7 },
  { job: "blogdel-daily-1300-sast", hour: 13 },
  { job: "blogdel-daily-2000-sast", hour: 20 },
];

function nextRuns(count = 6) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const start = Date.UTC(get("year"), get("month") - 1, get("day"));
  const runs: Array<{ job: string; at: Date }> = [];
  for (let day = 0; day < 4; day++) for (const schedule of DAILY_SCHEDULES) {
    const at = new Date(start + day * 86_400_000 + (schedule.hour - 2) * 3_600_000);
    if (at > now) runs.push({ job: schedule.job, at });
  }
  return runs.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, count);
}

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
  const filters = ["","queued","running","completed","failed","schedule"];
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
      {s.status === "schedule" ? <ScheduleView /> : <div className="border border-border rounded overflow-hidden">
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
      </div>}
    </>
  );
}

function ScheduleView() {
  const runs = nextRuns();
  const now = Date.now();
  return <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-3">{DAILY_SCHEDULES.map((item) => <div key={item.job} className="rounded border border-border p-3"><div className="font-mono text-xs">{item.job}</div><div className="mt-1 text-lg font-semibold">{String(item.hour).padStart(2,"0")}:00 SAST</div><div className="text-xs text-muted-foreground">Daily - Africa/Johannesburg</div></div>)}</div>
    <div className="overflow-hidden rounded border border-border"><table className="w-full text-sm"><thead className="bg-muted text-left"><tr><th className="p-3">Job</th><th>Run time</th><th>Starts in</th><th>Output</th></tr></thead><tbody>{runs.map((run) => { const minutes = Math.max(0, Math.ceil((run.at.getTime() - now) / 60_000)); const days = Math.floor(minutes / 1440); const hours = Math.floor((minutes % 1440) / 60); const mins = minutes % 60; return <tr key={`${run.job}-${run.at.toISOString()}`} className="border-t border-border"><td className="p-3 font-mono text-xs">{run.job}</td><td>{run.at.toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg", dateStyle: "medium", timeStyle: "short" })}</td><td>{days ? `${days}d ` : ""}{hours}h {mins}m</td><td><Badge variant="secondary">Pending</Badge></td></tr>; })}</tbody></table></div>
    <p className="text-xs text-muted-foreground">Times are calculated in Africa/Johannesburg. Completed generation output appears under the completed jobs filter.</p>
  </div>;
}
