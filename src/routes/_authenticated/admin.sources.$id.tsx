import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { getSource, updateSource } from "@/lib/admin.functions";
import { PageTitle } from "@/components/blogdel/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/blogdel";

const opts = (id: string) => queryOptions({ queryKey: ["admin","source", id], queryFn: () => getSource({ data: { id } }) });

export const Route = createFileRoute("/_authenticated/admin/sources/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(opts(params.id)),
  component: SourceDetail,
});

function SourceDetail() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(opts(id));
  const qc = useQueryClient();
  const s: any = data.source;
  const [prompt, setPrompt] = useState(s?.prompt_template ?? "");
  const [rights, setRights] = useState(s?.rights_notes ?? "");
  useEffect(() => { setPrompt(s?.prompt_template ?? ""); setRights(s?.rights_notes ?? ""); }, [s?.id]);
  if (!s) return <p>Not found</p>;

  const save = async () => {
    try {
      await updateSource({ data: { id, prompt_template: prompt, rights_notes: rights } });
      toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin","source", id] });
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <>
      <div className="mb-2 text-sm"><Link to="/admin/sources" className="text-muted-foreground hover:text-foreground">← All sources</Link></div>
      <PageTitle eyebrow={s.categories?.label} title={s.name} description={s.description ?? ""} right={<Badge variant="outline">{s.source_type}</Badge>} />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm eyebrow">Prompt template</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={8} />
            <div className="mt-2"><Button onClick={save}>Save</Button></div>
            <div className="mt-4 eyebrow">Rights & Notes</div>
            <Textarea value={rights} onChange={(e) => setRights(e.target.value)} rows={4} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm eyebrow">Recent items</CardTitle></CardHeader>
          <CardContent className="text-sm">
            {data.items.length === 0 && <p className="text-muted-foreground">No items yet.</p>}
            <ul className="divide-y divide-border">
              {data.items.map((i: any) => (
                <li key={i.id} className="py-2">
                  <div className="text-xs text-muted-foreground">{formatDateTime(i.created_at)} · {i.status}</div>
                  <div className="line-clamp-2">{i.prompt}</div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
