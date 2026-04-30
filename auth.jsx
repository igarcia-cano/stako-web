/* global React */
/* ============================================================
   STAKO — Auth UI: login modal, user dropdown, auth state
   ============================================================ */
const { useState: _useState, useEffect: _useEffect, useRef: _useRef } = React;

/* ===== Hook: estado de sesión global ===== */
function useAuthState() {
  const [user, setUser] = _useState(() => window.StakoSupabase.currentUser());
  const [admin, setAdmin] = _useState(false);
  const [loading, setLoading] = _useState(true);

  _useEffect(() => {
    let alive = true;

    // Si venimos de OAuth, consumir fragment
    (async () => {
      const oauthUser = await window.StakoSupabase.consumeOAuthFragment().catch(() => null);
      if (oauthUser && alive) setUser(oauthUser);

      const u = window.StakoSupabase.currentUser();
      if (alive) setUser(u);
      if (u) {
        const isAdm = await window.StakoSupabase.isAdmin().catch(() => false);
        if (alive) setAdmin(isAdm);
      } else {
        if (alive) setAdmin(false);
      }
      if (alive) setLoading(false);
    })();

    // Si cambia el localStorage en otra pestaña
    const onStorage = (e) => {
      if (e.key === "stako-auth") {
        const u = window.StakoSupabase.currentUser();
        setUser(u);
        if (!u) setAdmin(false);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => { alive = false; window.removeEventListener("storage", onStorage); };
  }, []);

  const refresh = async () => {
    const u = window.StakoSupabase.currentUser();
    setUser(u);
    if (u) {
      const isAdm = await window.StakoSupabase.isAdmin().catch(() => false);
      setAdmin(isAdm);
    } else {
      setAdmin(false);
    }
  };

  const signOut = () => {
    window.StakoSupabase.signOut();
    setUser(null);
    setAdmin(false);
  };

  return { user, admin, loading, refresh, signOut };
}

/* ===== Login Modal ===== */
function LoginModal({ open, onClose, onLoggedIn }) {
  const { t } = useApp();
  const [mode, setMode] = _useState("login"); // login | signup | forgot
  const [email, setEmail] = _useState("");
  const [pwd, setPwd] = _useState("");
  const [pwd2, setPwd2] = _useState("");
  const [busy, setBusy] = _useState(false);
  const [err, setErr] = _useState("");
  const [info, setInfo] = _useState("");

  _useEffect(() => {
    if (!open) {
      // reset on close
      setTimeout(() => {
        setMode("login"); setEmail(""); setPwd(""); setPwd2("");
        setErr(""); setInfo(""); setBusy(false);
      }, 200);
    }
  }, [open]);

  if (!open) return null;

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setInfo(""); setBusy(true);
    try {
      if (mode === "login") {
        const r = await window.StakoSupabase.signIn(email.trim(), pwd);
        if (r.ok) { onLoggedIn && onLoggedIn(r.user); onClose(); }
        else setErr(r.message || t.auth.err_login);
      } else if (mode === "signup") {
        if (pwd.length < 8) { setErr(t.auth.err_pwd_short); setBusy(false); return; }
        if (pwd !== pwd2) { setErr(t.auth.err_pwd_mismatch); setBusy(false); return; }
        const r = await window.StakoSupabase.signUp(email.trim(), pwd);
        if (r.ok) {
          if (r.immediate) { onLoggedIn && onLoggedIn(r.user); onClose(); }
          else setInfo(t.auth.info_signup_email);
        } else setErr(r.message || t.auth.err_signup);
      } else if (mode === "forgot") {
        const r = await window.StakoSupabase.resetPassword(email.trim());
        if (r.ok) setInfo(t.auth.info_forgot_email);
        else setErr(r.message || "Error");
      }
    } finally { setBusy(false); }
  };

  const onGoogle = () => {
    setBusy(true);
    window.StakoSupabase.signInWithGoogle();
  };

  const titles = {
    login: t.auth.login_title,
    signup: t.auth.signup_title,
    forgot: t.auth.forgot_title,
  };

  const modalContent = (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="eyebrow">— Stako</div>
        <h2 className="display modal-title">{titles[mode]}</h2>
        <p className="text-muted modal-sub">
          {mode === "login" && t.auth.login_sub}
          {mode === "signup" && t.auth.signup_sub}
          {mode === "forgot" && t.auth.forgot_sub}
        </p>

        {mode !== "forgot" && (
          <>
            <button className="btn btn-google" onClick={onGoogle} disabled={busy}>
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C41.8 35.6 44 30.3 44 24c0-1.3-.1-2.4-.4-3.5z"/>
              </svg>
              {t.auth.google_cta}
            </button>

            <div className="modal-divider"><span>{t.auth.separator}</span></div>
          </>
        )}

        <form onSubmit={onSubmit} className="modal-form">
          <label className="modal-label">
            <span className="mono">{t.auth.email_label}</span>
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.auth.email_ph} autoFocus
              disabled={busy}
            />
          </label>

          {mode !== "forgot" && (
            <label className="modal-label">
              <span className="mono">{t.auth.password_label}</span>
              <input
                type="password" required value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder={mode === "signup" ? t.auth.password_ph_signup : t.auth.password_ph_login}
                disabled={busy} minLength={mode === "signup" ? 8 : undefined}
              />
            </label>
          )}

          {mode === "signup" && (
            <label className="modal-label">
              <span className="mono">{t.auth.password_repeat_label}</span>
              <input
                type="password" required value={pwd2}
                onChange={(e) => setPwd2(e.target.value)}
                placeholder={t.auth.password_repeat_label}
                disabled={busy}
              />
            </label>
          )}

          {err && <div className="modal-err">{err}</div>}
          {info && <div className="modal-info">{info}</div>}

          <button className="btn btn-primary modal-submit" type="submit" disabled={busy}>
            {busy ? t.auth.submitting : (
              mode === "login" ? t.auth.submit_login :
              mode === "signup" ? t.auth.submit_signup :
              t.auth.submit_forgot
            )}
          </button>
        </form>

        <div className="modal-foot">
          {mode === "login" && (
            <>
              <button className="link-btn" onClick={() => { setErr(""); setInfo(""); setMode("forgot"); }}>
                {t.auth.forgot_link}
              </button>
              <span className="text-dim"> · </span>
              <button className="link-btn" onClick={() => { setErr(""); setInfo(""); setMode("signup"); }}>
                {t.auth.signup_link}
              </button>
            </>
          )}
          {mode === "signup" && (
            <button className="link-btn" onClick={() => { setErr(""); setInfo(""); setMode("login"); }}>
              {t.auth.to_login_link}
            </button>
          )}
          {mode === "forgot" && (
            <button className="link-btn" onClick={() => { setErr(""); setInfo(""); setMode("login"); }}>
              {t.auth.back_to_login}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===== User Dropdown (cuando está logueado) ===== */
function UserDropdown({ user, admin, onLogout }) {
  const { t } = useApp();
  const [open, setOpen] = _useState(false);
  const ref = _useRef(null);

  _useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const initials = (user.email || "?").split("@")[0].slice(0, 2).toUpperCase();
  const displayName = user.user_metadata?.full_name ||
                      user.user_metadata?.name ||
                      user.email.split("@")[0];

  return (
    <div className="user-menu" ref={ref}>
      <button className="user-menu__trigger" onClick={() => setOpen(!open)}>
        <span className="user-avatar">{initials}</span>
        <span className="user-name hide-sm">{displayName}</span>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="user-menu__panel">
          <div className="user-menu__head">
            <div className="user-menu__name">{displayName}</div>
            <div className="user-menu__email mono text-dim">{user.email}</div>
          </div>
          <a href="cuenta.html" className="user-menu__item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            {t.nav.profile}
          </a>
          <a href="cuenta.html#suscripciones" className="user-menu__item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18"/></svg>
            {t.nav.subscriptions}
          </a>
          {admin && (
            <a href="admin.html" className="user-menu__item user-menu__item--admin">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              {t.nav.admin}
            </a>
          )}
          <div className="user-menu__sep"></div>
          <button className="user-menu__item user-menu__item--danger" onClick={onLogout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            {t.nav.logout}
          </button>
        </div>
      )}
    </div>
  );
}

/* ===== AuthSlot: pone el botón de login O el dropdown de usuario ===== */
function AuthSlot() {
  const { t } = useApp();
  const auth = useAuthState();

  if (auth.loading) {
    return <div className="auth-slot-skeleton" aria-hidden="true">&nbsp;</div>;
  }

  if (auth.user) {
    return (
      <UserDropdown user={auth.user} admin={auth.admin} onLogout={auth.signOut} />
    );
  }

  // Sin sesión: enlace directo a la página de cuenta (que muestra login).
  return (
    <a href="cuenta.html" className="btn btn-ghost btn-sm">
      {t.nav.access}
    </a>
  );
}

/* expose */
Object.assign(window, { useAuthState, LoginModal, UserDropdown, AuthSlot });
