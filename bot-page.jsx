/* global React, useApp, Reveal */
const { useState, useEffect, useRef } = React;

/* ============================================================
   BOT PAGE
   ============================================================ */
function BotPage() {
  return (
    <>
      <BotHero />
      <TelegramOnboarding />
      <BotPipeline />
      <BotFeatures />
      <BotFAQ />
      <BotCTA />
    </>
  );
}

function BotHero() {
  const { t } = useApp();
  const p = t.bot_page;
  return (
    <section className="bothero">
      <div className="container">
        <Reveal>
          <a href="index.html" className="back-link mono">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            {p.back}
          </a>
        </Reveal>
        <div className="bothero__grid">
          <div>
            <Reveal className="hero__eyebrow">
              <span className="tag tag-live"><span className="dot"></span>{p.hero_eyebrow}</span>
            </Reveal>
            <Reveal as="h1" className="display bothero__title" delay={80}>
              {p.hero_title}
            </Reveal>
            <Reveal className="bothero__sub" delay={160}>
              {p.hero_sub}
            </Reveal>
            <Reveal className="hero__ctas" delay={240}>
              <a href="#join" className="btn btn-primary">
                {p.cta_join}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </a>
              <a href="#telegram" className="btn btn-ghost">{p.cta_demo}</a>
            </Reveal>
          </div>
          <Reveal delay={300}>
            <BotHeroStats />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function BotHeroStats() {
  const { lang } = useApp();
  const stats = lang === "es" ? [
    { l: "Pares activos", v: "BTC · ETH" },
    { l: "Frecuencia", v: "1H" },
    { l: "Indicadores", v: "RSI + EMA" },
    { l: "Riesgo por trade", v: "máx. 1.5%" },
    { l: "Capital mínimo", v: "$300 USDT" },
    { l: "Notificación", v: "Telegram" },
  ] : [
    { l: "Active pairs", v: "BTC · ETH" },
    { l: "Frequency", v: "1H" },
    { l: "Indicators", v: "RSI + EMA" },
    { l: "Risk per trade", v: "max 1.5%" },
    { l: "Min capital", v: "$300 USDT" },
    { l: "Notifications", v: "Telegram" },
  ];
  return (
    <div className="bothero__stats card">
      <div className="bothero__stats-head">
        <div className="eyebrow">— {lang === "es" ? "Especificaciones" : "Specs"}</div>
        <span className="tag tag-live"><span className="dot"></span>v0.1</span>
      </div>
      <dl className="specs">
        {stats.map((s) => (
          <div key={s.l} className="spec">
            <dt className="mono">{s.l}</dt>
            <dd>{s.v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ============================================================
   TELEGRAM ONBOARDING (animated chat)
   ============================================================ */
function TelegramOnboarding() {
  const { t, lang } = useApp();
  const p = t.bot_page;
  const messages = useTelegramScript(lang);
  return (
    <section id="telegram" className="telegram-sec">
      <div className="container">
        <Reveal className="section-head">
          <div className="eyebrow">— /start</div>
          <h2 className="display section-title">{p.telegram_title}</h2>
          <p className="section-sub">{p.telegram_sub}</p>
        </Reveal>
        <div className="telegram-sec__layout">
          <Reveal className="phone">
            <PhoneFrame>
              <div className="tg-app">
                <div className="tg-app__header">
                  <button className="tg-app__back" aria-label="Back">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <div className="tg-app__avatar">S</div>
                  <div>
                    <div className="tg-app__name">Stako Bot</div>
                    <div className="tg-app__status mono">bot</div>
                  </div>
                </div>
                <div className="tg-app__feed">
                  {messages.map((m, i) => (
                    <BotBubble key={i} m={m} />
                  ))}
                </div>
                <div className="tg-app__input">
                  <span className="mono text-dim">{lang === "es" ? "Escribe un comando…" : "Type a command…"}</span>
                </div>
              </div>
            </PhoneFrame>
          </Reveal>
          <div className="telegram-sec__notes">
            <Reveal className="tnote" delay={80}>
              <div className="tnote__num mono">/start</div>
              <div className="tnote__t">{lang === "es" ? "Comando inicial" : "Initial command"}</div>
              <div className="tnote__d">
                {lang === "es"
                  ? "El usuario abre el bot en Telegram y escribe /start. El bot responde con su descripción y un menú."
                  : "The user opens the bot in Telegram and types /start. The bot replies with its description and a menu."}
              </div>
            </Reveal>
            <Reveal className="tnote" delay={160}>
              <div className="tnote__num mono">/setup</div>
              <div className="tnote__t">{lang === "es" ? "Conexión con Binance" : "Binance connection"}</div>
              <div className="tnote__d">
                {lang === "es"
                  ? "Te guía para crear una API key con permisos solo de trading. Stako jamás puede retirar fondos."
                  : "Guides you to create an API key with trading-only permissions. Stako can never withdraw funds."}
              </div>
            </Reveal>
            <Reveal className="tnote" delay={240}>
              <div className="tnote__num mono">/allocate</div>
              <div className="tnote__t">{lang === "es" ? "Capital aislado" : "Isolated capital"}</div>
              <div className="tnote__d">
                {lang === "es"
                  ? "Decides cuánto USDT entra en juego. El resto de tu cartera ni se toca ni se ve afectado."
                  : "You decide how much USDT goes in. The rest of your portfolio is untouched."}
              </div>
            </Reveal>
            <Reveal className="tnote" delay={320}>
              <div className="tnote__num mono">/run</div>
              <div className="tnote__t">{lang === "es" ? "Operativa en vivo" : "Live trading"}</div>
              <div className="tnote__d">
                {lang === "es"
                  ? "El bot empieza a operar 24/7. Recibes notificación en cada compra, venta, stop-loss o take-profit."
                  : "The bot starts trading 24/7. You get a ping on every buy, sell, stop-loss or take-profit."}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function PhoneFrame({ children }) {
  return (
    <div className="phone-frame">
      <div className="phone-frame__notch"></div>
      <div className="phone-frame__screen">{children}</div>
    </div>
  );
}

function BotBubble({ m }) {
  if (m.kind === "system") {
    return <div className="tgb tgb--system mono">{m.text}</div>;
  }
  if (m.kind === "user") {
    return <div className="tgb tgb--user">{m.text}</div>;
  }
  return (
    <div className="tgb tgb--bot">
      {m.title && <div className="tgb__title">{m.title}</div>}
      {m.lines && m.lines.map((l, i) => (
        <div key={i} className={`tgb__line ${l.muted ? "tgb__line--muted" : ""}`}>
          {l.k && <span className="mono text-dim">{l.k}</span>}
          <span>{l.v}</span>
        </div>
      ))}
      {m.body && <div className="tgb__body">{m.body}</div>}
      {m.buttons && (
        <div className="tgb__buttons">
          {m.buttons.map((b) => (
            <button key={b} className="tgb__btn">{b}</button>
          ))}
        </div>
      )}
      {m.time && <div className="tgb__time mono">{m.time}</div>}
    </div>
  );
}

function useTelegramScript(lang) {
  const [n, setN] = useState(1);
  const isES = lang === "es";
  const all = isES ? [
    { kind: "system", text: "Hoy 12:42" },
    { kind: "user", text: "/start" },
    {
      kind: "bot",
      title: "👋 Bienvenido a Stako Bot",
      body: "Soy un bot de trading automático que opera con un capital aislado en tu cuenta de Binance. Tú me asignas un saldo de USDT y yo decido cuándo comprar y vender usando análisis técnico (RSI + EMA) con stop-loss y take-profit.",
      buttons: ["⚙️ Conectar Binance", "📖 Cómo funciona"],
      time: "12:42",
    },
    { kind: "user", text: "/setup" },
    {
      kind: "bot",
      title: "🔐 Conexión con Binance",
      body: "Para empezar, crea una API key en Binance con permisos SOLO de trading (jamás retiros). Pega aquí tu API key y secret. Tus claves se cifran y solo se usan para ejecutar órdenes.",
      time: "12:43",
    },
    { kind: "user", text: "/allocate 1000" },
    {
      kind: "bot",
      title: "💼 Capital aislado fijado",
      lines: [
        { k: "Asignado", v: "1,000 USDT" },
        { k: "Pares", v: "BTC/USDT, ETH/USDT" },
        { k: "Riesgo / trade", v: "1.5%" },
        { k: "TP / SL", v: "+3.2% / −1.5%" },
      ],
      buttons: ["▶ Empezar /run", "⚙️ Ajustes"],
      time: "12:44",
    },
  ] : [
    { kind: "system", text: "Today 12:42" },
    { kind: "user", text: "/start" },
    {
      kind: "bot",
      title: "👋 Welcome to Stako Bot",
      body: "I'm an automated trading bot that runs on isolated capital in your Binance account. You allocate me a USDT balance and I decide when to buy and sell using technical analysis (RSI + EMA) with stop-loss and take-profit.",
      buttons: ["⚙️ Connect Binance", "📖 How it works"],
      time: "12:42",
    },
    { kind: "user", text: "/setup" },
    {
      kind: "bot",
      title: "🔐 Connect Binance",
      body: "First, create an API key on Binance with TRADING-ONLY permissions (never withdraw). Paste your API key and secret here. Keys are encrypted and only used to execute orders.",
      time: "12:43",
    },
    { kind: "user", text: "/allocate 1000" },
    {
      kind: "bot",
      title: "💼 Isolated capital set",
      lines: [
        { k: "Allocated", v: "1,000 USDT" },
        { k: "Pairs", v: "BTC/USDT, ETH/USDT" },
        { k: "Risk / trade", v: "1.5%" },
        { k: "TP / SL", v: "+3.2% / −1.5%" },
      ],
      buttons: ["▶ Start /run", "⚙️ Settings"],
      time: "12:44",
    },
  ];

  useEffect(() => {
    setN(1);
    const id = setInterval(() => {
      setN((x) => (x >= all.length ? all.length : x + 1));
    }, 1100);
    return () => clearInterval(id);
  }, [lang]);

  return all.slice(0, n);
}

/* ============================================================
   PIPELINE DIAGRAM
   ============================================================ */
function BotPipeline() {
  const { t, lang } = useApp();
  const p = t.bot_page;
  const isES = lang === "es";
  const steps = isES ? [
    { tag: "01 · INPUT", title: "Datos de mercado", desc: "Velas 1H de Binance. Histórico continuo, sin huecos." },
    { tag: "02 · SEÑAL", title: "RSI + EMA", desc: "RSI <30 (sobreventa) o >70 (sobrecompra). Cruce de EMA(9/21) confirma tendencia." },
    { tag: "03 · VALIDACIÓN", title: "Filtro de riesgo", desc: "¿Hay capital? ¿No supera el riesgo máx? ¿API operativa? Si no, se descarta." },
    { tag: "04 · EJECUCIÓN", title: "Orden en Binance", desc: "Orden limitada con SL y TP. Confirmación en milisegundos." },
    { tag: "05 · NOTIFICACIÓN", title: "Telegram", desc: "Mensaje instantáneo con par, precio, cantidad, RSI, SL y TP." },
  ] : [
    { tag: "01 · INPUT", title: "Market data", desc: "1H candles from Binance. Continuous history, no gaps." },
    { tag: "02 · SIGNAL", title: "RSI + EMA", desc: "RSI <30 (oversold) or >70 (overbought). EMA(9/21) crossover confirms trend." },
    { tag: "03 · VALIDATION", title: "Risk filter", desc: "Capital available? Within max risk? API healthy? Otherwise, skip." },
    { tag: "04 · EXECUTION", title: "Order on Binance", desc: "Limit order with SL and TP. Confirmation in milliseconds." },
    { tag: "05 · NOTIFICATION", title: "Telegram", desc: "Instant message with pair, price, size, RSI, SL and TP." },
  ];
  return (
    <section className="pipeline">
      <div className="container">
        <Reveal className="section-head">
          <div className="eyebrow">— {isES ? "Pipeline" : "Pipeline"}</div>
          <h2 className="display section-title">{p.diagram_title}</h2>
          <p className="section-sub">{p.diagram_sub}</p>
        </Reveal>
        <div className="pipeline__rail">
          {steps.map((s, i) => (
            <Reveal key={s.tag} delay={i * 100} className="prail-step">
              <div className="prail-step__dot"></div>
              <div className="prail-step__tag mono">{s.tag}</div>
              <div className="prail-step__title">{s.title}</div>
              <div className="prail-step__desc">{s.desc}</div>
            </Reveal>
          ))}
        </div>
        <Reveal className="pipeline__ascii mono" delay={500}>
          <pre>{`     market data ─▶ RSI + EMA ─▶ risk filter ─▶ execution ─▶ telegram
                       │                │             │
                       └─ no signal ─────┴─ rejected ──┘
                              │              │
                          (skip cycle)   (logged + alert)`}</pre>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================================================
   FEATURES + Why Telegram
   ============================================================ */
function BotFeatures() {
  const { t } = useApp();
  const b = t.bot;
  return (
    <section className="botfeat">
      <div className="container">
        <div className="botfeat__grid">
          <Reveal className="botfeat__intro">
            <div className="eyebrow">— {b.features_title}</div>
            <h2 className="display section-title" style={{ marginTop: 18 }}>
              {b.why_telegram.title}
            </h2>
            <ul className="botfeat__list">
              {b.why_telegram.items.map((it) => (
                <li key={it}>
                  <span className="botfeat__check">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  </span>
                  {it}
                </li>
              ))}
            </ul>
          </Reveal>
          <div className="botfeat__cards">
            {b.features.map((f, i) => (
              <Reveal key={f.t} delay={i * 60} className="feat card">
                <div className="feat__bullet"></div>
                <div className="feat__t">{f.t}</div>
                <div className="feat__d">{f.d}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FAQ
   ============================================================ */
function BotFAQ() {
  const { t } = useApp();
  const p = t.bot_page;
  const [open, setOpen] = useState(0);
  return (
    <section className="faq">
      <div className="container">
        <Reveal className="section-head">
          <div className="eyebrow">— FAQ</div>
          <h2 className="display section-title">{p.faq_title}</h2>
        </Reveal>
        <div className="faq__list">
          {p.faq.map((f, i) => (
            <Reveal key={i} delay={i * 50}>
              <button
                className={`faq__item ${open === i ? "is-open" : ""}`}
                onClick={() => setOpen(open === i ? -1 : i)}
              >
                <span className="faq__q">
                  <span className="mono text-dim">0{i + 1}</span>
                  {f.q}
                </span>
                <span className="faq__icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
                </span>
                {open === i && <span className="faq__a">{f.a}</span>}
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   CTA
   ============================================================ */
function BotCTA() {
  const { t } = useApp();
  const p = t.bot_page;
  return (
    <section id="join" className="botcta">
      <div className="container">
        <Reveal className="botcta__inner card">
          <h2 className="display botcta__title">{p.hero_title}</h2>
          <a href="index.html#waitlist" className="btn btn-primary">
            {p.cta_join}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </a>
        </Reveal>
      </div>
    </section>
  );
}

Object.assign(window, { BotPage });
