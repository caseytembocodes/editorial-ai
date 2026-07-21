
-- Unschedule any previous entries with the same names (idempotent re-run).
DO $$
DECLARE j record;
BEGIN
  FOR j IN SELECT jobname FROM cron.job
           WHERE jobname IN ('blogdel-daily-0700-sast','blogdel-daily-1300-sast','blogdel-daily-2000-sast')
  LOOP
    PERFORM cron.unschedule(j.jobname);
  END LOOP;
END $$;

SELECT cron.schedule(
  'blogdel-daily-0700-sast', '0 5 * * *',
  $cmd$
  SELECT net.http_post(
    url := 'https://blogdel.blog/api/public/cron/tick',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-cron-token',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='cron_token_blogdel')
    ),
    body := '{}'::jsonb
  );
  $cmd$
);

SELECT cron.schedule(
  'blogdel-daily-1300-sast', '0 11 * * *',
  $cmd$
  SELECT net.http_post(
    url := 'https://blogdel.blog/api/public/cron/tick',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-cron-token',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='cron_token_blogdel')
    ),
    body := '{}'::jsonb
  );
  $cmd$
);

SELECT cron.schedule(
  'blogdel-daily-2000-sast', '0 18 * * *',
  $cmd$
  SELECT net.http_post(
    url := 'https://blogdel.blog/api/public/cron/tick',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-cron-token',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='cron_token_blogdel')
    ),
    body := '{}'::jsonb
  );
  $cmd$
);

DROP FUNCTION IF EXISTS public._blogdel_store_cron_token(text);
