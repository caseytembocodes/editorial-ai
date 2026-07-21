
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Temporary helper so a non-superuser can upsert the cron token into Vault
-- without ever embedding the value in a committed migration. Dropped later.
CREATE OR REPLACE FUNCTION public._blogdel_store_cron_token(_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE existing uuid;
BEGIN
  SELECT id INTO existing FROM vault.secrets WHERE name = 'cron_token_blogdel';
  IF existing IS NULL THEN
    PERFORM vault.create_secret(_token, 'cron_token_blogdel', 'Blogdel cron auth token');
  ELSE
    PERFORM vault.update_secret(existing, _token, 'cron_token_blogdel', 'Blogdel cron auth token');
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public._blogdel_store_cron_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public._blogdel_store_cron_token(text) TO authenticated, service_role, anon;

-- Helper for cron.schedule (pg_cron restricts direct cron.job writes to superuser
-- but cron.schedule/unschedule are callable by grantees).
GRANT USAGE ON SCHEMA cron TO postgres;
