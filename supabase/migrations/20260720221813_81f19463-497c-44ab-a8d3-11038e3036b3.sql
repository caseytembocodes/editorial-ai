
-- ============ EXTENSIONS ============
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin','editor','viewer');
CREATE TYPE public.source_type_enum AS ENUM ('api','dataset','website','evergreen');
CREATE TYPE public.source_item_status AS ENUM ('pending','queued','processed','rejected','duplicate','failed');
CREATE TYPE public.job_type_enum AS ENUM ('normalise','draft','review','revise','schema_repair','publish');
CREATE TYPE public.job_status_enum AS ENUM ('queued','running','completed','failed','retrying','cancelled');
CREATE TYPE public.article_status_enum AS ENUM ('draft','review','scheduled','published','failed','archived');
CREATE TYPE public.article_type_enum AS ENUM ('news','analysis','explainer','list','profile','history','guide');
CREATE TYPE public.provider_event_type AS ENUM ('request_started','request_completed','rate_limited','timeout','schema_failed','provider_unavailable','fallback_activated','provider_recovered');
CREATE TYPE public.system_mode_enum AS ENUM ('running','publishing_paused','generation_paused','fully_paused');

-- ============ HELPER: updated_at ============
CREATE OR REPLACE FUNCTION public.tg_touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;

-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  label text NOT NULL,
  internal_label text,
  description text,
  is_current boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (true);

-- ============ AUTHORS ============
CREATE TABLE public.authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  rotation_weight int NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  last_used_at timestamptz,
  article_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX authors_category_idx ON public.authors(category_id);
GRANT SELECT ON public.authors TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.authors TO authenticated;
GRANT ALL ON public.authors TO service_role;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authors_public_read" ON public.authors FOR SELECT USING (true);

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_self_read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','editor','viewer'));
$$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self" ON public.profiles FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Trigger: first user becomes admin, everyone gets a profile
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE user_count int;
BEGIN
  INSERT INTO public.profiles(id, display_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)))
    ON CONFLICT (id) DO NOTHING;
  SELECT count(*) INTO user_count FROM auth.users;
  IF user_count <= 1 THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'viewer') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ SOURCES ============
CREATE TABLE public.sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  source_type public.source_type_enum NOT NULL,
  provider text,
  base_url text,
  auth_type text,
  env_var_name text,
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  prompt_template text,
  rights_notes text,
  priority int NOT NULL DEFAULT 5,
  is_enabled boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  next_eligible_at timestamptz,
  recent_failures int NOT NULL DEFAULT 0,
  collected_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sources_category_idx ON public.sources(category_id);
CREATE TRIGGER sources_touch BEFORE UPDATE ON public.sources FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
GRANT SELECT ON public.sources TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.sources TO authenticated;
GRANT ALL ON public.sources TO service_role;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sources_public_read" ON public.sources FOR SELECT USING (true);
CREATE POLICY "sources_admin_write" ON public.sources FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ SOURCE ITEMS ============
CREATE TABLE public.source_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.sources(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  external_id text,
  prompt text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  instructions jsonb NOT NULL DEFAULT '{}'::jsonb,
  content_hash text,
  status public.source_item_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  source_published_at timestamptz,
  retrieved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX source_items_source_idx ON public.source_items(source_id);
CREATE INDEX source_items_status_idx ON public.source_items(status);
CREATE UNIQUE INDEX source_items_hash_idx ON public.source_items(content_hash) WHERE content_hash IS NOT NULL;
GRANT SELECT ON public.source_items TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.source_items TO authenticated;
GRANT ALL ON public.source_items TO service_role;
ALTER TABLE public.source_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "source_items_staff_read" ON public.source_items FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "source_items_admin_write" ON public.source_items FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

-- ============ DELEGATION JOBS ============
CREATE TABLE public.delegation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_item_id uuid REFERENCES public.source_items(id) ON DELETE SET NULL,
  author_id uuid REFERENCES public.authors(id) ON DELETE SET NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  job_type public.job_type_enum NOT NULL,
  provider text NOT NULL,
  model text NOT NULL,
  input_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_payload jsonb,
  status public.job_status_enum NOT NULL DEFAULT 'queued',
  attempt_count int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 3,
  failure_reason text,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX jobs_status_idx ON public.delegation_jobs(status);
CREATE INDEX jobs_scheduled_idx ON public.delegation_jobs(scheduled_at);
GRANT SELECT, INSERT, UPDATE ON public.delegation_jobs TO authenticated;
GRANT ALL ON public.delegation_jobs TO service_role;
ALTER TABLE public.delegation_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs_staff_read" ON public.delegation_jobs FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "jobs_editor_write" ON public.delegation_jobs FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

-- ============ ARTICLES ============
CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_item_id uuid REFERENCES public.source_items(id) ON DELETE SET NULL,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  author_id uuid NOT NULL REFERENCES public.authors(id) ON DELETE RESTRICT,
  generation_job_id uuid REFERENCES public.delegation_jobs(id) ON DELETE SET NULL,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  body_markdown text NOT NULL,
  article_type public.article_type_enum NOT NULL DEFAULT 'news',
  language text NOT NULL DEFAULT 'en',
  status public.article_status_enum NOT NULL DEFAULT 'draft',
  featured_image_url text,
  featured_image_alt text,
  word_count int NOT NULL DEFAULT 0,
  reading_time_minutes int NOT NULL DEFAULT 1,
  keywords text[] NOT NULL DEFAULT '{}',
  provider text,
  model text,
  is_demo boolean NOT NULL DEFAULT false,
  event_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  archived_at timestamptz,
  search_tsv tsvector
);
CREATE INDEX articles_status_idx ON public.articles(status);
CREATE INDEX articles_category_idx ON public.articles(category_id);
CREATE INDEX articles_author_idx ON public.articles(author_id);
CREATE INDEX articles_published_idx ON public.articles(published_at DESC NULLS LAST);
CREATE INDEX articles_search_idx ON public.articles USING GIN(search_tsv);
CREATE TRIGGER articles_touch BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

CREATE OR REPLACE FUNCTION public.tg_articles_tsv() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_tsv :=
    setweight(to_tsvector('english', coalesce(NEW.title,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.body_markdown,'')), 'C');
  RETURN NEW;
END; $$;
CREATE TRIGGER articles_tsv_trg BEFORE INSERT OR UPDATE OF title, description, body_markdown ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.tg_articles_tsv();

GRANT SELECT ON public.articles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.articles TO authenticated;
GRANT ALL ON public.articles TO service_role;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "articles_public_read_published" ON public.articles FOR SELECT USING (status = 'published');
CREATE POLICY "articles_staff_read_all" ON public.articles FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "articles_editor_write" ON public.articles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

-- ============ ARTICLE REFERENCES ============
CREATE TABLE public.article_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  source_item_id uuid REFERENCES public.source_items(id) ON DELETE SET NULL,
  provider text,
  title text NOT NULL,
  url text NOT NULL,
  authority text,
  position int NOT NULL DEFAULT 0,
  source_published_at timestamptz,
  retrieved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX refs_article_idx ON public.article_references(article_id);
GRANT SELECT ON public.article_references TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.article_references TO authenticated;
GRANT ALL ON public.article_references TO service_role;
ALTER TABLE public.article_references ENABLE ROW LEVEL SECURITY;
CREATE POLICY "refs_public_read" ON public.article_references FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.articles a WHERE a.id = article_id AND a.status = 'published')
);
CREATE POLICY "refs_staff_read" ON public.article_references FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "refs_editor_write" ON public.article_references FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

-- ============ PROVIDER EVENTS ============
CREATE TABLE public.provider_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.delegation_jobs(id) ON DELETE CASCADE,
  provider text NOT NULL,
  model text,
  event_type public.provider_event_type NOT NULL,
  latency_ms int,
  input_tokens int,
  output_tokens int,
  status_code int,
  error_code text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX prov_events_created_idx ON public.provider_events(created_at DESC);
CREATE INDEX prov_events_provider_idx ON public.provider_events(provider);
GRANT SELECT, INSERT ON public.provider_events TO authenticated;
GRANT ALL ON public.provider_events TO service_role;
ALTER TABLE public.provider_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prov_events_staff_read" ON public.provider_events FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "prov_events_editor_write" ON public.provider_events FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

-- ============ ARTICLE VERSIONS ============
CREATE TABLE public.article_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  version_number int NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  body_markdown text NOT NULL,
  change_reason text,
  provider text,
  model text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(article_id, version_number)
);
GRANT SELECT, INSERT ON public.article_versions TO authenticated;
GRANT ALL ON public.article_versions TO service_role;
ALTER TABLE public.article_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "versions_staff_read" ON public.article_versions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "versions_editor_write" ON public.article_versions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'editor'));

-- ============ SYSTEM STATE ============
CREATE TABLE public.system_state (
  id int PRIMARY KEY DEFAULT 1,
  mode public.system_mode_enum NOT NULL DEFAULT 'running',
  primary_provider text NOT NULL DEFAULT 'groq',
  fallback_active text,
  morning_hour int NOT NULL DEFAULT 7,
  afternoon_hour int NOT NULL DEFAULT 13,
  night_hour int NOT NULL DEFAULT 20,
  timezone text NOT NULL DEFAULT 'Africa/Johannesburg',
  daily_target int NOT NULL DEFAULT 20,
  daily_maximum int NOT NULL DEFAULT 40,
  per_category_max int NOT NULL DEFAULT 5,
  max_concurrent_jobs int NOT NULL DEFAULT 5,
  max_attempts int NOT NULL DEFAULT 3,
  provider_failure_threshold int NOT NULL DEFAULT 3,
  provider_cooldown_minutes int NOT NULL DEFAULT 15,
  min_body_length int NOT NULL DEFAULT 500,
  last_run_at timestamptz,
  next_run_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
CREATE TRIGGER system_state_touch BEFORE UPDATE ON public.system_state FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();
GRANT SELECT ON public.system_state TO anon, authenticated;
GRANT UPDATE ON public.system_state TO authenticated;
GRANT ALL ON public.system_state TO service_role;
ALTER TABLE public.system_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "system_state_public_read" ON public.system_state FOR SELECT USING (true);
CREATE POLICY "system_state_admin_write" ON public.system_state FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.system_state(id) VALUES (1) ON CONFLICT DO NOTHING;
