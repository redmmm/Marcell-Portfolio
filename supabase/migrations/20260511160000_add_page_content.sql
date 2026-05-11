
-- Page content table for editable site text
CREATE TABLE IF NOT EXISTS public.page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page TEXT NOT NULL DEFAULT 'about',
  heading TEXT NOT NULL DEFAULT 'Versatility in every cut.',
  body_paragraph_1 TEXT NOT NULL DEFAULT '',
  body_paragraph_2 TEXT NOT NULL DEFAULT '',
  contact_heading TEXT NOT NULL DEFAULT 'Let''s work together',
  contact_body TEXT NOT NULL DEFAULT 'For project inquiries, rates, or just to say hello.',
  email TEXT NOT NULL DEFAULT 'red.edits2244@gmail.com',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "Anyone can read page_content" ON public.page_content;
DROP POLICY IF EXISTS "Admins can update page_content" ON public.page_content;
DROP POLICY IF EXISTS "Admins can insert page_content" ON public.page_content;

CREATE POLICY "Anyone can read page_content"
  ON public.page_content FOR SELECT
  USING (true);

CREATE POLICY "Admins can update page_content"
  ON public.page_content FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can insert page_content"
  ON public.page_content FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- updated_at trigger
DROP TRIGGER IF EXISTS page_content_touch_updated_at ON public.page_content;
CREATE TRIGGER page_content_touch_updated_at
  BEFORE UPDATE ON public.page_content
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed default about page content
INSERT INTO public.page_content (
  page,
  heading,
  body_paragraph_1,
  body_paragraph_2,
  contact_heading,
  contact_body,
  email
) VALUES (
  'about',
  'Versatility in every cut.',
  'I''m Marcell, a freelance video editor with over 5 years of experience shaping visual stories. While my foundation was built in Premiere Pro, I now work primarily in DaVinci Resolve Studio, utilizing Fusion to integrate clean, dynamic motion graphics directly into the edit.',
  'My work covers a vast range of styles and formats. I''ve edited fast-paced supercar test drives at the Hungaroring in both standard and 360-degree video, crafted cinematic drone and social campaigns for travel agencies, and delivered fast-paced commercial ads. From emotional proposal films and long-form YouTube content to snappy short-form social media, POV footage, and polished talking heads, I adapt the pacing to fit the exact vibe of the project.',
  'Let''s work together',
  'For project inquiries, rates, or just to say hello.',
  'red.edits2244@gmail.com'
)
ON CONFLICT DO NOTHING;
