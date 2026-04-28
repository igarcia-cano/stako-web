-- ====================================================================
-- STAKO — Migración 001: Sistema de licencias del bot
-- ====================================================================
-- Crea las tablas necesarias para vincular pagos (bot_purchases) con
-- chat_ids de Telegram mediante códigos de activación de un solo uso.
--
-- Modelo:
--   bot_purchases  (ya existe)  → 1 fila por pago/suscripción del cliente
--        ↓ 1:N
--   bot_activation_codes        → códigos generados (1 por compra activa)
--        ↓ 1:1 (al canjearse)
--   bot_licenses                → licencia viva, vinculada a un chat_id
-- ====================================================================

-- 1. Asegurar columnas extra en bot_purchases
ALTER TABLE public.bot_purchases ADD COLUMN IF NOT EXISTS linked_chat_id BIGINT;
ALTER TABLE public.bot_purchases ADD COLUMN IF NOT EXISTS activated_at  TIMESTAMPTZ;
ALTER TABLE public.bot_purchases ADD COLUMN IF NOT EXISTS expires_at    TIMESTAMPTZ;

-- 2. bot_activation_codes
CREATE TABLE IF NOT EXISTS public.bot_activation_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.bot_purchases(id) ON DELETE CASCADE,
  code        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at     TIMESTAMPTZ,
  used_by_chat_id BIGINT
);
CREATE INDEX IF NOT EXISTS idx_codes_purchase ON public.bot_activation_codes(purchase_id);
CREATE INDEX IF NOT EXISTS idx_codes_unused   ON public.bot_activation_codes(code) WHERE used_at IS NULL;

-- 3. bot_licenses
CREATE TABLE IF NOT EXISTS public.bot_licenses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id      BIGINT NOT NULL UNIQUE,
  purchase_id  UUID NOT NULL REFERENCES public.bot_purchases(id) ON DELETE CASCADE,
  user_email   TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'active',
  activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_lic_chat     ON public.bot_licenses(chat_id);
CREATE INDEX IF NOT EXISTS idx_lic_purchase ON public.bot_licenses(purchase_id);
CREATE INDEX IF NOT EXISTS idx_lic_status   ON public.bot_licenses(status);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public._touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_lic_touch ON public.bot_licenses;
CREATE TRIGGER trg_lic_touch BEFORE UPDATE ON public.bot_licenses
  FOR EACH ROW EXECUTE FUNCTION public._touch_updated_at();

-- 4. Sync: bot_purchases.status -> bot_licenses.status
CREATE OR REPLACE FUNCTION public._sync_license_from_purchase() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    UPDATE public.bot_licenses
       SET status = CASE
                      WHEN NEW.status = 'active'    THEN 'active'
                      WHEN NEW.status = 'cancelled' THEN 'cancelled'
                      WHEN NEW.status = 'banned'    THEN 'banned'
                      WHEN NEW.status = 'pending'   THEN 'cancelled'
                      ELSE status
                    END
     WHERE purchase_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS trg_purchase_sync_license ON public.bot_purchases;
CREATE TRIGGER trg_purchase_sync_license AFTER UPDATE ON public.bot_purchases
  FOR EACH ROW EXECUTE FUNCTION public._sync_license_from_purchase();

-- 5. RPC gen_bot_activation_code
CREATE OR REPLACE FUNCTION public.gen_bot_activation_code(p_purchase_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code TEXT; v_status TEXT; v_existing TEXT;
BEGIN
  SELECT status INTO v_status FROM public.bot_purchases WHERE id = p_purchase_id;
  IF v_status IS NULL THEN RAISE EXCEPTION 'Purchase not found'; END IF;
  IF v_status <> 'active' THEN RAISE EXCEPTION 'Purchase must be active (current: %)', v_status; END IF;

  SELECT code INTO v_existing FROM public.bot_activation_codes
   WHERE purchase_id = p_purchase_id AND used_at IS NULL LIMIT 1;
  IF v_existing IS NOT NULL THEN RETURN v_existing; END IF;

  LOOP
    v_code := 'STK-' ||
              upper(substr(translate(encode(gen_random_bytes(3),'hex'),'01ilo','23456'),1,4)) ||
              '-' ||
              upper(substr(translate(encode(gen_random_bytes(3),'hex'),'01ilo','23456'),1,4));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.bot_activation_codes WHERE code = v_code);
  END LOOP;

  INSERT INTO public.bot_activation_codes (purchase_id, code) VALUES (p_purchase_id, v_code);
  RETURN v_code;
END; $$;

-- 6. RPC redeem_bot_activation_code
CREATE OR REPLACE FUNCTION public.redeem_bot_activation_code(p_code TEXT, p_chat_id BIGINT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code_row     public.bot_activation_codes%ROWTYPE;
  v_purchase_row public.bot_purchases%ROWTYPE;
  v_existing_lic public.bot_licenses%ROWTYPE;
BEGIN
  SELECT * INTO v_code_row FROM public.bot_activation_codes WHERE code = upper(trim(p_code));
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok',false,'error','invalid_code',
      'message','Código no válido. Revisa que lo hayas escrito bien.');
  END IF;

  IF v_code_row.used_at IS NOT NULL THEN
    IF v_code_row.used_by_chat_id = p_chat_id THEN
      SELECT * INTO v_existing_lic FROM public.bot_licenses WHERE chat_id = p_chat_id;
      RETURN jsonb_build_object('ok',true,'already_active',true,
        'email',v_existing_lic.user_email,
        'message','Ya tenías esta licencia activada.');
    END IF;
    RETURN jsonb_build_object('ok',false,'error','code_used',
      'message','Este código ya fue canjeado por otro usuario.');
  END IF;

  SELECT * INTO v_purchase_row FROM public.bot_purchases WHERE id = v_code_row.purchase_id;
  IF v_purchase_row.status <> 'active' THEN
    RETURN jsonb_build_object('ok',false,'error','purchase_inactive',
      'message','La compra asociada a este código ya no está activa. Contacta con soporte.');
  END IF;

  SELECT * INTO v_existing_lic FROM public.bot_licenses WHERE chat_id = p_chat_id;
  IF FOUND AND v_existing_lic.status = 'active' THEN
    RETURN jsonb_build_object('ok',false,'error','already_licensed',
      'message','Este Telegram ya tiene una licencia activa con email '||
                v_existing_lic.user_email||'. Contacta con soporte si necesitas cambiarla.');
  END IF;

  IF FOUND THEN
    UPDATE public.bot_licenses
       SET status='active', purchase_id=v_purchase_row.id,
           user_email=v_purchase_row.user_email,
           activated_at=now(), expires_at=v_purchase_row.expires_at
     WHERE chat_id = p_chat_id;
  ELSE
    INSERT INTO public.bot_licenses (chat_id, purchase_id, user_email, expires_at)
    VALUES (p_chat_id, v_purchase_row.id, v_purchase_row.user_email, v_purchase_row.expires_at);
  END IF;

  UPDATE public.bot_activation_codes SET used_at=now(), used_by_chat_id=p_chat_id WHERE id = v_code_row.id;
  UPDATE public.bot_purchases
     SET linked_chat_id=p_chat_id, activated_at=COALESCE(activated_at, now())
   WHERE id = v_purchase_row.id;

  RETURN jsonb_build_object('ok',true,'first_time',true,
    'email',v_purchase_row.user_email,
    'message','Licencia activada correctamente.');
END; $$;

-- 7. RPC revoke_bot_license
CREATE OR REPLACE FUNCTION public.revoke_bot_license(p_chat_id BIGINT, p_reason TEXT DEFAULT 'cancelled')
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_reason NOT IN ('cancelled','banned') THEN
    RAISE EXCEPTION 'reason must be cancelled or banned';
  END IF;
  UPDATE public.bot_licenses SET status = p_reason WHERE chat_id = p_chat_id;
  RETURN FOUND;
END; $$;

-- 8. RLS
ALTER TABLE public.bot_activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_licenses        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin read codes"     ON public.bot_activation_codes;
DROP POLICY IF EXISTS "admin write codes"    ON public.bot_activation_codes;
DROP POLICY IF EXISTS "admin read licenses"  ON public.bot_licenses;
DROP POLICY IF EXISTS "admin write licenses" ON public.bot_licenses;

CREATE POLICY "admin read codes" ON public.bot_activation_codes
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.admins));
CREATE POLICY "admin write codes" ON public.bot_activation_codes
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admins))
        WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));
CREATE POLICY "admin read licenses" ON public.bot_licenses
  FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.admins));
CREATE POLICY "admin write licenses" ON public.bot_licenses
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.admins))
        WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admins));

-- 9. Permisos RPC
GRANT EXECUTE ON FUNCTION public.gen_bot_activation_code(UUID)            TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_bot_activation_code(TEXT, BIGINT) TO service_role;
GRANT EXECUTE ON FUNCTION public.revoke_bot_license(BIGINT, TEXT)         TO authenticated;
