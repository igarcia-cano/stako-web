-- ====================================================================
-- STAKO — Migración 005: Blog
-- ====================================================================

-- 1. Categorías
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  display_order INT  NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.blog_categories (slug, name, description, display_order) VALUES
  ('macro',      'Macro y bancos centrales', 'Política monetaria, tipos de interés, inflación, decisiones del BCE y la Fed.', 10),
  ('mercados',   'Mercados',                  'Movimientos de bolsa, divisas, materias primas y cripto.', 20),
  ('largo-plazo','Inversión a largo plazo',   'Valor, acumulación, indexados, planificación financiera.', 30),
  ('educacion',  'Educación financiera',      'Conceptos, indicadores, glosario y guías para entender los mercados.', 40),
  ('historia',   'Análisis e historia',       'Ciclos económicos, crisis y patrones que se repiten.', 50),
  ('libros',     'Reseñas de libros',         'Lecturas que dan perspectiva sobre dinero e inversión.', 60)
ON CONFLICT (slug) DO NOTHING;

-- 2. Posts
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               TEXT UNIQUE NOT NULL,
  title              TEXT NOT NULL,
  subtitle           TEXT,
  excerpt            TEXT,
  body_md            TEXT NOT NULL DEFAULT '',
  category_slug      TEXT REFERENCES public.blog_categories(slug) ON UPDATE CASCADE,
  tags               TEXT[] NOT NULL DEFAULT '{}',
  cover_image_url    TEXT,
  author             TEXT NOT NULL DEFAULT 'Equipo Stako',
  status             TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  published_at       TIMESTAMPTZ,
  reading_time_min   INT NOT NULL DEFAULT 1,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published_at ON public.blog_posts (status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category           ON public.blog_posts (category_slug);

-- 3. Triggers: updated_at + reading_time + auto-publish_at
CREATE OR REPLACE FUNCTION public.tg_blog_posts_before_save()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  -- Reading time: ~1500 chars/min de lectura, mínimo 1
  NEW.reading_time_min := GREATEST(1, CEIL(LENGTH(COALESCE(NEW.body_md, '')) / 1500.0))::INT;
  -- Si pasa a published y no tenía published_at, lo seteamos a ahora
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS tg_blog_posts_before_save ON public.blog_posts;
CREATE TRIGGER tg_blog_posts_before_save
BEFORE INSERT OR UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.tg_blog_posts_before_save();

-- 4. RLS
ALTER TABLE public.blog_posts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

-- Categorías: lectura pública
DROP POLICY IF EXISTS blog_categories_read_all ON public.blog_categories;
CREATE POLICY blog_categories_read_all ON public.blog_categories
  FOR SELECT USING (true);

-- Posts: SELECT público SOLO publicados
DROP POLICY IF EXISTS blog_posts_read_published ON public.blog_posts;
CREATE POLICY blog_posts_read_published ON public.blog_posts
  FOR SELECT USING (
    status = 'published'
    AND published_at IS NOT NULL
    AND published_at <= now()
  );

-- Posts: SELECT/INSERT/UPDATE/DELETE para admins
DROP POLICY IF EXISTS blog_posts_admin_all ON public.blog_posts;
CREATE POLICY blog_posts_admin_all ON public.blog_posts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid())
  );

-- Categorías: gestión sólo admins
DROP POLICY IF EXISTS blog_categories_admin_write ON public.blog_categories;
CREATE POLICY blog_categories_admin_write ON public.blog_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.admins a WHERE a.user_id = auth.uid())
  );

GRANT SELECT ON public.blog_categories TO anon, authenticated;
GRANT SELECT ON public.blog_posts      TO anon, authenticated;
GRANT ALL    ON public.blog_categories TO service_role;
GRANT ALL    ON public.blog_posts      TO service_role;
