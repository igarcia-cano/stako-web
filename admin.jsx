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
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    const [w, b, k, lic, cod] = await Promise.all([
      window.StakoSupabase.adminListWaitlist(),
      window.StakoSupabase.adminListBotPurchases(),
      window.StakoSupabase.adminListBookPurchases(),
      window.StakoSupabase.adminListLicenses(),
      window.StakoSupabase.adminListActivationCodes(),
    ]);
    setWaitlist(w); setBot(b); setBooks(k);
    setLicenses(lic); setCodes(cod);
    setLoading(false);
  };
  useEffect(() => { reload(); }, []);

  const tabs = [
    { id: "overview", label: "Resumen" },
    { id: "waitlist", label: `Waitlist · ${waitlist.length}` },
    { id: "bot", label: `Bot · ${bot.length}` },
    { id: "licenses", label: `Licencias · ${licenses.filter((l) => l.status === "active").length}` },
    { id: "books", label: `Libros · ${books.length}` },
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

/* ===== Waitlist Table ===== */
function WaitlistTable({ rows, onChange }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => rows.filter((r) => !q || (r.email || "").toLowerCase().includes(q.toLowerCase())), [rows, q]);
  const exportCSV = () => {
    const csv = ["email,lang,source,created_at", ...rows.map((r) => `${r.email},${r.lang||""},${r.source||""},${r.created_at}`)].join("\n");
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
          <h2 className="display adm-h2">{rows.length} emails apuntados</h2>
        </div>
        <div className="adm-section__actions">
          <input className="input" placeholder="Buscar email…" value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 240 }} />
          <button className="btn btn-ghost btn-sm" onClick={exportCSV}>Exportar CSV</button>
        </div>
      </header>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr><th>Email</th><th>Idioma</th><th>Fuente</th><th>Fecha</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="adm-empty">Sin resultados.</td></tr>
            ) : filtered.map((r) => (
              <tr key={r.id}>
                <td className="adm-mono">{r.email}</td>
                <td><span className="tag">{r.lang || "—"}</span></td>
                <td className="text-muted mono">{r.source || "—"}</td>
                <td className="text-muted mono num-tab">{new Date(r.created_at).toLocaleString("es-ES")}</td>
                <td><button className="adm-link-danger" onClick={() => del(r.id, r.email)}>Eliminar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ===== Bot Purchases Table ===== */
function BotTable({ rows, codes = [], onChange }) {
  const [generating, setGenerating] = useState(null); // purchase_id en proceso
  const [shownCode, setShownCode] = useState(null);   // { purchaseId, code }

  const setStatus = async (id, status) => {
    await window.StakoSupabase.adminUpdateBotPurchase(id, { status });
    onChange();
  };

  const codesByPurchase = useMemo(() => {
    const m = {};
    for (const c of codes) {
      (m[c.purchase_id] ||= []).push(c);
    }
    return m;
  }, [codes]);

  const generateCode = async (purchaseId) => {
    setGenerating(purchaseId);
    const r = await window.StakoSupabase.adminGenActivationCode(purchaseId);
    setGenerating(null);
    if (r.ok) {
      setShownCode({ purchaseId, code: r.code });
      onChange();
    } else {
      alert("Error: " + r.message);
    }
  };

  const copyCode = async (code) => {
    try { await navigator.clipboard.writeText(code); } catch (_) {}
  };

  return (
    <div className="adm-section">
      <header className="adm-section__head">
        <div>
          <div className="eyebrow">— Bot de trading</div>
          <h2 className="display adm-h2">{rows.length} usuarios del bot</h2>
          <p className="text-muted" style={{ marginTop: 8 }}>
            Cuando una compra esté <span className="mono">active</span>, genera un código y envíaselo al cliente. Lo canjea con <span className="mono">/activar STK-XXXX-YYYY</span> en el bot.
          </p>
        </div>
      </header>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr><th>Email</th><th>Importe</th><th>Estado</th><th>Código / Vinculación</th><th>Notas</th><th>Fecha</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="adm-empty">
                Aún no hay usuarios del bot.<br/>
                <span className="text-dim mono" style={{ fontSize: 11 }}>(la tabla está lista para cuando lancéis las ventas)</span>
              </td></tr>
            ) : rows.map((r) => {
              const cs = codesByPurchase[r.id] || [];
              const unused = cs.find((c) => !c.used_at);
              const used = cs.find((c) => c.used_at);
              const isShown = shownCode?.purchaseId === r.id;
              return (
                <tr key={r.id}>
                  <td className="adm-mono">{r.user_email}</td>
                  <td className="mono num-tab">€{Number(r.amount_eur || 0).toFixed(2)}</td>
                  <td><StatusBadge s={r.status} /></td>
                  <td className="mono" style={{ fontSize: 12 }}>
                    {r.linked_chat_id ? (
                      <span style={{ color: "var(--accent)" }}>✓ chat_id <span className="text-dim">{r.linked_chat_id}</span></span>
                    ) : isShown ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ background: "var(--bg-elev)", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>{shownCode.code}</span>
                        <button className="adm-link" onClick={() => copyCode(shownCode.code)} title="Copiar">⧉</button>
                      </div>
                    ) : unused ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span className="text-muted">{unused.code}</span>
                        <button className="adm-link" onClick={() => copyCode(unused.code)} title="Copiar">⧉</button>
                      </div>
                    ) : used ? (
                      <span className="text-muted">usado · {new Date(used.used_at).toLocaleDateString("es-ES")}</span>
                    ) : (
                      <span className="text-dim">—</span>
                    )}
                  </td>
                  <td className="text-muted">{r.notes || "—"}</td>
                  <td className="text-muted mono num-tab">{new Date(r.created_at).toLocaleDateString("es-ES")}</td>
                  <td>
                    <div className="adm-actions">
                      {r.status === "active" && !unused && !r.linked_chat_id && (
                        <button className="adm-link" disabled={generating === r.id} onClick={() => generateCode(r.id)}>
                          {generating === r.id ? "..." : "🔑 Código"}
                        </button>
                      )}
                      {r.status !== "active" && <button className="adm-link" onClick={() => setStatus(r.id, "active")}>Activar</button>}
                      {r.status !== "cancelled" && <button className="adm-link" onClick={() => setStatus(r.id, "cancelled")}>Cancelar</button>}
                      {r.status !== "banned" && <button className="adm-link-danger" onClick={() => setStatus(r.id, "banned")}>Banear</button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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

ReactDOM.createRoot(document.getElementById("root")).render(<AdminApp />);
