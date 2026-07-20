import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { getOverview, updateSystemState } from "@/lib/admin.functions";
import { PageTitle } from "@/components/blogdel/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const opts = queryOptions({ queryKey: ["admin","overview"], queryFn: () => getOverview() });

export const Route = createFileRoute("/_authenticated/admin/system")({
  loader: ({ context }) => context.queryClient.ensureQueryData(opts),
  component: SystemPage,
});

function SystemPage() {
  const { data } = useSuspenseQuery(opts);
  const s: any = data.system;
  const qc = useQueryClient();
  const [f, setF] = useState<any>(s ?? {});
  useEffect(() => setF(s ?? {}), [s?.mode, s?.daily_target]);
  const save = async () => {
    try { await updateSystemState({ data: {
      mode: f.mode, morning_hour: Number(f.morning_hour), afternoon_hour: Number(f.afternoon_hour), night_hour: Number(f.night_hour),
      daily_target: Number(f.daily_target), daily_maximum: Number(f.daily_maximum), per_category_max: Number(f.per_category_max),
      min_body_length: Number(f.min_body_length), primary_provider: f.primary_provider,
    } }); toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin","overview"] }); }
    catch (e: any) { toast.error(e.message); }
  };
  return (
    <>
      <PageTitle eyebrow="Control" title="System settings" description="Runtime controls for the autonomous pipeline." />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm eyebrow">Mode</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Pipeline mode</Label>
              <Select value={f.mode} onValueChange={(v) => setF({ ...f, mode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="running">Running (generate + publish)</SelectItem>
                  <SelectItem value="publishing_paused">Publishing paused (generate only)</SelectItem>
                  <SelectItem value="generation_paused">Generation paused (publish queue only)</SelectItem>
                  <SelectItem value="fully_paused">Fully paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Primary provider</Label>
              <Input value={f.primary_provider ?? ""} onChange={(e) => setF({ ...f, primary_provider: e.target.value })} placeholder="groq" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm eyebrow">Schedule</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-3">
            <div><Label>Morning</Label><Input type="number" min={0} max={23} value={f.morning_hour ?? 8} onChange={(e) => setF({ ...f, morning_hour: e.target.value })} /></div>
            <div><Label>Afternoon</Label><Input type="number" min={0} max={23} value={f.afternoon_hour ?? 14} onChange={(e) => setF({ ...f, afternoon_hour: e.target.value })} /></div>
            <div><Label>Night</Label><Input type="number" min={0} max={23} value={f.night_hour ?? 20} onChange={(e) => setF({ ...f, night_hour: e.target.value })} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm eyebrow">Limits</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-3">
            <div><Label>Target/day</Label><Input type="number" value={f.daily_target ?? 20} onChange={(e) => setF({ ...f, daily_target: e.target.value })} /></div>
            <div><Label>Max/day</Label><Input type="number" value={f.daily_maximum ?? 30} onChange={(e) => setF({ ...f, daily_maximum: e.target.value })} /></div>
            <div><Label>Per category</Label><Input type="number" value={f.per_category_max ?? 3} onChange={(e) => setF({ ...f, per_category_max: e.target.value })} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm eyebrow">Quality</CardTitle></CardHeader>
          <CardContent>
            <Label>Minimum body length (chars)</Label>
            <Input type="number" value={f.min_body_length ?? 500} onChange={(e) => setF({ ...f, min_body_length: e.target.value })} />
          </CardContent>
        </Card>
      </div>
      <div className="mt-6"><Button onClick={save}>Save settings</Button></div>
    </>
  );
}
