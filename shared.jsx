/* global React */
const { useState, useEffect, useCallback, useRef, createContext, useContext, useMemo } = React;

/* ===== App context: theme + lang ===== */
const AppCtx = createContext(null);

function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("stako-theme") || "dark";
  });
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("stako-lang") || "es";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("stako-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem("stako-lang", lang);
  }, [lang]);

  // Activate reveal animations only after first paint, so the page is
  // visible even if IntersectionObserver / transitions fail.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      document.documentElement.dataset.revealMode = "active";
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const t = useMemo(() => window.STAKO_I18N[lang], [lang]);

  return (
    <AppCtx.Provider value={{ theme, setTheme, lang, setLang, t }}>
      {children}
    </AppCtx.Provider>
  );
}

const useApp = () => useContext(AppCtx);

/* ===== Reveal on scroll ===== */
function Reveal({ children, delay = 0, as: Tag = "div", className = "", ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    const fire = () => {
      if (cancelled) return;
      el.classList.add("in");
    };
    // First check: in viewport now? Reveal after delay.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight + 200 && rect.bottom > -200) {
      const id = setTimeout(fire, delay);
      return () => { cancelled = true; clearTimeout(id); };
    }
    // Otherwise, observe.
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setTimeout(fire, delay);
          io.unobserve(el);
        }
      });
    }, { threshold: 0, rootMargin: "0px 0px -5% 0px" });
    io.observe(el);
    // Safety fallback: ensure it fires after 1.5s no matter what.
    const safety = setTimeout(fire, 1500 + delay);
    return () => { cancelled = true; clearTimeout(safety); io.disconnect(); };
  }, [delay]);
  return <Tag ref={ref} className={`reveal ${className}`} {...rest}>{children}</Tag>;
}

/* ===== Logo ===== */
function Logo({ size = 22 }) {
  return (
    <a href="index.html" className="stako-logo" aria-label="Stako home">
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="2.5" y="2.5" width="27" height="27" rx="7" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10 20.5 L14.5 13.5 L18.5 18 L23 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="23" cy="11" r="1.6" fill="currentColor"/>
      </svg>
      <span className="stako-logo__word">Stako</span>
    </a>
  );
}

/* ===== Theme + lang toggles ===== */
function ThemeToggle() {
  const { theme, setTheme } = useApp();
  return (
    <button
      className="icon-btn"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      title={theme === "dark" ? "Switch to light" : "Switch to dark"}
    >
      {theme === "dark" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      )}
    </button>
  );
}

function LangToggle() {
  const { lang, setLang } = useApp();
  return (
    <div className="lang-toggle" role="tablist" aria-label="Language">
      <button
        role="tab"
        aria-selected={lang === "es"}
        className={lang === "es" ? "is-active" : ""}
        onClick={() => setLang("es")}
      >ES</button>
      <span className="lang-toggle__sep">·</span>
      <button
        role="tab"
        aria-selected={lang === "en"}
        className={lang === "en" ? "is-active" : ""}
        onClick={() => setLang("en")}
      >EN</button>
    </div>
  );
}

/* ===== Nav ===== */
function Nav({ active = "home" }) {
  const { t } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { id: "home", href: "index.html", label: t.nav.home },
    { id: "books", href: "#", label: t.nav.books, soon: true },
    { id: "blog", href: "#", label: t.nav.blog, soon: true },
    { id: "bot", href: "bot.html", label: t.nav.bot },
  ];

  return (
    <header className={`nav ${scrolled ? "is-scrolled" : ""}`}>
      <div className="container nav__inner">
        <Logo />
        <nav className="nav__links" aria-label="Primary">
          {links.map((l) => (
            <a
              key={l.id}
              href={l.href}
              className={`nav__link ${active === l.id ? "is-active" : ""} ${l.soon ? "is-soon" : ""}`}
              onClick={l.soon ? (e) => e.preventDefault() : undefined}
            >
              {l.label}
              {l.soon && <span className="nav__soon">{t.nav.soon}</span>}
            </a>
          ))}
        </nav>
        <div className="nav__actions">
          <LangToggle />
          <ThemeToggle />
          <AuthSlot />
          <button
            className="icon-btn show-sm"
            aria-label="Open menu"
            onClick={() => setOpen(!open)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
          </button>
        </div>
      </div>
      {open && (
        <div className="nav__mobile">
          {links.map((l) => (
            <a
              key={l.id}
              href={l.href}
              className={`nav__mobile-link ${l.soon ? "is-soon" : ""}`}
              onClick={l.soon ? (e) => { e.preventDefault(); setOpen(false); } : () => setOpen(false)}
            >
              {l.label}
              {l.soon && <span className="nav__soon">{t.nav.soon}</span>}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

/* ===== Footer ===== */
function Footer() {
  const { t } = useApp();
  const f = t.footer;
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <Logo size={26} />
            <p className="footer__tagline">{f.tagline}</p>
          </div>
          <div className="footer__cols">
            <FooterCol title={f.product} items={[
              { label: f.links.bot, href: "bot.html" },
              { label: `${f.links.books} · ${t.nav.soon}`, href: "#" },
              { label: `${f.links.blog} · ${t.nav.soon}`, href: "#" },
            ]} />
            <FooterCol title={f.company} items={[
              { label: f.links.about, href: "#" },
              { label: f.links.contact, href: "#" },
              { label: f.links.careers, href: "#" },
            ]} />
            <FooterCol title={f.legal} items={[
              { label: f.links.terms, href: "#" },
              { label: f.links.privacy, href: "#" },
              { label: f.links.cookies, href: "#" },
              { label: f.links.risk, href: "#" },
            ]} />
          </div>
        </div>
        <hr className="hr" />
        <div className="footer__bottom">
          <span className="mono text-dim">{f.copyright}</span>
          <span className="footer__risk text-dim">{f.risk}</span>
        </div>
      </div>
    </footer>
  );
}
function FooterCol({ title, items }) {
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 14 }}>{title}</div>
      <ul className="footer__list">
        {items.map((it) => (
          <li key={it.label}><a href={it.href}>{it.label}</a></li>
        ))}
      </ul>
    </div>
  );
}

/* expose globals for other Babel scripts */
Object.assign(window, {
  AppProvider, useApp, Reveal, Logo, Nav, Footer, ThemeToggle, LangToggle,
});
