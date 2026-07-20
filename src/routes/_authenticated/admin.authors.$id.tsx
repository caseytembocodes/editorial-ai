import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthorAdmin, updateAuthor } from "@/lib/admin.functions";
import { PageTitle } from "@/components/blogdel/AdminShell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatDate, STATUS_LABELS } from "@/lib/blogdel";

const opts = (id: string) => queryOptions({ queryKey: ["admin","author", id], queryFn: () => getAuthorAdmin({ data: { id } }) });

export const Route = createFileRoute("/_authenticated/admin/authors/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(opts(params.id)),
  component: AuthorAdmin,
});

function AuthorAdmin() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(opts(id));
  const qc = useQueryClient();
  const a: any = data.author;
  const [name, setName] = useState(a?.display_name ?? "");
  const [desc, setDesc] = useState(a?.description ?? "");
  const [weight, setWeight] = useState<number>(a?.rotation_weight ?? 1);
  useEffect(() => { if (a) { setName(a.display_name); setDesc(a.description ?? ""); setWeight(a.rotation_weight); } }, [a?.id]);
  if (!a) return <p>Not found</p>;
  const save = async () => {
    try { await updateAuthor({ data: { id, display_name: name, description: desc, rotation_weight: weight } });
      toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin","authors"] }); qc.invalidateQueries({ queryKey: ["admin","author", id] }); }
    catch (e: any) { toast.error(e.message); }
  };
  return (
    <>
      <div className="mb-2 text-sm"><Link to="/admin/authors" className="text-muted-foreground hover:text-foreground">← Authors</Link></div>
      <PageTitle eyebrow={a.categories?.label} title={a.display_name} />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <div><label className="eyebrow">Display name</label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><label className="eyebrow">Bio</label><Textarea rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
          <div><label className="eyebrow">Rotation weight (0–10)</label><Input type="number" min={0} max={10} value={weight} onChange={(e) => setWeight(Number(e.target.value))} /></div>
          <Button onClick={save}>Save</Button>
        </div>
        <div>
          <h3 className="eyebrow mb-2">Articles</h3>
          <ul className="text-sm divide-y divide-border">
            {data.articles.map((r: any) => (
              <li key={r.id} className="py-2 flex justify-between">
                <Link to="/admin/articles/$id" params={{ id: r.id }} className="hover:text-accent-ink">{r.title}</Link>
                <span className="text-xs text-muted-foreground">{STATUS_LABELS[r.status]} · {formatDate(r.published_at)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
