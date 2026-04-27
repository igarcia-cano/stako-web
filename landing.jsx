/* global React, useApp, Reveal */
const { useState, useEffect, useRef } = React;

/* ============================================================
   HERO
   ============================================================ */
function Hero() {
  const { t } = useApp();
  const h = t.hero;
  return (
    <section className="hero">
      <div className="container hero__inner">
        <div className="hero__copy">
          <Reveal className="hero__eyebrow">
            <span className="tag tag-live"><span className="dot"></span>{h.live}</span>
            <span className="eyebrow">{h.eyebrow}</span>
          </Reveal>
          <Reveal as="h1" className="display hero__title" delay={80}>
            {h.title_a}{" "}
            <em className="hero__title-em">{h.title_b}</em><br />
            {h.title_c}
          </Reveal>
          <Reveal className="hero__sub" delay={160}>
            {h.sub}
          </Reveal>
          <Reveal className="hero__ctas" delay={240}>
            <a href="#waitlist" className="btn btn-primary">
              {h.cta_primary}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </a>
            <a href="#ecosystem" className="btn btn-ghost">{h.cta_secondary}</a>
          </Reveal>
        </div>
        <Reveal className="hero__viz" delay={300}>
          <HeroViz />
        </Reveal>
      </div>
      <div className="hero__ticker"><Ticker /></div>
    </section>
  );
}

/* Animated chart + Telegram message preview */
function HeroViz() {
  const { t, lang } = useApp();
  const points = useChartData(80);
  const path = pointsToPath(points, 480, 220);
  const last = points[points.length - 1];
  const first = points[0];
  const change = ((last - first) / first) * 100;

  return (
    <div className="viz">
      <div className="viz__chart card">
        <div className="viz__chart-head">
          <div>
            <div className="eyebrow">BTC/USDT · 1H</div>
            <div className="viz__price mono num-tab">$67,{(420 + Math.round(last * 6)).toString().padStart(3, "0").slice(0,3)}</div>
          </div>
          <div className={`viz__change ${change >= 0 ? "is-up" : "is-down"} mono`}>
            {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
          </div>
        </div>
        <svg viewBox="0 0 480 220" className="viz__chart-svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((p) => (
            <line key={p} x1="0" x2="480" y1={p * 220} y2={p * 220} stroke="var(--border)" strokeWidth="1" />
          ))}
          <path d={`${path} L 480 220 L 0 220 Z`} fill="url(#grad)" />
          <path d={path} fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
          {/* markers: a buy and a sell */}
          <Marker x={140} y={pointToY(points[Math.floor(points.length * 0.35)], 220)} type="buy" />
          <Marker x={340} y={pointToY(points[Math.floor(points.length * 0.78)], 220)} type="sell" />
        </svg>
        <div className="viz__chart-legend mono">
          <span><span className="dot dot-buy"></span> {lang === "es" ? "Compra ejecutada" : "Buy executed"}</span>
          <span><span className="dot dot-sell"></span> {lang === "es" ? "Venta ejecutada" : "Sell executed"}</span>
        </div>
      </div>
      <div className="viz__telegram">
        <div className="tg-header">
          <div className="tg-avatar">S</div>
          <div>
            <div className="tg-name">Stako Bot</div>
            <div className="tg-status mono">● {lang === "es" ? "en línea" : "online"}</div>
          </div>
        </div>
        <div className="tg-msg">
          <div className="tg-msg__head mono">
            <span className="text-accent">▲ BUY</span> · BTC/USDT
          </div>
          <div className="tg-msg__row"><span>{lang === "es" ? "Precio" : "Price"}</span><span className="mono num-tab">$67,432</span></div>
          <div className="tg-msg__row"><span>{lang === "es" ? "Cantidad" : "Size"}</span><span className="mono num-tab">0.0148 BTC</span></div>
          <div className="tg-msg__row"><span>RSI / EMA</span><span className="mono num-tab">28.4 / cross↑</span></div>
          <div className="tg-msg__row"><span>SL / TP</span><span className="mono num-tab text-dim">−1.5% / +3.2%</span></div>
          <div className="tg-msg__time mono">12:48</div>
        </div>
      </div>
    </div>
  );
}
function Marker({ x, y, type }) {
  const color = type === "buy" ? "var(--accent)" : "var(--gold)";
  return (
    <g>
      <circle cx={x} cy={y} r="9" fill={color} fillOpacity="0.18" />
      <circle cx={x} cy={y} r="4" fill={color} />
    </g>
  );
}

/* Pseudo random walk that updates on a timer */
function useChartData(n = 80) {
  const [pts, setPts] = useState(() => seedWalk(n));
  useEffect(() => {
    const id = setInterval(() => {
      setPts((p) => {
        const last = p[p.length - 1];
        const next = Math.max(8, Math.min(92, last + (Math.random() - 0.5) * 6));
        return [...p.slice(1), next];
      });
    }, 1400);
    return () => clearInterval(id);
  }, []);
  return pts;
}
function seedWalk(n) {
  const out = [50];
  for (let i = 1; i < n; i++) {
    out.push(Math.max(10, Math.min(90, out[i - 1] + (Math.random() - 0.48) * 7)));
  }
  return out;
}
function pointsToPath(pts, w, h) {
  if (!pts.length) return "";
  const stepX = w / (pts.length - 1);
  return pts.map((v, i) => {
    const x = i * stepX;
    const y = pointToY(v, h);
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}
function pointToY(v, h) {
  return h - (v / 100) * (h - 16) - 8;
}

/* Ticker bar */
function Ticker() {
  const items = [
    { sym: "BTC/USDT", v: "67,432.18", c: "+1.84%", up: true },
    { sym: "ETH/USDT", v: "3,418.07", c: "+0.92%", up: true },
    { sym: "SOL/USDT", v: "182.44", c: "−0.31%", up: false },
    { sym: "XRP/USDT", v: "0.5824", c: "+2.10%", up: true },
    { sym: "BNB/USDT", v: "612.05", c: "−0.08%", up: false },
    { sym: "ADA/USDT", v: "0.4421", c: "+0.51%", up: true },
    { sym: "DOGE/USDT", v: "0.1582", c: "+3.06%", up: true },
    { sym: "AVAX/USDT", v: "32.18", c: "−1.22%", up: false },
  ];
  const doubled = [...items, ...items];
  return (
    <div className="ticker">
      <div className="ticker__track">
        {doubled.map((it, i) => (
          <div className="ticker__item" key={i}>
            <span className="ticker__sym mono">{it.sym}</span>
            <span className="mono num-tab">{it.v}</span>
            <span className={`mono ticker__c ${it.up ? "is-up" : "is-down"}`}>{it.c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   ECOSYSTEM
   ============================================================ */
function Ecosystem() {
  const { t } = useApp();
  const e = t.eco;
  const p = e.pillars;
  return (
    <section id="ecosystem" className="eco">
      <div className="container">
        <Reveal className="section-head">
          <div className="eyebrow">— {e.eyebrow}</div>
          <h2 className="display section-title">{e.title}</h2>
          <p className="section-sub">{e.sub}</p>
        </Reveal>
        <div className="eco__grid">
          <Reveal delay={60}>
            <PillarCard
              kind="bot"
              tag={p.bot.tag} tagType="live"
              name={p.bot.name}
              desc={p.bot.desc}
              cta={p.bot.cta}
              href="bot.html"
              big
            />
          </Reveal>
          <Reveal delay={140}>
            <PillarCard
              kind="books"
              tag={p.books.tag} tagType="soon"
              name={p.books.name}
              desc={p.books.desc}
              cta={p.books.cta}
              soon
            />
          </Reveal>
          <Reveal delay={220}>
            <PillarCard
              kind="blog"
              tag={p.blog.tag} tagType="soon"
              name={p.blog.name}
              desc={p.blog.desc}
              cta={p.blog.cta}
              soon
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function PillarCard({ kind, tag, tagType, name, desc, cta, href = "#", big = false, soon = false }) {
  return (
    <article className={`pillar card ${big ? "pillar--big" : ""} ${soon ? "pillar--soon" : ""}`}>
      <div className="pillar__art">
        <PillarArt kind={kind} />
      </div>
      <div className="pillar__body">
        <span className={`tag tag-${tagType}`}>
          <span className="dot"></span>{tag}
        </span>
        <h3 className="pillar__name">{name}</h3>
        <p className="pillar__desc">{desc}</p>
        <a href={soon ? "#waitlist" : href} className="pillar__cta">
          {cta}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </a>
      </div>
    </article>
  );
}

function PillarArt({ kind }) {
  if (kind === "bot") {
    return (
      <div className="pillar-art pillar-art--bot">
        <div className="pa-bot__chat">
          <div className="pa-bot__line">
            <span className="text-accent mono">▲ BUY</span>
            <span className="mono">BTC/USDT</span>
            <span className="mono num-tab">$67,432</span>
          </div>
          <div className="pa-bot__line pa-bot__line--muted">
            <span className="mono">RSI 28.4</span>
            <span className="mono">EMA cross↑</span>
          </div>
          <div className="pa-bot__line">
            <span className="text-gold mono">▼ SELL</span>
            <span className="mono">BTC/USDT</span>
            <span className="mono num-tab">$69,580</span>
          </div>
          <div className="pa-bot__line pa-bot__line--muted">
            <span className="mono">+3.18% TP</span>
            <span className="mono">2h 14m</span>
          </div>
        </div>
      </div>
    );
  }
  if (kind === "books") {
    return (
      <div className="pillar-art pillar-art--books">
        <div className="pa-book pa-book--1"><div className="pa-book__spine"></div><div className="pa-book__title">Long-Term<br/>Capital</div></div>
        <div className="pa-book pa-book--2"><div className="pa-book__spine"></div><div className="pa-book__title">Systematic<br/>Trading</div></div>
        <div className="pa-book pa-book--3"><div className="pa-book__spine"></div><div className="pa-book__title">Applied<br/>Economics</div></div>
      </div>
    );
  }
  return (
    <div className="pillar-art pillar-art--blog">
      <div className="pa-blog__line"></div>
      <div className="pa-blog__line pa-blog__line--short"></div>
      <div className="pa-blog__line"></div>
      <div className="pa-blog__line pa-blog__line--short"></div>
      <div className="pa-blog__line"></div>
      <div className="pa-blog__chart">
        <svg viewBox="0 0 100 30" preserveAspectRatio="none">
          <path d="M0 22 L15 18 L30 24 L45 12 L60 16 L75 6 L90 10 L100 4" fill="none" stroke="var(--gold)" strokeWidth="1.4" />
        </svg>
      </div>
    </div>
  );
}

/* ============================================================
   BOT DETAIL (on landing — short version, links to /bot)
   ============================================================ */
function BotSection() {
  const { t, lang } = useApp();
  const b = t.bot;
  return (
    <section className="botsec" id="bot">
      <div className="container">
        <div className="botsec__head">
          <Reveal>
            <div className="eyebrow">— {b.eyebrow}</div>
            <h2 className="display section-title">{b.title}</h2>
            <p className="section-sub">{b.sub}</p>
          </Reveal>
        </div>

        <div className="botsec__steps">
          {b.steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 80} className="step card">
              <div className="step__n mono">{s.n}</div>
              <div className="step__t">{s.t}</div>
              <div className="step__d">{s.d}</div>
            </Reveal>
          ))}
        </div>

        <div className="botsec__features">
          {b.features.map((f, i) => (
            <Reveal key={f.t} delay={i * 60} className="feat">
              <div className="feat__bullet"></div>
              <div className="feat__t">{f.t}</div>
              <div className="feat__d">{f.d}</div>
            </Reveal>
          ))}
        </div>

        <Reveal className="botsec__cta">
          <a href="bot.html" className="btn btn-ghost">
            {lang === "es" ? "Ver detalle completo" : "See full details"}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </a>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================
   WAITLIST
   ============================================================ */
function Waitlist() {
  const { t, lang } = useApp();
  const w = t.waitlist;
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [errorKind, setErrorKind] = useState(null); // duplicate | invalid | network
  const [count, setCount] = useState(null);

  // Initial count from Supabase + a baseline floor for social proof
  const BASELINE = 1247;
  React.useEffect(() => {
    let alive = true;
    if (window.StakoSupabase) {
      window.StakoSupabase.getWaitlistCount().then((n) => {
        if (!alive) return;
        if (typeof n === "number") setCount(BASELINE + n);
      });
    }
    return () => { alive = false; };
  }, []);

  const errorMsg = () => {
    if (errorKind === "duplicate") {
      return lang === "es"
        ? "Ese email ya está en la lista."
        : "That email is already on the list.";
    }
    if (errorKind === "invalid") {
      return lang === "es"
        ? "Email no válido."
        : "Invalid email.";
    }
    return lang === "es"
      ? "No hemos podido apuntarte. Intenta de nuevo."
      : "We couldn't add you. Please try again.";
  };

  const submit = async (e) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setErrorKind("invalid");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorKind(null);
    try {
      const res = await window.StakoSupabase.joinWaitlist({ email: value, lang });
      if (res.ok) {
        setStatus("done");
        setCount((c) => (c == null ? BASELINE + 1 : c + 1));
        return;
      }
      if (res.duplicate) {
        // Treat duplicate as success-ish: they're in the list either way.
        setStatus("done");
        return;
      }
      setErrorKind("network");
      setStatus("error");
    } catch (_) {
      setErrorKind("network");
      setStatus("error");
    }
  };

  const submitting = status === "loading";
  const finished = status === "done";

  return (
    <section id="waitlist" className="waitlist">
      <div className="container">
        <div className="waitlist__inner card">
          <div className="waitlist__copy">
            <div className="eyebrow">— {w.eyebrow}</div>
            <h2 className="display waitlist__title">{w.title}</h2>
            <p className="text-muted">{w.sub}</p>
          </div>
          <form onSubmit={submit} className="waitlist__form" aria-live="polite">
            {!finished ? (
              <>
                <div className="waitlist__row">
                  <input
                    className="input"
                    type="email"
                    placeholder={w.placeholder}
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
                    required
                    disabled={submitting}
                  />
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? (lang === "es" ? "Enviando…" : "Sending…") : w.cta}
                  </button>
                </div>
                {status === "error" && (
                  <div className="waitlist__error mono">{errorMsg()}</div>
                )}
                <div className="waitlist__meta mono">
                  <span>
                    <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", marginRight: 6, verticalAlign: "middle" }}></span>
                    {(count ?? BASELINE).toLocaleString()} {w.n_waiting}
                  </span>
                  <span className="text-dim">·</span>
                  <span className="text-dim">{w.legal}</span>
                </div>
              </>
            ) : (
              <div className="waitlist__success">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                <span>{w.success}</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Hero, Ecosystem, BotSection, Waitlist });
