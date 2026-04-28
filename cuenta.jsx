/* global React */
/* ============================================================
   STAKO — Página de cuenta del cliente
   ============================================================ */
const { useState: _useS, useEffect: _useE } = React;

function CuentaApp() {
  return (
    <AppProvider>
      <Nav active={null} />
      <CuentaMain />
      <Footer />
    </AppProvider>
  );
}

function CuentaMain() {
  const auth = useAuthState();
  const [section, setSection] = _useS(() => {
    if (window.location.hash === "#suscripciones") return "subs";
    if (window.location.hash === "#libros") return "books";
    return "profile";
  });

  // Si no hay sesión, mostrar invitación a login
  if (auth.loading) {
    return <main className="cuenta-main"><div className="container"><p className="text-muted" style={{ padding: 80, textAlign: "center" }}>Cargando…</p></div></main>;
  }

  if (!auth.user) {
    return <CuentaLoginRequired auth={auth} />;
  }

  return (
    <main className="cuenta-main">
      <div className="container cuenta-grid">
        <CuentaSidebar
          section={section} setSection={setSection}
          user={auth.user} admin={auth.admin}
          onLogout={auth.signOut}
        />
        <div className="cuenta-content">
          {section === "profile" && <CuentaProfile user={auth.user} admin={auth.admin} />}
          {section === "subs"    && <CuentaSubs />}
          {section === "books"   && <CuentaBooks />}
        </div>
      </div>
    </main>
  );
}

/* ===== Login required: formulario integrado en la página ===== */
function CuentaLoginRequired({ auth }) {
  const [mode, setMode] = _useS("login"); // login | signup | forgot
  const [email, setEmail] = _useS("");
  const [pwd, setPwd] = _useS("");
  const [pwd2, setPwd2] = _useS("");
  const [busy, setBusy] = _useS(false);
  const [err, setErr] = _useS("");
  const [info, setInfo] = _useS("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setInfo(""); setBusy(true);
    try {
      if (mode === "login") {
        const r = await window.StakoSupabase.signIn(email.trim(), pwd);
        if (r.ok) auth.refresh();
        else setErr(r.message || "Error al iniciar sesión");
      } else if (mode === "signup") {
        if (pwd.length < 8) { setErr("La contraseña debe tener al menos 8 caracteres."); setBusy(false); return; }
        if (pwd !== pwd2) { setErr("Las contraseñas no coinciden."); setBusy(false); return; }
        const r = await window.StakoSupabase.signUp(email.trim(), pwd);
        if (r.ok) {
          if (r.immediate) auth.refresh();
          else setInfo(r.message || "Te hemos enviado un email de confirmación.");
        } else setErr(r.message || "Error al crear cuenta");
      } else if (mode === "forgot") {
        const r = await window.StakoSupabase.resetPassword(email.trim());
        if (r.ok) setInfo(r.message);
        else setErr(r.message || "Error");
      }
    } finally { setBusy(false); }
  };

  const onGoogle = () => {
    setBusy(true);
    window.StakoSupabase.signInWithGoogle();
  };

  const titles = {
    login: "Iniciar sesión",
    signup: "Crear cuenta",
    forgot: "Recuperar contraseña",
  };
  const subs = {
    login: "Accede a tu cuenta para ver suscripciones, productos y más.",
    signup: "Crea una cuenta para gestionar tus suscripciones y productos.",
    forgot: "Te enviaremos un email para restablecer tu contraseña.",
  };

  return (
    <main className="cuenta-main">
      <div className="container cuenta-auth-wrap">
        <div className="cuenta-auth-card">
          <div className="eyebrow">— Stako</div>
          <h1 className="display cuenta-auth-title">{titles[mode]}</h1>
          <p className="text-muted cuenta-auth-sub">{subs[mode]}</p>

          {mode !== "forgot" && (
            <>
              <button type="button" className="btn btn-google" onClick={onGoogle} disabled={busy}>
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C41.8 35.6 44 30.3 44 24c0-1.3-.1-2.4-.4-3.5z"/>
                </svg>
                Continuar con Google
              </button>
              <div className="modal-divider"><span>o</span></div>
            </>
          )}

          <form onSubmit={onSubmit} className="modal-form">
            <label className="modal-label">
              <span className="mono">Email</span>
              <input type="email" required value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     placeholder="tu@email.com" autoFocus disabled={busy} />
            </label>
            {mode !== "forgot" && (
              <label className="modal-label">
                <span className="mono">Contraseña</span>
                <input type="password" required value={pwd}
                       onChange={(e) => setPwd(e.target.value)}
                       placeholder={mode === "signup" ? "Mínimo 8 caracteres" : "Tu contraseña"}
                       disabled={busy} minLength={mode === "signup" ? 8 : undefined} />
              </label>
            )}
            {mode === "signup" && (
              <label className="modal-label">
                <span className="mono">Repite la contraseña</span>
                <input type="password" required value={pwd2}
                       onChange={(e) => setPwd2(e.target.value)} disabled={busy} />
              </label>
            )}
            {err && <div className="modal-err">{err}</div>}
            {info && <div className="modal-info">{info}</div>}
            <button type="submit" className="btn btn-primary modal-submit" disabled={busy}>
              {busy ? "..." : (mode === "login" ? "Entrar" : mode === "signup" ? "Crear cuenta" : "Enviar email")}
            </button>
          </form>

          <div className="modal-foot">
            {mode === "login" && (
              <>
                <button type="button" className="link-btn" onClick={() => { setErr(""); setInfo(""); setMode("forgot"); }}>
                  ¿Olvidaste tu contraseña?
                </button>
                <span className="text-dim"> · </span>
                <button type="button" className="link-btn" onClick={() => { setErr(""); setInfo(""); setMode("signup"); }}>
                  Crear cuenta nueva
                </button>
              </>
            )}
            {mode === "signup" && (
              <button type="button" className="link-btn" onClick={() => { setErr(""); setInfo(""); setMode("login"); }}>
                ¿Ya tienes cuenta? Inicia sesión
              </button>
            )}
            {mode === "forgot" && (
              <button type="button" className="link-btn" onClick={() => { setErr(""); setInfo(""); setMode("login"); }}>
                Volver al inicio de sesión
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/* ===== Sidebar ===== */
function CuentaSidebar({ section, setSection, user, admin, onLogout }) {
  const initials = (user.email || "?").split("@")[0].slice(0, 2).toUpperCase();
  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email.split("@")[0];

  const items = [
    { id: "profile", label: "Mi perfil",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
    { id: "subs", label: "Suscripciones",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18"/></svg> },
    { id: "books", label: "Mis libros",
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
  ];

  const onPick = (id) => {
    setSection(id);
    if (id === "profile") window.location.hash = "";
    if (id === "subs") window.location.hash = "suscripciones";
    if (id === "books") window.location.hash = "libros";
  };

  return (
    <aside className="cuenta-sidebar">
      <div className="cuenta-side-head">
        <div className="cuenta-avatar">{initials}</div>
        <div>
          <div className="cuenta-side-name">{displayName}</div>
          <div className="cuenta-side-email mono text-dim">{user.email}</div>
        </div>
      </div>

      <nav className="cuenta-side-nav">
        {items.map((it) => (
          <button key={it.id}
            className={`cuenta-side-link ${section === it.id ? "is-active" : ""}`}
            onClick={() => onPick(it.id)}
          >
            {it.icon}
            <span>{it.label}</span>
          </button>
        ))}
        {admin && (
          <a href="admin.html" className="cuenta-side-link cuenta-side-link--admin">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>Panel admin</span>
          </a>
        )}
      </nav>

      <button className="btn btn-ghost btn-sm cuenta-side-logout" onClick={onLogout}>
        Cerrar sesión
      </button>
    </aside>
  );
}

/* ===== Sección: Perfil ===== */
function CuentaProfile({ user, admin }) {
  const [pwd, setPwd] = _useS("");
  const [pwd2, setPwd2] = _useS("");
  const [busy, setBusy] = _useS(false);
  const [msg, setMsg] = _useS("");
  const [err, setErr] = _useS("");

  const onChangePwd = async (e) => {
    e.preventDefault();
    setMsg(""); setErr("");
    if (pwd.length < 8) { setErr("Mínimo 8 caracteres."); return; }
    if (pwd !== pwd2) { setErr("Las contraseñas no coinciden."); return; }
    setBusy(true);
    const r = await window.StakoSupabase.updatePassword(pwd);
    setBusy(false);
    if (r.ok) { setMsg("Contraseña actualizada."); setPwd(""); setPwd2(""); }
    else setErr(r.message || "Error");
  };

  const provider = user.app_metadata?.provider || "email";
  const createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString("es-ES") : "—";

  return (
    <section className="cuenta-section">
      <div className="eyebrow">— Mi cuenta</div>
      <h1 className="display cuenta-h1">Mi perfil</h1>

      <div className="cuenta-card">
        <h2 className="cuenta-h2">Datos de la cuenta</h2>
        <dl className="cuenta-dl">
          <dt>Email</dt><dd className="mono">{user.email}</dd>
          <dt>Método de acceso</dt><dd>{provider === "google" ? "Google" : "Email + contraseña"}</dd>
          <dt>Cuenta creada</dt><dd className="mono">{createdAt}</dd>
          {admin && (<><dt>Rol</dt><dd><span className="badge-admin">Administrador</span></dd></>)}
        </dl>
      </div>

      {provider !== "google" && (
        <div className="cuenta-card">
          <h2 className="cuenta-h2">Cambiar contraseña</h2>
          <form onSubmit={onChangePwd} className="cuenta-form">
            <label className="modal-label">
              <span className="mono">Nueva contraseña</span>
              <input type="password" minLength={8} required value={pwd}
                     onChange={(e) => setPwd(e.target.value)}
                     placeholder="Mínimo 8 caracteres" disabled={busy} />
            </label>
            <label className="modal-label">
              <span className="mono">Repite la nueva contraseña</span>
              <input type="password" minLength={8} required value={pwd2}
                     onChange={(e) => setPwd2(e.target.value)}
                     disabled={busy} />
            </label>
            {err && <div className="modal-err">{err}</div>}
            {msg && <div className="modal-info">{msg}</div>}
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Guardando…" : "Guardar contraseña"}
            </button>
          </form>
        </div>
      )}

      {provider === "google" && (
        <div className="cuenta-card">
          <h2 className="cuenta-h2">Acceso con Google</h2>
          <p className="text-muted">
            Tu cuenta usa Google para iniciar sesión. La contraseña se gestiona desde tu cuenta de Google.
          </p>
        </div>
      )}
    </section>
  );
}

/* ===== Sección: Suscripciones ===== */
function CuentaSubs() {
  const [rows, setRows] = _useS([]);
  const [codes, setCodes] = _useS({});
  const [loading, setLoading] = _useS(true);
  const [busyId, setBusyId] = _useS(null);

  const reload = async () => {
    setLoading(true);
    const data = await window.StakoSupabase.clientMyPurchases();
    setRows(data || []);
    // pedir códigos sin canjear de cada compra activa (no es ideal pero simple)
    const codeMap = {};
    for (const p of data || []) {
      if (p.status === "active" && !p.linked_chat_id) {
        try {
          const c = await window.StakoSupabase.clientMyActivationCode(p.id);
          if (c) codeMap[p.id] = c;
        } catch (_) {}
      }
    }
    setCodes(codeMap);
    setLoading(false);
  };
  _useE(() => { reload(); }, []);

  const cancel = async (id) => {
    if (!confirm("¿Cancelar esta suscripción al final del periodo?")) return;
    setBusyId(id);
    const r = await window.StakoSupabase.clientCancelSubscription(id);
    setBusyId(null);
    if (r.ok) { alert(r.message); reload(); }
    else alert(r.message || "Error");
  };
  const reactivate = async (id) => {
    setBusyId(id);
    const r = await window.StakoSupabase.clientReactivateSubscription(id);
    setBusyId(null);
    if (r.ok) reload();
    else alert(r.message || "Error");
  };
  const copy = async (txt) => {
    try { await navigator.clipboard.writeText(txt); } catch (_) {}
  };

  return (
    <section className="cuenta-section">
      <div className="eyebrow">— Mi cuenta</div>
      <h1 className="display cuenta-h1">Suscripciones</h1>

      {loading ? <p className="text-muted">Cargando…</p> :
       rows.length === 0 ? (
        <div className="cuenta-empty">
          <p className="text-muted">No tienes ninguna suscripción activa todavía.</p>
          <a href="bot.html" className="btn btn-primary" style={{ marginTop: 24 }}>Conoce el Bot de Trading</a>
        </div>
       ) : (
        <div className="cuenta-subs">
          {rows.map((p) => <SubCard key={p.id} p={p} code={codes[p.id]} busy={busyId === p.id}
                                      onCancel={() => cancel(p.id)}
                                      onReactivate={() => reactivate(p.id)}
                                      onCopy={copy} />)}
        </div>
       )}
    </section>
  );
}

function SubCard({ p, code, busy, onCancel, onReactivate, onCopy }) {
  const fmtDate = (s) => s ? new Date(s).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }) : "—";

  let status, statusClass;
  if (p.status === "active" && p.cancel_at_period_end) {
    status = "Cancelada · activa hasta " + fmtDate(p.expires_at);
    statusClass = "sub-status--warn";
  } else if (p.status === "active") {
    status = "Activa";
    statusClass = "sub-status--ok";
  } else if (p.status === "cancelled") {
    status = "Cancelada";
    statusClass = "sub-status--off";
  } else if (p.status === "banned") {
    status = "Suspendida";
    statusClass = "sub-status--err";
  } else {
    status = "Pendiente";
    statusClass = "sub-status--warn";
  }

  return (
    <div className="sub-card">
      <div className="sub-card__head">
        <div>
          <div className="sub-card__title">Bot de Trading · Stako</div>
          <div className={`sub-status ${statusClass}`}>● {status}</div>
        </div>
        <div className="sub-card__price mono">€{Number(p.amount_eur || 0).toFixed(2)}<span className="text-dim">/mes</span></div>
      </div>

      <dl className="cuenta-dl cuenta-dl--inline">
        <dt>Inicio</dt><dd className="mono">{fmtDate(p.created_at)}</dd>
        {p.expires_at && (<><dt>Próxima renovación</dt><dd className="mono">{fmtDate(p.expires_at)}</dd></>)}
        {p.linked_chat_id && (<><dt>Telegram vinculado</dt><dd className="mono text-muted">chat_id {p.linked_chat_id}</dd></>)}
      </dl>

      {p.status === "active" && !p.linked_chat_id && code && (
        <div className="sub-card__code-block">
          <div className="text-muted" style={{ fontSize: 13, marginBottom: 8 }}>
            Tu código de activación. Cánjealo en <a href="https://t.me/StakoTradingBot" target="_blank" rel="noopener">@StakoTradingBot</a> con <span className="mono">/activar</span>:
          </div>
          <div className="sub-card__code">
            <span className="mono">{code}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => onCopy(code)}>Copiar</button>
          </div>
        </div>
      )}

      <div className="sub-card__actions">
        {p.status === "active" && !p.cancel_at_period_end && (
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={onCancel}>
            Cancelar suscripción
          </button>
        )}
        {p.status === "active" && p.cancel_at_period_end && (
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={onReactivate}>
            Reactivar
          </button>
        )}
      </div>
    </div>
  );
}

/* ===== Sección: Libros ===== */
function CuentaBooks() {
  const [rows, setRows] = _useS([]);
  const [loading, setLoading] = _useS(true);
  _useE(() => {
    (async () => {
      const data = await window.StakoSupabase.clientMyBooks();
      setRows(data || []);
      setLoading(false);
    })();
  }, []);

  return (
    <section className="cuenta-section">
      <div className="eyebrow">— Mi cuenta</div>
      <h1 className="display cuenta-h1">Mis libros</h1>

      {loading ? <p className="text-muted">Cargando…</p> :
       rows.length === 0 ? (
        <div className="cuenta-empty">
          <p className="text-muted">Aún no has comprado ningún libro.</p>
          <p className="text-dim mono" style={{ fontSize: 12, marginTop: 12 }}>
            La librería de Stako se lanzará próximamente.
          </p>
        </div>
       ) : (
        <div className="cuenta-books">
          {rows.map((b) => (
            <div key={b.id} className="book-card">
              <div className="book-card__title">{b.book_title || "Libro Stako"}</div>
              <div className="text-muted mono num-tab" style={{ fontSize: 13 }}>
                €{Number(b.amount_eur || 0).toFixed(2)} · {new Date(b.created_at).toLocaleDateString("es-ES")}
              </div>
              {b.download_url && (
                <a href={b.download_url} className="btn btn-ghost btn-sm" style={{ marginTop: 14 }}>
                  Descargar
                </a>
              )}
            </div>
          ))}
        </div>
       )}
    </section>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<CuentaApp />);
