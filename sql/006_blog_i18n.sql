-- ============================================================
-- STAKO — Migración 006: Posts bilingües (ES/EN)
-- ============================================================
-- Añade columnas opcionales en inglés a `blog_posts`. Cuando un
-- post solo tiene una versión, el frontend muestra esa con un
-- banner avisando al lector.
-- ============================================================

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS title_en    TEXT,
  ADD COLUMN IF NOT EXISTS subtitle_en TEXT,
  ADD COLUMN IF NOT EXISTS excerpt_en  TEXT,
  ADD COLUMN IF NOT EXISTS body_md_en  TEXT;

-- (Opcional) índice para búsquedas en EN si en algún momento añadimos
-- búsqueda en inglés. De momento se filtra por título/excerpt en ES.
-- CREATE INDEX IF NOT EXISTS idx_blog_posts_title_en ON public.blog_posts (title_en);

-- Recalcular reading_time_min usando la versión más larga si la hay
CREATE OR REPLACE FUNCTION public.tg_blog_posts_before_save()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  len_es INT;
  len_en INT;
  len_max INT;
BEGIN
  NEW.updated_at := now();

  len_es := LENGTH(COALESCE(NEW.body_md, ''));
  len_en := LENGTH(COALESCE(NEW.body_md_en, ''));
  len_max := GREATEST(len_es, len_en);

  -- Reading time basado en el cuerpo más largo (~1500 chars/min, mínimo 1)
  NEW.reading_time_min := GREATEST(1, CEIL(len_max / 1500.0))::INT;

  -- Si pasa a published y no tenía published_at, lo seteamos a ahora
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;

  RETURN NEW;
END;
$$;

-- Comentario informativo
COMMENT ON COLUMN public.blog_posts.title_en    IS 'Versión inglesa opcional del título';
COMMENT ON COLUMN public.blog_posts.subtitle_en IS 'Versión inglesa opcional del subtítulo';
COMMENT ON COLUMN public.blog_posts.excerpt_en  IS 'Versión inglesa opcional del resumen (excerpt)';
COMMENT ON COLUMN public.blog_posts.body_md_en  IS 'Versión inglesa opcional del cuerpo (Markdown)';
