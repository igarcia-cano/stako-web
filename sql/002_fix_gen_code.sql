-- ====================================================================
-- STAKO — Migración 002: FIX gen_bot_activation_code
-- ====================================================================
-- La versión anterior usaba gen_random_bytes() que requiere la extensión
-- pgcrypto. Esta versión usa md5(random()) que está siempre disponible.
-- ====================================================================

CREATE OR REPLACE FUNCTION public.gen_bot_activation_code(p_purchase_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code TEXT; v_status TEXT; v_existing TEXT;
  v_alphabet TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- sin 0/O/1/I/L
  v_part1 TEXT; v_part2 TEXT;
BEGIN
  SELECT status INTO v_status FROM public.bot_purchases WHERE id = p_purchase_id;
  IF v_status IS NULL THEN RAISE EXCEPTION 'Purchase not found'; END IF;
  IF v_status <> 'active' THEN RAISE EXCEPTION 'Purchase must be active (current: %)', v_status; END IF;

  SELECT code INTO v_existing FROM public.bot_activation_codes
   WHERE purchase_id = p_purchase_id AND used_at IS NULL LIMIT 1;
  IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;

  LOOP
    -- Generar 4 caracteres aleatorios del alfabeto seguro
    v_part1 := '';
    v_part2 := '';
    FOR i IN 1..4 LOOP
      v_part1 := v_part1 || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
      v_part2 := v_part2 || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    END LOOP;
    v_code := 'STK-' || v_part1 || '-' || v_part2;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.bot_activation_codes WHERE code = v_code);
  END LOOP;

  INSERT INTO public.bot_activation_codes (purchase_id, code) VALUES (p_purchase_id, v_code);
  RETURN v_code;
END; $$;

-- Asegurar permiso para service_role también (el bot lo usa con esa key)
GRANT EXECUTE ON FUNCTION public.gen_bot_activation_code(UUID) TO authenticated, service_role, anon;
