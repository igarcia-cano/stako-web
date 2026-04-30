/* global React, ReactDOM */
/* ============================================================
   STAKO — Página de confirmación de email
   Maneja la URL a la que Supabase redirige tras pulsar el enlace
   del correo de verificación. Tres estados:
     - success: token válido encontrado en el hash → sesión iniciada
     - already: usuario llegó aquí sin token, pero ya tiene sesión
     - error:   Supabase devolvió un error en los query params
     - manual:  usuario llegó aquí sin token y sin sesión (entró a mano)
   ============================================================ */
const { useState: _useS, useEffect: _useE } = React;

function ConfirmadoApp() {
  return (
    <AppProvider>
      <Nav active={null} />
      <ConfirmadoMain />
      <Footer />
      <CookieBanner />
    </AppProvider>
  );
}

function ConfirmadoMain() {
  const [state, setState] = _useS("loading"); // loading | success | error | manual
  const [errorMsg, setErrorMsg] = _useS("");
  const [user, setUser] = _useS(null);

  _useE(() => {
    (async () => {
      // 1) ¿Error en los query params? (ej: link caducado)
      const qs = new URLSearchParams(window.location.search);
      const errParam =
        qs.get("error_description") || qs.get("error_code") || qs.get("error");
      if (errParam) {
        setErrorMsg(decodeURIComponent(errParam.replace(/\+/g, " ")));
        setState("error");
        return;
      }

      // 2) ¿Hay token en el hash? (flujo normal de Supabase)
      try {
        const u = await window.StakoSupabase.consumeOAuthFragment();
        if (u) {
          setUser(u);
          setState("success");
          return;
        }
      } catch (_) { /* ignore */ }

      // 3) ¿Ya hay sesión guardada? (usuario recargó la página)
      const existing = window.StakoSupabase.currentUser?.();
      if (existing) {
        setUser(existing);
        setState("success");
        return;
      }

      // 4) Llegó aquí sin nada → mensaje neutro
      setState("manual");
    })();
  }, []);

  return (
    <main className="confirm-main">
      <div className="container confirm-wrap">
        {state === "loading" && <ConfirmLoading />}
        {state === "success" && <ConfirmSuccess user={user} />}
        {state === "error"   && <ConfirmError message={errorMsg} />}
        {state === "manual"  && <ConfirmManual />}
      </div>
    </main>
  );
}

/* ===== Estados ===== */

function ConfirmLoading() {
  return (
    <div className="confirm-card">
      <div className="confirm-spinner" aria-hidden="true" />
      <p className="text-muted mono" style={{ fontSize: 13, marginTop: 18 }}>
        Verificando tu cuenta…
      </p>
    </div>
  );
}

function ConfirmSuccess({ user }) {
  return (
    <div className="confirm-card confirm-card--ok">
      <CheckIcon />
      <div className="eyebrow" style={{ marginTop: 28 }}>— Cuenta confirmada</div>
      <h1 className="display confirm-h1">¡Correo confirmado!</h1>
      <p className="confirm-lead">
        Tu cuenta {user?.email ? <span className="mono">({user.email})</span> : null} ya está activa.
        Puedes seguir desde la web o desde la app.
      </p>

      <div className="confirm-actions">
        <a href="/cuenta" className="btn btn-primary">Ir a mi cuenta</a>
        <a href="/" className="btn btn-ghost">Volver al inicio</a>
      </div>

      <p className="text-dim mono" style={{ fontSize: 11, marginTop: 32 }}>
        Bienvenid@ a Stako · stakocapital.com
      </p>
    </div>
  );
}

function ConfirmError({ message }) {
  // Mensajes habituales de Supabase: "Email link is invalid or has expired"
  const isExpired =
    /expir|invalid|otp/i.test(message || "");

  return (
    <div className="confirm-card confirm-card--err">
      <ErrorIcon />
      <div className="eyebrow" style={{ marginTop: 28 }}>— Algo no ha salido bien</div>
      <h1 className="display confirm-h1">
        {isExpired ? "Este enlace ya no es válido" : "No hemos podido confirmar tu cuenta"}
      </h1>
      <p className="confirm-lead">
        {isExpired
          ? "Los enlaces de confirmación caducan a las pocas horas por seguridad. No te preocupes: inicia sesión y te enviaremos uno nuevo automáticamente."
          : "Inténtalo de nuevo desde tu cuenta. Si el problema continúa, escríbenos."}
      </p>
      {message && (
        <p className="text-dim mono confirm-errmsg">{message}</p>
      )}

      <div className="confirm-actions">
        <a href="/cuenta" className="btn btn-primary">Iniciar sesión</a>
        <a href="/" className="btn btn-ghost">Volver al inicio</a>
      </div>
    </div>
  );
}

function ConfirmManual() {
  return (
    <div className="confirm-card">
      <CheckIcon />
      <div className="eyebrow" style={{ marginTop: 28 }}>— Confirmación de cuenta</div>
      <h1 className="display confirm-h1">Esta página es para confirmar tu correo</h1>
      <p className="confirm-lead">
        Si has llegado aquí desde el enlace que te enviamos, ya está todo listo.
        Si no, puedes entrar directamente a tu cuenta.
      </p>
      <div className="confirm-actions">
        <a href="/cuenta" className="btn btn-primary">Ir a mi cuenta</a>
        <a href="/" className="btn btn-ghost">Volver al inicio</a>
      </div>
    </div>
  );
}

/* ===== Iconos ===== */

function CheckIcon() {
  return (
    <svg className="confirm-icon confirm-icon--ok" viewBox="0 0 88 88" aria-hidden="true">
      <circle cx="44" cy="44" r="40" className="confirm-icon__ring" />
      <path
        d="M28 46 L40 58 L62 32"
        className="confirm-icon__check"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg className="confirm-icon confirm-icon--err" viewBox="0 0 88 88" aria-hidden="true">
      <circle cx="44" cy="44" r="40" className="confirm-icon__ring" />
      <path
        d="M44 26 L44 50"
        className="confirm-icon__check"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="44" cy="60" r="2.4" className="confirm-icon__dot" />
    </svg>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ConfirmadoApp />);
