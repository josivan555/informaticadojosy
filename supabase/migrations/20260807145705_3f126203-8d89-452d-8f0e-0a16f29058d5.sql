
CREATE TABLE public.download_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    software_id UUID REFERENCES public.softwares(id) ON DELETE CASCADE NOT NULL,
    downloaded_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT ON public.download_history TO authenticated;
GRANT ALL ON public.download_history TO service_role;

ALTER TABLE public.download_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own download history"
ON public.download_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own download history"
ON public.download_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all download history"
ON public.download_history
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
