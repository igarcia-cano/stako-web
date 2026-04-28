-- ====================================================================
-- STAKO — Migración 003: Cuentas de cliente (perfil web)
-- ====================================================================
-- Cambios:
--   1. Añade un trigger que rellena `expires_at` por defecto a 1 mes
--      cuando se crea una compra (si no se especifica).
--   2. RPC `client_my_purchases` para que un cliente vea sus compras.
--   3. RPC `client_cancel_subscription` para cancelar al final del periodo.
--   4. RPC `client_reactivate_subscription` para reactivar antes de expirar.
--   5. Política RLS para que cada cliente solo vea SUS compras.
-- ====================================================================

-- 1. Default expires_at +30 días al insertar
CREATE OR REPLACE FUNCTION public._set_default_expires_at() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL AND NEW.status = 'active' THEN
    NEW.expires_at = COALESCE(NEW.created_at, now()) + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_purchase_default_expires ON public.bot_purchases;
CREATE TRIGGER trg_purchase_default_expires BEFORE INSERT ON public.bot_purchases
  FOR EACH ROW EXECUTE FUNCTION public._set_default_expires_at();

-- 2. Añadir columna `cancel_at_period_end` para cancelaciones por el cliente
ALTER TABLE public.bot_purchases ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- 3. RPC: client_my_purchases - el cliente ve sus propias compras
CREATE OR REPLACE FUNCTION public.client_my_purchases()
RETURNS TABLE (
  id UUID, user_email TEXT, amount_eur NUMERIC, status TEXT,
  notes TEXT, created_at TIMESTAMPTZ, expires_at TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN, linked_chat_id BIGINT, activated_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email TEXT;
BEGIN
  v_email := auth.jwt()->>'email';
  IF v_email IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  RETURN QUERY
    SELECT bp.id, bp.user_email, bp.amount_eur, bp.status, bp.notes,
           bp.created_at, bp.expires_at, bp.cancel_at_period_end,
           bp.linked_chat_id, bp.activated_at
      FROM public.bot_purchases bp
     WHERE bp.user_email = v_email
     ORDER BY bp.created_at DESC;
END; $$;

-- 4. RPC: client_my_books - el cliente ve sus libros comprados
CREATE OR REPLACE FUNCTION public.client_my_books()
RETURNS SETOF public.book_purchases
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email TEXT;
BEGIN
  v_email := auth.jwt()->>'email';
  IF v_email IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  RETURN QUERY
    SELECT * FROM public.book_purchases
     WHERE user_email = v_email
     ORDER BY created_at DESC;
END; $$;

-- 5. RPC: client_my_activation_code - código sin canjear (si lo hay)
CREATE OR REPLACE FUNCTION public.client_my_activation_code(p_purchase_id UUID)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email TEXT; v_code TEXT;
BEGIN
  v_email := auth.jwt()->>'email';
  IF v_email IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- Verificar que la compra es del cliente
  IF NOT EXISTS (
    SELECT 1 FROM public.bot_purchases
     WHERE id = p_purchase_id AND user_email = v_email
  ) THEN
    RAISE EXCEPTION 'Purchase not found or not yours';
  END IF;

  SELECT code INTO v_code FROM public.bot_activation_codes
   WHERE purchase_id = p_purchase_id AND used_at IS NULL LIMIT 1;
  RETURN v_code;
END; $$;

-- 6. RPC: client_cancel_subscription - cancelar al final del periodo
CREATE OR REPLACE FUNCTION public.client_cancel_subscription(p_purchase_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email TEXT; v_purchase public.bot_purchases%ROWTYPE;
BEGIN
  v_email := auth.jwt()->>'email';
  IF v_email IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_purchase FROM public.bot_purchases
   WHERE id = p_purchase_id AND user_email = v_email;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Suscripción no encontrada.');
  END IF;
  IF v_purchase.status <> 'active' THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Esta suscripción no está activa.');
  END IF;

  UPDATE public.bot_purchases
     SET cancel_at_period_end = TRUE
   WHERE id = p_purchase_id;

  RETURN jsonb_build_object(
    'ok', true,
    'message', 'Tu suscripción seguirá activa hasta ' ||
               to_char(v_purchase.expires_at, 'DD/MM/YYYY') ||
               '. Después no se renovará.',
    'expires_at', v_purchase.expires_at
  );
END; $$;

-- 7. RPC: client_reactivate_subscription - deshacer cancelación
CREATE OR REPLACE FUNCTION public.client_reactivate_subscription(p_purchase_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email TEXT;
BEGIN
  v_email := auth.jwt()->>'email';
  IF v_email IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  UPDATE public.bot_purchases
     SET cancel_at_period_end = FALSE
   WHERE id = p_purchase_id AND user_email = v_email AND status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Suscripción no encontrada o no activa.');
  END IF;
  RETURN jsonb_build_object('ok', true, 'message', 'Suscripción reactivada.');
END; $$;

-- 8. Permisos
GRANT EXECUTE ON FUNCTION public.client_my_purchases()              TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_my_books()                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_my_activation_code(UUID)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_cancel_subscription(UUID)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_reactivate_subscription(UUID) TO authenticated;
