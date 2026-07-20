import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { manualGenerate } from "@/lib/admin.functions";
import { PageTitle } from "@/components/blogdel/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, ARTICLE_TYPES } from "@/lib/article-schema";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/manual")({
  head: () => ({ meta: [{ title: "Manual trigger — Blogdel Admin" }] }),
  component: ManualPage,
});

function ManualPage() {
  const [category, setCategory] = useState<string>("technology");
  const [type, setType] = useState<string>("explainer");
  const [prompt, setPrompt] = useState("Write a plain-language explainer on how large language models are trained, aimed at a curious non-technical reader.");
  const [refUrl, setRefUrl] = useState("https://en.wikipedia.org/wiki/Large_language_model");
  const [refTitle, setRefTitle] = useState("Large language model — Wikipedia");
  const [result, setResult] = useState<any>(null);

  const gen = useMutation({
    mutationFn: () => manualGenerate({ data: { category, article_type: type as any, prompt, reference_url: refUrl, reference_title: refTitle } }),
    onSuccess: (r) => { setResult(r); toast.success("Generated"); },
    onError: (e: any) => { toast.error(e.message); },
  });
  const dry = useMutation({
    mutationFn: () => manualGenerate({ data: { category, article_type: type as any, prompt, reference_url: refUrl, reference_title: refTitle, dry_run: true } }),
    onSuccess: (r: any) => { setResult(r); toast.info("Input validated (no generation)"); },
    onError: (e: any) => { toast.error(e.message); },
  });

  return (
    <>
      <PageTitle eyebrow="Debug" title="Manual trigger"
        description="Fire a single generation end-to-end. Uses Groq when GROQ_API_KEY is set, otherwise falls back to Gemini or Lovable AI." />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm eyebrow">Input</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Article type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ARTICLE_TYPES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Prompt</Label><Textarea rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} /></div>
            <div><Label>Reference URL</Label><Input value={refUrl} onChange={(e) => setRefUrl(e.target.value)} /></div>
            <div><Label>Reference title</Label><Input value={refTitle} onChange={(e) => setRefTitle(e.target.value)} /></div>
            <div className="flex gap-2">
              <Button onClick={() => dry.mutate()} variant="outline" disabled={dry.isPending}>Dry run</Button>
              <Button onClick={() => gen.mutate()} disabled={gen.isPending}>{gen.isPending ? "Generating…" : "Generate article"}</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm eyebrow">Result</CardTitle></CardHeader>
          <CardContent className="text-sm">
            {!result && <p className="text-muted-foreground">Nothing yet. A generation may take 15–40s depending on the provider.</p>}
            {result?.dry && <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-96">{JSON.stringify(result.input, null, 2)}</pre>}
            {result?.article_id && (
              <div className="space-y-2">
                <div>Provider: <code>{result.provider}</code></div>
                <div>Model: <code>{result.model}</code></div>
                <Link to="/admin/articles/$id" params={{ id: result.article_id }} className="text-accent-ink underline">Open article →</Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
