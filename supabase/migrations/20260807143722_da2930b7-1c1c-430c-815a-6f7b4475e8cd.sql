-- Add checkout_sessions table to track payment status
CREATE TABLE public.checkout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    software_id UUID REFERENCES public.softwares(id) ON DELETE CASCADE,
    external_checkout_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, expired
    payment_method TEXT, -- mercadopago, paddle
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT one_item_only CHECK (
        (course_id IS NOT NULL AND software_id IS NULL) OR
        (course_id IS NULL AND software_id IS NOT NULL)
    )
);

-- Grant access
GRANT SELECT, INSERT, UPDATE ON public.checkout_sessions TO authenticated;
GRANT ALL ON public.checkout_sessions TO service_role;

-- RLS
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own checkout sessions"
ON public.checkout_sessions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checkout sessions"
ON public.checkout_sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
