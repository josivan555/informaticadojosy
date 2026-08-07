-- Create software categories table
CREATE TABLE public.software_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add category_id to softwares
ALTER TABLE public.softwares ADD COLUMN category_id uuid REFERENCES public.software_categories(id) ON DELETE SET NULL;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.software_categories TO authenticated;
GRANT ALL ON public.software_categories TO service_role;
GRANT SELECT ON public.software_categories TO anon;

-- RLS
ALTER TABLE public.software_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read software_categories" ON public.software_categories FOR SELECT USING (true);
CREATE POLICY "Admin full access software_categories" ON public.software_categories 
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed some default categories
INSERT INTO public.software_categories (name, slug, description) VALUES
('Utilitários', 'utilitarios', 'Ferramentas de sistema e utilitários gerais'),
('Produtividade', 'produtividade', 'Softwares para aumentar a eficiência no trabalho'),
('Segurança', 'seguranca', 'Antivírus, VPNs e ferramentas de proteção'),
('Desenvolvimento', 'desenvolvimento', 'IDE, compiladores e ferramentas para programadores');