import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { manualGenerate } from "@/lib/admin.functions";
import { CATEGORIES, ARTICLE_TYPES } from "@/lib/article-schema";
import { PageTitle } from "@/components/blogdel/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/manual")({
  head: () => ({ meta: [{ title: "Manual and batch trigger - Blogdel Admin" }] }),
  component: ManualPage,
});

type Reference = { title: string; url: string; authority: "primary" | "secondary" | "tertiary" };

function ManualPage() {
  const [mode, setMode] = useState<"single" | "batch">("single");
  const [category, setCategory] = useState<string>("technology");
  const [type, setType] = useState<string>("explainer");
  const [prompt, setPrompt] = useState("Write a plain-language explainer on how large language models are trained, aimed at a curious non-technical reader.");
  const [batchPrompts, setBatchPrompts] = useState("");
  const [references, setReferences] = useState<Reference[]>([{ title: "Large language model - Wikipedia", url: "https://en.wikipedia.org/wiki/Large_language_model", authority: "primary" }]);
  const [results, setResults] = useState<any[]>([]);

  const prompts = mode === "single" ? [prompt.trim()].filter(Boolean) : batchPrompts.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
  const payload = (itemPrompt: string, dryRun = false) => ({ category, article_type: type as any, prompt: itemPrompt, references, dry_run: dryRun });

  const generate = useMutation({
    mutationFn: async () => {
      if (!prompts.length) throw new Error("Add at least one prompt.");
      if (prompts.length > 10) throw new Error("Batch size is limited to 10 jobs.");
      const next: any[] = [];
      for (const itemPrompt of prompts) {
        try { next.push({ prompt: itemPrompt, ...(await manualGenerate({ data: payload(itemPrompt) })) }); }
        catch (error: any) { next.push({ prompt: itemPrompt, error: error?.message ?? String(error) }); }
        setResults([...next]);
      }
      return next;
    },
    onSuccess: (items) => toast.success(`${items.filter((item) => !item.error).length} of ${items.length} jobs completed`),
    onError: (error: any) => toast.error(error.message),
  });

  const validate = useMutation({
    mutationFn: async () => {
      if (!prompts.length) throw new Error("Add at least one prompt.");
      if (prompts.length > 10) throw new Error("Batch size is limited to 10 jobs.");
      const next = [];
      for (const itemPrompt of prompts) next.push({ prompt: itemPrompt, ...(await manualGenerate({ data: payload(itemPrompt, true) })) });
      return next;
    },
    onSuccess: (items) => { setResults(items); toast.info(`${items.length} input${items.length === 1 ? "" : "s"} validated`); },
    onError: (error: any) => toast.error(error.message),
  });

  const updateReference = (index: number, patch: Partial<Reference>) => setReferences(references.map((item, i) => i === index ? { ...item, ...patch } : item));

  return <>
    <PageTitle eyebrow="Generation" title="Manual & batch trigger" description="Validate or execute up to ten jobs sequentially through the production provider pipeline." />
    <div className="grid gap-6 md:grid-cols-2">
      <Card><CardHeader><CardTitle className="text-sm eyebrow">Input</CardTitle></CardHeader><CardContent className="space-y-4">
        <div><Label>Trigger mode</Label><RadioGroup value={mode} onValueChange={(value) => setMode(value as "single" | "batch")} className="mt-2 flex gap-5"><div className="flex items-center gap-2"><RadioGroupItem value="single" id="single" /><Label htmlFor="single">Single job</Label></div><div className="flex items-center gap-2"><RadioGroupItem value="batch" id="batch" /><Label htmlFor="batch">Batch</Label></div></RadioGroup></div>
        <div className="grid grid-cols-2 gap-3"><div><Label>Category</Label><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div><div><Label>Article type</Label><Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ARTICLE_TYPES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div></div>
        {mode === "single" ? <div><Label>Prompt</Label><Textarea rows={5} value={prompt} onChange={(event) => setPrompt(event.target.value)} /></div> : <div><Label>Batch prompts</Label><Textarea rows={9} placeholder="Separate complete prompts with a blank line. Maximum 10." value={batchPrompts} onChange={(event) => setBatchPrompts(event.target.value)} /><p className="mt-1 text-xs text-muted-foreground">{prompts.length} job{prompts.length === 1 ? "" : "s"} in this batch.</p></div>}
        <div className="space-y-3"><div className="flex items-center justify-between"><Label>References</Label><Button type="button" size="sm" variant="outline" onClick={() => setReferences([...references, { title: "", url: "", authority: "primary" }])} disabled={references.length >= 5}>Add reference</Button></div>{references.map((ref, index) => <div key={index} className="grid gap-2 rounded border border-border p-3"><Input aria-label={`Reference ${index + 1} title`} placeholder="Reference title" value={ref.title} onChange={(event) => updateReference(index, { title: event.target.value })} /><Input aria-label={`Reference ${index + 1} URL`} placeholder="https://..." value={ref.url} onChange={(event) => updateReference(index, { url: event.target.value })} /><div className="flex items-center gap-2"><Select value={ref.authority} onValueChange={(authority: Reference["authority"]) => updateReference(index, { authority })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="primary">Primary</SelectItem><SelectItem value="secondary">Secondary</SelectItem><SelectItem value="tertiary">Tertiary</SelectItem></SelectContent></Select>{references.length > 1 && <Button type="button" variant="ghost" onClick={() => setReferences(references.filter((_, i) => i !== index))}>Remove</Button>}</div></div>)}<p className="text-xs text-muted-foreground">Health, politics and science require at least two references.</p></div>
        <div className="flex gap-2"><Button onClick={() => validate.mutate()} variant="outline" disabled={validate.isPending || generate.isPending}>Validate batch</Button><Button onClick={() => { setResults([]); generate.mutate(); }} disabled={generate.isPending || validate.isPending}>{generate.isPending ? "Running..." : mode === "batch" ? `Run ${prompts.length} jobs` : "Generate article"}</Button></div>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="text-sm eyebrow">Results</CardTitle></CardHeader><CardContent className="text-sm">{!results.length && <p className="text-muted-foreground">Nothing yet. Jobs run sequentially and may take 15-40 seconds each.</p>}<div className="space-y-3">{results.map((result, index) => <div key={index} className="rounded border border-border p-3"><div className="mb-2 line-clamp-2 font-medium">{index + 1}. {result.prompt}</div>{result.error ? <p className="text-destructive">{result.error}</p> : result.dry ? <p className="text-muted-foreground">Validated - no generation performed.</p> : <div className="space-y-1"><div>Provider/model: <code>{result.provider}/{result.model}</code></div><Link to="/admin/articles/$id" params={{ id: result.article_id }} className="text-accent-ink underline">Open article -&gt;</Link></div>}</div>)}</div></CardContent></Card>
    </div>
  </>;
}
