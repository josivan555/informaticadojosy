ALTER TABLE public.download_history ALTER COLUMN user_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS download_history_downloaded_at_idx
ON public.download_history (downloaded_at DESC);

CREATE INDEX IF NOT EXISTS download_history_software_downloaded_at_idx
ON public.download_history (software_id, downloaded_at DESC);