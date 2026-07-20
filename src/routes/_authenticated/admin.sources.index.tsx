import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { listAllSources, updateSource } from "@/lib/admin.functions";
import { PageTitle } from "@/components/blogdel/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const opts = queryOptions({ queryKey: ["admin","sources"], queryFn: () => listAllSources() });

export const Route = createFileRoute("/_authenticated/admin/sources/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(opts),
  component: Sources,
});

function Sources() {
  const { data } = useSuspenseQuery(opts);
  const qc = useQueryClient();
  const toggle = async (id: string, is_enabled: boolean) => {
    try { await updateSource({ data: { id, is_enabled } }); toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin","sources"] }); }
    catch (e: any) { toast.error(e.message); }
  };
  return (
    <>
      <PageTitle eyebrow="Discovery" title="Sources" description="Where ideas come from. Enable, disable, and open a source to see its recent items." />
      <div className="border border-border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="p-3">Source</th><th>Category</th><th>Type</th><th>Priority</th><th>Enabled</th>
            </tr>
          </thead>
          <tbody>
            {data.map((s: any) => (
              <tr key={s.id} className="border-t border-border">
                <td className="p-3">
                  <Link to="/admin/sources/$id" params={{ id: s.id }} className="font-medium hover:text-accent-ink">{s.name}</Link>
                  <div className="text-xs text-muted-foreground">{s.slug}</div>
                </td>
                <td>{s.categories?.label}</td>
                <td><Badge variant="outline">{s.source_type}</Badge></td>
                <td>{s.priority}</td>
                <td><Switch checked={s.is_enabled} onCheckedChange={(v) => toggle(s.id, v)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
