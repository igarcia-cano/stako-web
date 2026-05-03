/* ============================================================
   STAKO — Blog público
   Renderiza /blog (lista) o /blog?p=:slug (detalle)
   Soporta posts bilingües: si el post tiene title_en y body_md_en,
   se muestra la versión EN cuando lang=en. Si solo tiene una versión,
   se muestra esa con un banner avisando.
   ============================================================ */
const { useState: _bUseState, useEffect: _bUseEffect, useMemo: _bUseMemo } = React;

function _bFmtDate(iso, lang) {
  if (!iso) return "—";
  const d = new Date(iso);
  const locale = lang === "en" ? "en-US" : "es-ES";
  return d.toLocaleDateString(locale, { day: "2-digit", month: "long", year: "numeric" });
}

function _bFmtMonth(lang) {
  const d = new Date();
  const locale = lang === "en" ? "en-US" : "es-ES";
  return d.toLocaleDateString(locale, { month: "long" });
}

function _bRenderMarkdown(md) {
  if (!md) return "";
  try {
    const html = window.marked.parse(md, { breaks: true, gfm: true });
    return window.DOMPurify.sanitize(html);
  } catch (e) {
    return "";
  }
}

function _bGetSlugFromQuery() {
  try {
    const params = new URLSearchParams(window.location.search);
    const p = params.get("p");
    return p ? decodeURIComponent(p) : null;
  } catch (e) {
    return null;
  }
}

function _bBuildPostUrl(slug) {
  return "/blog?p=" + encodeURIComponent(slug);
}

/* ------------------------------------------------------------
   Localizar un post según el idioma actual.
   Devuelve: { title, subtitle, excerpt, body, isFallback, originalLang }
   - isFallback: true si pediste lang X pero el post solo está en Y
   - originalLang: idioma real del contenido devuelto ("es"|"en")
   ------------------------------------------------------------ */
function _bLocalizePost(post, lang) {
  if (!post) return null;
  // En el listing del blog NO viene body_md (se omite por tamaño en el SELECT),
  // así que decidimos hasEN/hasES solo por el título. Para el detalle (que usa
  // select=*), body_md y body_md_en vienen automáticamente.
  const hasEN = !!(post.title_en && post.title_en.trim());
  const hasES = !!(post.title    && post.title.trim());

  if (lang === "en" && hasEN) {
    return {
      title:    post.title_en,
      subtitle: post.subtitle_en || "",
      excerpt:  post.excerpt_en  || "",
      body:     post.body_md_en  || "",
      isFallback: false,
      originalLang: "en",
    };
  }
  if (lang === "en" && !hasEN && hasES) {
    return {
      title:    post.title,
      subtitle: post.subtitle || "",
      excerpt:  post.excerpt  || "",
      body:     post.body_md  || "",
      isFallback: true,
      originalLang: "es",
    };
  }
  if (lang === "es" && hasES) {
    return {
      title:    post.title,
      subtitle: post.subtitle || "",
      excerpt:  post.excerpt  || "",
      body:     post.body_md  || "",
      isFallback: false,
      originalLang: "es",
    };
  }
  if (lang === "es" && !hasES && hasEN) {
    return {
      title:    post.title_en,
      subtitle: post.subtitle_en || "",
      excerpt:  post.excerpt_en  || "",
      body:     post.body_md_en  || "",
      isFallback: true,
      originalLang: "en",
    };
  }
  // fallback final: lo que haya
  return {
    title:    post.title    || post.title_en    || "",
    subtitle: post.subtitle || post.subtitle_en || "",
    excerpt:  post.excerpt  || post.excerpt_en  || "",
    body:     post.body_md  || post.body_md_en  || "",
    isFallback: false,
    originalLang: hasES ? "es" : "en",
  };
}

/* === Router principal === */
function BlogRouter() {
  const [slug, setSlug] = _bUseState(_bGetSlugFromQuery());

  _bUseEffect(() => {
    const onPop = () => setSlug(_bGetSlugFromQuery());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  if (slug) return <BlogPostPage slug={slug} />;
  return <BlogListPage />;
}

function BlogCategoryDropdown({ categories, activeCat, onChange, t }) {
  const [open, setOpen] = _bUseState(false);
  const ref = React.useRef(null);

  const activeLabel = activeCat
    ? ((categories.find((c) => c.slug === activeCat) || {}).name || activeCat)
    : t.blog.filter_all;

  // Cerrar al hacer click fuera o pulsar ESC
  _bUseEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handle = (slug) => {
    onChange(slug);
    setOpen(false);
  };

  return (
    <div className="blog-cat-dd" ref={ref}>
      <button
        type="button"
        className={"blog-cat-dd__trigger" + (activeCat ? " is-active" : "") + (open ? " is-open" : "")}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="blog-cat-dd__label">{t.blog.filter_label || "Categoria"}</span>
        <span className="blog-cat-dd__value">{activeLabel}</span>
        <span className="blog-cat-dd__chevron" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
      </button>
      {open && (
        <ul className="blog-cat-dd__list" role="listbox">
          <li>
            <button
              type="button"
              className={"blog-cat-dd__item" + (activeCat === "" ? " is-active" : "")}
              onClick={() => handle("")}
              role="option"
              aria-selected={activeCat === ""}
            >{t.blog.filter_all}</button>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <button
                type="button"
                className={"blog-cat-dd__item" + (activeCat === c.slug ? " is-active" : "")}
                onClick={() => handle(c.slug)}
                role="option"
                aria-selected={activeCat === c.slug}
                title={c.description || ""}
              >{c.name}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* === Lista === */
function BlogListPage() {
  const { t, lang } = useApp();
  const [posts, setPosts]           = _bUseState(null);
  const [categories, setCategories] = _bUseState([]);
  const [activeCat, setActiveCat]   = _bUseState("");
  const [q, setQ]                   = _bUseState("");

  _bUseEffect(() => {
    let cancelled = false;
    (async () => {
      const [p, c] = await Promise.all([
        window.StakoSupabase.blogListPublishedPosts({ category: activeCat || undefined, q: q || undefined }),
        window.StakoSupabase.blogListCategories(),
      ]);
      if (!cancelled) { setPosts(p); setCategories(c); }
    })();
    return () => { cancelled = true; };
  }, [activeCat, q]);

  // Modo quiosco solo cuando no hay filtro ni búsqueda activa
  const isKiosk = !activeCat && !q.trim();

  return (
    <div className="container blog-wrap">
      {isKiosk ? (
        <header className="blog-kiosk-hero">
          <h1 className="blog-kiosk-hero__title">{t.blog.kiosk_brand || "Stako"}</h1>
          <div className="blog-kiosk-hero__meta">
            <div>{t.blog.kiosk_meta_categories || t.blog.hero_sub}</div>
            <b>
              {(posts ? posts.length : 0)}{" "}
              {(posts && posts.length === 1)
                ? (t.blog.kiosk_meta_published_one || "publicado")
                : (t.blog.kiosk_meta_published_other || "publicados")}
              {" · "}
              {t.blog.kiosk_edition_prefix || "Edición de"} {_bFmtMonth(lang)}
            </b>
          </div>
        </header>
      ) : (
        <header className="blog-hero">
          <div className="eyebrow">— {t.blog.hero_eyebrow}</div>
          <h1 className="display blog-hero__title">{t.blog.hero_title}</h1>
          <p className="blog-hero__sub text-muted">{t.blog.hero_sub}</p>
        </header>
      )}

      <div className="blog-toolbar">
        <BlogCategoryDropdown
          categories={categories}
          activeCat={activeCat}
          onChange={setActiveCat}
          t={t}
        />
        <input
          type="search"
          className="blog-search"
          placeholder={t.blog.search_ph}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {posts === null && (
        <div className="blog-loading text-muted">{t.blog.loading}</div>
      )}

      {posts !== null && posts.length === 0 && (
        <div className="blog-empty">
          <p className="text-muted">{t.blog.empty_category}</p>
        </div>
      )}

      {posts !== null && posts.length > 0 && isKiosk && (
        <BlogKioskoView posts={posts} categories={categories} lang={lang} t={t} onSelectCategory={setActiveCat} />
      )}

      {posts !== null && posts.length > 0 && !isKiosk && (
        <div className="blog-grid">
          {posts.map((p) => <BlogCard key={p.id} post={p} lang={lang} t={t} />)}
        </div>
      )}
    </div>
  );
}

/* === Modo Quiosco === */
function BlogKioskoView({ posts, categories, lang, t, onSelectCategory }) {
  if (!posts || posts.length === 0) return null;
  const featured = posts[0];
  const rest = posts.slice(1);

  // Agrupar el resto por categoría manteniendo el orden de display_order
  const byCat = {};
  rest.forEach((p) => {
    const k = p.category_slug || "_otros";
    if (!byCat[k]) byCat[k] = [];
    byCat[k].push(p);
  });

  // Construir secciones en el orden de las categorías oficiales
  const sections = [];
  categories.forEach((c) => {
    const items = byCat[c.slug];
    if (items && items.length > 0) {
      sections.push({ slug: c.slug, name: c.name, items });
      delete byCat[c.slug];
    }
  });
  // Cola: cualquier categoría que apareciera en posts pero no en la lista oficial
  Object.keys(byCat).forEach((k) => {
    if (byCat[k] && byCat[k].length > 0) {
      sections.push({ slug: k, name: k, items: byCat[k] });
    }
  });

  // Activa el filtro de categoría y hace scroll al toolbar para que se vea aplicado
  const handleCategoryClick = (slug) => {
    if (typeof onSelectCategory === "function") {
      onSelectCategory(slug);
      // Scroll suave al toolbar (donde aparece el filtro activado)
      setTimeout(() => {
        const tb = document.querySelector(".blog-toolbar");
        if (tb) tb.scrollIntoView({ behavior: "smooth", block: "start" });
        else window.scrollTo({ top: 0, behavior: "smooth" });
      }, 50);
    }
  };

  const seeMoreLabel = (t.blog && t.blog.kiosk_see_more) || "Ver todos";

  return (
    <React.Fragment>
      <BlogFeatured post={featured} lang={lang} t={t} />
      {sections.map((s) => {
        const totalCount = s.items.length;
        const visible = s.items.slice(0, 6);
        const hiddenCount = totalCount - visible.length;
        const countLabel = (totalCount === 1)
          ? (t.blog.kiosk_meta_published_one || "publicado")
          : (t.blog.kiosk_meta_published_other || "publicados");
        return (
          <section key={s.slug} className="blog-section">
            <button
              type="button"
              className="blog-section__header blog-section__header--button"
              onClick={() => handleCategoryClick(s.slug)}
              aria-label={`${s.name} — ${seeMoreLabel}`}
            >
              <span className="blog-section__label">{s.name}</span>
              <span className="blog-section__line"></span>
              <span className="blog-section__count">
                {totalCount} {countLabel}
              </span>
              <span className="blog-section__chevron" aria-hidden="true">→</span>
            </button>
            <div className="blog-section__grid">
              {visible.map((p) => (
                <BlogCardCompact key={p.id} post={p} lang={lang} t={t} />
              ))}
            </div>
            {hiddenCount > 0 && (
              <div className="blog-section__more">
                <button
                  type="button"
                  className="blog-section__more-btn"
                  onClick={() => handleCategoryClick(s.slug)}
                >
                  <span>{seeMoreLabel} ({totalCount})</span>
                  <span className="blog-section__more-arrow" aria-hidden="true">→</span>
                </button>
              </div>
            )}
          </section>
        );
      })}
    </React.Fragment>
  );
}

/* Featured story (modo quiosco) */
function BlogFeatured({ post, lang, t }) {
  const url = _bBuildPostUrl(post.slug);
  const loc = _bLocalizePost(post, lang);
  return (
    <a href={url} className="blog-featured">
      <div className="blog-featured__cover">
        {post.cover_image_url ? (
          <img src={post.cover_image_url} alt="" loading="eager" />
        ) : null}
        <div className="blog-featured__ribbon">{t.blog.featured_ribbon || "Lo destacado"}</div>
      </div>
      <div className="blog-featured__body">
        <div className="blog-featured__cat eyebrow">
          — {post.category_slug} · {post.reading_time_min} {t.blog.reading_time}
        </div>
        <h2 className="blog-featured__title">{loc.title}</h2>
        {loc.excerpt && <p className="blog-featured__excerpt">{loc.excerpt}</p>}
        <div className="blog-featured__cta">
          <span className="blog-featured__arrow"></span>
          <span>{t.blog.read_article || "Leer artículo"}</span>
        </div>
      </div>
    </a>
  );
}

/* Card compacta (modo quiosco) */
function BlogCardCompact({ post, lang, t }) {
  const url = _bBuildPostUrl(post.slug);
  const loc = _bLocalizePost(post, lang);
  return (
    <a href={url} className="blog-card-c">
      {post.cover_image_url ? (
        <div className="blog-card-c__cover">
          <img src={post.cover_image_url} alt="" loading="lazy" />
        </div>
      ) : (
        <div className="blog-card-c__cover blog-card-c__cover--placeholder">
          <span>Stako</span>
        </div>
      )}
      <div className="blog-card-c__body">
        <h4 className="blog-card-c__title">{loc.title}</h4>
        <div className="blog-card-c__meta">
          {post.reading_time_min} {t.blog.reading_time}
          {" · "}
          {_bFmtDate(post.published_at, lang)}
          {loc.isFallback && (
            <span className="lang-warn">· {loc.originalLang.toUpperCase()}</span>
          )}
        </div>
      </div>
    </a>
  );
}

function BlogCard({ post, lang, t }) {
  const cat = post.category_slug;
  const url = _bBuildPostUrl(post.slug);
  const loc = _bLocalizePost(post, lang);
  return (
    <a href={url} className="blog-card">
      {post.cover_image_url ? (
        <div className="blog-card__cover">
          <img src={post.cover_image_url} alt="" loading="lazy" />
        </div>
      ) : (
        <div className="blog-card__cover blog-card__cover--placeholder">
          <span className="mono">Stako</span>
        </div>
      )}
      <div className="blog-card__body">
        {cat && <div className="blog-card__cat eyebrow">{cat}</div>}
        <h3 className="blog-card__title">{loc.title}</h3>
        {loc.excerpt && <p className="blog-card__excerpt text-muted">{loc.excerpt}</p>}
        <div className="blog-card__meta">
          <span className="mono">{_bFmtDate(post.published_at, lang)}</span>
          <span className="dot-sep">·</span>
          <span className="mono">{post.reading_time_min} {t.blog.reading_time}</span>
          {loc.isFallback && (
            <>
              <span className="dot-sep">·</span>
              <span className="mono blog-card__lang-warn">{loc.originalLang.toUpperCase()}</span>
            </>
          )}
        </div>
      </div>
    </a>
  );
}

/* === Detalle === */
function BlogPostPage({ slug }) {
  const { t, lang } = useApp();
  const [post, setPost] = _bUseState(undefined);
  const [cats, setCats] = _bUseState([]);

  _bUseEffect(() => {
    let cancelled = false;
    (async () => {
      const [p, c] = await Promise.all([
        window.StakoSupabase.blogGetPostBySlug(slug),
        window.StakoSupabase.blogListCategories(),
      ]);
      if (!cancelled) { setPost(p || null); setCats(c); }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  // SEO
  _bUseEffect(() => {
    if (!post) return;
    const loc = _bLocalizePost(post, lang);
    if (!loc || !loc.title) return;
    const SITE = "https://stakocapital.com";
    const url = SITE + _bBuildPostUrl(post.slug);
    const fullTitle = loc.title + " — Stako";
    const img = post.cover_image_url || (SITE + "/og-image.png");

    document.title = fullTitle;
    document.documentElement.lang = loc.originalLang;

    const setAttr = (sel, attr, val) => {
      const el = document.querySelector(sel);
      if (el && val != null) el.setAttribute(attr, val);
    };
    setAttr('link[rel="canonical"]', "href", url);
    setAttr('meta[name="description"]', "content", loc.excerpt || "");
    setAttr('meta[property="og:url"]', "content", url);
    setAttr('meta[property="og:title"]', "content", loc.title);
    setAttr('meta[property="og:description"]', "content", loc.excerpt || "");
    setAttr('meta[property="og:type"]', "content", "article");
    setAttr('meta[property="og:image"]', "content", img);
    setAttr('meta[property="og:image:alt"]', "content", loc.title);
    setAttr('meta[name="twitter:url"]', "content", url);
    setAttr('meta[name="twitter:title"]', "content", loc.title);
    setAttr('meta[name="twitter:description"]', "content", loc.excerpt || "");
    setAttr('meta[name="twitter:image"]', "content", img);
    setAttr('meta[name="twitter:image:alt"]', "content", loc.title);

    document.querySelectorAll('script[data-stako-jsonld]').forEach(s => s.remove());
    const article = {
      "@context": "https://schema.org",
      "@type": "Article",
      "mainEntityOfPage": { "@type": "WebPage", "@id": url },
      "headline": loc.title,
      "description": loc.excerpt || "",
      "image": img,
      "datePublished": post.published_at || post.created_at || null,
      "dateModified": post.updated_at || post.published_at || null,
      "author": { "@type": "Organization", "name": post.author || t.blog.author_default, "url": SITE + "/" },
      "publisher": {
        "@type": "Organization",
        "name": "Stako",
        "logo": { "@type": "ImageObject", "url": SITE + "/favicon.svg" }
      },
      "inLanguage": loc.originalLang === "en" ? "en-US" : "es-ES"
    };
    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": lang === "en" ? "Home" : "Inicio", "item": SITE + "/" },
        { "@type": "ListItem", "position": 2, "name": "Blog", "item": SITE + "/blog" },
        { "@type": "ListItem", "position": 3, "name": loc.title, "item": url }
      ]
    };
    [article, breadcrumb].forEach(obj => {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.setAttribute("data-stako-jsonld", "post");
      s.textContent = JSON.stringify(obj);
      document.head.appendChild(s);
    });

    return () => {
      document.querySelectorAll('script[data-stako-jsonld]').forEach(s => s.remove());
    };
  }, [post, lang]);

  if (post === undefined) {
    return <div className="container blog-wrap"><div className="blog-loading text-muted">{t.blog.loading}</div></div>;
  }
  if (post === null) {
    return (
      <div className="container blog-wrap blog-404">
        <div className="eyebrow">— {t.blog.not_found_eyebrow}</div>
        <h1 className="display">{t.blog.not_found_h1}</h1>
        <p className="text-muted">{t.blog.not_found_lead}</p>
        <a href="/blog" className="btn btn-ghost" style={{ marginTop: 20 }}>{t.blog.back_to_blog}</a>
      </div>
    );
  }

  const cat = cats.find((c) => c.slug === post.category_slug);
  const loc = _bLocalizePost(post, lang);
  const html = _bRenderMarkdown(loc.body);

  return (
    <article className="blog-article">
      <div className="container blog-article__inner">
        <a href="/blog" className="blog-back">{t.blog.back_btn}</a>

        {cat && <div className="eyebrow blog-article__cat">{cat.name}</div>}
        <h1 className="display blog-article__title">{loc.title}</h1>
        {loc.subtitle && <p className="blog-article__subtitle text-muted">{loc.subtitle}</p>}

        <div className="blog-article__meta">
          <span className="mono">{post.author || t.blog.author_default}</span>
          <span className="dot-sep">·</span>
          <span className="mono">{_bFmtDate(post.published_at, lang)}</span>
          <span className="dot-sep">·</span>
          <span className="mono">{post.reading_time_min} {t.blog.reading_time}</span>
        </div>

        {loc.isFallback && (
          <div className="blog-lang-banner">
            <div className="blog-lang-banner__title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              {loc.originalLang === "es" ? t.blog.lang_banner_only_es_title : t.blog.lang_banner_only_en_title}
            </div>
            <p className="blog-lang-banner__body">
              {loc.originalLang === "es" ? t.blog.lang_banner_only_es_body : t.blog.lang_banner_only_en_body}
            </p>
          </div>
        )}

        {post.cover_image_url && (
          <figure className="blog-article__cover">
            <img src={post.cover_image_url} alt={loc.title} />
          </figure>
        )}

        <div
          className="blog-article__body"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {post.tags && post.tags.length > 0 && (
          <div className="blog-article__tags">
            {post.tags.map((tg) => (
              <span key={tg} className="blog-tag mono">#{tg}</span>
            ))}
          </div>
        )}

        <BlogDisclaimer t={t} />
      </div>
    </article>
  );
}

/* === Disclaimer obligatorio === */
function BlogDisclaimer({ t }) {
  return (
    <aside className="blog-disclaimer">
      <div className="eyebrow">— {t.blog.disclaimer_eyebrow}</div>
      <p>
        {t.blog.disclaimer_body_a} <strong>{t.blog.disclaimer_body_b}</strong>{t.blog.disclaimer_body_c}
      </p>
    </aside>
  );
}
