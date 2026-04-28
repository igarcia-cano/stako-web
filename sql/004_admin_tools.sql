-- ====================================================================
-- STAKO — Migración 004: Admin tools (convertir waitlist, renovar, etc)
-- ====================================================================

-- 1. Marcar waitlist como convertida
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS converted_to_purchase_id UUID;

-- 2. Método de pago en bot_purchases (manual ahora; cuando llegue Stripe se rellenará con stripe_id)
ALTER TABLE public.bot_purchases ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- 3. RPC para crear suscripción + código + marcar waitlist en una sola operación
CREATE OR REPLACE FUNCTION public.admin_create_subscription(
  p_email TEXT,
  p_amount_eur NUMERIC,
  p_payment_method TEXT DEFAULT NULL,
  p_months INT DEFAULT 1,
  p_notes TEXT DEFAULT NULL,
  p_waitlist_id UUID DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_purchase_id UUID;
  v_now TIMESTAMPTZ := now();
  v_expires_at TIMESTAMPTZ;
  v_code TEXT;
BEGIN
  -- Calcular fecha de expiración
  v_expires_at := v_now + (p_months || ' months')::INTERVAL;

  -- Crear la compra (el trigger de expires_at NO va a actuar porque ya pasamos un valor)
  INSERT INTO public.bot_purchases (
    user_email, amount_eur, status, notes, payment_method,
    created_at, expires_at, cancel_at_period_end
  ) VALUES (
    LOWER(TRIM(p_email)), p_amount_eur, 'active', p_notes, p_payment_method,
    v_now, v_expires_at, FALSE
  ) RETURNING id INTO v_purchase_id;

  -- Generar código de activación inmediatamente
  v_code := public.gen_bot_activation_code(v_purchase_id);

  -- Marcar waitlist como convertida (si se pasó el id)
  IF p_waitlist_id IS NOT NULL THEN
    UPDATE public.waitlist
       SET converted_at = v_now,
           converted_to_purchase_id = v_purchase_id
     WHERE id = p_waitlist_id;
  END IF;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'purchase_id', v_purchase_id,
    'code', v_code,
    'expires_at', v_expires_at
  );
END; $$;

-- 4. RPC para renovar/extender una suscripción
CREATE OR REPLACE FUNCTION public.admin_renew_subscription(
  p_purchase_id UUID,
  p_months INT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_purchase public.bot_purchases%ROWTYPE;
  v_base TIMESTAMPTZ;
  v_new_expires TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_purchase FROM public.bot_purchases WHERE id = p_purchase_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'message', 'Suscripción no encontrada');
  END IF;

  -- Si ya expiró, sumar desde HOY. Si aún está vigente, sumar desde la fecha actual de expiración.
  v_base := GREATEST(COALESCE(v_purchase.expires_at, now()), now());
  v_new_expires := v_base + (p_months || ' months')::INTERVAL;

  UPDATE public.bot_purchases
     SET expires_at = v_new_expires,
         status = 'active',
         cancel_at_period_end = FALSE
   WHERE id = p_purchase_id;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'expires_at', v_new_expires,
    'months_added', p_months
  );
END; $$;

-- 5. RPC para cambiar fecha manualmente
CREATE OR REPLACE FUNCTION public.admin_set_expires_at(
  p_purchase_id UUID,
  p_expires_at TIMESTAMPTZ
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.bot_purchases
     SET expires_at = p_expires_at
   WHERE id = p_purchase_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', FALSE, 'message', 'Suscripción no encontrada');
  END IF;
  RETURN jsonb_build_object('ok', TRUE);
END; $$;

GRANT EXECUTE ON FUNCTION public.admin_create_subscription(TEXT, NUMERIC, TEXT, INT, TEXT, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_renew_subscription(UUID, INT)              TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_expires_at(UUID, TIMESTAMPTZ)          TO authenticated, service_role;
