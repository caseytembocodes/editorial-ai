import { Link, Outlet, useLocation, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Radio, ListChecks, FileText, Users2,
  Settings2, Database, ShieldAlert, Beaker, LogOut, ExternalLink,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getMyRole } from "@/lib/admin.functions";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

const LINKS = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/sources", label: "Sources", icon: Radio },
  { to: "/admin/jobs", label: "Delegation jobs", icon: ListChecks },
  { to: "/admin/articles", label: "Articles", icon: FileText },
  { to: "/admin/authors", label: "Authors", icon: Users2 },
  { to: "/admin/conditions", label: "Conditions", icon: ShieldAlert },
  { to: "/admin/schema", label: "Schema", icon: Beaker },
  { to: "/admin/database", label: "Database", icon: Database },
  { to: "/admin/system", label: "System", icon: Settings2 },
  { to: "/admin/manual", label: "Manual trigger", icon: Beaker },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null)); }, []);
  const roleQ = useQuery({ queryKey: ["my-role"], queryFn: () => getMyRole() });

  return (
    <div className="min-h-screen bg-background text-foreground grid" style={{ gridTemplateColumns: "260px 1fr" }}>
      <aside className="border-r border-border bg-sidebar text-sidebar-foreground p-4 sticky top-0 h-screen overflow-y-auto">
        <Link to="/" className="block mb-6">
          <div className="text-2xl font-serif">Blogdel</div>
          <div className="text-[10px] uppercase tracking-[0.3em] opacity-70">Operations</div>
        </Link>
        <nav className="space-y-0.5 text-sm">
          {LINKS.map(l => {
            const active = l.exact ? loc.pathname === l.to : loc.pathname.startsWith(l.to);
            const Icon = l.icon;
            return (
              <Link key={l.to} to={l.to as any}
                className={`flex items-center gap-2 px-2 py-1.5 rounded ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60"}`}>
                <Icon className="h-4 w-4" /> {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-8 pt-4 border-t border-sidebar-border text-xs">
          <div className="opacity-70 mb-1">Signed in as</div>
          <div className="truncate">{email ?? "…"}</div>
          <Badge variant="outline" className="mt-1">{roleQ.data?.role ?? "…"}</Badge>
          <div className="mt-3 flex flex-col gap-1">
            <Link to="/" className="inline-flex items-center gap-1 opacity-80 hover:opacity-100"><ExternalLink className="h-3 w-3" />Public site</Link>
            <button className="inline-flex items-center gap-1 opacity-80 hover:opacity-100 text-left" onClick={async () => { await supabase.auth.signOut(); router.navigate({ to: "/auth" }); }}>
              <LogOut className="h-3 w-3" />Sign out
            </button>
          </div>
        </div>
      </aside>
      <main className="p-8 max-w-6xl">
        {children}
      </main>
    </div>
  );
}

export function PageTitle({ eyebrow, title, description, right }: { eyebrow?: string; title: string; description?: string; right?: React.ReactNode }) {
  return (
    <div className="border-b border-border pb-4 mb-6 flex items-start justify-between gap-4">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1 className="headline text-3xl mt-1">{title}</h1>
        {description && <p className="text-muted-foreground text-sm mt-1 max-w-2xl">{description}</p>}
      </div>
      {right}
    </div>
  );
}

export function AdminLayout() { return <AdminShell><Outlet /></AdminShell>; }
