/* global React, ReactDOM */
const { useState, useEffect, useMemo } = React;

/* ============================================================
   ADMIN — login + dashboard
   ============================================================ */

function AdminApp() {
  const [user, setUser] = useState(() => window.StakoSupabase.currentUser());
  const [admin, setAdmin] = useState(null); // null = unknown, true/false = checked
  const [theme, setTheme] = useState(() => localStorage.getItem("stako-theme") || "dark");

  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem("stako-theme", theme); }, [theme]);

  useEffect(() => {
    let alive = true;
    if (!user) { setAdmin(false); return; }
    window.StakoSupabase.isAdmin().then((ok) => { if (alive) setAdmin(ok); });
    return () => { alive = false; };
  }, [user]);

  const onLogin = (u) => setUser(u);
  const onLogout = () => { window.StakoSupabase.signOut(); setUser(null); setAdmin(null); };

  if (!user) return <Login onLogin={onLogin} theme={theme} setTheme={setTheme} />;
  if (admin === null) return <Loading label="Verificando permisos…" />;
  if (admin === false) return <Forbidden onLogout={onLogout} />;
  return <Dashboard user={user} onLogout={onLogout} theme={theme} setTheme={setTheme} />;
}

function Loading({ label }) {
  return (
    <div className="adm-center">
      <div className="adm-spinner"></div>
      <p className="text-muted mono" style={{ marginTop: 14, fontSize: 12 }}>{label}</p>
    </div>
  );
}

function Forbidden({ onLogout }) {
  return (
    <div className="adm-center">
      <div className="adm-card" style={{ maxWidth: 440, textAlign: "center" }}>
        <div className="eyebrow" style={{ color: "var(--danger)" }}>— Acceso denegado</div>
        <h2 className="display" style={{ fontSize: 32, margin: "16px 0 8px" }}>No tienes permisos.</h2>
        <p className="text-muted">Tu cuenta no está registrada como admin.</p>
        <button className="btn btn-ghost" onClick={onLogout} style={{ marginTop: 22 }}>Cerrar sesión</button>
      </div>
    </div>
  );
}

function Login({ onLogin, theme, setTheme }) {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setErr(null); setLoading(true);
    const res = await window.StakoSupabase.signIn(email.trim(), pwd);
    setLoading(false);
    if (res.ok) onLogin(res.user);
    else setErr(res.message || "No se ha podido iniciar sesión.");
  };

  return (
    <div className="adm-center">
      <a href="index.html" className="adm-logo-link">
        <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
          <rect x="2.5" y="2.5" width="27" height="27" rx="7" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10 20.5 L14.5 13.5 L18.5 18 L23 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="23" cy="11" r="1.6" fill="currentColor"/>
        </svg>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 22 }}>Stako</span>
      </a>
      <form onSubmit={submit} className="adm-card adm-login">
        <div className="eyebrow">— Panel de administración</div>
        <h1 className="display" style={{ fontSize: 36, margin: "14px 0 24px", letterSpacing: "-0.02em" }}>
          Iniciar sesión
        </h1>
        <label className="adm-field">
          <span className="mono">Email</span>
          <input className="input" type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="adm-field">
          <span className="mono">Contraseña</span>
          <input className="input" type="password" required value={pwd} onChange={(e) => setPwd(e.target.value)} />
        </label>
        {err && <div className="waitlist__error mono" style={{ marginTop: 4 }}>{err}</div>}
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", justifyContent: "center", marginTop: 20 }}>
          {loading ? "Entrando…" : "Entrar"}
        </button>
        <p className="text-dim mono" style={{ marginTop: 18, fontSize: 11, textAlign: "center" }}>
          Solo cuentas autorizadas.
        </p>
      </form>
      <button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={{ marginTop: 20 }} aria-label="Toggle theme">
        {theme === "dark" ? "☀" : "☾"}
      </button>
    </div>
  );
}

function Dashboard({ user, onLogout, theme, setTheme }) {
  const [tab, setTab] = useState("overview");
  const [waitlist, setWaitlist] = useState([]);
  const [bot, setBot] = useState([]);
  const [books, setBooks] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [codes, setCodes] = useState([]);
  const [posts, setPosts] = useState([]);
  const [blogCategories, setBlogCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    const [w, b, k, lic, cod, p, bc] = await Promise.all([
      window.StakoSupabase.adminListWaitlist(),
      window.StakoSupabase.adminListBotPurchases(),
      window.StakoSupabase.adminListBookPurchases(),
      window.StakoSupabase.adminListLicenses(),
      window.StakoSupabase.adminListActivationCodes(),
      window.StakoSupabase.adminBlogListAllPosts({ status: "all" }),
      window.StakoSupabase.blogListCategories(),
    ]);
    setWaitlist(w); setBot(b); setBooks(k);
    setLicenses(lic); setCodes(cod);
    setPosts(p); setBlogCategories(bc);
    setLoading(false);
  };
  useEffect(() => { reload(); }, []);

  const tabs = [
    { id: "overview", label: "Resumen" },
    { id: "waitlist", label: `Waitlist · ${waitlist.length}` },
    { id: "bot", label: `Bot · ${bot.length}` },
    { id: "licenses", label: `Licencias · ${licenses.filter((l) => l.status === "active").length}` },
    { id: "books", label: `Libros · ${books.length}` },
    { id: "blog", label: `Blog · ${posts.length}` },
  ];

  return (
    <div className="adm">
      <header className="adm-top">
        <div className="adm-top__left">
          <a href="index.html" className="adm-logo">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <rect x="2.5" y="2.5" width="27" height="27" rx="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 20.5 L14.5 13.5 L18.5 18 L23 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Stako</span>
            <span className="adm-logo__sub mono">/ admin</span>
          </a>
        </div>
        <nav className="adm-tabs">
          {tabs.map((t) => (
            <button key={t.id} className={`adm-tab ${tab === t.id ? "is-active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </nav>
        <div className="adm-top__right">
          <button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Theme">
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <button className="icon-btn" onClick={reload} aria-label="Reload" title="Recargar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>
          </button>
          <span className="mono text-dim adm-user">{user.email}</span>
          <button className="btn btn-ghost btn-sm" onClick={onLogout}>Salir</button>
        </div>
      </header>

      <main className="adm-main">
        {loading ? <Loading label="Cargando datos…" /> : (
          <>
            {tab === "overview" && <Overview waitlist={waitlist} bot={bot} books={books} onJump={setTab} />}
            {tab === "waitlist" && <WaitlistTable rows={waitlist} onChange={reload} />}
            {tab === "bot" && <BotTable rows={bot} codes={codes} onChange={reload} />}
            {tab === "licenses" && <LicensesTable rows={licenses} onChange={reload} />}
            {tab === "books" && <BookTable rows={books} />}
            {tab === "blog" && <BlogManager posts={posts} categories={blogCategories} onChange={reload} />}
          </>
        )}
      </main>
    </div>
  );
}

/* ===== Overview / KPIs ===== */
function Overview({ waitlist, bot, books, onJump }) {
  const now = Date.now();
  const week = now - 7 * 86400000;
  const newThisWeek = waitlist.filter((r) => new Date(r.created_at).getTime() > week).length;
  const botActive = bot.filter((r) => r.status === "active").length;
  const botRevenue = bot.reduce((s, r) => s + (r.status === "active" ? Number(r.amount_eur || 0) : 0), 0);
  const bookRevenue = books.reduce((s, r) => s + Number(r.amount_eur || 0), 0);
  const total = botRevenue + bookRevenue;

  // Suscripciones que vencen pronto
  const expiringSoon = useMemo(() => {
    const now = Date.now();
    return bot
      .filter((r) => r.status === "active" && r.expires_at)
      .map((r) => ({ ...r, _days: Math.floor((new Date(r.expires_at) - now) / 86400000) }))
      .filter((r) => r._days <= 7)
      .sort((a, b) => a._days - b._days);
  }, [bot]);

  // Recent activity (mix waitlist + purchases)
  const activity = [
    ...waitlist.slice(0, 5).map((r) => ({ type: "waitlist", at: r.created_at, label: r.email })),
    ...bot.slice(0, 5).map((r) => ({ type: "bot", at: r.created_at, label: `${r.user_email} · ${r.status}` })),
    ...books.slice(0, 5).map((r) => ({ type: "book", at: r.created_at, label: `${r.user_email} · ${r.book_title}` })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 8);

  return (
    <div className="adm-section">
      <header className="adm-section__head">
        <div>
          <div className="eyebrow">— Resumen</div>
          <h2 className="display adm-h2">Estado del negocio</h2>
        </div>
      </header>

      {expiringSoon.length > 0 && (
        <div className="adm-alert adm-alert--warn">
          <div className="adm-alert__head">
            <strong>⚠ {expiringSoon.length} suscripcion{expiringSoon.length === 1 ? "" : "es"} vencen pronto</strong>
            <button className="adm-link adm-link--primary" onClick={() => onJump("bot")}>Ver todas →</button>
          </div>
          <ul className="adm-alert__list">
            {expiringSoon.slice(0, 5).map((r) => (
              <li key={r.id}>
                <span className="adm-mono">{r.user_email}</span>
                <span className="text-muted mono"> · </span>
                {r._days < 0 ? (
                  <span style={{ color: "var(--danger)" }}>vencida hace {-r._days}d</span>
                ) : r._days === 0 ? (
                  <span style={{ color: "var(--gold)" }}>vence hoy</span>
                ) : (
                  <span style={{ color: "var(--gold)" }}>vence en {r._days}d</span>
                )}
                <span className="text-dim mono"> · {fmtDate(r.expires_at)}</span>
              </li>
            ))}
            {expiringSoon.length > 5 && (
              <li className="text-dim mono" style={{ fontSize: 12 }}>… y {expiringSoon.length - 5} más</li>
            )}
          </ul>
        </div>
      )}

      <div className="kpi-grid">
        <Kpi label="Lista de espera" value={waitlist.length} delta={`+${newThisWeek} esta semana`} accent="green" onClick={() => onJump("waitlist")} />
        <Kpi label="Bot · Suscriptores activos" value={botActive} sub={`${bot.length} totales`} accent="green" onClick={() => onJump("bot")} />
        <Kpi label="Ingresos del bot" value={`€${botRevenue.toFixed(2)}`} sub="recurrente" accent="gold" onClick={() => onJump("bot")} />
        <Kpi label="Ingresos libros" value={`€${bookRevenue.toFixed(2)}`} sub={`${books.length} ventas`} accent="gold" onClick={() => onJump("books")} />
      </div>

      <div className="adm-row">
        <div className="adm-card adm-card--big">
          <div className="adm-card__head">
            <div className="eyebrow">— Crecimiento de waitlist · 14 días</div>
          </div>
          <Sparkline data={buildDaily(waitlist, 14)} />
        </div>
        <div className="adm-card">
          <div className="adm-card__head">
            <div className="eyebrow">— Actividad reciente</div>
          </div>
          {activity.length === 0 ? (
            <p className="text-muted">Sin actividad todavía.</p>
          ) : (
            <ul className="adm-activity">
              {activity.map((a, i) => (
                <li key={i}>
                  <span className={`adm-dot adm-dot--${a.type}`}></span>
                  <span className="mono adm-activity__type">{a.type}</span>
                  <span className="adm-activity__lbl">{a.label}</span>
                  <span className="mono text-dim adm-activity__t">{relTime(a.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, delta, sub, accent, onClick }) {
  return (
    <button className={`kpi kpi--${accent}`} onClick={onClick}>
      <div className="eyebrow">— {label}</div>
      <div className="kpi__value mono num-tab">{value}</div>
      <div className="kpi__sub mono">{delta || sub}</div>
    </button>
  );
}

function buildDaily(rows, days) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - i);
    const next = new Date(d); next.setDate(d.getDate() + 1);
    const c = rows.filter((r) => { const t = new Date(r.created_at); return t >= d && t < next; }).length;
    out.push({ d, c });
  }
  return out;
}
function Sparkline({ data }) {
  const max = Math.max(1, ...data.map((p) => p.c));
  const w = 600, h = 160;
  const stepX = w / (data.length - 1 || 1);
  const path = data.map((p, i) => `${i === 0 ? "M" : "L"} ${i * stepX} ${h - (p.c / max) * (h - 24) - 12}`).join(" ");
  return (
    <svg className="sparkline" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="spk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0,0.5,1].map((p) => <line key={p} x1="0" x2={w} y1={p*h} y2={p*h} stroke="var(--border)" />)}
      <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill="url(#spk)" />
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((p, i) => (
        <g key={i}>
          <circle cx={i * stepX} cy={h - (p.c / max) * (h - 24) - 12} r="3" fill="var(--accent)" />
          <text x={i * stepX} y={h - 2} fill="var(--fg-dim)" fontSize="9" textAnchor="middle" fontFamily="var(--font-mono)">
            {p.d.getDate()}
          </text>
        </g>
      ))}
    </svg>
  );
}

function relTime(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return "ahora";
  if (diff < 3600) return Math.floor(diff/60) + "m";
  if (diff < 86400) return Math.floor(diff/3600) + "h";
  return Math.floor(diff/86400) + "d";
}

/* ===== Helpers de fecha ===== */
function daysFromNow(dateIso) {
  if (!dateIso) return null;
  const ms = new Date(dateIso) - Date.now();
  return Math.floor(ms / 86400000);
}
function fmtDate(dateIso) {
  if (!dateIso) return "—";
  return new Date(dateIso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateInput(dateIso) {
  // YYYY-MM-DD para <input type="date">
  if (!dateIso) return "";
  const d = new Date(dateIso);
  return d.toISOString().slice(0, 10);
}
function ExpiresPill({ expiresAt, status }) {
  if (status === "cancelled") return <span className="exp-pill exp-pill--off">Cancelada</span>;
  if (status === "banned") return <span className="exp-pill exp-pill--err">Baneada</span>;
  if (!expiresAt) return <span className="exp-pill exp-pill--off">Sin fecha</span>;
  const d = daysFromNow(expiresAt);
  if (d < 0) return <span className="exp-pill exp-pill--err">Vencida hace {-d}d</span>;
  if (d === 0) return <span className="exp-pill exp-pill--warn">Vence hoy</span>;
  if (d <= 7)  return <span className="exp-pill exp-pill--warn">{d}d</span>;
  return <span className="exp-pill exp-pill--ok">{d}d</span>;
}

/* ===== Modal genérico ===== */
function AdminModal({ title, subtitle, onClose, children, footer, wide }) {
  return (
    <div className="adm-modal-bd" onClick={onClose}>
      <div className={`adm-modal-card ${wide ? "adm-modal-card--wide" : ""}`} onClick={(e) => e.stopPropagation()}>
        <button className="adm-modal-close" onClick={onClose}>✕</button>
        <div className="eyebrow">— Stako · admin</div>
        <h2 className="display" style={{ fontSize: 26, margin: "8px 0 4px" }}>{title}</h2>
        {subtitle && <p className="text-muted" style={{ marginBottom: 22, fontSize: 14 }}>{subtitle}</p>}
        <div>{children}</div>
        {footer && <div className="adm-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

/* ===== Modal: Convertir waitlist en cliente / Crear suscripción ===== */
function ConvertModal({ row, onClose, onCreated }) {
  // row = entrada de waitlist (puede ser null si es nueva suscripción manual)
  const [email, setEmail]   = useState(row?.email || "");
  const [amount, setAmount] = useState("39.00");
  const [months, setMonths] = useState(1);
  const [pmethod, setPmethod] = useState("Bizum");
  const [notes, setNotes]   = useState("");
  const [busy, setBusy]     = useState(false);
  const [err, setErr]       = useState("");
  const [result, setResult] = useState(null); // { code, expires_at, purchase_id }

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    const r = await window.StakoSupabase.adminCreateSubscription({
      email: email.trim(),
      amount_eur: Number(amount) || 0,
      payment_method: pmethod,
      months: Number(months),
      notes: notes.trim() || null,
      waitlist_id: row?.id || null,
    });
    setBusy(false);
    if (r.ok) { setResult(r); onCreated && onCreated(); }
    else setErr(r.message || "Error");
  };
  const copy = async (txt) => { try { await navigator.clipboard.writeText(txt); } catch (_) {} };
  const mailto = () => {
    if (!result) return;
    const subj = encodeURIComponent("Tu acceso al Bot Stako");
    const body = encodeURIComponent(
`Hola,

Aquí tienes tu código de activación para el bot de trading de Stako:

  ${result.code}

Pasos:
1. Abre @StakoTradingBot en Telegram (https://t.me/StakoTradingBot)
2. Envía: /activar ${result.code}
3. Sigue las instrucciones para conectar tu cuenta de Binance

Tu suscripción es válida hasta el ${fmtDate(result.expires_at)}.

Cualquier duda, respóndeme a este email.

— Stako`
    );
    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${subj}&body=${body}`;
  };

  if (result) {
    return (
      <AdminModal
        title="🎉 Suscripción creada"
        subtitle={`Cliente: ${email} · Vence el ${fmtDate(result.expires_at)}`}
        onClose={onClose}
      >
        <div className="adm-code-box">
          <div className="text-muted" style={{ fontSize: 13, marginBottom: 10 }}>Código de activación (envíaselo al cliente):</div>
          <div className="adm-code">
            <span className="mono">{result.code}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => copy(result.code)}>Copiar</button>
          </div>
        </div>
        <div className="adm-modal-footer" style={{ marginTop: 24 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cerrar</button>
          <button type="button" className="btn btn-primary" onClick={mailto}>Mandar email al cliente</button>
        </div>
      </AdminModal>
    );
  }

  return (
    <AdminModal
      title={row ? "Convertir en cliente" : "Nueva suscripción manual"}
      subtitle={row ? `Marcando ${row.email} como pagado y generando código.` : "Crea una suscripción para alguien que no estaba en waitlist."}
      onClose={onClose}
    >
      <form onSubmit={submit} className="adm-form">
        <label className="adm-form__label">
          <span>Email del cliente</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy || !!row} />
        </label>
        <div className="adm-form__row">
          <label className="adm-form__label" style={{ flex: 1 }}>
            <span>Importe (€)</span>
            <input type="number" step="0.01" min="0" required value={amount} onChange={(e) => setAmount(e.target.value)} disabled={busy} />
          </label>
          <label className="adm-form__label" style={{ flex: 1 }}>
            <span>Duración (meses)</span>
            <select value={months} onChange={(e) => setMonths(Number(e.target.value))} disabled={busy}>
              <option value="1">1 mes</option>
              <option value="3">3 meses</option>
              <option value="6">6 meses</option>
              <option value="12">12 meses</option>
            </select>
          </label>
        </div>
        <label className="adm-form__label">
          <span>Método de pago</span>
          <select value={pmethod} onChange={(e) => setPmethod(e.target.value)} disabled={busy}>
            <option>Bizum</option>
            <option>Transferencia</option>
            <option>PayPal</option>
            <option>Efectivo</option>
            <option>Otro</option>
          </select>
        </label>
        <label className="adm-form__label">
          <span>Notas internas (opcional)</span>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={busy}
                    placeholder="Ej: amigo personal, periodo de prueba, etc." />
        </label>
        {err && <div className="modal-err">{err}</div>}
        <div className="adm-modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={busy || !email}>
            {busy ? "Creando…" : "Crear suscripción y código"}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}

/* ===== Modal: Renovar suscripción ===== */
function RenewModal({ row, onClose, onDone }) {
  const [months, setMonths] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    const r = await window.StakoSupabase.adminRenewSubscription(row.id, Number(months));
    setBusy(false);
    if (r.ok) { onDone(); onClose(); }
    else setErr(r.message || "Error");
  };
  const baseDate = row.expires_at && new Date(row.expires_at) > new Date() ? row.expires_at : new Date().toISOString();
  const newDate = new Date(baseDate);
  newDate.setMonth(newDate.getMonth() + Number(months));
  return (
    <AdminModal
      title="Renovar suscripción"
      subtitle={`${row.user_email} · vence ${fmtDate(row.expires_at)}`}
      onClose={onClose}
    >
      <form onSubmit={submit} className="adm-form">
        <label className="adm-form__label">
          <span>Añadir tiempo</span>
          <select value={months} onChange={(e) => setMonths(Number(e.target.value))} disabled={busy} autoFocus>
            <option value="1">+1 mes</option>
            <option value="3">+3 meses</option>
            <option value="6">+6 meses</option>
            <option value="12">+12 meses</option>
          </select>
        </label>
        <div className="adm-info-box">
          <strong>Nueva fecha de renovación:</strong> {fmtDate(newDate)}
          {daysFromNow(row.expires_at) < 0 && (
            <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>
              (Estaba vencida — la renovación se cuenta desde hoy)
            </div>
          )}
        </div>
        {err && <div className="modal-err">{err}</div>}
        <div className="adm-modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Renovando…" : "Renovar"}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}

/* ===== Modal: Editar fecha de expiración manualmente ===== */
function EditDateModal({ row, onClose, onDone }) {
  const [date, setDate] = useState(fmtDateInput(row.expires_at));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    const iso = new Date(date + "T23:59:59").toISOString();
    const r = await window.StakoSupabase.adminSetExpiresAt(row.id, iso);
    setBusy(false);
    if (r.ok) { onDone(); onClose(); }
    else setErr(r.message || "Error");
  };
  return (
    <AdminModal title="Editar fecha de expiración" subtitle={row.user_email} onClose={onClose}>
      <form onSubmit={submit} className="adm-form">
        <label className="adm-form__label">
          <span>Vence el</span>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} disabled={busy} autoFocus />
        </label>
        {err && <div className="modal-err">{err}</div>}
        <div className="adm-modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Guardando…" : "Guardar fecha"}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}

/* ===== Waitlist Table ===== */
function WaitlistTable({ rows, onChange }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("pending"); // pending | converted | all
  const [convertRow, setConvertRow] = useState(null);

  const filtered = useMemo(() => rows.filter((r) => {
    if (filter === "pending"   && r.converted_at) return false;
    if (filter === "converted" && !r.converted_at) return false;
    if (q && !(r.email || "").toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [rows, q, filter]);

  const pendingCount = rows.filter((r) => !r.converted_at).length;
  const convertedCount = rows.length - pendingCount;

  const exportCSV = () => {
    const csv = ["email,lang,source,created_at,converted_at", ...rows.map((r) => `${r.email},${r.lang||""},${r.source||""},${r.created_at},${r.converted_at||""}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "waitlist.csv"; a.click();
  };
  const del = async (id, email) => {
    if (!confirm(`¿Eliminar ${email} de la lista?`)) return;
    await window.StakoSupabase.adminDeleteWaitlist(id);
    onChange();
  };
  return (
    <div className="adm-section">
      <header className="adm-section__head">
        <div>
          <div className="eyebrow">— Lista de espera</div>
          <h2 className="display adm-h2">{pendingCount} pendientes <span className="text-dim" style={{ fontSize: 14, fontWeight: 400 }}>· {convertedCount} convertidos · {rows.length} totales</span></h2>
        </div>
        <div className="adm-section__actions">
          <div className="adm-segmented">
            <button className={filter === "pending" ? "is-active" : ""} onClick={() => setFilter("pending")}>Pendientes</button>
            <button className={filter === "converted" ? "is-active" : ""} onClick={() => setFilter("converted")}>Convertidos</button>
            <button className={filter === "all" ? "is-active" : ""} onClick={() => setFilter("all")}>Todos</button>
          </div>
          <input className="input" placeholder="Buscar email…" value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 220 }} />
          <button className="btn btn-ghost btn-sm" onClick={exportCSV}>Exportar CSV</button>
        </div>
      </header>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr><th>Email</th><th>Idioma</th><th>Fuente</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="adm-empty">Sin resultados.</td></tr>
            ) : filtered.map((r) => (
              <tr key={r.id}>
                <td className="adm-mono">{r.email}</td>
                <td><span className="tag">{r.lang || "—"}</span></td>
                <td className="text-muted mono">{r.source || "—"}</td>
                <td>
                  {r.converted_at ? (
                    <span className="exp-pill exp-pill--ok" title={`Convertido el ${fmtDate(r.converted_at)}`}>
                      ✓ Cliente
                    </span>
                  ) : (
                    <span className="exp-pill exp-pill--warn">Pendiente</span>
                  )}
                </td>
                <td className="text-muted mono num-tab">{new Date(r.created_at).toLocaleDateString("es-ES")}</td>
                <td>
                  <div className="adm-actions">
                    {!r.converted_at && (
                      <button className="adm-link adm-link--primary" onClick={() => setConvertRow(r)}>
                        💳 Convertir
                      </button>
                    )}
                    <button className="adm-link-danger" onClick={() => del(r.id, r.email)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {convertRow && (
        <ConvertModal
          row={convertRow}
          onClose={() => setConvertRow(null)}
          onCreated={() => onChange()}
        />
      )}
    </div>
  );
}

/* ===== Bot Purchases Table ===== */
function BotTable({ rows, codes = [], onChange }) {
  const [generating, setGenerating] = useState(null); // purchase_id en proceso
  const [shownCode, setShownCode]   = useState(null);   // { purchaseId, code }
  const [filter, setFilter]         = useState("active"); // active | expiring | expired | cancelled | all
  const [q, setQ]                   = useState("");
  const [renewRow, setRenewRow]     = useState(null);
  const [editDateRow, setEditDateRow] = useState(null);
  const [createNew, setCreateNew]   = useState(false);

  const setStatus = async (id, status) => {
    await window.StakoSupabase.adminUpdateBotPurchase(id, { status });
    onChange();
  };

  const codesByPurchase = useMemo(() => {
    const m = {};
    for (const c of codes) (m[c.purchase_id] ||= []).push(c);
    return m;
  }, [codes]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const sorted = [...rows].sort((a, b) => {
      // Activas con expires_at asc primero (las que vencen antes)
      const aActive = a.status === "active";
      const bActive = b.status === "active";
      if (aActive !== bActive) return aActive ? -1 : 1;
      const ae = a.expires_at ? new Date(a.expires_at).getTime() : Infinity;
      const be = b.expires_at ? new Date(b.expires_at).getTime() : Infinity;
      return ae - be;
    });
    return sorted.filter((r) => {
      if (q && !(r.user_email || "").toLowerCase().includes(q.toLowerCase())) return false;
      const exp = r.expires_at ? new Date(r.expires_at).getTime() : null;
      const daysLeft = exp != null ? Math.floor((exp - now) / 86400000) : null;
      if (filter === "active")     return r.status === "active" && (daysLeft == null || daysLeft >= 0);
      if (filter === "expiring")   return r.status === "active" && daysLeft != null && daysLeft >= 0 && daysLeft <= 7;
      if (filter === "expired")    return r.status === "active" && daysLeft != null && daysLeft < 0;
      if (filter === "cancelled")  return r.status === "cancelled" || r.status === "banned";
      return true; // all
    });
  }, [rows, q, filter]);

  const counts = useMemo(() => {
    const now = Date.now();
    let active = 0, expiring = 0, expired = 0, cancelled = 0;
    for (const r of rows) {
      const exp = r.expires_at ? new Date(r.expires_at).getTime() : null;
      const daysLeft = exp != null ? Math.floor((exp - now) / 86400000) : null;
      if (r.status === "active") {
        if (daysLeft == null || daysLeft >= 0) active++;
        if (daysLeft != null && daysLeft >= 0 && daysLeft <= 7) expiring++;
        if (daysLeft != null && daysLeft < 0) expired++;
      } else if (r.status === "cancelled" || r.status === "banned") cancelled++;
    }
    return { active, expiring, expired, cancelled };
  }, [rows]);

  const generateCode = async (purchaseId) => {
    setGenerating(purchaseId);
    const r = await window.StakoSupabase.adminGenActivationCode(purchaseId);
    setGenerating(null);
    if (r.ok) { setShownCode({ purchaseId, code: r.code }); onChange(); }
    else alert("Error: " + r.message);
  };
  const copyCode = async (code) => { try { await navigator.clipboard.writeText(code); } catch (_) {} };
  const sendEmail = (row, code) => {
    const subj = encodeURIComponent("Tu acceso al Bot Stako");
    const body = encodeURIComponent(
`Hola,

Aquí tienes tu código de activación para el bot de trading de Stako:

  ${code}

Pasos:
1. Abre @StakoTradingBot en Telegram (https://t.me/StakoTradingBot)
2. Envía: /activar ${code}
3. Sigue las instrucciones para conectar tu cuenta de Binance

Tu suscripción es válida hasta el ${fmtDate(row.expires_at)}.

— Stako`);
    window.location.href = `mailto:${encodeURIComponent(row.user_email)}?subject=${subj}&body=${body}`;
  };

  return (
    <div className="adm-section">
      <header className="adm-section__head">
        <div>
          <div className="eyebrow">— Bot de trading</div>
          <h2 className="display adm-h2">{counts.active} suscripciones activas</h2>
          <p className="text-muted" style={{ marginTop: 8 }}>
            {counts.expiring > 0 && <span style={{ color: "var(--gold)" }}>⚠ {counts.expiring} vencen en menos de 7 días · </span>}
            {counts.expired > 0  && <span style={{ color: "var(--danger)" }}>{counts.expired} vencidas · </span>}
            {counts.cancelled} canceladas/baneadas.
          </p>
        </div>
        <div className="adm-section__actions">
          <button className="btn btn-primary btn-sm" onClick={() => setCreateNew(true)}>+ Nueva suscripción</button>
        </div>
      </header>

      <div className="adm-section__actions" style={{ marginTop: 8, marginBottom: 16, justifyContent: "space-between" }}>
        <div className="adm-segmented">
          <button className={filter === "active" ? "is-active" : ""} onClick={() => setFilter("active")}>Activas · {counts.active}</button>
          <button className={filter === "expiring" ? "is-active" : ""} onClick={() => setFilter("expiring")}>Vencen pronto · {counts.expiring}</button>
          <button className={filter === "expired" ? "is-active" : ""} onClick={() => setFilter("expired")}>Vencidas · {counts.expired}</button>
          <button className={filter === "cancelled" ? "is-active" : ""} onClick={() => setFilter("cancelled")}>Canceladas · {counts.cancelled}</button>
          <button className={filter === "all" ? "is-active" : ""} onClick={() => setFilter("all")}>Todas · {rows.length}</button>
        </div>
        <input className="input" placeholder="Buscar email…" value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 220 }} />
      </div>

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Importe</th>
              <th>Vence / Restante</th>
              <th>Pago</th>
              <th>Estado</th>
              <th>Telegram / Código</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="adm-empty">
                {rows.length === 0 ? (
                  <>Aún no hay suscripciones.<br/>
                    <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setCreateNew(true)}>Crear la primera</button>
                  </>
                ) : "Sin resultados con este filtro."}
              </td></tr>
            ) : filtered.map((r) => {
              const cs = codesByPurchase[r.id] || [];
              const unused = cs.find((c) => !c.used_at);
              const used = cs.find((c) => c.used_at);
              const isShown = shownCode?.purchaseId === r.id;
              const codeToShow = isShown ? shownCode.code : (unused?.code || null);
              return (
                <tr key={r.id}>
                  <td className="adm-mono">
                    {r.user_email}
                    {r.notes && (
                      <div className="text-dim" style={{ fontSize: 11, marginTop: 3 }} title={r.notes}>
                        {r.notes.length > 40 ? r.notes.slice(0,40) + "…" : r.notes}
                      </div>
                    )}
                  </td>
                  <td className="mono num-tab">€{Number(r.amount_eur || 0).toFixed(2)}</td>
                  <td>
                    <div className="mono num-tab" style={{ fontSize: 13 }}>{fmtDate(r.expires_at)}</div>
                    <div style={{ marginTop: 4 }}>
                      <ExpiresPill expiresAt={r.expires_at} status={r.status} />
                      {r.cancel_at_period_end && r.status === "active" && (
                        <span className="exp-pill exp-pill--warn" style={{ marginLeft: 6 }}>cancelada al final</span>
                      )}
                    </div>
                  </td>
                  <td className="text-muted mono" style={{ fontSize: 12 }}>{r.payment_method || "—"}</td>
                  <td><StatusBadge s={r.status} /></td>
                  <td className="mono" style={{ fontSize: 12 }}>
                    {r.linked_chat_id ? (
                      <span style={{ color: "var(--accent)" }}>✓ chat_id <span className="text-dim">{r.linked_chat_id}</span></span>
                    ) : codeToShow ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ background: "var(--bg-elev)", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>{codeToShow}</span>
                        <button type="button" className="adm-link" onClick={() => copyCode(codeToShow)} title="Copiar">⧉</button>
                        <button type="button" className="adm-link" onClick={() => sendEmail(r, codeToShow)} title="Mandar email">✉</button>
                      </div>
                    ) : used ? (
                      <span className="text-muted">canjeado · {new Date(used.used_at).toLocaleDateString("es-ES")}</span>
                    ) : (
                      <span className="text-dim">sin código</span>
                    )}
                  </td>
                  <td>
                    <div className="adm-actions">
                      {r.status === "active" && !codeToShow && !r.linked_chat_id && (
                        <button className="adm-link" disabled={generating === r.id} onClick={() => generateCode(r.id)}>
                          {generating === r.id ? "..." : "🔑 Código"}
                        </button>
                      )}
                      {(r.status === "active" || r.status === "cancelled") && (
                        <button className="adm-link adm-link--primary" onClick={() => setRenewRow(r)}>
                          🔄 Renovar
                        </button>
                      )}
                      <button className="adm-link" onClick={() => setEditDateRow(r)}>📅 Fecha</button>
                      {r.status === "active" && <button className="adm-link" onClick={() => setStatus(r.id, "cancelled")}>Cancelar</button>}
                      {r.status === "cancelled" && <button className="adm-link" onClick={() => setStatus(r.id, "active")}>Reactivar</button>}
                      {r.status !== "banned" && <button className="adm-link-danger" onClick={() => { if (confirm("¿Banear?")) setStatus(r.id, "banned"); }}>Banear</button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {createNew  && <ConvertModal  row={null}     onClose={() => setCreateNew(false)} onCreated={() => onChange()} />}
      {renewRow   && <RenewModal    row={renewRow} onClose={() => setRenewRow(null)}   onDone={() => onChange()} />}
      {editDateRow && <EditDateModal row={editDateRow} onClose={() => setEditDateRow(null)} onDone={() => onChange()} />}
    </div>
  );
}

/* ===== Licenses Table ===== */
function LicensesTable({ rows, onChange }) {
  const revoke = async (chatId, reason) => {
    if (!confirm(`¿Seguro que quieres ${reason === "banned" ? "BANEAR" : "cancelar"} esta licencia? El bot dejará de operarle en menos de 60s.`)) return;
    const ok = await window.StakoSupabase.adminRevokeLicense(chatId, reason);
    if (ok) onChange();
    else alert("No se pudo revocar.");
  };

  const active = rows.filter((r) => r.status === "active").length;

  return (
    <div className="adm-section">
      <header className="adm-section__head">
        <div>
          <div className="eyebrow">— Licencias del bot</div>
          <h2 className="display adm-h2">{active} licencias activas <span className="text-dim" style={{ fontSize: 14, fontWeight: 400 }}>· {rows.length} totales</span></h2>
          <p className="text-muted" style={{ marginTop: 8 }}>
            Vinculaciones activas entre compras y cuentas de Telegram. Si revocas, el bot deja de operar a ese cliente en máximo 60s.
          </p>
        </div>
      </header>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr><th>Email</th><th>chat_id</th><th>Estado</th><th>Activada</th><th>Caduca</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="adm-empty">
                Sin licencias activadas todavía.<br/>
                <span className="text-dim mono" style={{ fontSize: 11 }}>(aparecerán cuando los clientes canjeen sus códigos)</span>
              </td></tr>
            ) : rows.map((r) => (
              <tr key={r.id}>
                <td className="adm-mono">{r.user_email}</td>
                <td className="mono text-muted">{r.chat_id}</td>
                <td><StatusBadge s={r.status} /></td>
                <td className="text-muted mono num-tab">{new Date(r.activated_at).toLocaleDateString("es-ES")}</td>
                <td className="text-muted mono num-tab">{r.expires_at ? new Date(r.expires_at).toLocaleDateString("es-ES") : "—"}</td>
                <td>
                  <div className="adm-actions">
                    {r.status === "active" && <button className="adm-link" onClick={() => revoke(r.chat_id, "cancelled")}>Cancelar</button>}
                    {r.status !== "banned" && <button className="adm-link-danger" onClick={() => revoke(r.chat_id, "banned")}>Banear</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ s }) {
  const map = {
    active: { c: "var(--accent)", l: "Activo" },
    pending: { c: "var(--gold)", l: "Pendiente" },
    cancelled: { c: "var(--fg-muted)", l: "Cancelado" },
    banned: { c: "var(--danger)", l: "Baneado" },
  };
  const m = map[s] || { c: "var(--fg-muted)", l: s || "—" };
  return <span className="adm-status" style={{ color: m.c, borderColor: `color-mix(in oklch, ${m.c} 35%, transparent)` }}>● {m.l}</span>;
}

/* ===== Book Purchases Table ===== */
function BookTable({ rows }) {
  const total = rows.reduce((s, r) => s + Number(r.amount_eur || 0), 0);
  return (
    <div className="adm-section">
      <header className="adm-section__head">
        <div>
          <div className="eyebrow">— Libros</div>
          <h2 className="display adm-h2">{rows.length} ventas · €{total.toFixed(2)}</h2>
          <p className="text-muted" style={{ marginTop: 8 }}>Histórico de eBooks vendidos.</p>
        </div>
      </header>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr><th>Email</th><th>Libro</th><th>Importe</th><th>Fecha</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={4} className="adm-empty">
                Aún no hay ventas.<br/>
                <span className="text-dim mono" style={{ fontSize: 11 }}>(la tabla está lista para cuando publiquéis libros)</span>
              </td></tr>
            ) : rows.map((r) => (
              <tr key={r.id}>
                <td className="adm-mono">{r.user_email}</td>
                <td>{r.book_title}</td>
                <td className="mono num-tab">€{Number(r.amount_eur || 0).toFixed(2)}</td>
                <td className="text-muted mono num-tab">{new Date(r.created_at).toLocaleDateString("es-ES")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
   BLOG MANAGER (lista + editor)
   ============================================================ */
function BlogManager({ posts, categories, onChange }) {
  const [editing, setEditing] = useState(null); // null=lista, 'new'=crear, {post}=editar
  const [statusFilter, setStatusFilter] = useState("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (q) {
        const needle = q.toLowerCase();
        if (!(p.title || "").toLowerCase().includes(needle) &&
            !(p.slug || "").toLowerCase().includes(needle)) return false;
      }
      return true;
    });
  }, [posts, statusFilter, q]);

  if (editing) {
    return (
      <BlogEditor
        post={editing === "new" ? null : editing}
        categories={categories}
        onClose={() => { setEditing(null); onChange(); }}
      />
    );
  }

  return (
    <div className="adm-section">
      <header className="adm-section__head">
        <div>
          <div className="eyebrow">— Blog</div>
          <h2 className="display adm-h2">{posts.length} artículos</h2>
          <p className="text-muted" style={{ marginTop: 8 }}>
            Borradores y publicados. Edita o crea desde aquí — los publicados aparecen en{" "}
            <code>stakocapital.com/blog</code>.
          </p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={() => setEditing("new")}>
            + Nuevo artículo
          </button>
        </div>
      </header>

      <div className="adm-toolbar" style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <select
          className="input mono"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: "auto", minWidth: 160 }}
        >
          <option value="all">Todos · {posts.length}</option>
          <option value="published">Publicados · {posts.filter((p) => p.status === "published").length}</option>
          <option value="draft">Borradores · {posts.filter((p) => p.status === "draft").length}</option>
        </select>
        <input
          type="search"
          className="input"
          placeholder="Buscar por título o slug…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
      </div>

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th>Actualizado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="adm-empty">
                {posts.length === 0 ? (
                  <>
                    Aún no hay artículos.<br/>
                    <span className="text-dim mono" style={{ fontSize: 11 }}>
                      Crea el primero con "+ Nuevo artículo"
                    </span>
                  </>
                ) : (
                  <>Ningún artículo coincide con el filtro.</>
                )}
              </td></tr>
            ) : filtered.map((p) => (
              <BlogRow key={p.id} post={p} categories={categories}
                onEdit={() => setEditing(p)} onChange={onChange} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BlogRow({ post, categories, onEdit, onChange }) {
  const [busy, setBusy] = useState(false);
  const cat = categories.find((c) => c.slug === post.category_slug);

  const togglePublish = async () => {
    setBusy(true);
    if (post.status === "published") await window.StakoSupabase.adminBlogUnpublish(post.id);
    else await window.StakoSupabase.adminBlogPublish(post.id);
    setBusy(false); onChange();
  };

  const remove = async () => {
    if (!confirm(`¿Eliminar definitivamente "${post.title}"?\nEsta acción no se puede deshacer.`)) return;
    setBusy(true);
    await window.StakoSupabase.adminBlogDeletePost(post.id);
    setBusy(false); onChange();
  };

  return (
    <tr>
      <td>
        <div style={{ fontWeight: 500 }}>{post.title || <span className="text-dim">(sin título)</span>}</div>
        <div className="mono text-dim" style={{ fontSize: 11, marginTop: 3 }}>/{post.slug}</div>
      </td>
      <td className="text-muted">{cat ? cat.name : <span className="text-dim">—</span>}</td>
      <td>
        <BlogStatusBadge s={post.status} />
      </td>
      <td className="text-muted mono num-tab">
        {new Date(post.updated_at).toLocaleDateString("es-ES")}
      </td>
      <td>
        <div className="adm-actions">
          <button className="adm-link" onClick={onEdit} disabled={busy}>Editar</button>
          <button className="adm-link" onClick={togglePublish} disabled={busy}>
            {post.status === "published" ? "Despublicar" : "Publicar"}
          </button>
          <button className="adm-link-danger" onClick={remove} disabled={busy}>Eliminar</button>
        </div>
      </td>
    </tr>
  );
}

function BlogStatusBadge({ s }) {
  const map = {
    published: { c: "var(--accent)", l: "Publicado" },
    draft:     { c: "var(--gold)",   l: "Borrador" },
  };
  const m = map[s] || { c: "var(--fg-muted)", l: s || "—" };
  return (
    <span className="adm-status" style={{
      color: m.c,
      borderColor: `color-mix(in oklch, ${m.c} 35%, transparent)`,
    }}>● {m.l}</span>
  );
}

/* === Editor === */
function BlogEditor({ post, categories, onClose }) {
  const isNew = !post;
  const [form, setForm] = useState(() => ({
    title:           post?.title           || "",
    slug:            post?.slug            || "",
    subtitle:        post?.subtitle        || "",
    excerpt:         post?.excerpt         || "",
    body_md:         post?.body_md         || "",
    category_slug:   post?.category_slug   || "",
    tags:            (post?.tags || []).join(", "),
    cover_image_url: post?.cover_image_url || "",
    author:          post?.author          || "Equipo Stako",
    status:          post?.status          || "draft",
  }));
  const [showPreview, setShowPreview] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'ok'|'err', text }
  const [savedId, setSavedId] = useState(post?.id || null);

  const upd = (patch) => setForm((f) => ({ ...f, ...patch }));

  // Auto-slug en creación si el slug está vacío
  const autoSlug = (s) =>
    (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);

  const onTitleChange = (v) => {
    if (isNew && !savedId && (form.slug === "" || form.slug === autoSlug(form.title))) {
      upd({ title: v, slug: autoSlug(v) });
    } else {
      upd({ title: v });
    }
  };

  const buildPayload = () => ({
    title: form.title.trim(),
    slug: (form.slug.trim() || autoSlug(form.title)),
    subtitle: form.subtitle.trim() || null,
    excerpt: form.excerpt.trim() || null,
    body_md: form.body_md,
    category_slug: form.category_slug || null,
    tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    cover_image_url: form.cover_image_url.trim() || null,
    author: form.author.trim() || "Equipo Stako",
    status: form.status,
  });

  const validate = () => {
    if (!form.title.trim()) return "Falta el título.";
    if (!(form.slug.trim() || autoSlug(form.title))) return "Falta el slug.";
    return null;
  };

  const save = async ({ publish = null } = {}) => {
    const err = validate();
    if (err) { setMsg({ type: "err", text: err }); return; }
    setBusy(true); setMsg(null);
    const payload = buildPayload();
    if (publish === true)  payload.status = "published";
    if (publish === false) payload.status = "draft";

    let res;
    if (savedId) {
      res = await window.StakoSupabase.adminBlogUpdatePost(savedId, payload);
    } else {
      res = await window.StakoSupabase.adminBlogCreatePost(payload);
    }
    setBusy(false);
    if (!res.ok) {
      setMsg({ type: "err", text: "No se pudo guardar: " + (res.message || "error desconocido") });
      return;
    }
    setSavedId(res.post.id);
    upd({ status: res.post.status, slug: res.post.slug });
    setMsg({
      type: "ok",
      text: res.post.status === "published"
        ? "Publicado. Ya está visible en /blog."
        : "Guardado como borrador.",
    });
  };

  const remove = async () => {
    if (!savedId) { onClose(); return; }
    if (!confirm(`¿Eliminar definitivamente "${form.title}"?\nEsta acción no se puede deshacer.`)) return;
    setBusy(true);
    await window.StakoSupabase.adminBlogDeletePost(savedId);
    setBusy(false);
    onClose();
  };

  // Preview HTML
  const previewHtml = useMemo(() => {
    if (!form.body_md) return "";
    try {
      const raw = window.marked ? window.marked.parse(form.body_md, { breaks: true, gfm: true }) : "";
      return window.DOMPurify ? window.DOMPurify.sanitize(raw) : raw;
    } catch (_) { return ""; }
  }, [form.body_md]);

  const readingTime = Math.max(1, Math.ceil((form.body_md || "").length / 1500));
  const isPublished = form.status === "published";

  return (
    <div className="adm-section blog-editor">
      <header className="adm-section__head" style={{ alignItems: "center" }}>
        <div>
          <button className="adm-link" onClick={onClose} style={{ marginBottom: 10 }}>← Volver al listado</button>
          <div className="eyebrow">— {isNew && !savedId ? "Nuevo artículo" : "Editar artículo"}</div>
          <h2 className="display adm-h2" style={{ marginTop: 6 }}>
            {form.title || <span className="text-dim">(Sin título)</span>}
          </h2>
          <div className="mono text-dim" style={{ fontSize: 12, marginTop: 4 }}>
            <BlogStatusBadge s={form.status} /> &nbsp;·&nbsp;
            {readingTime} min de lectura &nbsp;·&nbsp;
            {form.body_md.length} caracteres
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowPreview((v) => !v)}>
            {showPreview ? "Ocultar preview" : "Mostrar preview"}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => save({ publish: false })} disabled={busy}>
            Guardar borrador
          </button>
          {isPublished ? (
            <button className="btn btn-ghost btn-sm" onClick={() => save({ publish: false })} disabled={busy}>
              Despublicar
            </button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => save({ publish: true })} disabled={busy}>
              {busy ? "Publicando…" : "Publicar"}
            </button>
          )}
          {savedId && (
            <button className="btn btn-ghost btn-sm" onClick={remove} disabled={busy}
              style={{ color: "var(--danger)" }}>Eliminar</button>
          )}
        </div>
      </header>

      {msg && (
        <div className={"blog-editor__msg " + (msg.type === "ok" ? "is-ok" : "is-err")}>
          {msg.text}
          {msg.type === "ok" && isPublished && form.slug && (
            <> &nbsp;·&nbsp;
              <a href={"/blog?p=" + encodeURIComponent(form.slug)} target="_blank" rel="noreferrer" className="adm-link">
                Ver en el blog ↗
              </a>
            </>
          )}
        </div>
      )}

      <div className={"blog-editor__grid " + (showPreview ? "is-split" : "is-single")}>
        {/* === COLUMNA IZQUIERDA: FORMULARIO === */}
        <div className="blog-editor__form">
          <Field label="Título">
            <input
              className="input"
              value={form.title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Ej: La Fed sube tipos: qué cambia para tu cartera"
            />
          </Field>

          <div className="blog-editor__row">
            <Field label="Slug (URL)">
              <input
                className="input mono"
                value={form.slug}
                onChange={(e) => upd({ slug: e.target.value })}
                placeholder="la-fed-sube-tipos"
              />
              <span className="text-dim mono" style={{ fontSize: 11 }}>
                stakocapital.com/blog/<strong>{form.slug || "(slug)"}</strong>
              </span>
            </Field>

            <Field label="Categoría">
              <select
                className="input mono"
                value={form.category_slug}
                onChange={(e) => upd({ category_slug: e.target.value })}
              >
                <option value="">— Sin categoría —</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Subtítulo (opcional)">
            <input
              className="input"
              value={form.subtitle}
              onChange={(e) => upd({ subtitle: e.target.value })}
              placeholder="Subtítulo o gancho que se ve bajo el título"
            />
          </Field>

          <Field label="Resumen (excerpt — sale en la lista del blog)">
            <textarea
              className="input"
              rows={2}
              value={form.excerpt}
              onChange={(e) => upd({ excerpt: e.target.value })}
              placeholder="2-3 frases de resumen para la portada del blog y el SEO."
            />
          </Field>

          <div className="blog-editor__row">
            <Field label="Tags (separados por comas)">
              <input
                className="input mono"
                value={form.tags}
                onChange={(e) => upd({ tags: e.target.value })}
                placeholder="fed, tipos-de-interes, macro"
              />
            </Field>
            <Field label="Imagen de portada (URL)">
              <input
                className="input mono"
                value={form.cover_image_url}
                onChange={(e) => upd({ cover_image_url: e.target.value })}
                placeholder="https://… (opcional)"
              />
            </Field>
          </div>

          <Field label="Autor">
            <input
              className="input"
              value={form.author}
              onChange={(e) => upd({ author: e.target.value })}
              placeholder="Equipo Stako"
            />
          </Field>

          <Field label="Cuerpo (Markdown)">
            <textarea
              className="input mono blog-editor__body"
              value={form.body_md}
              onChange={(e) => upd({ body_md: e.target.value })}
              placeholder={"# Título de sección\n\nUn párrafo de introducción.\n\n## Subsección\n\n- Punto uno\n- Punto dos\n\n> Una cita relevante.\n\n**Negrita** y *cursiva*."}
              spellCheck={true}
            />
            <span className="text-dim mono" style={{ fontSize: 11 }}>
              Soporta Markdown: <code>#</code> títulos, <code>**negrita**</code>, <code>*cursiva*</code>,
              <code>[enlace](url)</code>, <code>&gt; cita</code>, listas con <code>-</code>.
            </span>
          </Field>
        </div>

        {/* === COLUMNA DERECHA: PREVIEW === */}
        {showPreview && (
          <aside className="blog-editor__preview">
            <div className="blog-editor__preview-head mono text-dim">— Vista previa</div>
            <article className="blog-article" style={{ padding: 0 }}>
              <div className="blog-article__inner" style={{ maxWidth: "100%" }}>
                {form.category_slug && (
                  <div className="eyebrow blog-article__cat">
                    {categories.find((c) => c.slug === form.category_slug)?.name || form.category_slug}
                  </div>
                )}
                <h1 className="display blog-article__title" style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>
                  {form.title || <span className="text-dim">(Sin título)</span>}
                </h1>
                {form.subtitle && <p className="blog-article__subtitle text-muted">{form.subtitle}</p>}
                <div className="blog-article__meta">
                  <span className="mono">{form.author || "Equipo Stako"}</span>
                  <span className="dot-sep">·</span>
                  <span className="mono">Hoy</span>
                  <span className="dot-sep">·</span>
                  <span className="mono">{readingTime} min</span>
                </div>
                {form.cover_image_url && (
                  <figure className="blog-article__cover">
                    <img src={form.cover_image_url} alt="" />
                  </figure>
                )}
                {previewHtml ? (
                  <div className="blog-article__body" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                ) : (
                  <div className="blog-article__body text-dim">
                    <em>El cuerpo del artículo aparecerá aquí.</em>
                  </div>
                )}
                {form.tags && form.tags.trim() && (
                  <div className="blog-article__tags">
                    {form.tags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                      <span key={t} className="blog-tag mono">#{t}</span>
                    ))}
                  </div>
                )}
                <aside className="blog-disclaimer">
                  <div className="eyebrow">— Aviso</div>
                  <p>
                    Este contenido es <strong>informativo y educativo</strong>. No constituye recomendación
                    de inversión, asesoramiento financiero ni invitación a comprar o vender activos.
                    Consulta con un asesor registrado en la CNMV antes de tomar decisiones financieras.
                    La inversión conlleva riesgo de pérdida del capital invertido.
                  </p>
                </aside>
              </div>
            </article>
          </aside>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="adm-field" style={{ marginBottom: 18 }}>
      <span className="mono">{label}</span>
      {children}
    </label>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<AdminApp />);
