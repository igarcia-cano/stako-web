/* global React, ReactDOM */
/* ============================================================
   STAKO — Página de confirmación de email
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
  const { t } = useApp();
  const [state, setState] = _useS("loading");
  const [errorMsg, setErrorMsg] = _useS("");
  const [user, setUser] = _useS(null);

  _useE(() => {
    (async () => {
      const qs = new URLSearchParams(window.location.search);
      const errParam =
        qs.get("error_description") || qs.get("error_code") || qs.get("error");
      if (errParam) {
        setErrorMsg(decodeURIComponent(errParam.replace(/\+/g, " ")));
        setState("error");
        return;
      }
      try {
        const u = await window.StakoSupabase.consumeOAuthFragment();
        if (u) { setUser(u); setState("success"); return; }
      } catch (_) { /* ignore */ }
      const existing = window.StakoSupabase.currentUser?.();
      if (existing) { setUser(existing); setState("success"); return; }
      setState("manual");
    })();
  }, []);

  return (
    <main className="confirm-main">
      <div className="container confirm-wrap">
        {state === "loading" && <ConfirmLoading t={t} />}
        {state === "success" && <ConfirmSuccess user={user} t={t} />}
        {state === "error"   && <ConfirmError message={errorMsg} t={t} />}
        {state === "manual"  && <ConfirmManual t={t} />}
      </div>
    </main>
  );
}

function ConfirmLoading({ t }) {
  return (
    <div className="confirm-card">
      <div className="confirm-spinner" aria-hidden="true" />
      <p className="text-muted mono" style={{ fontSize: 13, marginTop: 18 }}>
        {t.confirmado.loading}
      </p>
    </div>
  );
}

function ConfirmSuccess({ user, t }) {
  return (
    <div className="confirm-card confirm-card--ok">
      <CheckIcon />
      <div className="eyebrow" style={{ marginTop: 28 }}>— {t.confirmado.ok_eyebrow}</div>
      <h1 className="display confirm-h1">{t.confirmado.ok_h1}</h1>
      <p className="confirm-lead">
        {t.confirmado.ok_lead_a} {user?.email ? <span className="mono">({user.email})</span> : null} {t.confirmado.ok_lead_b}
      </p>
      <div className="confirm-actions">
        <a href="/cuenta" className="btn btn-primary">{t.confirmado.ok_cta_account}</a>
        <a href="/" className="btn btn-ghost">{t.confirmado.ok_cta_home}</a>
      </div>
      <p className="text-dim mono" style={{ fontSize: 11, marginTop: 32 }}>
        {t.confirmado.ok_footer}
      </p>
    </div>
  );
}

function ConfirmError({ message, t }) {
  const isExpired = /expir|invalid|otp/i.test(message || "");
  return (
    <div className="confirm-card confirm-card--err">
      <ErrorIcon />
      <div className="eyebrow" style={{ marginTop: 28 }}>— {t.confirmado.err_eyebrow}</div>
      <h1 className="display confirm-h1">
        {isExpired ? t.confirmado.err_h1_expired : t.confirmado.err_h1_generic}
      </h1>
      <p className="confirm-lead">
        {isExpired ? t.confirmado.err_lead_expired : t.confirmado.err_lead_generic}
      </p>
      {message && <p className="text-dim mono confirm-errmsg">{message}</p>}
      <div className="confirm-actions">
        <a href="/cuenta" className="btn btn-primary">{t.confirmado.err_cta_login}</a>
        <a href="/" className="btn btn-ghost">{t.confirmado.err_cta_home}</a>
      </div>
    </div>
  );
}

function ConfirmManual({ t }) {
  return (
    <div className="confirm-card">
      <CheckIcon />
      <div className="eyebrow" style={{ marginTop: 28 }}>— {t.confirmado.manual_eyebrow}</div>
      <h1 className="display confirm-h1">{t.confirmado.manual_h1}</h1>
      <p className="confirm-lead">{t.confirmado.manual_lead}</p>
      <div className="confirm-actions">
        <a href="/cuenta" className="btn btn-primary">{t.confirmado.ok_cta_account}</a>
        <a href="/" className="btn btn-ghost">{t.confirmado.ok_cta_home}</a>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="confirm-icon confirm-icon--ok" viewBox="0 0 88 88" aria-hidden="true">
      <circle cx="44" cy="44" r="40" className="confirm-icon__ring" />
      <path d="M28 46 L40 58 L62 32" className="confirm-icon__check" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg className="confirm-icon confirm-icon--err" viewBox="0 0 88 88" aria-hidden="true">
      <circle cx="44" cy="44" r="40" className="confirm-icon__ring" />
      <path d="M44 26 L44 50" className="confirm-icon__check" fill="none" strokeLinecap="round" />
      <circle cx="44" cy="60" r="2.4" className="confirm-icon__dot" />
    </svg>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ConfirmadoApp />);
